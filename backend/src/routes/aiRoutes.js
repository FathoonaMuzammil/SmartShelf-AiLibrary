const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Student-only AI Assistant endpoint
router.post(
    '/chat',
    authenticateToken,
    authorizeRoles('student'),
    aiController.chatWithAI
);

module.exports = router;