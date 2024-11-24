const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');

const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// User Registration Endpoint
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await db.User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const user = await  db.User.create({ username, password });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// User Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.User.findOne({ where: { username } });
        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

module.exports = router;
