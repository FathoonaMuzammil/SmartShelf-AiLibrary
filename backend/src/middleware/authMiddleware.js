const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Verify JWT and check the user's current account status
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check whether the token exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required.'
            });
        }

        // Extract and verify the token
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get the latest user information from the database
        const [users] = await db.execute(
            `SELECT user_id, role, is_active
             FROM Users
             WHERE user_id = ?`,
            [decoded.userId]
        );

        // Check whether the account exists
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User account not found.'
            });
        }

        const user = users[0];

        // Check whether the account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive.'
            });
        }

        // Attach current database information to the request
        req.user = {
            userId: user.user_id,
            role: user.role
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token.'
            });
        }

        next(error);
    }
};

module.exports = authenticateToken;