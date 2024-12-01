const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const db = require('../models');
const { calculateDuration } = require('../utils/audio');
const {getTranscription} = require("../ai/assemblySpeechModel");


const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3 and WAV are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

router.post('/upload', authenticateToken, upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const {buffer, mimetype, originalname} = req.file;
    const userId = req.user.id;

    await db.APILog.create({
        userId,
        endpoint: req.originalUrl,
        timestamp: new Date()
    });

    // Calculate duration (example only - you might use an audio processing library for accurate duration)
    const duration = 0//await calculateDuration(buffer);  // Assume a function for this

    // Save the uploaded audio data to the Transcription table
    const transcription = await db.Transcription.create({
        userId,
        name: originalname,
        duration,
        status: 'uploaded',
        loadtype: mimetype,
        wav: buffer,  // Save the audio buffer data as BLOB
        timestamp: new Date()
    });

    let audioTranscription = await getTranscription(buffer)

    let newTranscription = await db.Ai.create({
        transcriptionId:transcription.id,
        AIresponse: JSON.stringify(audioTranscription)
    })

    res.json({
        message: 'File received and saved',
        transcriptionId: transcription.id,
        filename: originalname,
        userId
    });
});

router.get('/transcription/details/:id',authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Find transcription details with AI response joined
        const transcription = await db.Transcription.findOne({
            where: { id },
            include: [
                {
                    model: db.Ai,
                    as: 'AiDetails', // Ensure this matches the association
                    required: false, // Include even if no Ai exists
                    include: [
                        {
                            model: db.Summary,
                            as: 'AiSummary', // Ensure this matches the association
                            required: false, // Include even if no Summary exists

                        },
                    ],
                }
            ]
        });

        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        // Parse the AI response from JSON string to object
        const aiDetails = transcription.AiDetails
            ? {
                ...transcription.AiDetails.toJSON(),
                AIresponse: JSON.parse(transcription.AiDetails.AIresponse)
            }
            : null;

        if(transcription.AiDetails.AiSummary?.AIresponse){
            aiDetails.AIsummary = JSON.parse(transcription.AiDetails.AiSummary.AIresponse)
        }

        //pulisco
        delete aiDetails.AiSummary

        res.json({
            transcriptionId: transcription.id,
            name: transcription.name,
            duration: transcription.duration,
            status: transcription.status,
            loadtype: transcription.loadtype,
            timestamp: transcription.timestamp,
            aiDetails
        });
    } catch (error) {
        console.error('Error fetching transcription details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/transcription/list',authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, pageSize = 10 } = req.query; // Extract pagination info from query params

        // Calculate offset and limit
        const limit = parseInt(pageSize); // Number of records per page
        const offset = (parseInt(page) - 1) * limit; // Skip records for previous pages

        // Use findAndCountAll for pagination with total count
        const result = await db.Transcription.findAndCountAll({
            where: { userId: userId },
            limit,
            offset,
        });

        // Construct pagination metadata
        const totalPages = Math.ceil(result.count / limit);

        res.json({
            transcriptions: result.rows,
            currentPage: parseInt(page),
            totalPages,
            totalItems: result.count,
            pageSize: limit,
        });
    } catch (error) {
        console.error('Error fetching transcription details with pagination:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
