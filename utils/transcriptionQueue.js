const { getTranscription } = require('../ai/assemblySpeechModel'); // Transcription API service
const db = require('../models');
const {getEmbedding} = require("../ai/generateEmbeddings");

const { index } = require("../ai/pinecone");

async function queueTranscription(transcriptionId,transcriptionTitle, audioBuffer,currentUser) {
    try {
        // Perform transcription asynchronously
        let audioTranscription = await getTranscription(audioBuffer);

        const { audio_duration, status: aiStatus } = audioTranscription;

        let content = JSON.stringify(audioTranscription)
        let textContent = audioTranscription.text

        // Save the transcription result in the Ai table
        await db.Ai.create({
            transcriptionId: transcriptionId,
            AIresponse: content
        });

        let transcriptionIdString = transcriptionId.toString()
        const embedding = await getEmbedding(textContent)
        let timestamp = new Date().toLocaleString();

        await index.namespace(currentUser).upsert([
                {
                    id: transcriptionIdString,
                    values: embedding,
                    metadata: {
                        transcriptionTitle,
                        timestamp,
                        currentUser,
                        transcriptionIdString,
                        textContent
                    },
                },
            ]);

        // Update the Transcription record with the new duration and status
        await db.Transcription.update(
            { duration: audio_duration, status: aiStatus },
            { where: { id: transcriptionId } }
        );

        console.log(`Transcription ${transcriptionId} completed successfully.`);
    } catch (error) {
        console.error(`Transcription ${transcriptionId} failed:`, error);

        // If there's an error, update status to 'failed'
        await db.Transcription.update(
            { status: 'failed' },
            { where: { id: transcriptionId } }
        );
    }
}

module.exports = { queueTranscription };
