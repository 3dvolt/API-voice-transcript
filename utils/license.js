const { Op } = require('sequelize');
const { License, Transcription, sequelize } = require('../models');

async function fetchUserTranscriptionUsage(userId) {
    try {
        if (!userId) {
            throw new Error('UserId is required.');
        }

        let license = await License.findOne({ where: { userId: userId } });
        if (!license) {
            license = await License.create({ userId: userId });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const timezoneOffset = startOfMonth.getTimezoneOffset() * 60000;
        const startUTC = new Date(startOfMonth.getTime() - timezoneOffset);
        const endUTC = new Date(endOfMonth.getTime() - timezoneOffset);

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

        const result = transcriptionUsage[0].dataValues;
        const userLicense = await License.findOne({ where: { userId: userId } });

        let milliSecondLimits = userLicense.minuteLimit * 60 * 1000

        let remainTrainscription = milliSecondLimits - result.totalDuration

        return {
            userId: userId,
            totalDuration: result.totalDuration || 0,
            transcriptionCount: result.transcriptionCount || 0,
            remainTrainscription: remainTrainscription || 0,
            license: userLicense,
        };
    } catch (error) {
        console.error('Error fetching transcription usage:', error);
        return { error: 'An error occurred while fetching transcription usage.' };
    }
}

module.exports = { fetchUserTranscriptionUsage };
