const express = require('express');
const { sequelize,Timer, Transcription, User } = require('../models'); // Adjust path as needed
const router = express.Router();
const { Op } = require('sequelize');
const authenticateToken = require("../middleware/auth");

// Endpoint to generate stats per user
router.get('/user-stats',authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'UserId is required.' });
        }

// Parse and validate date range
        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0); // Set start to the beginning of the day

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // Set end to the end of the day

        // Fetch timers grouped by day
        const timerData = await Timer.findAll({
            where: {
                userId: userId,
                createdAt: {
                    [Op.between]: [start, end],
                },
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('seconds')), 'totalSeconds'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        });

        // Fetch transcriptions grouped by day
        const transcriptionData = await Transcription.findAll({
            where: {
                userId: userId,
                createdAt: {
                    [Op.between]: [start, end],
                },
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('duration')), 'transcriptionCount'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        });

        // Combine results by date
        const stats = {};

        timerData.forEach(timer => {
            const date = timer.dataValues.date;
            if (!stats[date]) stats[date] = { date, totalSeconds: 0, transcriptionCount: 0 };
            stats[date].totalSeconds = timer.dataValues.totalSeconds;
        });

        transcriptionData.forEach(transcription => {
            const date = transcription.dataValues.date;
            if (!stats[date]) stats[date] = { date, totalSeconds: 0, transcriptionCount: 0 };
            stats[date].transcriptionCount = transcription.dataValues.transcriptionCount;
        });

        // Convert stats object to array for response
        const statsArray = Object.values(stats);

        return res.status(200).json(statsArray);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while generating user stats.' });
    }
});

module.exports = router;
