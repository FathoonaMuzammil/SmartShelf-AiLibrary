const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Student registration
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);

// Admin-only staff account creation
router.post(
    '/staff',
    authenticateToken,
    authorizeRoles('admin'),
    authController.createStaffAccount
);

// View all registered accounts (Admin only)
router.get(
    '/users',
    authenticateToken,
    authorizeRoles('admin'),
    authController.getAllUsers
);

// Activate or deactivate a user account (Admin only)
router.patch(
    '/users/:userId/status',
    authenticateToken,
    authorizeRoles('admin'),
    authController.updateUserStatus
);

module.exports = router;