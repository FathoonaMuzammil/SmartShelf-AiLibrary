const db = require('../config/db');

// ==========================================
// STUDENT DASHBOARD SUMMARY
// ==========================================

const getDashboard = async (req, res, next) => {
    try {
        const studentId = req.user.userId;

        // Current loans and overdue loans
        const [loanRows] = await db.execute(
            `SELECT
                COUNT(*) AS current_loans,
                COALESCE(SUM(due_date < NOW()), 0) AS overdue_loans
             FROM Borrowings
             WHERE student_id = ?
               AND returned_at IS NULL
               AND status IN ('borrowed', 'overdue')`,
            [studentId]
        );

        // Active reservations and those ready for pickup
        const [reservationRows] = await db.execute(
            `SELECT
                COUNT(*) AS active_reservations,
                COALESCE(SUM(status = 'ready_for_pickup'), 0) AS ready_for_pickup
             FROM Reservations
             WHERE student_id = ?
               AND status IN ('pending', 'waiting', 'ready_for_pickup')`,
            [studentId]
        );

        // Unread notifications
        const [unreadRows] = await db.execute(
            `SELECT COUNT(*) AS unread
             FROM Notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [studentId]
        );

        // Next books to return
        const [dueSoon] = await db.execute(
            `SELECT
                br.borrowing_id,
                b.book_id,
                b.title,
                br.due_date
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             JOIN Books b ON b.book_id = c.book_id
             WHERE br.student_id = ?
               AND br.returned_at IS NULL
               AND br.status IN ('borrowed', 'overdue')
             ORDER BY br.due_date ASC
             LIMIT 3`,
            [studentId]
        );

        // Latest lecturer recommendations
        const [recommendations] = await db.execute(
            `SELECT
                lr.recommendation_id,
                b.book_id,
                b.title,
                b.authors,
                t.topic_name,
                u.full_name AS lecturer_name,
                lr.difficulty_level,
                lr.explanation
             FROM LecturerRecommendations lr
             JOIN Books b ON b.book_id = lr.book_id
             JOIN Topics t ON t.topic_id = lr.topic_id
             JOIN Users u ON u.user_id = lr.lecturer_id
             ORDER BY lr.created_at DESC, lr.recommendation_id DESC
             LIMIT 4`
        );

        // Latest notifications
        const [notifications] = await db.execute(
            `SELECT
                notification_id,
                notification_type,
                title,
                message,
                is_read,
                created_at
             FROM Notifications
             WHERE user_id = ?
             ORDER BY created_at DESC, notification_id DESC
             LIMIT 5`,
            [studentId]
        );

        const now = new Date();

        return res.status(200).json({
            success: true,
            summary: {
                current_loans: Number(loanRows[0].current_loans),
                overdue_loans: Number(loanRows[0].overdue_loans),
                active_reservations: Number(
                    reservationRows[0].active_reservations
                ),
                ready_for_pickup: Number(reservationRows[0].ready_for_pickup),
                unread_notifications: Number(unreadRows[0].unread)
            },
            due_soon: dueSoon.map((item) => ({
                ...item,
                is_overdue: new Date(item.due_date) < now
            })),
            recommendations,
            notifications: notifications.map((item) => ({
                ...item,
                is_read: Boolean(item.is_read)
            }))
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// MARK ALL MY NOTIFICATIONS AS READ
// ==========================================

const markAllNotificationsRead = async (req, res, next) => {
    try {
        await db.execute(
            `UPDATE Notifications
             SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.userId]
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    markAllNotificationsRead
};
