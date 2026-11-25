
const db = require('../config/db');

const authService = require('../services/authService');

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
            WHERE b.is_archived = FALSE
            ${whereClause ? `AND (${whereClause.replace(/^WHERE\s+/i, '')})` : ''}
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
// ==========================================

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels'];

const createRecommendation = async (req, res, next) => {
    try {
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

        const [books] = await db.execute(
            'SELECT book_id FROM Books WHERE book_id = ? AND is_archived = FALSE',
            [bookId]
        );

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'This book was not found in the library catalogue.'
            });
        }

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
                AND b.is_archived = FALSE
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
// Handles unchanged values correctly
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

        const [result] = await db.execute(
            `UPDATE LecturerRecommendations
             SET explanation = ?, relevant_chapters = ?, difficulty_level = ?
             WHERE recommendation_id = ? AND lecturer_id = ?`,
            [
                explanation,
                relevantChapters,
                difficultyLevel,
                recommendationId,
                lecturerId
            ]
        );

        // Zero affected rows does not always mean the record is missing.
        if (result.affectedRows === 0) {
            const [existing] = await db.execute(
                `SELECT recommendation_id
                 FROM LecturerRecommendations
                 WHERE recommendation_id = ? AND lecturer_id = ?
                 LIMIT 1`,
                [recommendationId, lecturerId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Recommendation not found.'
                });
            }
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


// ==========================================
// STUDENT FEEDBACK
// ==========================================

const getFeedback = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;

        const [summaries] = await db.execute(
            `SELECT
                lr.recommendation_id,
                lr.book_id,
                b.title,
                b.authors,
                lr.topic_id,
                t.topic_name,
                s.subject_name,
                ROUND(AVG(r.rating), 1) AS average_rating,
                COUNT(r.rating_id) AS rating_count
             FROM LecturerRecommendations lr
             JOIN Books b ON b.book_id = lr.book_id
             JOIN Topics t ON t.topic_id = lr.topic_id
             JOIN Subjects s ON s.subject_id = t.subject_id
             LEFT JOIN BookRatings r
                ON r.book_id = lr.book_id AND r.topic_id = lr.topic_id
             WHERE lr.lecturer_id = ?
                 AND b.is_archived = FALSE
             GROUP BY lr.recommendation_id, lr.book_id, b.title, b.authors,
                      lr.topic_id, t.topic_name, s.subject_name, lr.created_at
             ORDER BY lr.created_at DESC`,
            [lecturerId]
        );

        const [reviews] = await db.execute(
            `SELECT
                rv.review_id,
                rv.book_id,
                rv.topic_id,
                rv.review_text,
                rv.updated_at,
                r.rating
             FROM BookReviews rv
             JOIN LecturerRecommendations lr
                ON lr.book_id = rv.book_id AND lr.topic_id = rv.topic_id
             LEFT JOIN BookRatings r
                ON r.student_id = rv.student_id
               AND r.book_id = rv.book_id
               AND r.topic_id = rv.topic_id
             WHERE lr.lecturer_id = ?
             ORDER BY rv.updated_at DESC`,
            [lecturerId]
        );

        const feedback = summaries.map((summary) => ({
            ...summary,
            average_rating: summary.average_rating === null
                ? null
                : Number(summary.average_rating),
            rating_count: Number(summary.rating_count),
            reviews: reviews
                .filter((review) =>
                    review.book_id === summary.book_id
                    && review.topic_id === summary.topic_id)
                .map((review) => ({
                    review_id: review.review_id,
                    review_text: review.review_text,
                    rating: review.rating,
                    updated_at: review.updated_at
                }))
        }));

        return res.status(200).json({
            success: true,
            feedback
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

const getDashboard = async (req, res, next) => {
    try {
        const lecturerId = req.user.userId;

        const [counts] = await db.execute(
            `SELECT
                COUNT(*) AS total_recommendations,
                COUNT(DISTINCT book_id) AS recommended_books
             FROM LecturerRecommendations
             WHERE lecturer_id = ?`,
            [lecturerId]
        );

        const [ratings] = await db.execute(
            `SELECT
                COUNT(r.rating_id) AS total_ratings,
                ROUND(AVG(r.rating), 1) AS average_rating
             FROM BookRatings r
             WHERE EXISTS (
                SELECT 1
                FROM LecturerRecommendations lr
                WHERE lr.lecturer_id = ?
                  AND lr.book_id = r.book_id
                  AND lr.topic_id = r.topic_id
             )`,
            [lecturerId]
        );

        const [recent] = await db.execute(
            `SELECT
                lr.recommendation_id,
                b.title,
                t.topic_name,
                lr.difficulty_level,
                lr.created_at
             FROM LecturerRecommendations lr
             JOIN Books b ON b.book_id = lr.book_id
             JOIN Topics t ON t.topic_id = lr.topic_id
             WHERE lr.lecturer_id = ?
                AND b.is_archived = FALSE
             ORDER BY lr.created_at DESC
             LIMIT 5`,
            [lecturerId]
        );

        return res.status(200).json({
            success: true,
            summary: {
                total_recommendations: Number(counts[0].total_recommendations),
                recommended_books: Number(counts[0].recommended_books),
                total_ratings: Number(ratings[0].total_ratings),
                average_rating: ratings[0].average_rating === null
                    ? null
                    : Number(ratings[0].average_rating)
            },
            recent_recommendations: recent
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// LIST MY NOTIFICATIONS
// ==========================================

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;

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
             LIMIT 50`,
            [userId]
        );

        const [unreadRows] = await db.execute(
            `SELECT COUNT(*) AS unread
             FROM Notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            unread_count: Number(unreadRows[0].unread),
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
// MARK ONE NOTIFICATION AS READ
// ==========================================

const markNotificationRead = async (req, res, next) => {
    try {
        const notificationId = Number(req.params.notificationId);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification.'
            });
        }

        const [result] = await db.execute(
            `UPDATE Notifications
             SET is_read = TRUE
             WHERE notification_id = ? AND user_id = ?`,
            [notificationId, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.'
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


// ==========================================
// MY PROFILE
// ==========================================

const getProfile = async (req, res, next) => {
    try {
        const [users] = await db.execute(
            `SELECT user_id, full_name, email, role, created_at
             FROM Users
             WHERE user_id = ?`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            success: true,
            profile: users[0]
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// UPDATE MY NAME
// ==========================================

const updateProfile = async (req, res, next) => {
    try {
        const body = req.body || {};

        const fullName = typeof body.full_name === 'string'
            ? body.full_name.trim()
            : '';

        if (fullName.length < 2 || fullName.length > 150) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 150 characters.'
            });
        }

        await db.execute(
            'UPDATE Users SET full_name = ? WHERE user_id = ?',
            [fullName, req.user.userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            full_name: fullName
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// CHANGE MY PASSWORD
// ==========================================

const changePassword = async (req, res, next) => {
    try {
        const body = req.body || {};
        const currentPassword = body.current_password;
        const newPassword = body.new_password;

        if (typeof currentPassword !== 'string' || !currentPassword
            || typeof newPassword !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Please provide your current and new password.'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must contain at least 8 characters.'
            });
        }

        const [users] = await db.execute(
            'SELECT password_hash FROM Users WHERE user_id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const matches = await authService.comparePassword(
            currentPassword,
            users[0].password_hash
        );

        if (!matches) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        const newHash = await authService.hashPassword(newPassword);

        await db.execute(
            'UPDATE Users SET password_hash = ? WHERE user_id = ?',
            [newHash, req.user.userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.'
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
    deleteRecommendation,
    getFeedback,
    getDashboard,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getProfile,
    updateProfile,
    changePassword
};
