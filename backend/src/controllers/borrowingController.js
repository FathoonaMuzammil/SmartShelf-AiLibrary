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

            // Whole days left (positive) or days late (negative)
            const daysDifference = Math.ceil((due - now) / DAY_MS);

            // Renewal policy
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
            returned: borrowings.filter((item) => !item.is_active).length
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

module.exports = {
    getMyBorrowings,
    renewBorrowing
};
