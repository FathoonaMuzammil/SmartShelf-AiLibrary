const db = require('../config/db');

// ==========================================
// GET SUBJECTS AND TOPICS
// Used by the Create Recommendation form
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

        return res.status(200).json({
            success: true,
            books
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// CREATE A RECOMMENDATION
// Body: book_id, topic_id, explanation,
//       relevant_chapters (optional), difficulty_level
// ==========================================

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels'];

const createRecommendation = async (req, res, next) => {
    try {
        // The lecturer always comes from the verified token, never from the request body
        const lecturerId = req.user.userId;

        const body = req.body || {};

        const bookId = Number(body.book_id);
        const topicId = Number(body.topic_id);

        const explanation = typeof body.explanation === 'string'
            ? body.explanation.trim()
            : '';

        const relevantChapters = typeof body.relevant_chapters === 'string'
            && body.relevant_chapters.trim().length > 0
            ? body.relevant_chapters.trim()
            : null;

        const difficultyLevel = body.difficulty_level;

        // Validate input
        if (!Number.isInteger(bookId) || bookId <= 0
            || !Number.isInteger(topicId) || topicId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid book and topic.'
            });
        }

        if (!explanation) {
            return res.status(400).json({
                success: false,
                message: 'Please explain why this book is useful.'
            });
        }

        if (!DIFFICULTY_LEVELS.includes(difficultyLevel)) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid difficulty level.'
            });
        }

        // The book must exist in the library catalogue
        const [books] = await db.execute(
            'SELECT book_id FROM Books WHERE book_id = ?',
            [bookId]
        );

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'This book was not found in the library catalogue.'
            });
        }

        // The topic must exist
        const [topics] = await db.execute(
            'SELECT topic_id FROM Topics WHERE topic_id = ?',
            [topicId]
        );

        if (topics.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found.'
            });
        }

        // Do not allow the same lecturer to recommend the same book for the same topic twice
        const [existing] = await db.execute(
            `SELECT recommendation_id
             FROM LecturerRecommendations
             WHERE lecturer_id = ? AND book_id = ? AND topic_id = ?`,
            [lecturerId, bookId, topicId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You have already recommended this book for this topic.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO LecturerRecommendations
                (lecturer_id, book_id, topic_id, explanation,
                 relevant_chapters, difficulty_level)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [lecturerId, bookId, topicId, explanation,
             relevantChapters, difficultyLevel]
        );

        return res.status(201).json({
            success: true,
            message: 'Recommendation created successfully.',
            recommendation_id: result.insertId
        });

    } catch (error) {
        next(error);
    }
};
// ==========================================
// LIST MY RECOMMENDATIONS
// Only the logged-in lecturer's own recommendations
// ==========================================

const getMyRecommendations = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;

        const [recommendations] = await db.execute(
            `SELECT
                lr.recommendation_id,
                lr.book_id,
                b.title,
                b.authors,
                b.cover_image_url,
                lr.topic_id,
                t.topic_name,
                s.subject_id,
                s.subject_name,
                lr.explanation,
                lr.relevant_chapters,
                lr.difficulty_level,
                lr.created_at,
                lr.updated_at
             FROM LecturerRecommendations lr
             JOIN Books b ON b.book_id = lr.book_id
             JOIN Topics t ON t.topic_id = lr.topic_id
             JOIN Subjects s ON s.subject_id = t.subject_id
             WHERE lr.lecturer_id = ?
             ORDER BY lr.created_at DESC`,
            [lecturerId]
        );

        return res.status(200).json({
            success: true,
            recommendations
        });

    } catch (error) {
        next(error);
    }
};
// ==========================================
// UPDATE MY RECOMMENDATION
// Only the lecturer who created it can edit it
// Body: explanation, relevant_chapters, difficulty_level
// ==========================================

const updateRecommendation = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;
        const recommendationId = Number(req.params.recommendationId);

        if (!Number.isInteger(recommendationId) || recommendationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recommendation.'
            });
        }

        const body = req.body || {};

        const explanation = typeof body.explanation === 'string'
            ? body.explanation.trim()
            : '';

        const relevantChapters = typeof body.relevant_chapters === 'string'
            && body.relevant_chapters.trim().length > 0
            ? body.relevant_chapters.trim()
            : null;

        const difficultyLevel = body.difficulty_level;

        if (!explanation) {
            return res.status(400).json({
                success: false,
                message: 'Please explain why this book is useful.'
            });
        }

        if (!DIFFICULTY_LEVELS.includes(difficultyLevel)) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid difficulty level.'
            });
        }

        // lecturer_id in the WHERE clause stops a lecturer editing someone else's recommendation
        const [result] = await db.execute(
            `UPDATE LecturerRecommendations
             SET explanation = ?, relevant_chapters = ?, difficulty_level = ?
             WHERE recommendation_id = ? AND lecturer_id = ?`,
            [explanation, relevantChapters, difficultyLevel,
             recommendationId, lecturerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Recommendation updated successfully.'
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// DELETE MY RECOMMENDATION
// Only the lecturer who created it can delete it
// ==========================================

const deleteRecommendation = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;
        const recommendationId = Number(req.params.recommendationId);

        if (!Number.isInteger(recommendationId) || recommendationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recommendation.'
            });
        }

        const [result] = await db.execute(
            `DELETE FROM LecturerRecommendations
             WHERE recommendation_id = ? AND lecturer_id = ?`,
            [recommendationId, lecturerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Recommendation deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFilters,
    getBooks,
    createRecommendation,
    getMyRecommendations,
    updateRecommendation,
    deleteRecommendation
};