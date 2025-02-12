const fs = require('fs');
const pdf = require('pdf-parse');
const config = require('../config/config');

async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw error;
    }
}

function parseChatMessages(text) {
    const validUsers = new Set(config.validUsers);
    
    // Updated regex to handle WhatsApp format with timestamps
    const messageRegex = /\[(\d{2}\/\d{2}\/\d{2},\s\d{2}:\d{2}:\d{2})\]\s([^:]+):\s*([^\n]+)(?:\n|$)/g;
    const messages = [];
    let match;

    // Store all found usernames for debugging
    const foundUsernames = new Set();

    while ((match = messageRegex.exec(text)) !== null) {
        const timestamp = match[1];
        const user = match[2].trim();
        const message = match[3].trim();
        
        // Store all usernames we find
        foundUsernames.add(user);
        
        // Only include messages from valid users
        if (message && message.length > 0 && validUsers.has(user)) {
            messages.push({
                user,
                message,
                timestamp
            });
        }
    }

    // Detailed logging
    console.log('\nAll usernames found in chat:', Array.from(foundUsernames));
    console.log('Number of valid messages found:', messages.length);

    if (messages.length === 0) {
        console.error('\n⚠️ No valid messages found! This might be because:');
        console.error('1. The usernames in your config don\'t match the ones in the chat');
        console.error('2. The message format in the PDF is different than expected');
        console.error('3. The PDF text extraction didn\'t work as expected');
        console.error('\nPlease check your config.validUsers:', config.validUsers);
        console.error('And compare with found usernames:', Array.from(foundUsernames));
    }

    // Log message samples if we found any
    if (messages.length > 0) {
        console.log('\nSample of parsed messages:');
        messages.slice(0, 3).forEach(m => {
            console.log(`[${m.timestamp}] ${m.user}: ${m.message}`);
        });
    }

    // Apply message limit from config
    if (messages.length > config.messageLimit) {
        console.warn(`\nWarning: Large number of messages detected (${messages.length}). Truncating to ${config.messageLimit}.`);
        return messages.slice(0, config.messageLimit);
    }

    return messages;
}

module.exports = {
    extractTextFromPDF,
    parseChatMessages
};