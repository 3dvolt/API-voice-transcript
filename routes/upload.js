const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const db = require('../models');
const { calculateDuration } = require('../utils/audio');
const {getTranscription} = require("../ai/assemblySpeechModel");
const {Readable} = require("node:stream");
const {Op} = require("sequelize");
const {queueTranscription} = require("../utils/transcriptionQueue");
const { uploadAudioToS3, getSignedUrlForAudio } = require('../utils/aws');

const apiUrl = process.env.API_BASE_URL || 'http://192.168.2.194:3001/v1/api';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm' || file.mimetype === 'audio/m4a' || file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/x-m4a') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3 and WAV are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

router.post('/upload', authenticateToken, upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const { buffer, mimetype, originalname } = req.file;
    const userId = req.user.id;

    await db.APILog.create({
        userId,
        endpoint: req.originalUrl
    });

    // Save the uploaded audio data to the Transcription table with 'pending' status
    const transcription = await db.Transcription.create({
        userId,
        name: originalname,
        nota: req.body.title,
        duration: null, // Will be updated later
        status: 'pending',  // Initially set as 'pending'
        loadtype: mimetype,
        wav:''
    });

    const s3Key = `audio/${userId}-${transcription.id}-${Date.now()}.mp3`;

    // Upload the audio file buffer to S3.
    const uploadResult = await uploadAudioToS3(buffer, s3Key);

    console.log('Audio file uploaded to S3:', uploadResult.Location);

    transcription.update({wav:uploadResult.Key})

    // Queue the transcription job to run in the background
    queueTranscription(transcription.id, buffer);

    res.json({
        message: 'File received and transcription in progress',
        transcriptionId: transcription.id,
        filename: originalname,
        userId,
        status: 'pending' // Indicate transcription is still in progress
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
                            where: {
                                createdAt: {
                                    [Op.eq]: db.Sequelize.literal(`(
                                SELECT MAX("createdAt") 
                                FROM "Summaries" 
                                WHERE "Summaries"."aiId" = "AiDetails"."id"
                            )`),
                                },
                            },
                        },
                    ],
                }
            ]
        });

        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        if (transcription.status == 'pending') {
            res.status(404).json({ message: 'Pending Job...' });
        }

        // Parse the AI response from JSON string to object
        const aiDetails = transcription.AiDetails
            ? {
                ...transcription.AiDetails.toJSON(),
                AIresponse: JSON.parse(transcription.AiDetails.AIresponse)
            }
            : null;

        if(transcription?.AiDetails?.AiSummary?.AIresponse){
            aiDetails.AIsummary = JSON.parse(transcription.AiDetails.AiSummary.AIresponse)
        }

        //pulisco
        delete aiDetails.AiSummary

        let audioStream = ''
        const wavContent = transcription.wav.toString('utf8').trim();

        if (wavContent.startsWith('audio/')) {
            audioStream = getSignedUrlForAudio(transcription.wav.toString());
        }
        //old storage way
        else{
            audioStream = `${apiUrl}/transcription/stream/${transcription.id}`
        }


        res.json({
            transcriptionId: transcription.id,
            favourite: transcription.favourite,
            name: transcription.nota,
            tags: transcription.tag,
            duration: transcription.duration,
            status: transcription.status,
            loadtype: transcription.loadtype,
            timestamp: transcription.timestamp,
            file:audioStream,
            aiDetails
        });
    } catch (error) {
        console.error('Error fetching transcription details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/transcription/update/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { nota, tag , favourite} = req.body;

        // Find the transcription by ID
        const transcription = await db.Transcription.findOne({ where: { id } });
        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        // If you want to ensure that only the owner can update, you can do:
        // if (transcription.userId !== userId) {
        //   return res.status(403).json({ message: 'Not authorized to update this transcription.' });
        // }

        // Update fields if provided
        transcription.nota = nota !== undefined ? nota : transcription.nota;
        transcription.tag = tag !== undefined ? tag : transcription.tag;
        transcription.favourite = favourite !== undefined ? favourite : transcription.favourite;

        console.log(transcription.favourite, favourite)

        // Save the updated transcription
        await transcription.save();

        await db.APILog.create({
            userId,
            endpoint: req.originalUrl,
            timestamp: new Date(),
        });

        return res.json({
            message: 'Transcription updated successfully',
            transcription,
        });
    } catch (error) {
        console.error('Error updating transcription details:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['wav'] }
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

router.get('/transcription/stream/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find transcription to get the file path
        const transcription = await db.Transcription.findOne({ where: { id } });

        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        const audioBuffer = transcription.wav; // Assuming this is the audio buffer

        if (!audioBuffer) {
            return res.status(404).json({ message: 'Audio file not found' });
        }

        // Set the appropriate headers
        res.setHeader('Content-Type', 'audio/mp3');
        res.setHeader('Content-Length', audioBuffer.length);

        // Stream the buffer
        const readable = new Readable();
        readable._read = () => {}; // No-op _read
        readable.push(audioBuffer);
        readable.push(null); // Signal EOF

        readable.pipe(res);
    } catch (error) {
        console.error('Error fetching transcription audio file:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/transcription/delete/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the transcription by ID
        const transcription = await db.Transcription.findOne({ where: { id } });
        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found' });
        }

        // Ensure only the owner can delete the transcription
        if (transcription.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this transcription.' });
        }

        // Delete the transcription
        await transcription.destroy();

        // Log the API action
        await db.APILog.create({
            userId,
            endpoint: req.originalUrl,
            timestamp: new Date(),
        });

        return res.json({ message: 'Transcription deleted successfully' });
    } catch (error) {
        console.error('Error deleting transcription:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/transcription/update-utterance/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { utteranceIndex, text } = req.body;

        // Fetch the existing record

        const transcription = await db.Ai.findOne({where: { transcriptionId: id } });
        if (!transcription) {
            return res.status(404).json({ message: "Transcription not found" });
        }

        let data = transcription.AIresponse;
        const jsonString = new TextDecoder().decode(data);
        let transcriptionContent = JSON.parse(jsonString)

        transcriptionContent.utterances[utteranceIndex].text = text

        transcription.AIresponse = JSON.stringify(transcriptionContent)

        await transcription.save();

        await db.APILog.create({
            userId : req.user.id,
            endpoint: req.originalUrl,
            timestamp: new Date(),
        });

        return res.json({
            message: 'Transcription updated successfully',
            transcription,
        });
    } catch (error) {
        console.error('Error updating transcription details:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/transcription/update-speaker/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { tempSpeaker, speaker } = req.body;

        // Fetch the existing record

        const transcription = await db.Ai.findOne({where: { transcriptionId: id } });
        if (!transcription) {
            return res.status(404).json({ message: "Transcription not found" });
        }

        let data = transcription.AIresponse;
        const jsonString = new TextDecoder().decode(data);
        let transcriptionContent = JSON.parse(jsonString)

        if (speaker) {
            transcriptionContent.words = transcriptionContent.words.map((word) => {
                if (word.speaker === speaker) {
                    word.speaker = speaker;
                }
                return word;
            });

            transcriptionContent.utterances = transcriptionContent.utterances.map((utterance) => {
                if (utterance.speaker === speaker) {
                    utterance.speaker = tempSpeaker;
                }
                return utterance;
            });
        }

        transcription.AIresponse = JSON.stringify(transcriptionContent)

        await transcription.save();

        await db.APILog.create({
            userId : req.user.id,
            endpoint: req.originalUrl,
            timestamp: new Date(),
        });

        return res.json({
            message: 'Transcription updated successfully',
            transcription,
        });
    } catch (error) {
        console.error('Error updating transcription details:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
