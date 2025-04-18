const axios = require('axios');
const OpenAI = require('openai');
const template = require("./example");

let preprompt_old = `make a summary of this voice transcription. make a deep focus also in extrapolate phone numbers and relative name of contact and email. focus also in event scheduled and merge it in a list. if the hour is not explicitly sayed make it all the day event.
    if the year is not explicitily sayed take in consideration the current year
    the output should be structured like this example:
    ${JSON.stringify(template)}
    the notes filed should contain the summary of the voice transcription in a ordanized and well formatted way, the output should be in the same language as the transcription text
    `

let afterprompt = `structure the output in a JSON structure. output only JSON, no other text, the text in notes should be in HTML`

let prepromptAskAI = `you are Niuteq assistant, you are a chat assistant for a productive application that help people to focus better and to take notes, you will answare always in the language of the input message. from this notes from a recording of a meeting `

let afterpromptAskAI = `answar to this question in a sharp and clean answare as possibile`

let preprompt = `Make a detailed summary of this voice transcription. Extract and organize the following information with precision:
1. **Contact Details**: Include phone numbers, names associated with them, and emails mentioned.
2. **Event Details**: List scheduled events with their dates and times. If the time is not mentioned, default to "all-day event." If the year is not explicitly mentioned, assume it to be the current year.
3. **Notes**: Provide a well-structured and concise summary of the conversation in HTML format for better readability. The notes should be formatted with proper headings, bullet points, and paragraphs where necessary.
4. **Task**: Provide a well-structured and concise list of task. The task name should be short and concise.

The output must be structured in JSON format with the following template:
${JSON.stringify(template)}

### Additional Guidelines:
- Retain the language of the transcription text in all fields.
- Include any relevant context for unclear data, and note assumptions where applicable.
- Avoid omitting important details that could provide additional context to the summary.

`

const openai = new OpenAI({ apiKey: process.env.AI_GPT_KEY});

async function getSummaryOPENAI(initialTranscription,timestamp) {
    try {
        let finalPrompt = preprompt + `The current time and date of the recording is ${timestamp}. Below is the transcription:
${initialTranscription}, Provide the output as a JSON object with no extra text. The "notes" field must contain the HTML-formatted summary. the output should be in the same language of the transcription
`
        const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{"role": "user", "content": `${finalPrompt}`}],
    temperature: 1,
    max_tokens: 400,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
});
        response.choices[0].message.content = response.choices[0].message.content.replace('json','')


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
