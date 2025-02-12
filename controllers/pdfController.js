const path = require('path');
const config = require('../config/config');
const { extractTextFromPDF, parseChatMessages } = require('../utils/pdfParser');
const { storeVectors, retrieveSimilarMessages } = require('../services/vectorStore');
const { generateResponse } = require('../services/ollamaService');

// Helper functions for style analysis
function findCommonPhrases(messages) {
    const phrases = {};
    messages.forEach(msg => {
        const words = msg.message.toLowerCase().split(' ');
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
    });
    return Object.entries(phrases)
        .filter(([_, count]) => count > 1)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5)
        .map(([phrase]) => phrase);
}

function analyzeEmotionalTone(messages) {
    const emotions = {
        positive: 0,
        negative: 0,
        neutral: 0
    };
    
    messages.forEach(msg => {
        if (msg.message.includes('!') || /\b(happy|great|awesome|good|love)\b/i.test(msg.message)) {
            emotions.positive++;
        } else if (msg.message.includes('?') || /\b(sad|bad|angry|upset)\b/i.test(msg.message)) {
            emotions.negative++;
        } else {
            emotions.neutral++;
        }
    });
    
    return emotions;
}

function analyzeResponsePatterns(messages) {
    return {
        averageResponseLength: messages.reduce((acc, m) => acc + m.message.length, 0) / messages.length,
        usesEmojis: messages.some(m => /[\u{1F300}-\u{1F9FF}]/u.test(m.message)),
        questionFrequency: messages.filter(m => m.message.includes('?')).length / messages.length,
        exclamationFrequency: messages.filter(m => m.message.includes('!')).length / messages.length
    };
}

function analyzeVocabulary(messages) {
    const words = messages
        .map(m => m.message.toLowerCase().match(/\b\w+\b/g) || [])
        .flat();
    
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return {
        uniqueWords: Object.keys(wordFreq).length,
        mostCommonWords: Object.entries(wordFreq)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word)
    };
}

function analyzeUserStyle(messages, targetUser) {
    const userMessages = messages.filter(m => m.user === targetUser);
    
    return {
        averageLength: userMessages.reduce((acc, m) => acc + m.message.length, 0) / userMessages.length,
        commonPhrases: findCommonPhrases(userMessages),
        emotionalTone: analyzeEmotionalTone(userMessages),
        responsePatterns: analyzeResponsePatterns(userMessages),
        vocabulary: analyzeVocabulary(userMessages)
    };
}

async function processPDF(req, res) {
    try {
        const pdfPath = path.join(config.dataDirectory, 'chat.pdf');
        const pdfText = await extractTextFromPDF(pdfPath);
        const messages = parseChatMessages(pdfText);
        
        // Analyze user style before storing
        const userStyle = analyzeUserStyle(messages, config.impersonateUser);
        
        // Store both messages and style analysis
        await storeVectors(config.impersonateUser, messages.map(m => ({
            ...m,
            styleAnalysis: userStyle
        })));
        
        res.json({ 
            success: true, 
            userCount: new Set(messages.map(m => m.user)).size,
            messageCount: messages.length,
            users: [...new Set(messages.map(m => m.user))],
            userStyle
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({ error: "Failed to process PDF" });
    }
}

async function chat(req, res) {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const context = await retrieveSimilarMessages(message);
        const response = await generateResponse(message, context, config.impersonateUser);
        
        res.json({ response });
    } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
}

module.exports = {
    processPDF,
    chat
};