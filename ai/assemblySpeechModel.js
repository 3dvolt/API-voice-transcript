const axios = require('axios');
const {AssemblyAI} = require('assemblyai');

async function getTranscription(audioBuffer) {
    try {
        const client = new AssemblyAI({
            apiKey: process.env.ASSEMBLY_AI_KEY
        });

        // Step 1: Upload the audio file to AssemblyAI
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            audioBuffer,
            {
                headers: {
                    authorization: process.env.ASSEMBLY_AI_KEY,
                    'content-type': 'application/octet-stream'
                }
            }
        );

        const audioUrl = uploadResponse.data.upload_url;

        // Step 2: Request transcription
        const params = {
            audio_url: audioUrl,
            language_detection: true,
            speaker_labels: true
        };

        const transcript = await client.transcripts.transcribe(params);

        return transcript;
    } catch (error) {
        console.error('Error fetching transcription:', error);
        throw error;
    }
}

module.exports = {getTranscription};