const db = require('../config/db');

// ==========================================
// GET SUBJECTS AND TOPICS (for filters)
// ==========================================

const getFilters = async (req, res, next) => {
    try {
        const [subjects] = await db.execute(
            `SELECT subject_id, subject_name
             FROM Subjects
             ORDER BY subject_name`
        );

        const [topics] = await db.execute(
            `SELECT topic_id, subject_id, topic_name
             FROM Topics
             ORDER BY topic_name`
        );

        return res.status(200).json({
            success: true,
            subjects,
            topics
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// SEARCH AND LIST BOOKS
// Query: search, subject_id, topic_id, availability
// ==========================================

const getBooks = async (req, res, next) => {
    try {
        const { search, subject_id, topic_id, availability } = req.query;

        const conditions = [];
        const params = [];

        // Search by title, author, ISBN or topic name
        if (typeof search === 'string' && search.trim().length > 0) {
            const like = `%${search.trim()}%`;

            conditions.push(
                `(b.title LIKE ?
                  OR b.authors LIKE ?
                  OR b.isbn LIKE ?
                  OR EXISTS (
                        SELECT 1
                        FROM BookTopics bt2
                        JOIN Topics t2 ON t2.topic_id = bt2.topic_id
                        WHERE bt2.book_id = b.book_id
                          AND t2.topic_name LIKE ?
                  ))`
            );

            params.push(like, like, like, like);
        }

        // Filter by subject
        const subjectId = Number(subject_id);

        if (Number.isInteger(subjectId) && subjectId > 0) {
            conditions.push(
                `EXISTS (
                    SELECT 1
                    FROM BookTopics bt3
                    JOIN Topics t3 ON t3.topic_id = bt3.topic_id
                    WHERE bt3.book_id = b.book_id
                      AND t3.subject_id = ?
                )`
            );

            params.push(subjectId);
        }

        // Filter by topic
        const topicId = Number(topic_id);

        if (Number.isInteger(topicId) && topicId > 0) {
            conditions.push(
                `EXISTS (
                    SELECT 1
                    FROM BookTopics bt4
                    WHERE bt4.book_id = b.book_id
                      AND bt4.topic_id = ?
                )`
            );

            params.push(topicId);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Filter by availability
        let havingClause = '';

        if (availability === 'available') {
            havingClause = 'HAVING available_copies > 0';
        } else if (availability === 'unavailable') {
            havingClause = 'HAVING available_copies = 0';
        }

        const [books] = await db.execute(
            `SELECT
                b.book_id,
                b.isbn,
                b.title,
                b.authors,
                b.description,
                b.cover_image_url,
                COUNT(c.copy_id) AS total_copies,
                COALESCE(SUM(c.status = 'available'), 0) AS available_copies,
                GROUP_CONCAT(DISTINCT c.shelf_location SEPARATOR ', ') AS shelf_locations
             FROM Books b
             LEFT JOIN BookCopies c ON c.book_id = b.book_id
             ${whereClause}
             GROUP BY b.book_id
             ${havingClause}
             ORDER BY b.title`,
            params
        );

        const result = books.map((book) => ({
            book_id: book.book_id,
            isbn: book.isbn,
            title: book.title,
            authors: book.authors,
            description: book.description,
            cover_image_url: book.cover_image_url,
            total_copies: Number(book.total_copies),
            available_copies: Number(book.available_copies),
            is_available: Number(book.available_copies) > 0,
            shelf_locations: book.shelf_locations
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            books: result
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// BOOK DETAILS
// ==========================================

const getBookById = async (req, res, next) => {
    try {
        const bookId = Number(req.params.bookId);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const [books] = await db.execute(
            `SELECT
                b.book_id, b.isbn, b.title, b.authors, b.publisher,
                b.publication_year, b.edition, b.language,
                b.description, b.cover_image_url
             FROM Books b
             WHERE b.book_id = ?`,
            [bookId]
        );

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        // Copies, availability and shelf locations
        const [copies] = await db.execute(
            `SELECT copy_id, accession_number, shelf_location, status
             FROM BookCopies
             WHERE book_id = ?
             ORDER BY accession_number`,
            [bookId]
        );

        // Topics with average relevance rating
        const [topicRows] = await db.execute(
            `SELECT
                t.topic_id,
                t.topic_name,
                s.subject_name,
                bt.relevance_description,
                AVG(r.rating) AS average_rating,
                COUNT(r.rating) AS rating_count
             FROM BookTopics bt
             JOIN Topics t ON t.topic_id = bt.topic_id
             JOIN Subjects s ON s.subject_id = t.subject_id
             LEFT JOIN BookRatings r
                ON r.book_id = bt.book_id AND r.topic_id = bt.topic_id
             WHERE bt.book_id = ?
             GROUP BY t.topic_id, t.topic_name, s.subject_name,
                      bt.relevance_description`,
            [bookId]
        );

        const topics = topicRows.map((topic) => ({
            ...topic,
            average_rating: topic.average_rating === null
                ? null
                : Number(Number(topic.average_rating).toFixed(1)),
            rating_count: Number(topic.rating_count)
        }));

        // Lecturer recommendations
        const [recommendations] = await db.execute(
            `SELECT
                lr.recommendation_id,
                u.full_name AS lecturer_name,
                t.topic_name,
                lr.explanation,
                lr.relevant_chapters,
                lr.difficulty_level
             FROM LecturerRecommendations lr
             JOIN Users u ON u.user_id = lr.lecturer_id
             JOIN Topics t ON t.topic_id = lr.topic_id
             WHERE lr.book_id = ?
             ORDER BY lr.created_at DESC`,
            [bookId]
        );

        const availableCopies = copies.filter(
            (copy) => copy.status === 'available'
        ).length;

        return res.status(200).json({
            success: true,
            book: {
                ...books[0],
                total_copies: copies.length,
                available_copies: availableCopies,
                is_available: availableCopies > 0,
                copies,
                topics,
                recommendations
            }
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getFilters,
    getBooks,
    getBookById
};
