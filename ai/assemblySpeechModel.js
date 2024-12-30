const axios = require('axios');
const {AssemblyAI} = require('assemblyai');

async function getTranscription(audioFile) {
    try {
        const client = new AssemblyAI({
            apiKey: process.env.ASSEMBLY_AI_KEY
        })


        const params = {
            audio: audioFile,
            speaker_labels: true
        }

        const transcript = await client.transcripts.transcribe(params)
        if(transcript.utterances){
        for (const utterance of transcript.utterances) {
            console.log(`Speaker ${utterance.speaker}: ${utterance.text}`)
        }
        }

        return transcript; // Return the parsed data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw the error to handle it externally
    }
}

module.exports = {getTranscription};