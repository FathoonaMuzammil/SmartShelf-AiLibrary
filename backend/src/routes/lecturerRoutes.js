const express = require('express');
const router = express.Router();

const lecturerController = require('../controllers/lecturerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All lecturer routes require a logged-in lecturer
router.use(authenticateToken, authorizeRoles('lecturer'));

// Subjects and topics for the recommendation form
router.get('/filters', lecturerController.getFilters);

// Search and list books
router.get('/books', lecturerController.getBooks);

// Create a recommendation
router.post('/recommendations', lecturerController.createRecommendation);

// List my own recommendations
router.get('/recommendations', lecturerController.getMyRecommendations);

module.exports = router;