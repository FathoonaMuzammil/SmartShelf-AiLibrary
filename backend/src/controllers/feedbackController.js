const db = require('../config/db');

// ==========================================
// GET FEEDBACK OF A BOOK
// Returns: my own ratings/reviews + all student reviews
// ==========================================

const getBookFeedback = async (req, res, next) => {
    try {
        const bookId = Number(req.params.bookId);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const studentId = req.user.userId;

        // My ratings (with my review text if I wrote one)
        const [myFeedback] = await db.execute(
            `SELECT r.topic_id, r.rating, rv.review_text
             FROM BookRatings r
             LEFT JOIN BookReviews rv
                ON rv.student_id = r.student_id
               AND rv.book_id = r.book_id
               AND rv.topic_id = r.topic_id
             WHERE r.student_id = ? AND r.book_id = ?`,
            [studentId, bookId]
        );

        // All reviews written for this book
        const [reviews] = await db.execute(
            `SELECT
                rv.review_id,
                rv.topic_id,
                t.topic_name,
                u.full_name,
                rv.review_text,
                rv.updated_at,
                r.rating,
                (rv.student_id = ?) AS is_mine
             FROM BookReviews rv
             JOIN Users u ON u.user_id = rv.student_id
             JOIN Topics t ON t.topic_id = rv.topic_id
             LEFT JOIN BookRatings r
                ON r.student_id = rv.student_id
               AND r.book_id = rv.book_id
               AND r.topic_id = rv.topic_id
             WHERE rv.book_id = ?
             ORDER BY rv.updated_at DESC`,
            [studentId, bookId]
        );

        return res.status(200).json({
            success: true,
            my_feedback: myFeedback,
            reviews: reviews.map((item) => ({
                ...item,
                is_mine: Boolean(item.is_mine)
            }))
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// SAVE (CREATE OR EDIT) MY RATING AND REVIEW
// Body: { rating: 1-5, review_text?: string }
// ==========================================

const saveFeedback = async (req, res, next) => {
    let connection;

    try {
        const bookId = Number(req.params.bookId);
        const topicId = Number(req.params.topicId);
        const body = req.body || {};

        if (
            !Number.isInteger(bookId) || bookId <= 0 ||
            !Number.isInteger(topicId) || topicId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid book or topic.'
            });
        }

        const rating = Number(body.rating);

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be a whole number from 1 to 5.'
            });
        }

        const reviewText = typeof body.review_text === 'string'
            ? body.review_text.trim()
            : '';

        if (reviewText.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Review must be 1000 characters or less.'
            });
        }

        const studentId = req.user.userId;

        // The topic must belong to this book
        const [links] = await db.execute(
            `SELECT book_id FROM BookTopics
             WHERE book_id = ? AND topic_id = ?`,
            [bookId, topicId]
        );

        if (links.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'This topic is not linked to this book.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO BookRatings (student_id, book_id, topic_id, rating)
             VALUES (?, ?, ?, ?) AS new_row
             ON DUPLICATE KEY UPDATE rating = new_row.rating`,
            [studentId, bookId, topicId, rating]
        );

        if (reviewText.length > 0) {
            await connection.execute(
                `INSERT INTO BookReviews
                 (student_id, book_id, topic_id, review_text)
                 VALUES (?, ?, ?, ?) AS new_row
                 ON DUPLICATE KEY UPDATE review_text = new_row.review_text`,
                [studentId, bookId, topicId, reviewText]
            );
        } else {
            // Empty text means the student removed the review
            await connection.execute(
                `DELETE FROM BookReviews
                 WHERE student_id = ? AND book_id = ? AND topic_id = ?`,
                [studentId, bookId, topicId]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Your rating and review were saved.'
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
    getBookFeedback,
    saveFeedback
};
