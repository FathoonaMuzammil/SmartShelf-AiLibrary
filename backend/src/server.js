require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test MySQL connection before starting the server
async function startServer() {
    try {
        const connection = await db.getConnection();

        console.log('MySQL database connected successfully!');

        connection.release();

        app.listen(PORT, () => {
            console.log(`SmartShelf API running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();
