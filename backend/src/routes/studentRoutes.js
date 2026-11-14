const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const reservationController = require('../controllers/reservationController');
const borrowingController = require('../controllers/borrowingController');
const feedbackController = require('../controllers/feedbackController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All student routes require a logged-in student
router.use(authenticateToken, authorizeRoles('student'));

// Subjects and topics for the filters
router.get('/filters', studentController.getFilters);

// Search and list books
router.get('/books', studentController.getBooks);

// Single book details
router.get('/books/:bookId', studentController.getBookById);

// Reservations
router.post('/reservations', reservationController.createReservation);
router.get('/reservations', reservationController.getMyReservations);
router.patch(
    '/reservations/:reservationId/cancel',
    reservationController.cancelReservation
);

// Borrowings (current loans and history)
router.get('/borrowings', borrowingController.getMyBorrowings);

// Ratings and reviews
router.get('/books/:bookId/feedback', feedbackController.getBookFeedback);
router.put(
    '/books/:bookId/topics/:topicId/feedback',
    feedbackController.saveFeedback
);

module.exports = router;
