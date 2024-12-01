const axios = require('axios');
const OpenAI = require('openai');
const template = require("./example");

let preprompt = `make a summary of this voice transcription. make a deep focus also in extrapolate phone numbers and relative name of contact and email. focus also in event scheduled and reurn it in a list. if the hour is not explicitly sayed make it all the day event.
    if the year is not explicitily sayed take in consideration the current year 2024
    the output should be structured like this example:
    ${JSON.stringify(template)}
    `

let afterprompt = `structure the output in a JSON structure. output only JSON, no other text, the text in notes should be in HTML`

let prepromptAskAI = `from this notes from a recording of a meeting `

let afterpromptAskAI = `asware to this question in a sharp and clean answare as possibile`


const openai = new OpenAI({ apiKey: process.env.AI_GPT_KEY});

async function getSummaryOPENAI(initialTranscription) {
    try {
        let finalPrompt = preprompt + initialTranscription + afterprompt

        const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{"role": "user", "content": `${finalPrompt}`}],
    temperature: 1,
    max_tokens: 400,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
});


        return JSON.parse(response.choices[0].message.content)
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw the error to handle it externally
    }
}


async function getSummary(initialTranscription) {
    try {

        let finalPrompt = preprompt + initialTranscription + afterprompt

        const response = await axios.post('https://api.aimlapi.com/chat/completions',
            {
                "model": "meta-llama/Meta-Llama-3-70B",
                "messages": [
                    finalPrompt
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

async function asktoAIOPENAI(initialTranscription,question) {
    try {
        let finalPrompt = prepromptAskAI + initialTranscription + afterpromptAskAI + question

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": `${finalPrompt}`}],
            temperature: 1,
            max_tokens: 400,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });


        return response.choices[0].message.content
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw the error to handle it externally
    }
}

module.exports = {getSummary,getSummaryOPENAI,asktoAIOPENAI};
