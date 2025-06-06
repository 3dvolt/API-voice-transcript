const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.AI_GPT_KEY });

async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    return response.data[0].embedding;
}

module.exports = { getEmbedding };
