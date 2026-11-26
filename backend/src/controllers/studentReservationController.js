const db = require('../config/db');
const policy = require('../config/libraryPolicy');

const ACTIVE_STATUSES = ['pending', 'waiting', 'ready_for_pickup'];


// ==========================================
// REUSABLE FIFO ALLOCATION HELPER
// Assigns a released copy to the next eligible
// student in the waiting list.
// ==========================================

const allocateCopyToNextWaitingStudent = async (
    connection,
    bookId,
    copyId,
    bookTitle
) => {

    // Find the earliest eligible student.
    // These eligibility rules match returnBorrowing.
    const [waitingReservations] = await connection.execute(
        `SELECT
            r.reservation_id,
            r.student_id
         FROM Reservations r
         JOIN Users u ON u.user_id = r.student_id
         WHERE r.book_id = ?
           AND r.status = 'waiting'
           AND u.role = 'student'
           AND u.is_active = 1

           AND NOT EXISTS (
               SELECT 1
               FROM Borrowings existing
               JOIN BookCopies existingCopy
                 ON existingCopy.copy_id = existing.copy_id
               WHERE existing.student_id = r.student_id
                 AND existingCopy.book_id = r.book_id
                 AND existing.status IN ('borrowed', 'overdue')
                 AND existing.returned_at IS NULL
           )

           AND (
               ? = 0
               OR NOT EXISTS (
                   SELECT 1
                   FROM Borrowings overdueLoan
                   WHERE overdueLoan.student_id = r.student_id
                     AND overdueLoan.status IN ('borrowed', 'overdue')
                     AND overdueLoan.returned_at IS NULL
                     AND overdueLoan.due_date < NOW()
               )
           )

         ORDER BY r.reserved_at ASC, r.reservation_id ASC
         LIMIT 1
         FOR UPDATE`,
        [
            bookId,
            policy.BLOCK_NEW_RESERVATIONS_WHEN_OVERDUE ? 1 : 0
        ]
    );

    const nextReservation = waitingReservations[0] || null;

    // Nobody eligible is waiting.
    if (!nextReservation) {
        return null;
    }

    // Assign the released physical copy.
    const [updateResult] = await connection.execute(
        `UPDATE Reservations
         SET copy_id = ?,
             status = 'ready_for_pickup',
             ready_at = NOW(),
             pickup_deadline = DATE_ADD(
                 NOW(),
                 INTERVAL ? DAY
             )
         WHERE reservation_id = ?
           AND status = 'waiting'`,
        [
            copyId,
            policy.PICKUP_DEADLINE_DAYS,
            nextReservation.reservation_id
        ]
    );

    // Do not continue if the reservation was not updated.
    if (updateResult.affectedRows !== 1) {
        return null;
    }

    // Mark the physical copy as reserved.
    await connection.execute(
        `UPDATE BookCopies
         SET status = 'reserved'
         WHERE copy_id = ?`,
        [copyId]
    );

    // Notify the next student.
    await connection.execute(
        `INSERT INTO Notifications
            (user_id, notification_type, title, message,
             related_type, related_id)
         VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
        [
            nextReservation.student_id,
            'Book ready for pickup',
            `"${bookTitle}" is now ready for collection. Please collect it within ${policy.PICKUP_DEADLINE_DAYS} days.`,
            nextReservation.reservation_id
        ]
    );

    return {
        reservation_id: nextReservation.reservation_id,
        student_id: nextReservation.student_id
    };
};


// ==========================================
// RESERVE A BOOK
// Body: { book_id }
// ==========================================

const createReservation = async (req, res, next) => {
    let connection;

    try {
        const body = req.body || {};
        const bookId = Number(body.book_id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const studentId = req.user.userId;

connection = await db.getConnection();
await connection.beginTransaction();

// Verify that the student account is active.
const [students] = await connection.execute(
    `SELECT user_id, role, is_active
     FROM Users
     WHERE user_id = ?
     FOR UPDATE`,
    [studentId]
);

if (
    students.length === 0 ||
    students[0].role !== 'student' ||
    !students[0].is_active
) {
    await connection.rollback();

    return res.status(403).json({
        success: false,
        message: 'Your account is not eligible to make reservations.'
    });
}

        const [books] = await connection.execute(
            `SELECT book_id, title, is_archived
             FROM Books
             WHERE book_id = ?
             FOR UPDATE`,
            [bookId]
        );

        if (books.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        // Policy: students with overdue books cannot make new reservations
        if (books[0].is_archived) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'This book is currently unavailable for reservation.'
            });
        }

        if (policy.BLOCK_NEW_RESERVATIONS_WHEN_OVERDUE) {
            const [overdueLoans] = await connection.execute(
                `SELECT borrowing_id
                 FROM Borrowings
                 WHERE student_id = ?
                   AND returned_at IS NULL
                   AND status IN ('borrowed', 'overdue')
                   AND due_date < NOW()`,
                [studentId]
            );

            if (overdueLoans.length > 0) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: 'You have overdue books. Please return them before making a new reservation.'
                });
            }
        }

        // Student must not already have an active reservation for this book
        const [existing] = await connection.execute(
            `SELECT reservation_id
             FROM Reservations
             WHERE student_id = ? AND book_id = ?
               AND status IN ('pending', 'waiting', 'ready_for_pickup')`,
            [studentId, bookId]
        );

        if (existing.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'You already have an active reservation for this book.'
            });
        }

        const [loans] = await connection.execute(
            `SELECT br.borrowing_id
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             WHERE br.student_id = ? AND c.book_id = ?
               AND br.status IN ('borrowed', 'overdue')`,
            [studentId, bookId]
        );

        if (loans.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'You have already borrowed this book.'
            });
        }

        const [availableRows] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM BookCopies
             WHERE book_id = ? AND status = 'available'`,
            [bookId]
        );

        const [pendingRows] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM Reservations
             WHERE book_id = ? AND status = 'pending'`,
            [bookId]
        );

        const freeCopies =
            Number(availableRows[0].total) - Number(pendingRows[0].total);

        const status = freeCopies > 0 ? 'pending' : 'waiting';

        const [result] = await connection.execute(
            `INSERT INTO Reservations (student_id, book_id, status)
             VALUES (?, ?, ?)`,
            [studentId, bookId, status]
        );

        const message = status === 'pending'
            ? `Your reservation for "${books[0].title}" was received. The librarian will prepare the book.`
            : `You joined the waiting list for "${books[0].title}". You will be notified when a copy is available.`;

        await connection.execute(
            `INSERT INTO Notifications
             (user_id, notification_type, title, message, related_type, related_id)
             VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
            [
                studentId,
                status === 'pending' ? 'Reservation received' : 'Added to waiting list',
                message,
                result.insertId
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message,
            reservation: {
                reservation_id: result.insertId,
                book_id: bookId,
                status
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// ==========================================
// MY RESERVATIONS
// ==========================================

const getMyReservations = async (req, res, next) => {
    try {
        const [reservations] = await db.execute(
            `SELECT
                r.reservation_id,
                r.book_id,
                b.title,
                b.authors,
                b.isbn,
                b.cover_image_url,
                r.status,
                r.reserved_at,
                r.ready_at,
                r.pickup_deadline,
                c.shelf_location,
                c.accession_number,
                (SELECT COUNT(*)
                 FROM Reservations r2
                 WHERE r2.book_id = r.book_id
                   AND r2.status = 'waiting'
                   AND (r2.reserved_at < r.reserved_at
                        OR (r2.reserved_at = r.reserved_at
                            AND r2.reservation_id <= r.reservation_id))
                ) AS queue_position
             FROM Reservations r
             JOIN Books b ON b.book_id = r.book_id
             LEFT JOIN BookCopies c ON c.copy_id = r.copy_id
             WHERE r.student_id = ?
             ORDER BY r.reserved_at DESC, r.reservation_id DESC`,
            [req.user.userId]
        );

        const result = reservations.map((item) => ({
            ...item,
            queue_position: item.status === 'waiting'
                ? Number(item.queue_position)
                : null
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            reservations: result
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// CANCEL MY RESERVATION
// ==========================================

const cancelReservation = async (req, res, next) => {
    let connection;

    try {
        const reservationId = Number(req.params.reservationId);

        if (!Number.isInteger(reservationId) || reservationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                r.reservation_id,
                r.book_id,
                r.copy_id,
                r.status,
                b.title
             FROM Reservations r
             JOIN Books b ON b.book_id = r.book_id
             WHERE r.reservation_id = ?
               AND r.student_id = ?
             FOR UPDATE`,
            [reservationId, req.user.userId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];

        if (!ACTIVE_STATUSES.includes(reservation.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Only active reservations can be cancelled.'
            });
        }

        await connection.execute(
            `UPDATE Reservations
             SET status = 'cancelled'
             WHERE reservation_id = ?`,
            [reservationId]
        );

        let nextReservation = null;

        // Release the physical copy and allocate it to
        // the next eligible waiting student.
        if (reservation.copy_id) {

            const [releaseResult] = await connection.execute(
                `UPDATE BookCopies
                 SET status = 'available'
                 WHERE copy_id = ?
                   AND status = 'reserved'`,
                [reservation.copy_id]
            );

            if (releaseResult.affectedRows === 1) {
                nextReservation = await allocateCopyToNextWaitingStudent(
                    connection,
                    reservation.book_id,
                    reservation.copy_id,
                    reservation.title
                );
            }
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: nextReservation
                ? 'Reservation cancelled. The next waiting student has been notified.'
                : 'Reservation cancelled.',
            next_reservation_id: nextReservation
                ? nextReservation.reservation_id
                : null
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// ==========================================
// LIBRARIAN: GET ALL RESERVATIONS
// ==========================================

const getAllReservations = async (req, res, next) => {
    try {
        const [reservations] = await db.execute(
            `SELECT
                r.reservation_id,
                r.student_id,
                r.book_id,
                r.copy_id,
                r.status,
                r.reserved_at,
                r.ready_at,
                r.pickup_deadline,
                b.title,
                b.authors,
                b.isbn,
                u.full_name AS student_name,
                u.email AS student_email,
                c.accession_number,
                c.shelf_location
             FROM Reservations r
             JOIN Books b ON b.book_id = r.book_id
             JOIN Users u ON u.user_id = r.student_id
             LEFT JOIN BookCopies c ON c.copy_id = r.copy_id
             ORDER BY
                CASE
                    WHEN r.status = 'pending' THEN 1
                    WHEN r.status = 'waiting' THEN 2
                    WHEN r.status = 'ready_for_pickup' THEN 3
                    ELSE 4
                END,
                r.reserved_at ASC`
        );

        return res.status(200).json({
            success: true,
            count: reservations.length,
            reservations
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// LIBRARIAN: ALLOCATE COPY
// ==========================================

const allocateReservation = async (req, res, next) => {
    let connection;

    try {
        const reservationId = Number(req.params.reservationId);

        if (!Number.isInteger(reservationId) || reservationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT reservation_id, student_id, book_id, status
             FROM Reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [reservationId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];

        if (!['pending', 'waiting'].includes(reservation.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This reservation cannot be allocated.'
            });
        }

        if (reservation.status === 'waiting') {
            const [firstWaiting] = await connection.execute(
                `SELECT reservation_id
                 FROM Reservations
                 WHERE book_id = ? AND status = 'waiting'
                 ORDER BY reserved_at ASC, reservation_id ASC
                 LIMIT 1
                 FOR UPDATE`,
                [reservation.book_id]
            );

            if (
                firstWaiting.length > 0 &&
                firstWaiting[0].reservation_id !== reservationId
            ) {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message: 'Please allocate the copy to the earliest waiting reservation first.'
                });
            }
        }

        const [copies] = await connection.execute(
            `SELECT copy_id
             FROM BookCopies
             WHERE book_id = ? AND status = 'available'
             ORDER BY copy_id ASC
             LIMIT 1
             FOR UPDATE`,
            [reservation.book_id]
        );

        if (copies.length === 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'No available physical copies for this book.'
            });
        }

        const copyId = copies[0].copy_id;

        await connection.execute(
            `UPDATE BookCopies
             SET status = 'reserved'
             WHERE copy_id = ?`,
            [copyId]
        );

        await connection.execute(
            `UPDATE Reservations
             SET copy_id = ?,
                 status = 'ready_for_pickup',
                 ready_at = NOW(),
                 pickup_deadline = DATE_ADD(NOW(), INTERVAL ? DAY)
             WHERE reservation_id = ?`,
            [copyId, policy.PICKUP_DEADLINE_DAYS, reservationId]
        );

        await connection.execute(
            `INSERT INTO Notifications
             (user_id, notification_type, title, message, related_type, related_id)
             VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
            [
                reservation.student_id,
                'Book ready for pickup',
                'Your reserved book is ready for collection.',
                reservationId
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Copy allocated successfully. Reservation is ready for pickup.',
            reservation_id: reservationId,
            copy_id: copyId
        });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);

    } finally {
        if (connection) connection.release();
    }
};


// ==========================================
// LIBRARIAN: CANCEL RESERVATION
// ==========================================

const librarianCancelReservation = async (req, res, next) => {
    let connection;

    try {
        const reservationId = Number(req.params.reservationId);

        if (!Number.isInteger(reservationId) || reservationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                r.reservation_id,
                r.student_id,
                r.book_id,
                r.copy_id,
                r.status,
                b.title
             FROM Reservations r
             JOIN Books b ON b.book_id = r.book_id
             WHERE r.reservation_id = ?
             FOR UPDATE`,
            [reservationId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];

        if (!ACTIVE_STATUSES.includes(reservation.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This reservation cannot be cancelled.'
            });
        }

        await connection.execute(
            `UPDATE Reservations
             SET status = 'cancelled'
             WHERE reservation_id = ?`,
            [reservationId]
        );

        let nextReservation = null;

        // Release the allocated copy and pass it to
        // the next eligible waiting student.
        if (reservation.copy_id) {

            const [releaseResult] = await connection.execute(
                `UPDATE BookCopies
                 SET status = 'available'
                 WHERE copy_id = ?
                   AND status = 'reserved'`,
                [reservation.copy_id]
            );

            if (releaseResult.affectedRows === 1) {
                nextReservation = await allocateCopyToNextWaitingStudent(
                    connection,
                    reservation.book_id,
                    reservation.copy_id,
                    reservation.title
                );
            }
        }

        // Notify the student whose reservation was cancelled.
        await connection.execute(
            `INSERT INTO Notifications
             (user_id, notification_type, title, message, related_type, related_id)
             VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
            [
                reservation.student_id,
                'Reservation cancelled',
                'Your library reservation has been cancelled.',
                reservationId
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: nextReservation
                ? 'Reservation cancelled successfully. The next waiting student has been notified.'
                : 'Reservation cancelled successfully.',
            next_reservation_id: nextReservation
                ? nextReservation.reservation_id
                : null
        });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);

    } finally {
        if (connection) connection.release();
    }
};


// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation,
    getAllReservations,
    allocateReservation,
    librarianCancelReservation
};