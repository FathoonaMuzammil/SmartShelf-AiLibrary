
const express = require('express');
const router = express.Router();

const librarianController = require('../controllers/librarianController');
const reportsController = require('../controllers/reportsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const reservationController = require('../controllers/reservationController');
const borrowingController = require('../controllers/borrowingController');

// Only librarians and admins can access these routes
router.use(authenticateToken, authorizeRoles('librarian', 'admin'));

// ==========================================
// BOOK MANAGEMENT
// ==========================================

router.get('/books', librarianController.getBooks);
router.post('/books', librarianController.addBook);
router.put('/books/:bookId', librarianController.updateBook);
router.patch('/books/:bookId/archive', librarianController.archiveBook);
router.patch('/books/:bookId/restore', librarianController.restoreBook);

// ==========================================
// COPY MANAGEMENT
// ==========================================

router.get('/copies', librarianController.getCopies);
router.post('/copies', librarianController.addCopy);
router.put('/copies/:copyId', librarianController.updateCopy);

// ==========================================
// DASHBOARD
// ==========================================

router.get('/dashboard', (req, res, next) => {
    console.log('[DASHBOARD ROUTE] Matched successfully');
    next();
}, librarianController.getDashboard);

// ==========================================
// RESERVATION MANAGEMENT
// ==========================================

router.get('/reservations', reservationController.getAllReservations);

router.patch(
    '/reservations/:reservationId/allocate',
    reservationController.allocateReservation
);

router.patch(
    '/reservations/:reservationId/cancel',
    reservationController.librarianCancelReservation
);

// ==========================================
// BORROWING MANAGEMENT
// ==========================================

router.get('/borrowings', borrowingController.getAllBorrowings);
router.post('/borrowings', borrowingController.issueBorrowing);

// ==========================================
// RETURNS MANAGEMENT
// ==========================================

router.patch(
    '/borrowings/:borrowingId/return',
    borrowingController.returnBorrowing
);

// ==========================================
// OVERDUE MANAGEMENT
// ==========================================

router.get(
    '/overdue',
    borrowingController.getOverdueBorrowings
);

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

router.get('/reports', reportsController.getReports);

module.exports = router;
