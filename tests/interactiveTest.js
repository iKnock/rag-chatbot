const readline = require('readline');
const { generateResponse } = require('../services/ollamaService');
const { extractTextFromPDF, parseChatMessages } = require('../utils/pdfParser');
const config = require('../config/config');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false // This prevents double characters
});

async function startInteractiveTest() {
    try {
        // Load chat history
        console.log('Loading chat history...');
        const pdfPath = path.join(config.dataDirectory, 'chat.pdf');
        const pdfText = await extractTextFromPDF(pdfPath);
        const messages = parseChatMessages(pdfText);
        
        console.log(`\nImpersonating: ${config.impersonateUser}`);
        console.log('Type your messages (type "exit" to quit)\n');

        const askQuestion = () => {
            rl.question('You: ', async (input) => {
                if (input.toLowerCase() === 'exit') {
                    rl.close();
                    return;
                }

                try {
                    const response = await generateResponse(input, messages, config.impersonateUser);
                    console.log(`${config.impersonateUser}: ${response}\n`);
                } catch (error) {
                    console.error('Error generating response:', error);
                }

                askQuestion();
            });
        };

        askQuestion();
    } catch (error) {
        console.error('Test failed:', error);
        rl.close();
    }
}

startInteractiveTest();