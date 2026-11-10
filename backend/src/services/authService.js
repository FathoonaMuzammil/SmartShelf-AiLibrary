const bcrypt = require('bcrypt');
const db = require('../config/db');

// Hash a password before storing it
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Compare a login password with its stored hash
const comparePassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash);
};

module.exports = {
    hashPassword,
    comparePassword
};