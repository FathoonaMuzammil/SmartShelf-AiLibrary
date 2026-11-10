// Centralized error-handling middleware
const errorMiddleware = (err, req, res, next) => {

    // Log detailed error information for developers
    console.error('Backend Error:', err);

    // Determine the appropriate HTTP status code
    const statusCode =
        err.statusCode && err.statusCode >= 400 && err.statusCode < 600
            ? err.statusCode
            : 500;

    // Protect internal server error details
    const message =
        statusCode === 500
            ? 'An unexpected server error occurred.'
            : err.message || 'Something went wrong.';

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;