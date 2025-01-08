const axios = require('axios');
const {AssemblyAI} = require('assemblyai');

async function getTranscription(audioFile) {
    try {
        const client = new AssemblyAI({
            apiKey: process.env.ASSEMBLY_AI_KEY
        })


        const params = {
            audio: audioFile,
            //peech_model: 'nano',
            language_detection: true,
            speaker_labels: true
        }

        const transcript = await client.transcripts.transcribe(params)

        return transcript; // Return the parsed data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw the error to handle it externally
    }
}

module.exports = {getTranscription};