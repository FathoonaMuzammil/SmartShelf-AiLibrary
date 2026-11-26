
const db = require('../config/db');
const policy = require('../config/libraryPolicy');

const DAY_MS = 24 * 60 * 60 * 1000;

// ==========================================
// MY BORROWINGS (current loans + history)
// ==========================================

const getMyBorrowings = async (req, res, next) => {
    try {
        const [rows] = await db.execute(
            `SELECT
                br.borrowing_id,
                b.book_id,
                b.title,
                b.authors,
                b.isbn,
                c.accession_number,
                c.shelf_location,
                br.borrowed_at,
                br.due_date,
                br.returned_at,
                br.status,
                br.renewal_count,
                (SELECT COUNT(*)
                 FROM Reservations w
                 WHERE w.book_id = b.book_id
                   AND w.status = 'waiting') AS waiting_count
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             JOIN Books b ON b.book_id = c.book_id
             WHERE br.student_id = ?
             ORDER BY br.borrowed_at DESC, br.borrowing_id DESC`,
            [req.user.userId]
        );

        const now = new Date();

        const borrowings = rows.map((item) => {
            const isReturned = item.status === 'returned' || item.returned_at;
            const isLost = item.status === 'lost';
            const isActive = !isReturned && !isLost;

            const due = new Date(item.due_date);
            const isOverdue = isActive && due < now;

            const daysDifference = Math.ceil((due - now) / DAY_MS);

            let canRenew = false;
            let renewMessage = '';

            if (isActive) {
                if (isOverdue) {
                    renewMessage = 'Overdue books cannot be renewed.';
                } else if (item.renewal_count >= policy.MAX_RENEWALS) {
                    renewMessage = 'Already renewed.';
                } else if (Number(item.waiting_count) > 0) {
                    renewMessage = 'Another student is waiting for this book.';
                } else {
                    canRenew = true;
                }
            }

            const { waiting_count, ...rest } = item;

            return {
                ...rest,
                is_active: isActive,
                is_overdue: isOverdue,
                days_remaining: isActive ? daysDifference : null,
                can_renew: canRenew,
                renew_message: renewMessage
            };
        });

        const summary = {
            current: borrowings.filter((item) => item.is_active).length,
            overdue: borrowings.filter((item) => item.is_overdue).length,
            returned: borrowings.filter((item) => item.status === 'returned').length
        };

        return res.status(200).json({
            success: true,
            summary,
            policy: {
                renewal_days: policy.RENEWAL_DAYS,
                max_renewals: policy.MAX_RENEWALS
            },
            borrowings
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// RENEW A BORROWED BOOK
// ==========================================

const renewBorrowing = async (req, res, next) => {
    let connection;

    try {
        const borrowingId = Number(req.params.borrowingId);

        if (!Number.isInteger(borrowingId) || borrowingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid borrowing ID.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                br.borrowing_id,
                br.due_date,
                br.renewal_count,
                br.status,
                br.returned_at,
                c.book_id,
                b.title
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             JOIN Books b ON b.book_id = c.book_id
             WHERE br.borrowing_id = ? AND br.student_id = ?
             FOR UPDATE`,
            [borrowingId, req.user.userId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Borrowing record not found.'
            });
        }

        const loan = rows[0];

        if (loan.returned_at || !['borrowed', 'overdue'].includes(loan.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Only books you currently have can be renewed.'
            });
        }

        const due = new Date(loan.due_date);

        if (loan.status === 'overdue' || due < new Date()) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Overdue books cannot be renewed. Please return the book.'
            });
        }

        if (loan.renewal_count >= policy.MAX_RENEWALS) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'You have already renewed this book.'
            });
        }

        const [waiting] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM Reservations
             WHERE book_id = ? AND status = 'waiting'`,
            [loan.book_id]
        );

        if (Number(waiting[0].total) > 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Another student is waiting for this book, so it cannot be renewed.'
            });
        }

        const newDueDate = new Date(
            due.getTime() + policy.RENEWAL_DAYS * DAY_MS
        );

        await connection.execute(
            `UPDATE Borrowings
             SET due_date = ?, renewal_count = renewal_count + 1
             WHERE borrowing_id = ?`,
            [newDueDate, borrowingId]
        );

        await connection.execute(
            `INSERT INTO Notifications
             (user_id, notification_type, title, message, related_type, related_id)
             VALUES (?, 'borrowing', 'Book renewed', ?, 'borrowing', ?)`,
            [
                req.user.userId,
                `"${loan.title}" was renewed for ${policy.RENEWAL_DAYS} more days.`,
                borrowingId
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: `Renewed for ${policy.RENEWAL_DAYS} more days.`,
            due_date: newDueDate
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
// GET ALL BORROWINGS (LIBRARIAN)
// ==========================================

const getAllBorrowings = async (req, res, next) => {
    try {
        const [borrowings] = await db.execute(`
            SELECT
                br.borrowing_id,
                br.student_id,
                u.full_name AS student_name,
                u.email AS student_email,
                u.student_id AS student_number,
                br.copy_id,
                c.accession_number,
                c.shelf_location,
                b.book_id,
                b.title,
                b.authors,
                b.isbn,
                br.reservation_id,
                br.borrowed_at,
                br.due_date,
                br.returned_at,
                br.renewal_count,
                br.status,
                CASE
                    WHEN br.status IN ('borrowed', 'overdue')
                         AND br.returned_at IS NULL
                         AND br.due_date < NOW()
                    THEN TRUE
                    ELSE FALSE
                END AS is_overdue
            FROM Borrowings br
            JOIN Users u ON u.user_id = br.student_id
            JOIN BookCopies c ON c.copy_id = br.copy_id
            JOIN Books b ON b.book_id = c.book_id
            ORDER BY br.borrowed_at DESC, br.borrowing_id DESC
        `);

        const summary = {
            total: borrowings.length,
            active: borrowings.filter(
                item => item.status === 'borrowed' && !item.is_overdue
            ).length,
            overdue: borrowings.filter(
                item => Boolean(item.is_overdue)
            ).length,
            returned: borrowings.filter(
                item => item.status === 'returned'
            ).length,
            lost: borrowings.filter(
                item => item.status === 'lost'
            ).length
        };

        return res.status(200).json({
            success: true,
            summary,
            borrowings
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// GET OVERDUE BORROWINGS (LIBRARIAN)
// ==========================================

const getOverdueBorrowings = async (req, res, next) => {
    try {
        const [overdueBorrowings] = await db.execute(`
            SELECT
                br.borrowing_id,
                br.student_id,
                u.full_name AS student_name,
                u.email AS student_email,
                u.student_id AS student_number,
                br.copy_id,
                c.accession_number,
                c.shelf_location,
                b.book_id,
                b.title,
                b.authors,
                b.isbn,
                br.borrowed_at,
                br.due_date,
                br.status,
                DATEDIFF(CURDATE(), DATE(br.due_date)) AS days_overdue
            FROM Borrowings br
            JOIN Users u ON u.user_id = br.student_id
            JOIN BookCopies c ON c.copy_id = br.copy_id
            JOIN Books b ON b.book_id = c.book_id
            WHERE br.status IN ('borrowed', 'overdue')
              AND br.returned_at IS NULL
              AND br.due_date < NOW()
            ORDER BY br.due_date ASC, br.borrowing_id ASC
        `);

        const summary = {
            total_overdue: overdueBorrowings.length,
            affected_students: new Set(
                overdueBorrowings.map(item => item.student_id)
            ).size,
            overdue_books: overdueBorrowings.length,
            oldest_overdue_days: overdueBorrowings.length > 0
                ? Math.max(...overdueBorrowings.map(
                    item => Number(item.days_overdue)
                ))
                : 0
        };

        return res.status(200).json({
            success: true,
            summary,
            overdueBorrowings
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// ISSUE A BOOK (LIBRARIAN)
// Supports reservations and walk-in issues
// ==========================================

const issueBorrowing = async (req, res, next) => {
    let connection;

    try {
        const studentId = Number(req.body.studentId);
        const reservationId = req.body.reservationId
            ? Number(req.body.reservationId)
            : null;

        let copyId = req.body.copyId
            ? Number(req.body.copyId)
            : null;

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid student ID.'
            });
        }

        if (
            reservationId !== null &&
            (!Number.isInteger(reservationId) || reservationId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        if (
            reservationId === null &&
            (!Number.isInteger(copyId) || copyId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid copy ID for a walk-in issue.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check whether the student exists and is active.
        const [students] = await connection.execute(
            `SELECT user_id, full_name
             FROM Users
             WHERE user_id = ?
               AND role = 'student'
               AND is_active = 1
             FOR UPDATE`,
            [studentId]
        );

        if (students.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Active student not found.'
            });
        }

        // 2. Prevent issuing another book to a student
        // who currently has an overdue borrowing.
        const [overdueLoans] = await connection.execute(
            `SELECT borrowing_id
             FROM Borrowings
             WHERE student_id = ?
               AND status IN ('borrowed', 'overdue')
               AND returned_at IS NULL
               AND due_date < NOW()
             LIMIT 1
             FOR UPDATE`,
            [studentId]
        );

        if (overdueLoans.length > 0) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: 'This student has an overdue book. The overdue book must be returned before another book can be issued.'
            });
        }

        let title;
        let finalCopyId = copyId;

        // 3. If a reservation is provided, validate it.
        if (reservationId !== null) {
            const [reservations] = await connection.execute(
                `SELECT reservation_id, student_id, copy_id, status
                 FROM Reservations
                 WHERE reservation_id = ?
                 FOR UPDATE`,
                [reservationId]
            );

            if (reservations.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: 'Reservation not found.'
                });
            }

            const reservation = reservations[0];

            if (Number(reservation.student_id) !== studentId) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'This reservation does not belong to the selected student.'
                });
            }

            if (reservation.status !== 'ready_for_pickup') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Only reservations ready for pickup can be issued.'
                });
            }

            if (!reservation.copy_id) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'No book copy has been allocated to this reservation.'
                });
            }

            finalCopyId = Number(reservation.copy_id);

            if (copyId !== null && copyId !== finalCopyId) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'The selected copy does not match the reserved copy.'
                });
            }
        }

        // 4. Lock and validate the physical book copy.
        const [copies] = await connection.execute(
            `SELECT
                c.copy_id,
                c.status,
                b.title,
                b.is_archived
             FROM BookCopies c
             JOIN Books b ON b.book_id = c.book_id
             WHERE c.copy_id = ?
             FOR UPDATE`,
            [finalCopyId]
        );

        if (copies.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Book copy not found.'
            });
        }

        const copy = copies[0];
        title = copy.title;

        if (copy.is_archived) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This book has been archived and cannot be issued.'
            });
        }

        const requiredCopyStatus =
            reservationId !== null ? 'reserved' : 'available';

        if (copy.status !== requiredCopyStatus) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: reservationId !== null
                    ? 'The reserved copy is no longer available for issue.'
                    : 'This copy is not currently available.'
            });
        }

        // 5. Calculate the borrowing and due dates.
        const borrowedAt = new Date();
        const dueDate = new Date(
            borrowedAt.getTime() + policy.BORROWING_DAYS * DAY_MS
        );

        // 6. Create the borrowing record.
        const [result] = await connection.execute(
            `INSERT INTO Borrowings
                (student_id, copy_id, reservation_id, issued_by,
                 borrowed_at, due_date, status)
             VALUES (?, ?, ?, ?, ?, ?, 'borrowed')`,
            [
                studentId,
                finalCopyId,
                reservationId,
                req.user.userId,
                borrowedAt,
                dueDate
            ]
        );

        const borrowingId = result.insertId;

        // 7. Update the physical copy status.
        await connection.execute(
            `UPDATE BookCopies
             SET status = 'borrowed'
             WHERE copy_id = ?`,
            [finalCopyId]
        );

        // 8. Complete the reservation if this was a reservation issue.
        if (reservationId !== null) {
            await connection.execute(
                `UPDATE Reservations
                 SET status = 'completed'
                 WHERE reservation_id = ?`,
                [reservationId]
            );
        }

        // 9. Notify the student.
        await connection.execute(
            `INSERT INTO Notifications
                (user_id, notification_type, title, message,
                 related_type, related_id)
             VALUES (?, 'borrowing', 'Book issued', ?,
                     'borrowing', ?)`,
            [
                studentId,
                `"${title}" has been issued to you. Please return it by the due date.`,
                borrowingId
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Book issued successfully.',
            borrowing: {
                borrowing_id: borrowingId,
                student_id: studentId,
                copy_id: finalCopyId,
                reservation_id: reservationId,
                borrowed_at: borrowedAt,
                due_date: dueDate,
                status: 'borrowed'
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
// RETURN A BOOK (LIBRARIAN)
// Automatically handles the next eligible waiting reservation
// ==========================================

const returnBorrowing = async (req, res, next) => {
    let connection;

    try {
        const borrowingId = Number(req.params.borrowingId);

        if (!Number.isInteger(borrowingId) || borrowingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid borrowing ID.'
            });
        }

        // 1. Validate return condition and incident notes.
        const condition = req.body?.condition || 'normal';
        const notes = req.body?.notes?.trim() || '';

        if (!['normal', 'damaged', 'lost'].includes(condition)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid book condition.'
            });
        }

        if (condition !== 'normal' && !notes) {
            return res.status(400).json({
                success: false,
                message: 'Please provide notes for damaged or lost books.'
            });
        }

        if (notes.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Incident notes cannot exceed 1000 characters.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2. Lock borrowing record and physical copy.
        const [borrowings] = await connection.execute(
            `SELECT
                br.borrowing_id,
                br.student_id,
                br.copy_id,
                br.status,
                br.returned_at,
                c.book_id,
                c.status AS copy_status,
                b.title
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             JOIN Books b ON b.book_id = c.book_id
             WHERE br.borrowing_id = ?
             FOR UPDATE`,
            [borrowingId]
        );

        if (borrowings.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Borrowing record not found.'
            });
        }

        const borrowing = borrowings[0];

        // 3. Only active borrowing records can be processed.
        if (
            borrowing.returned_at ||
            !['borrowed', 'overdue'].includes(borrowing.status)
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This borrowing record cannot be processed.'
            });
        }

        // 4. Make sure the physical copy is currently borrowed.
        if (borrowing.copy_status !== 'borrowed') {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'The physical copy is not currently marked as borrowed.'
            });
        }

        // 5. Record the borrowing outcome.
        if (condition === 'lost') {
            await connection.execute(
                `UPDATE Borrowings
                 SET status = 'lost',
                     incident_notes = ?,
                     incident_recorded_by = ?
                 WHERE borrowing_id = ?`,
                [notes, req.user.userId, borrowingId]
            );

        } else {
            await connection.execute(
                `UPDATE Borrowings
                 SET status = 'returned',
                     returned_at = NOW(),
                     returned_by = ?,
                     incident_notes = ?,
                     incident_recorded_by = ?
                 WHERE borrowing_id = ?`,
                [
                    req.user.userId,
                    condition === 'damaged' ? notes : null,
                    condition === 'damaged' ? req.user.userId : null,
                    borrowingId
                ]
            );
        }

        let copyStatus = condition === 'normal'
            ? 'available'
            : condition;

        let nextReservationId = null;
        let nextReservation = null;

        // 6. Only normal returns can be allocated to waiting students.
        if (condition === 'normal') {

            const [waitingReservations] = await connection.execute(
                `SELECT
                    r.reservation_id,
                    r.student_id
                 FROM Reservations r
                 JOIN Users u ON u.user_id = r.student_id
                 WHERE r.book_id = ?
                        AND r.status = 'waiting'
                        AND u.role = 'student'
                        AND EXISTS (
                            SELECT 1
                            FROM Books b
                            WHERE b.book_id = r.book_id
                                AND b.is_archived = 0
                        )
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
                    borrowing.book_id,
                    policy.BLOCK_NEW_RESERVATIONS_WHEN_OVERDUE ? 1 : 0
                ]
            );

            nextReservation = waitingReservations[0] || null;

            if (nextReservation) {
                copyStatus = 'reserved';
                nextReservationId = nextReservation.reservation_id;

                await connection.execute(
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
                        borrowing.copy_id,
                        policy.PICKUP_DEADLINE_DAYS,
                        nextReservationId
                    ]
                );

                // Notify the next waiting student.
                await connection.execute(
                    `INSERT INTO Notifications
                        (user_id, notification_type, title, message,
                         related_type, related_id)
                     VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
                    [
                        nextReservation.student_id,
                        'Book ready for pickup',
                        `"${borrowing.title}" is now ready for collection. Please collect it within ${policy.PICKUP_DEADLINE_DAYS} days.`,
                        nextReservationId
                    ]
                );
            }
        }

        // 7. Update physical copy status.
        await connection.execute(
            `UPDATE BookCopies
             SET status = ?
             WHERE copy_id = ?`,
            [copyStatus, borrowing.copy_id]
        );

        // 8. Notify the original student.
        if (condition === 'normal' || condition === 'damaged') {
            await connection.execute(
                `INSERT INTO Notifications
                    (user_id, notification_type, title, message,
                     related_type, related_id)
                 VALUES (?, 'return', ?, ?, 'borrowing', ?)`,
                [
                    borrowing.student_id,
                    condition === 'damaged'
                        ? 'Damaged book recorded'
                        : 'Book returned successfully',
                    condition === 'damaged'
                        ? `"${borrowing.title}" has been returned and recorded as damaged.`
                        : `"${borrowing.title}" has been successfully returned to the library.`,
                    borrowingId
                ]
            );
        }

        // 9. Commit all changes together.
        await connection.commit();

        let message;

        if (condition === 'lost') {
            message = 'Book recorded as lost. The copy is unavailable for borrowing.';
        } else if (condition === 'damaged') {
            message = 'Book returned and recorded as damaged. The copy is unavailable for borrowing.';
        } else if (nextReservation) {
            message = 'Book returned successfully. The next waiting student has been notified.';
        } else {
            message = 'Book returned successfully. The copy is now available.';
        }

        return res.status(200).json({
            success: true,
            message,
            borrowing: {
                borrowing_id: borrowingId,
                returned_at: condition === 'lost' ? null : new Date(),
                status: condition === 'lost' ? 'lost' : 'returned'
            },
            copy: {
                copy_id: borrowing.copy_id,
                status: copyStatus
            },
            next_reservation_id: nextReservationId
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
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
    getMyBorrowings,
    renewBorrowing,
    getAllBorrowings,
    getOverdueBorrowings,
    issueBorrowing,
    returnBorrowing
};
