require('dotenv').config();

const readlineSync = require('readline-sync');
const db = require('../src/config/db');
const authService = require('../src/services/authService');

async function createAdmin() {
    try {
        console.log('\n=== SmartShelf Initial Admin Setup ===\n');

        // Check whether an admin already exists
        const [admins] = await db.execute(
            "SELECT user_id FROM Users WHERE role = 'admin' LIMIT 1"
        );

        if (admins.length > 0) {
            console.log('An administrator account already exists.');
            return;
        }

        // Collect administrator details
        const fullName = readlineSync.question('Admin full name: ').trim();

        const email = readlineSync.question('Admin email: ')
            .trim()
            .toLowerCase();

        // Collect password without displaying characters
        const password = readlineSync.question('Admin password: ', {
            hideEchoBack: true
        });

        const confirmPassword = readlineSync.question('\nConfirm password: ', {
            hideEchoBack: true
        });

        // Validate inputs
        if (!fullName || !email || !password) {
            throw new Error('All fields are required.');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please enter a valid email address.');
        }

        if (password.length < 12) {
            throw new Error(
                'Admin password must contain at least 12 characters.'
            );
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        // Hash the password
        const passwordHash = await authService.hashPassword(password);

        // Create the administrator account
        await db.execute(
            `INSERT INTO Users (full_name, email, password_hash, role)
             VALUES (?, ?, ?, 'admin')`,
            [fullName, email, passwordHash]
        );

        console.log('\nAdministrator account created successfully!');

    } catch (error) {
        console.error('\nAdmin setup failed:', error.message);

    } finally {
        await db.end();
    }
}

createAdmin();