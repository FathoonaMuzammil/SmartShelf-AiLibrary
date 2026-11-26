
const db = require('../config/db');

// ==========================================
// LIBRARIAN REPORTS & ANALYTICS
// ==========================================

const getReports = async (req, res, next) => {
    try {
        // Run independent report queries together.
        const [
            [borrowingRows],
            [overdueRows],
            [bookRows],
            [popularBooks],
            [copyRows],
            [reservationRows],
            [monthlyBorrowings]
        ] = await Promise.all([

            // 1. Borrowing summary
            db.execute(`
                SELECT
                    COUNT(*) AS total_issues,

                    SUM(
                        CASE
                            WHEN status = 'returned'
                                 OR returned_at IS NOT NULL
                            THEN 1 ELSE 0
                        END
                    ) AS returned,

                    SUM(
                        CASE
                            WHEN status IN ('borrowed', 'overdue')
                                 AND returned_at IS NULL
                            THEN 1 ELSE 0
                        END
                    ) AS active,

                    SUM(
                        CASE
                            WHEN status IN ('borrowed', 'overdue')
                                 AND returned_at IS NULL
                                 AND due_date < NOW()
                            THEN 1 ELSE 0
                        END
                    ) AS overdue

                FROM Borrowings
            `),

            // 2. Overdue statistics
            db.execute(`
                SELECT
                    COUNT(*) AS total_overdue,
                    COUNT(DISTINCT student_id) AS affected_students,
                    COALESCE(
                        MAX(DATEDIFF(CURDATE(), DATE(due_date))),
                        0
                    ) AS oldest_overdue_days

                FROM Borrowings

                WHERE status IN ('borrowed', 'overdue')
                  AND returned_at IS NULL
                  AND due_date < NOW()
            `),

            // 3. Active book titles
            db.execute(`
                SELECT COUNT(*) AS total_books
                FROM Books
                WHERE is_archived = FALSE
            `),

            // 4. Most frequently borrowed books
            // Historical borrowings are included, even if a book
            // has since been archived.
            db.execute(`
                SELECT
                    b.book_id,
                    b.title,
                    b.authors,
                    COUNT(br.borrowing_id) AS borrowing_count

                FROM Borrowings br
                INNER JOIN BookCopies c
                    ON c.copy_id = br.copy_id
                INNER JOIN Books b
                    ON b.book_id = c.book_id

                GROUP BY
                    b.book_id,
                    b.title,
                    b.authors

                ORDER BY borrowing_count DESC, b.title ASC
                LIMIT 5
            `),

            // 5. Physical copy statistics
            // Archived books are excluded, matching the librarian
            // dashboard's active-library inventory calculation.
            db.execute(`
                SELECT
                    c.status,
                    COUNT(*) AS total

                FROM BookCopies c
                INNER JOIN Books b
                    ON b.book_id = c.book_id

                WHERE b.is_archived = FALSE

                GROUP BY c.status
            `),

            // 6. Reservation statistics
            db.execute(`
                SELECT
                    status,
                    COUNT(*) AS total

                FROM Reservations

                GROUP BY status
            `),

            // 7. Monthly borrowing activity for the latest six months
            db.execute(`
                SELECT
                    DATE_FORMAT(borrowed_at, '%Y-%m') AS month,
                    DATE_FORMAT(borrowed_at, '%b %Y') AS month_label,
                    COUNT(*) AS total

                FROM Borrowings

                WHERE borrowed_at >= DATE_SUB(
                    DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                    INTERVAL 5 MONTH
                )

                GROUP BY
                    DATE_FORMAT(borrowed_at, '%Y-%m'),
                    DATE_FORMAT(borrowed_at, '%b %Y')

                ORDER BY month ASC
            `)
        ]);

        const borrowing = borrowingRows[0];
        const overdue = overdueRows[0];

        // Convert MySQL numeric values into JavaScript numbers.
        const summary = {
            total_books: Number(bookRows[0].total_books || 0),
            total_issues: Number(borrowing.total_issues || 0),
            returned: Number(borrowing.returned || 0),
            active: Number(borrowing.active || 0),
            overdue: Number(borrowing.overdue || 0),
            affected_students: Number(overdue.affected_students || 0),
            oldest_overdue_days: Number(overdue.oldest_overdue_days || 0)
        };

        // Include every copy status, even when its count is zero.
        const copyStatistics = {
            available: 0,
            reserved: 0,
            borrowed: 0,
            damaged: 0,
            lost: 0,
            total: 0
        };

        copyRows.forEach((item) => {
            const status = item.status;
            const count = Number(item.total || 0);

            if (Object.prototype.hasOwnProperty.call(copyStatistics, status)) {
                copyStatistics[status] = count;
                copyStatistics.total += count;
            }
        });

        // Include every reservation status used by the system.
        const reservationStatistics = {
            pending: 0,
            waiting: 0,
            ready_for_pickup: 0,
            completed: 0,
            cancelled: 0,
            total: 0
        };

        reservationRows.forEach((item) => {
            const status = item.status;
            const count = Number(item.total || 0);

            if (
                Object.prototype.hasOwnProperty.call(
                    reservationStatistics,
                    status
                )
            ) {
                reservationStatistics[status] = count;
                reservationStatistics.total += count;
            }
        });

        const formattedPopularBooks = popularBooks.map((book) => ({
            ...book,
            borrowing_count: Number(book.borrowing_count || 0)
        }));

        const formattedMonthlyBorrowings = monthlyBorrowings.map((item) => ({
            month: item.month,
            month_label: item.month_label,
            total: Number(item.total || 0)
        }));

        return res.status(200).json({
            success: true,
            data: {
                summary,
                popularBooks: formattedPopularBooks,
                copyStatistics,
                reservationStatistics,
                monthlyBorrowings: formattedMonthlyBorrowings
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReports
};
