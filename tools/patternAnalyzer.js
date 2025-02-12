class PatternAnalyzer {
    constructor() {
        this.patterns = new Map();
    }

    analyzePattern(message, response, context = []) {
        try {
            const score = {
                contextMatch: this.calculateContextMatch(message, context),
                responseMatch: this.calculateResponseMatch(message, response),
                patternMatch: this.calculatePatternMatch(message, response),
                total: 0
            };

            // Calculate total score
            score.total = (score.contextMatch + score.responseMatch + score.patternMatch) / 3;

            return {
                score,
                patterns: this.extractPatterns(message, response),
                analysis: this.analyzeMessageStructure(message)
            };
        } catch (error) {
            console.error('Error in pattern analysis:', error);
            return {
                score: { contextMatch: 0, responseMatch: 0, patternMatch: 0, total: 0 },
                patterns: [],
                analysis: {}
            };
        }
    }

    calculateContextMatch(message, context) {
        try {
            if (!Array.isArray(context)) {
                console.warn('Invalid context format');
                return 0;
            }

            const messageWords = this.getWords(message);
            const contextWords = new Set();

            // Safely process context messages
            context.forEach(msg => {
                if (msg && typeof msg === 'object' && msg.message) {
                    const words = this.getWords(msg.message);
                    words.forEach(word => contextWords.add(word));
                }
            });

            let matches = 0;
            messageWords.forEach(word => {
                if (contextWords.has(word)) matches++;
            });

            return matches / Math.max(messageWords.size, 1);
        } catch (error) {
            console.error('Error in context match calculation:', error);
            return 0;
        }
    }

    calculateResponseMatch(message, response) {
        try {
            if (!message || !response) return 0;
            
            const messageWords = this.getWords(message);
            const responseWords = this.getWords(response);

            let matches = 0;
            messageWords.forEach(word => {
                if (responseWords.has(word)) matches++;
            });

            return matches / Math.max(messageWords.size, 1);
        } catch (error) {
            console.error('Error in response match calculation:', error);
            return 0;
        }
    }

    calculatePatternMatch(message, response) {
        try {
            if (!message || !response) return 0;

            const messagePattern = this.getMessagePattern(message);
            const responsePattern = this.getMessagePattern(response);

            return messagePattern === responsePattern ? 1 : 0;
        } catch (error) {
            console.error('Error in pattern match calculation:', error);
            return 0;
        }
    }

    getWords(text) {
        try {
            if (typeof text !== 'string') {
                console.warn('Invalid text format in getWords:', typeof text);
                return new Set();
            }
            return new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
        } catch (error) {
            console.error('Error in getWords:', error);
            return new Set();
        }
    }

    getMessagePattern(text) {
        try {
            if (typeof text !== 'string') return '';
            return text.replace(/[a-zA-Z0-9]+/g, 'W')
                      .replace(/[0-9]+/g, 'N')
                      .replace(/[^W\s]/g, 'S');
        } catch (error) {
            console.error('Error in getMessagePattern:', error);
            return '';
        }
    }

    extractPatterns(message, response) {
        try {
            if (!message || !response) return [];
            return [
                this.getMessagePattern(message),
                this.getMessagePattern(response)
            ];
        } catch (error) {
            console.error('Error in extractPatterns:', error);
            return [];
        }
    }

    analyzeMessageStructure(message) {
        try {
            if (typeof message !== 'string') return {};
            return {
                length: message.length,
                words: message.split(/\s+/).length,
                hasQuestion: message.includes('?'),
                pattern: this.getMessagePattern(message)
            };
        } catch (error) {
            console.error('Error in analyzeMessageStructure:', error);
            return {};
        }
    }
}

module.exports = new PatternAnalyzer();