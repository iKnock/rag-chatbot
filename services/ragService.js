const { retrieveSimilarMessages } = require("./vectorStore");
const axios = require("axios");
const { config } = require("../config/config");

async function generateResponse(user, inputMessage) {
    const retrievedMessages = await retrieveSimilarMessages(inputMessage);
    
    const personaInstructions = `
        You are impersonating ${config.impersonateUser}.
        This user tends to respond in the following style: 
        ${retrievedMessages.join("\n")}

        Based on this, respond naturally to: "${inputMessage}"
    `;

    const response = await axios.post("http://localhost:11434/api/generate", {
        model: config.ollamaModel,
        prompt: personaInstructions,
    });

    return response.data.response;
}

module.exports = { generateResponse };
