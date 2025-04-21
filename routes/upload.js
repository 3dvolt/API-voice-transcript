const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const multerS3 = require('multer-s3');
const db = require('../models');
const {index} = require("../ai/pinecone");
const {queueTranscription} = require("../utils/transcriptionQueue");
const { uploadAudioToS3, getSignedUrlForAudio, s3Uploader} = require('../utils/aws');
const {fetchUserTranscriptionUsage} = require("../utils/license");
const {getEmbedding} = require("../ai/generateEmbeddings");
const pdfParse = require('pdf-parse');

const upload = multer({
    storage: multerS3({
        s3:s3Uploader,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const userId = req.user.id;
            const timestamp = Date.now();
            const s3Key = `audio/${userId}-${timestamp}-${file.originalname}`;
            cb(null, s3Key);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
});

const localUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
});

router.post('/upload', authenticateToken, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        const { location, key, mimetype,originalname } = req.file;

        //const { buffer, mimetype, originalname } = req.file;
        const userId = req.user.id;
        const duration = req.body.duration;

        const usageData = await fetchUserTranscriptionUsage(userId);

        await db.APILog.create({
            userId,
            endpoint: req.originalUrl,
        });

        const transcription = await db.Transcription.create({
            userId,
            name: key,
            nota: req.body.title,
            duration: duration,
            status: 'queued',
            loadtype: mimetype,
            wav: '',
        });

        console.log(location)

        await transcription.update({ wav: key });

        if (usageData.remainTrainscription <= duration) {

            await transcription.update({ status: 'limit exceeded' });

            console.log('Minutes exceeded');
            return res.json({
                message: 'Minute limit exceeded',
                transcriptionId: transcription.id,
                filename: location,
                userId,
                status: 'limit exceeded',
            });
        }

        let audioPosition = getSignedUrlForAudio(key);

        queueTranscription(transcription.id,req.body.title, audioPosition,req.user.id);

        return res.json({
            message: 'File received and transcription in progress',
            transcriptionId: transcription.id,
            filename: originalname,
            userId,
            status: 'queued',
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'An error occurred during file upload.' });
    }
});

router.post('/upload/pdf',authenticateToken, localUpload.single('pdf'), async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you're using JWT auth
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        // 1. Extract text from PDF
        const data = await pdfParse(fileBuffer);
        const fullText = data.text;

        // 2. Chunk the text (basic method: by character count)
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < fullText.length; i += chunkSize) {
            const chunk = fullText.slice(i, i + chunkSize);
            if (chunk.trim()) chunks.push(chunk);
        }

        // 3. Embed and upsert each chunk
        const timestamp = new Date().toISOString();

        const vectors = await Promise.all(
            chunks.map(async (text, i) => ({
                id: `${fileName}-${i}-${Date.now()}`,
                values: await getEmbedding(text),
                metadata: {
                    chunkIndex: i,
                    fileName,
                    timestamp,
                    userId,
                    content: text,
                },
            }))
        );

        await index.namespace(userId.toString()).upsert( vectors );

        res.status(200).json({ message: 'PDF uploaded and indexed', chunks: chunks.length });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
});

module.exports = router;
