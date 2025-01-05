const express = require('express');
const { Goal } = require('../models'); // Adjust path as needed
const router = express.Router();
const authenticateToken = require("../middleware/auth");

// Endpoint to create or update goal
router.post('/goals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { FocusGoals, RememberGoals } = req.body;

        if (!userId || FocusGoals == null || RememberGoals == null) {
            return res.status(400).json({ error: 'userId, FocusGoals, and RememberGoals are required.' });
        }

        // Upsert logic: Create or update based on userId
        const [goal, created] = await Goal.upsert({
            userId,
            FocusGoals,
            RememberGoals
        }, { returning: true });

        return res.status(200).json({
            message: created ? 'Goal created successfully.' : 'Goal updated successfully.',
            goal
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while creating or updating the goal.' });
    }
});

// Endpoint to get goal values for a user
router.get('/goals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required.' });
        }

        // Fetch the goal for the user
        const goal = await Goal.findOne({ where: { userId } });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found for the specified userId.' });
        }

        return res.status(200).json(goal);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching the goal.' });
    }
});

module.exports = router;
