const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const db = require('../models');
const calculateDuration = require('../utils/audio');
const {getSummary,getSummaryOPENAI,asktoAIOPENAI} = require("../ai/promptBuilder");


    router.post('/summary/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find transcription details with AI response joined
        const transcription = await db.Transcription.findOne({
            where: { id },
            include: [
                {
                    model: db.Ai,
                    as: 'AiDetails', // Ensure the alias matches your model definition if using aliases
                }
            ]
        });

        if (!transcription.AiDetails) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        // Parse the AI response from JSON string to object
        const aiDetails = transcription.AiDetails
            ? {
                ...transcription.AiDetails.toJSON(),
                AIresponse: JSON.parse(transcription.AiDetails.AIresponse)
            }
            : null;

        let response = await getSummaryOPENAI(aiDetails.AIresponse.text)

        let newSummary = await db.Summary.create({
            aiId:aiDetails.id,
            AIresponse: JSON.stringify(response)
        })

        await db.APILog.create({
            userId,
            endpoint: req.originalUrl,
            timestamp: new Date()
        });

        res.json(response);
    } catch (error) {
        console.error('Error fetching transcription details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/ask/summary/:id',authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const {question} = req.body

        // Find transcription details with AI response joined
        const transcription = await db.Transcription.findOne({
            where: { id },
            include: [
                {
                    model: db.Ai,
                    as: 'AiDetails', // Ensure the alias matches your model definition if using aliases
                }
            ]
        });

        if (!transcription.AiDetails) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        // Parse the AI response from JSON string to object
        const aiDetails = transcription.AiDetails
            ? {
                ...transcription.AiDetails.toJSON(),
                AIresponse: JSON.parse(transcription.AiDetails.AIresponse)
            }
            : null;

        let response = await asktoAIOPENAI(aiDetails.AIresponse.text,question)

        res.json(response);
    } catch (error) {
        console.error('Error fetching transcription details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




module.exports = router;
