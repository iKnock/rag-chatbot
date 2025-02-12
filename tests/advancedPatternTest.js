const path = require('path');
const { extractTextFromPDF, parseChatMessages } = require('../utils/pdfParser');
const responsePatternAnalyzer = require('../services/responsePatternAnalyzer');
const conversationAnalyzer = require('../services/conversationAnalyzer');
const { generateResponse } = require('../services/ollamaService');
const config = require('../config/config');

async function runAdvancedTests() {
    try {
        console.log('🔍 Starting Advanced Pattern Analysis\n');

        // Load chat history
        const pdfPath = path.join(config.dataDirectory, 'chat.pdf');
        const pdfText = await extractTextFromPDF(pdfPath);
        const messages = parseChatMessages(pdfText);

        // Filter messages for the impersonated user
        const userMessages = messages.filter(m => m.user === config.impersonateUser);
        
        console.log(`📊 Analyzing patterns for user: ${config.impersonateUser}`);
        console.log(`Total messages: ${userMessages.length}\n`);

        // 1. Response Type Analysis
        const responseTypes = {
            questions: userMessages.filter(m => m.message.includes('?')),
            greetings: userMessages.filter(m => /^(hi|hey|hello)/i.test(m.message)),
            agreements: userMessages.filter(m => /^(yes|yeah|sure|okay|ok)/i.test(m.message)),
            disagreements: userMessages.filter(m => /^(no|nah|nope)/i.test(m.message)),
            emotions: userMessages.filter(m => /[😀-🙏]/u.test(m.message))
        };

        console.log('📝 Response Type Distribution:');
        Object.entries(responseTypes).forEach(([type, msgs]) => {
            console.log(`- ${type}: ${msgs.length} messages (${((msgs.length/userMessages.length)*100).toFixed(1)}%)`);
        });

        // 2. Test Specific Response Scenarios
        const testScenarios = [
            {
                category: "Greetings",
                messages: [
                    "Hey there!",
                    "Good morning",
                    "Hi, how are you?"
                ]
            },
            {
                category: "Project Related",
                messages: [
                    "What's the status of the project?",
                    "Can you review this code?",
                    "When is the deadline?"
                ]
            },
            {
                category: "Technical Discussion",
                messages: [
                    "How should we implement this feature?",
                    "What's your opinion on this architecture?",
                    "Should we use a different approach?"
                ]
            },
            {
                category: "Personal Interaction",
                messages: [
                    "Want to grab lunch?",
                    "How was your weekend?",
                    "Are you free for a quick chat?"
                ]
            }
        ];

        console.log('\n🧪 Running Test Scenarios:');
        for (const scenario of testScenarios) {
            console.log(`\n📌 Category: ${scenario.category}`);
            for (const message of scenario.messages) {
                console.log(`\nTest Message: "${message}"`);
                
                // Get pattern-based response
                const patternResponse = responsePatternAnalyzer.findBestResponse(message, config.impersonateUser);
                if (patternResponse) {
                    console.log(`Pattern Match: "${patternResponse}"`);
                    console.log('Confidence: High (Direct pattern match)');
                } else {
                    // Get LLM response
                    const llmResponse = await generateResponse(message, messages, config.impersonateUser);
                    console.log(`LLM Response: "${llmResponse}"`);
                    console.log('Confidence: Medium (Generated response)');
                }
            }
        }

        // 3. Vocabulary Analysis
        const vocabAnalysis = conversationAnalyzer.analyzeVocabularyProfile(userMessages);
        console.log('\n📚 Vocabulary Analysis:');
        console.log('Most Common Words:', vocabAnalysis.commonWords.slice(0, 10));
        console.log('Common Phrases:', vocabAnalysis.commonPhrases.slice(0, 5));

        // 4. Response Time Analysis
        console.log('\n⏱️ Response Time Patterns:');
        const responseTimings = analyzeResponseTimings(messages, config.impersonateUser);
        console.log(`Average response time: ${responseTimings.averageTime}`);
        console.log(`Typical response length: ${responseTimings.averageLength} characters`);

        // 5. Context Sensitivity Test
        console.log('\n🔄 Testing Context Sensitivity:');
        const contextTests = [
            {
                context: "Previous: Let's discuss the project timeline",
                message: "What do you think?"
            },
            {
                context: "Previous: The server is down",
                message: "Can you help?"
            }
        ];

        for (const test of contextTests) {
            console.log(`\nContext: ${test.context}`);
            console.log(`Message: ${test.message}`);
            const response = await generateResponse(test.message, [...messages, { user: 'other', message: test.context }], config.impersonateUser);
            console.log(`Response: ${response}`);
        }

    } catch (error) {
        console.error('Advanced test failed:', error);
    }
}

function analyzeResponseTimings(messages, user) {
    const responses = [];
    let totalLength = 0;
    
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].user === user && messages[i-1].user !== user) {
            responses.push(messages[i]);
            totalLength += messages[i].message.length;
        }
    }

    return {
        averageTime: "N/A (timestamps not available)",
        averageLength: Math.round(totalLength / responses.length)
    };
}

// Run the advanced tests
runAdvancedTests();