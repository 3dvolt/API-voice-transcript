const { createClient } = require("@deepgram/sdk");

async function getTranscription(audioFile) {
    try {
    // The API key we created in step 3
    const deepgramApiKey = process.env.DEEPGRAM_AI_KEY;

    // Initializes the Deepgram SDK
    const deepgram = createClient(deepgramApiKey);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioFile,
        {smart_format: true, model: 'nova-2', detect_language: true },
    );

    if (error) throw error;
    if (!error) console.dir(result, {depth: null});
    return result
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

module.exports = {getTranscription};