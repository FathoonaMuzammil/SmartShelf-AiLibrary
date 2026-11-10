const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Security middleware
app.use(helmet());

// Allow frontend communication
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Authentication API routes
app.use('/api/auth', authRoutes);

// AI Assistant API routes
app.use('/api/ai', aiRoutes);

// Basic API health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'SmartShelf API is running'
    });
});
app.use(errorMiddleware);
module.exports = app;