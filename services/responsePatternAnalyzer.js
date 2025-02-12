const natural = require('natural');
const config = require('../config/config');

class ResponsePatternAnalyzer {
    constructor() {
        this.patterns = new Map();
        this.responseTemplates = new Map();
    }

    analyzeResponsePatterns(messages) {
        const conversationPairs = [];
        
        // Extract conversation pairs (message -> response)
        for (let i = 0; i < messages.length - 1; i++) {
            if (messages[i].user !== messages[i + 1].user) {
                conversationPairs.push({
                    trigger: this.normalizeMessage(messages[i].message),
                    response: messages[i + 1].message,
                    context: {
                        triggerUser: messages[i].user,
                        responseUser: messages[i + 1].user
                    }
                });
            }
        }

        // Analyze patterns
        conversationPairs.forEach(pair => {
            // Store exact matches
            this.storePattern('exact', pair.trigger, pair.response, pair.context);
            
            // Store intent-based patterns
            const intent = this.detectIntent(pair.trigger);
            this.storePattern('intent', intent, pair.response, pair.context);
            
            // Store keyword-based patterns
            const keywords = this.extractKeywords(pair.trigger);
            this.storePattern('keyword', keywords.join(' '), pair.response, pair.context);
        });

        return {
            exactPatterns: this.getPatternStats('exact'),
            intentPatterns: this.getPatternStats('intent'),
            keywordPatterns: this.getPatternStats('keyword')
        };
    }

    normalizeMessage(message) {
        return message.toLowerCase().trim();
    }

    detectIntent(message) {
        if (message.includes('?')) return 'question';
        if (/^(hi|hello|hey)/i.test(message)) return 'greeting';
        if (/^(bye|goodbye|see you)/i.test(message)) return 'farewell';
        if (/\b(thanks|thank you)\b/i.test(message)) return 'gratitude';
        if (/\b(sorry|apologize)\b/i.test(message)) return 'apology';
        if (/\b(agree|disagree|think)\b/i.test(message)) return 'opinion';
        if (/\b(can you|could you|would you)\b/i.test(message)) return 'request';
        return 'statement';
    }

    extractKeywords(message) {
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but']);
        return message
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    }

    storePattern(type, trigger, response, context) {
        const key = `${type}:${trigger}`;
        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }
        this.patterns.get(key).push({ response, context });
    }

    getPatternStats(type) {
        const stats = [];
        for (const [key, responses] of this.patterns.entries()) {
            if (key.startsWith(`${type}:`)) {
                const trigger = key.split(':')[1];
                stats.push({
                    trigger,
                    responses: responses.map(r => ({
                        text: r.response,
                        frequency: responses.filter(resp => resp.response === r.response).length
                    })).filter((v, i, a) => a.findIndex(t => t.text === v.text) === i)
                });
            }
        }
        return stats;
    }

    findBestResponse(message, impersonateUser) {
        const normalizedMessage = this.normalizeMessage(message);
        const intent = this.detectIntent(normalizedMessage);
        const keywords = this.extractKeywords(normalizedMessage);

        // Try exact match first
        let responses = this.patterns.get(`exact:${normalizedMessage}`);
        
        // Try intent match if no exact match
        if (!responses || responses.length === 0) {
            responses = this.patterns.get(`intent:${intent}`);
        }
        
        // Try keyword match if no intent match
        if (!responses || responses.length === 0) {
            const keywordKey = `keyword:${keywords.join(' ')}`;
            responses = this.patterns.get(keywordKey);
        }

        if (responses && responses.length > 0) {
            // Filter responses by the impersonated user
            const userResponses = responses.filter(r => r.context.responseUser === impersonateUser);
            if (userResponses.length > 0) {
                // Return the most frequent response
                return userResponses.reduce((prev, current) =>
                    (responses.filter(r => r.response === prev.response).length >
                     responses.filter(r => r.response === current.response).length)
                    ? prev : current
                ).response;
            }
        }

        return null;
    }
}

module.exports = new ResponsePatternAnalyzer();