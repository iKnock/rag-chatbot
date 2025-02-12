const axios = require('axios');
const config = require('../config/config');
const conversationAnalyzer = require('./conversationAnalyzer');
const responsePatternAnalyzer = require('./responsePatternAnalyzer');
const patternAnalyzer = require('../tools/patternAnalyzer');
const feedbackInterface = require('../tools/feedbackInterface');
const responseMemory = require('../services/responseMemory');

async function generateResponse(message, context, impersonateUser) {
    try {
        // First, check for common response patterns
        const patternResponse = responsePatternAnalyzer.findBestResponse(message, impersonateUser);
        
        /*if (patternResponse) {
            // Analyze the pattern match
            const analysis = patternAnalyzer.analyzePattern(message, patternResponse, context);

            // If the analysis score is good enough, use it
            if (analysis.score.total > 0.7) {
                console.log('Using high-confidence pattern-matched response');
                responseMemory.rewardResponse(message, patternResponse, impersonateUser);
                return patternResponse;
            }

            console.log('Using pattern-matched response');
            // Store the successful pattern match
            responseMemory.rewardResponse(message, patternResponse, impersonateUser);
            return patternResponse;
        }

        // Check memory for previously successful responses
        const memorizedResponse = responseMemory.getBestResponse(message, impersonateUser);
        if (memorizedResponse) {
            console.log('Using memorized successful response');
            return memorizedResponse;
        }*/

        if (patternResponse) {
            console.log('Using pattern-matched response');
            return patternResponse;
        }

        // If no pattern match, use the sophisticated LLM approach
        const contextAnalysis = {
            vocabulary: conversationAnalyzer.analyzeVocabularyProfile(context),
            flow: conversationAnalyzer.analyzeConversationFlow(context)
        };

        // Convert context messages to include pattern analysis
        const analyzedContext = responsePatternAnalyzer.analyzeResponsePatterns(context);

        const systemPrompt = `You are now impersonating ${impersonateUser} in a chat conversation. 
            Based on detailed analysis of their communication style:

            Vocabulary Profile:
            - Most used words: ${contextAnalysis.vocabulary.commonWords.map(w => w.item).join(', ')}
            - Common phrases: ${contextAnalysis.vocabulary.commonPhrases.map(p => p.item).join(', ')}

            Common Response Patterns:
            ${JSON.stringify(analyzedContext.exactPatterns, null, 2)}

            Previous messages for context:
            ${context.join('\n')}

            Guidelines:
            1. Use their exact response patterns when applicable
            2. Match their vocabulary precisely
            3. Follow their conversation flow
            4. Use their characteristic response types

            Respond to this message as ${impersonateUser} would:`;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: config.ollamaModel,
            prompt: `${systemPrompt}\n\nIncoming message: "${message}"\n\n${impersonateUser}'s response:`,
            system: `You are ${impersonateUser}. Use their exact phrases and response patterns.`,
            stream: false,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40
        });

        return response.data.response;
    } catch (error) {
        console.error('Error generating response:', error);
        throw error;
    }
}

async function rewardResponse(trigger, response, user) {
    try {
        responseMemory.rewardResponse(trigger, response, user);
        return true;
    } catch (error) {
        console.error('Error rewarding response:', error);
        return false;
    }
}

module.exports = {
    generateResponse
};