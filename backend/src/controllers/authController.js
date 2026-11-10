const db = require('../config/db');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

// Check whether a value is a non-empty string
const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};

// Validate email format
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Handle duplicate database entries
const handleDuplicateError = (error, res, next, message) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message
        });
    }

    return next(error);
};


// ==========================================
// STUDENT REGISTRATION
// ==========================================

const register = async (req, res, next) => {
    try {
        const body = req.body || {};

        const full_name = isNonEmptyString(body.full_name)
            ? body.full_name.trim()
            : '';

        const email = isNonEmptyString(body.email)
            ? body.email.trim().toLowerCase()
            : '';

        const password = body.password;

        const student_id = isNonEmptyString(body.student_id)
            ? body.student_id.trim()
            : '';

        // Check required fields
        if (!full_name || !email || !password || !student_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields.'
            });
        }

        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Validate password
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters.'
            });
        }

        // Check whether email or student ID already exists
        const [existingUsers] = await db.execute(
            `SELECT user_id
             FROM Users
             WHERE email = ? OR student_id = ?`,
            [email, student_id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email or student ID is already registered.'
            });
        }

        // Hash the password
        const passwordHash = await authService.hashPassword(password);

        // Always assign the student role on the server
        await db.execute(
            `INSERT INTO Users
            (full_name, email, password_hash, role, student_id)
            VALUES (?, ?, ?, 'student', ?)`,
            [full_name, email, passwordHash, student_id]
        );

        return res.status(201).json({
            success: true,
            message: 'Student account created successfully.'
        });

    } catch (error) {
        return handleDuplicateError(
            error,
            res,
            next,
            'Email or student ID is already registered.'
        );
    }
};


// ==========================================
// USER LOGIN
// ==========================================

const login = async (req, res, next) => {
    try {
        const body = req.body || {};

        const email = isNonEmptyString(body.email)
            ? body.email.trim().toLowerCase()
            : '';

        const password = body.password;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Validate input types
        if (
            typeof password !== 'string' ||
            !isValidEmail(email)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid login details.'
            });
        }

        // Find user using only the required columns
        const [users] = await db.execute(
            `SELECT
                user_id,
                full_name,
                email,
                password_hash,
                role,
                student_id,
                is_active
             FROM Users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact the administrator.'
            });
        }

        // Verify password
        const passwordMatches = await authService.comparePassword(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        // Return token and safe user details
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                student_id: user.student_id
            }
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// CREATE STAFF ACCOUNT (ADMIN ONLY)
// ==========================================

const createStaffAccount = async (req, res, next) => {
    try {
        const body = req.body || {};

        const full_name = isNonEmptyString(body.full_name)
            ? body.full_name.trim()
            : '';

        const email = isNonEmptyString(body.email)
            ? body.email.trim().toLowerCase()
            : '';

        const password = body.password;
        const role = body.role;

        // Validate required fields
        if (!full_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields.'
            });
        }

        // Only these roles can be created through this function
        const allowedRoles = ['lecturer', 'librarian', 'admin'];

        if (typeof role !== 'string' || !allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account role.'
            });
        }

        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Validate password
        if (typeof password !== 'string' || password.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 12 characters.'
            });
        }

        // Check whether email already exists
        const [existingUsers] = await db.execute(
            'SELECT user_id FROM Users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered.'
            });
        }

        // Hash the password
        const passwordHash = await authService.hashPassword(password);

        // Create the account
        const [result] = await db.execute(
            `INSERT INTO Users
            (full_name, email, password_hash, role, created_by)
            VALUES (?, ?, ?, ?, ?)`,
            [
                full_name,
                email,
                passwordHash,
                role,
                req.user.userId
            ]
        );

        return res.status(201).json({
            success: true,
            message: `${role} account created successfully.`,
            user: {
                user_id: result.insertId,
                full_name,
                email,
                role
            }
        });

    } catch (error) {
        return handleDuplicateError(
            error,
            res,
            next,
            'This email is already registered.'
        );
    }
};


// ==========================================
// GET ALL USERS (ADMIN ONLY)
// ==========================================

const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await db.execute(
            `SELECT
                user_id,
                full_name,
                email,
                role,
                student_id,
                is_active,
                created_at
             FROM Users
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// ACTIVATE OR DEACTIVATE USER (ADMIN ONLY)
// ==========================================

const updateUserStatus = async (req, res, next) => {
    let connection;

    try {
        const { userId } = req.params;
        const body = req.body || {};
        const { is_active } = body;

        // Validate user ID
        const targetUserId = Number(userId);

        if (
            !Number.isInteger(targetUserId) ||
            targetUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID.'
            });
        }

        // Validate account status
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Account status must be true or false.'
            });
        }

        // Prevent an administrator from deactivating their own account
        if (targetUserId === req.user.userId && !is_active) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account.'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Lock administrator records before checking active admins.
        // This helps prevent simultaneous requests from removing
        // the last active administrator.
        const [admins] = await connection.execute(
            `SELECT user_id, is_active
             FROM Users
             WHERE role = 'admin'
             FOR UPDATE`
        );

        // Find and lock the target account
        const [users] = await connection.execute(
            `SELECT user_id, role, is_active
             FROM Users
             WHERE user_id = ?
             FOR UPDATE`,
            [targetUserId]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        const targetUser = users[0];

        // Prevent deactivating the last active administrator
        if (
            targetUser.role === 'admin' &&
            targetUser.is_active &&
            !is_active
        ) {
            const activeAdminCount = admins.filter(
                admin => admin.is_active
            ).length;

            if (activeAdminCount <= 1) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'The last active administrator cannot be deactivated.'
                });
            }
        }

        // Update account status
        await connection.execute(
            'UPDATE Users SET is_active = ? WHERE user_id = ?',
            [is_active, targetUserId]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: is_active
                ? 'User account activated successfully.'
                : 'User account deactivated successfully.'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
    register,
    login,
    createStaffAccount,
    getAllUsers,
    updateUserStatus
};