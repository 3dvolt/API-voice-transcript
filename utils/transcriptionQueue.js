const { getTranscription } = require('../ai/assemblySpeechModel'); // Transcription API service
const db = require('../models'); // Import database models

async function queueTranscription(transcriptionId, audioBuffer) {
    try {
        // Perform transcription asynchronously
        let audioTranscription = await getTranscription(audioBuffer);

        const { audio_duration, status: aiStatus } = audioTranscription;

        // Save the transcription result in the Ai table
        await db.Ai.create({
            transcriptionId: transcriptionId,
            AIresponse: JSON.stringify(audioTranscription)
        });

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
