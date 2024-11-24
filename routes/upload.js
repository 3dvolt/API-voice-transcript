const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const db = require('../models');
const { calculateDuration } = require('../utils/audio');


const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav') {
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

    res.json({
        message: 'File received and saved',
        transcriptionId: transcription.id,
        filename: originalname,
        userId
    });
});

module.exports = router;
