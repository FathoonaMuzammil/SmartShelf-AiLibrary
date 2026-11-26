const db = require('../config/db');

// ==========================================
// GET ALL BOOKS
// Includes active and archived books
// ==========================================

const getBooks = async (req, res, next) => {
    try {
        const { search, status } = req.query;

        let conditions = [];
        let params = [];

        if (search && search.trim()) {
            conditions.push(
                '(title LIKE ? OR authors LIKE ? OR isbn LIKE ?)'
            );

            const keyword = `%${search.trim()}%`;
            params.push(keyword, keyword, keyword);
        }

        if (status === 'active') {
            conditions.push('is_archived = FALSE');
        } else if (status === 'archived') {
            conditions.push('is_archived = TRUE');
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const [books] = await db.execute(
            `SELECT
                b.*,
                COUNT(c.copy_id) AS total_copies,
                SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END)
                    AS available_copies
             FROM Books b
             LEFT JOIN BookCopies c ON c.book_id = b.book_id
             ${whereClause}
             GROUP BY b.book_id
             ORDER BY b.created_at DESC`,
            params
        );

        return res.status(200).json({
            success: true,
            count: books.length,
            books
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// ADD NEW BOOK
// ==========================================

const addBook = async (req, res, next) => {
    try {
        const {
            isbn,
            title,
            authors,
            publisher,
            publication_year,
            edition,
            language,
            description,
            cover_image_url
        } = req.body;

        if (
            !title || !title.trim() ||
            !authors || !authors.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Book title and authors are required.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO Books (
                isbn, title, authors, publisher,
                publication_year, edition, language,
                description, cover_image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                isbn || null,
                title.trim(),
                authors.trim(),
                publisher || null,
                publication_year || null,
                edition || null,
                language || null,
                description || null,
                cover_image_url || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Book added successfully.',
            bookId: result.insertId
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// UPDATE BOOK
// ==========================================

const updateBook = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        const {
            isbn,
            title,
            authors,
            publisher,
            publication_year,
            edition,
            language,
            description,
            cover_image_url
        } = req.body;

        if (!title || !title.trim() || !authors || !authors.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Book title and authors are required.'
            });
        }

        const [result] = await db.execute(
            `UPDATE Books
             SET isbn = ?,
                 title = ?,
                 authors = ?,
                 publisher = ?,
                 publication_year = ?,
                 edition = ?,
                 language = ?,
                 description = ?,
                 cover_image_url = ?
             WHERE book_id = ?`,
            [
                isbn || null,
                title.trim(),
                authors.trim(),
                publisher || null,
                publication_year || null,
                edition || null,
                language || null,
                description || null,
                cover_image_url || null,
                bookId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Book updated successfully.'
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// ARCHIVE BOOK
// ==========================================

const archiveBook = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        const [result] = await db.execute(
            `UPDATE Books
             SET is_archived = TRUE
             WHERE book_id = ? AND is_archived = FALSE`,
            [bookId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found or already archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Book archived successfully.'
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// RESTORE ARCHIVED BOOK
// ==========================================

const restoreBook = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        const [result] = await db.execute(
            `UPDATE Books
             SET is_archived = FALSE
             WHERE book_id = ? AND is_archived = TRUE`,
            [bookId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found or is not archived.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Book restored successfully.'
        });

    } catch (error) {
        next(error);
    }
};


// Get librarian dashboard statistics
const getDashboard = async (req, res) => {

    console.log('[DASHBOARD CONTROLLER] Reached successfully');
    try {
        const [rows] = await db.execute(`
            SELECT
                (
                    SELECT COUNT(*)
                    FROM Books
                    WHERE is_archived = FALSE
                ) AS total_books,

                (
                    SELECT COUNT(*)
                    FROM BookCopies c
                    INNER JOIN Books b ON c.book_id = b.book_id
                    WHERE b.is_archived = FALSE
                ) AS total_copies,

                (
                    SELECT COUNT(*)
                    FROM BookCopies c
                    INNER JOIN Books b ON c.book_id = b.book_id
                    WHERE b.is_archived = FALSE
                    AND c.status = 'available'
                ) AS available_copies,

                (
                    SELECT COUNT(*)
                    FROM Borrowings
                    WHERE status IN ('borrowed', 'overdue')
                ) AS active_borrowings,

                (
                    SELECT COUNT(*)
                    FROM Borrowings
                    WHERE returned_at IS NULL
                    AND (
                        status = 'overdue'
                        OR (status = 'borrowed' AND due_date < NOW())
                    )
                ) AS overdue_borrowings,

                (
                    SELECT COUNT(*)
                    FROM Reservations
                    WHERE status IN ('pending', 'waiting', 'ready_for_pickup')
                ) AS active_reservations
        `);

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Get librarian dashboard error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics.'
        });
    }
};

// ==========================================
// GET ALL BOOK COPIES
// ==========================================

const getCopies = async (req, res, next) => {
    try {
        const { search, status } = req.query;

        let conditions = [];
        let params = [];

        if (search && search.trim()) {
            conditions.push(
                '(b.title LIKE ? OR c.accession_number LIKE ? OR c.shelf_location LIKE ?)'
            );

            const keyword = `%${search.trim()}%`;
            params.push(keyword, keyword, keyword);
        }

        if (status) {
            const validStatuses = [
                'available',
                'reserved',
                'borrowed',
                'damaged',
                'lost'
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid copy status.'
                });
            }

            conditions.push('c.status = ?');
            params.push(status);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const [copies] = await db.execute(
            `SELECT
                c.copy_id,
                c.book_id,
                c.accession_number,
                c.shelf_location,
                c.status,
                c.created_at,
                c.updated_at,
                b.title,
                b.authors,
                b.isbn
             FROM BookCopies c
             INNER JOIN Books b ON c.book_id = b.book_id
             ${whereClause}
             ORDER BY c.created_at DESC`,
            params
        );

        return res.status(200).json({
            success: true,
            count: copies.length,
            copies
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// ADD NEW BOOK COPY
// ==========================================

const addCopy = async (req, res, next) => {
    try {
        const { book_id, accession_number, shelf_location } = req.body;

        if (
            !book_id ||
            !Number.isInteger(Number(book_id)) ||
            Number(book_id) <= 0 ||
            !accession_number ||
            !accession_number.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid book ID and accession number are required.'
            });
        }

        // Check whether the book exists and is active
        const [books] = await db.execute(
            `SELECT book_id
             FROM Books
             WHERE book_id = ? AND is_archived = FALSE`,
            [book_id]
        );

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found or archived.'
            });
        }

        // Insert new physical copy
        const [result] = await db.execute(
            `INSERT INTO BookCopies (
                book_id,
                accession_number,
                shelf_location
            )
            VALUES (?, ?, ?)`,
            [
                book_id,
                accession_number.trim(),
                shelf_location?.trim() || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Book copy added successfully.',
            copyId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This accession number already exists.'
            });
        }

        next(error);
    }
};


// ==========================================
// UPDATE BOOK COPY
// ==========================================

const updateCopy = async (req, res, next) => {
    try {
        const { copyId } = req.params;
        const { accession_number, shelf_location, status } = req.body;

        const validStatuses = [
            'available',
            'reserved',
            'borrowed',
            'damaged',
            'lost'
        ];

        if (
            status !== undefined &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid copy status.'
            });
        }

        if (
            accession_number !== undefined &&
            (!accession_number.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: 'Accession number cannot be empty.'
            });
        }

        const [existingCopies] = await db.execute(
            `SELECT copy_id
             FROM BookCopies
             WHERE copy_id = ?`,
            [copyId]
        );

        if (existingCopies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book copy not found.'
            });
        }

        const [result] = await db.execute(
            `UPDATE BookCopies
             SET accession_number = COALESCE(?, accession_number),
                 shelf_location = COALESCE(?, shelf_location),
                 status = COALESCE(?, status)
             WHERE copy_id = ?`,
            [
                accession_number !== undefined
                    ? accession_number.trim()
                    : null,
                shelf_location !== undefined
                    ? (shelf_location.trim() || null)
                    : null,
                status || null,
                copyId
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Book copy updated successfully.'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This accession number already exists.'
            });
        }

        next(error);
    }
};


// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
    getBooks,
    addBook,
    updateBook,
    archiveBook,
    restoreBook,
    getDashboard,
    getCopies,
    addCopy,
    updateCopy
};