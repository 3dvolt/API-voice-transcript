const express = require('express');
const db = require('../models');

const authenticateToken = require('../middleware/auth'); // Middleware for token authentication, if needed
const router = express.Router();

router.post('/timer', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const seconds = req.body.seconds;

    // Validate input
    if (!userId || !seconds) {
        return res.status(400).json({ message: 'User ID and seconds are required' });
    }

    try {
        // Insert a new timer entry
        const timer = await db.Timer.create({
            userId,
            seconds,
            timestamp: new Date()  // Optional: specify timestamp, or let default value apply
        });

        res.status(201).json({
            message: 'Timer entry created successfully',
            timer
        });
    } catch (error) {
        console.error('Error creating timer entry:', error);
        res.status(500).json({ message: 'Failed to create timer entry', error: error.message });
    }
});

module.exports = router;
