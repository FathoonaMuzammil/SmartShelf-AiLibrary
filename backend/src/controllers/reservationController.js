const db = require('../config/db');

const ACTIVE_STATUSES = ['pending', 'waiting', 'ready_for_pickup'];

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

        // Lock the book row so two students cannot take the last copy together
        const [books] = await connection.execute(
            'SELECT book_id, title FROM Books WHERE book_id = ? FOR UPDATE',
            [bookId]
        );

        if (books.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
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

        // Student must not already be borrowing this book
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

        // Decide: reserve now (pending) or join the waiting list (waiting)
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
            `SELECT reservation_id, copy_id, status
             FROM Reservations
             WHERE reservation_id = ? AND student_id = ?
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
            `UPDATE Reservations SET status = 'cancelled'
             WHERE reservation_id = ?`,
            [reservationId]
        );

        // Free the held copy if the librarian had already allocated one
        if (reservation.copy_id) {
            await connection.execute(
                `UPDATE BookCopies SET status = 'available'
                 WHERE copy_id = ? AND status = 'reserved'`,
                [reservation.copy_id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Reservation cancelled.'
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


module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation
};
