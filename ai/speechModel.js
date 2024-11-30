const axios = require('axios');

async function getTranscription(audioFile) {
    try {
        const response = await axios.post('https://api.aimlapi.com/stt',
            {
                "model": "#g1_whisper-large" ,
                "audio": audioFile,
                "custom_intent": {},
                "custom_topic": {},
                "tag": [
                    null
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.AI_KEY}`,
                }
            }
        );
        return response.data; // Return the parsed data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw the error to handle it externally
    }
}

module.exports = getTranscription();
