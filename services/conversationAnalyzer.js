const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class ConversationAnalyzer {
    constructor() {
        this.wordNet = natural.WordNet();
    }

    analyzeVocabularyProfile(messages) {
        const wordFrequency = {};
        const bigramFrequency = {};
        const sentencePatterns = {};

        messages.forEach(msg => {
            const tokens = tokenizer.tokenize(msg.message.toLowerCase());
            
            // Word frequency analysis
            tokens.forEach(token => {
                wordFrequency[token] = (wordFrequency[token] || 0) + 1;
            });

            // Bigram analysis
            for (let i = 0; i < tokens.length - 1; i++) {
                const bigram = `${tokens[i]} ${tokens[i + 1]}`;
                bigramFrequency[bigram] = (bigramFrequency[bigram] || 0) + 1;
            }

            // Sentence pattern analysis
            const pattern = this.getSentencePattern(msg.message);
            sentencePatterns[pattern] = (sentencePatterns[pattern] || 0) + 1;
        });

        return {
            commonWords: this.getTopItems(wordFrequency, 20),
            commonPhrases: this.getTopItems(bigramFrequency, 10),
            sentencePatterns: this.getTopItems(sentencePatterns, 5)
        };
    }

    analyzeConversationFlow(messages) {
        const flowPatterns = {
            responseTypes: {},
            messageLength: [],
            turnTaking: [],
            contextualContinuity: []
        };

        for (let i = 0; i < messages.length; i++) {
            const currentMsg = messages[i];
            const prevMsg = messages[i - 1];
            const nextMsg = messages[i + 1];

            // Analyze response types
            const responseType = this.getResponseType(currentMsg.message);
            flowPatterns.responseTypes[responseType] = 
                (flowPatterns.responseTypes[responseType] || 0) + 1;

            // Analyze message length patterns
            flowPatterns.messageLength.push(currentMsg.message.length);

            // Analyze turn-taking patterns
            if (prevMsg && nextMsg) {
                flowPatterns.turnTaking.push({
                    before: prevMsg.user,
                    current: currentMsg.user,
                    after: nextMsg.user
                });
            }

            // Analyze contextual continuity
            if (prevMsg) {
                const continuity = this.analyzeContextualContinuity(prevMsg.message, currentMsg.message);
                flowPatterns.contextualContinuity.push(continuity);
            }
        }

        return {
            dominantResponseTypes: this.getTopItems(flowPatterns.responseTypes, 5),
            averageMessageLength: this.average(flowPatterns.messageLength),
            turnTakingPatterns: this.analyzeTurnTaking(flowPatterns.turnTaking),
            contextualContinuityScore: this.average(flowPatterns.contextualContinuity)
        };
    }

    getResponseType(message) {
        if (message.endsWith('?')) return 'question';
        if (message.endsWith('!')) return 'exclamation';
        if (/^(yes|no|maybe|ok|okay|sure)/i.test(message)) return 'acknowledgment';
        if (message.length < 15) return 'short';
        if (message.length > 100) return 'elaborate';
        return 'standard';
    }

    getSentencePattern(message) {
        return message
            .replace(/[^.!?]+[.!?]+/g, (sentence) => {
                if (sentence.includes('?')) return 'QUESTION';
                if (sentence.includes('!')) return 'EXCLAMATION';
                return 'STATEMENT';
            })
            .replace(/\s+/g, '_');
    }

    analyzeContextualContinuity(prevMsg, currentMsg) {
        const prevTokens = new Set(tokenizer.tokenize(prevMsg.toLowerCase()));
        const currentTokens = tokenizer.tokenize(currentMsg.toLowerCase());
        return currentTokens.filter(token => prevTokens.has(token)).length / currentTokens.length;
    }

    getTopItems(freq, n) {
        return Object.entries(freq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, n)
            .map(([item, count]) => ({ item, count }));
    }

    average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    analyzeTurnTaking(patterns) {
        const summary = {};
        patterns.forEach(pattern => {
            const key = `${pattern.before}->${pattern.current}->${pattern.after}`;
            summary[key] = (summary[key] || 0) + 1;
        });
        return this.getTopItems(summary, 5);
    }
}

module.exports = new ConversationAnalyzer();
