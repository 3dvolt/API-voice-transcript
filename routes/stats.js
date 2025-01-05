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

        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0); // Set start to the beginning of the day

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // Set end to the end of the day

        const timezoneOffset = start.getTimezoneOffset() * 60000; // Offset in milliseconds
        const startUTC = new Date(start.getTime() - timezoneOffset);
        const endUTC = new Date(end.getTime() - timezoneOffset);

        // Fetch timers grouped by day
        const timerData = await Timer.findAll({
            where: {
                userId: userId,
                createdAt: {
                    [Op.between]: [startUTC, endUTC],
                },
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('seconds')), 'totalSeconds'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
        });

        // Fetch transcriptions grouped by day
        const transcriptionData = await Transcription.findAll({
            where: {
                userId: userId,
                createdAt: {
                    [Op.between]: [startUTC, endUTC],
                },
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('duration')), 'transcriptionCount'],
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
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

router.get('/user-transcription-usage', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: 'UserId is required.' });
        }

        // Get the current date and calculate the start and end of the month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Convert to UTC to ensure consistent querying
        const timezoneOffset = startOfMonth.getTimezoneOffset() * 60000;
        const startUTC = new Date(startOfMonth.getTime() - timezoneOffset);
        const endUTC = new Date(endOfMonth.getTime() - timezoneOffset);

        // Fetch transcription data for the current month
        const transcriptionUsage = await Transcription.findAll({
            where: {
                userId: userId,
                createdAt: {
                    [Op.between]: [startUTC, endUTC],
                },
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'transcriptionCount'],
            ],
        });

        // Extract the results
        const result = transcriptionUsage[0].dataValues;

        return res.status(200).json({
            userId: userId,
            totalDuration: result.totalDuration || 0,
            transcriptionCount: result.transcriptionCount || 0,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching transcription usage.' });
    }
});



module.exports = router;
