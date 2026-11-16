const db = require('../config/db');

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
                br.renewal_count
             FROM Borrowings br
             JOIN BookCopies c ON c.copy_id = br.copy_id
             JOIN Books b ON b.book_id = c.book_id
             WHERE br.student_id = ?
             ORDER BY br.borrowed_at DESC, br.borrowing_id DESC`,
            [req.user.userId]
        );

        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        const borrowings = rows.map((item) => {
            const isReturned = item.status === 'returned' || item.returned_at;
            const isLost = item.status === 'lost';
            const isActive = !isReturned && !isLost;

            const due = new Date(item.due_date);
            const isOverdue = isActive && due < now;

            // Whole days left (positive) or days late (negative)
            const daysDifference = Math.ceil((due - now) / dayMs);

            return {
                ...item,
                is_active: isActive,
                is_overdue: isOverdue,
                days_remaining: isActive ? daysDifference : null
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
            borrowings
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyBorrowings
};
