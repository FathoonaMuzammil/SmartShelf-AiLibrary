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

// Edit and delete my own recommendation
router.put('/recommendations/:recommendationId', lecturerController.updateRecommendation);
router.delete('/recommendations/:recommendationId', lecturerController.deleteRecommendation);

// Student feedback on my recommendations
router.get('/feedback', lecturerController.getFeedback);

// Dashboard statistics
router.get('/dashboard', lecturerController.getDashboard);

// Notifications
router.get('/notifications', lecturerController.getNotifications);
router.patch('/notifications/read-all', lecturerController.markAllNotificationsRead);
router.patch('/notifications/:notificationId/read', lecturerController.markNotificationRead);

// Lecturer profile and password
router.get('/profile', lecturerController.getProfile);
router.put('/profile', lecturerController.updateProfile);
router.put('/password', lecturerController.changePassword);

module.exports = router;
