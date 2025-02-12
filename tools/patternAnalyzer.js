const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const distance = natural.JaroWinklerDistance;

class PatternAnalyzer {
    constructor() {
        this.tfidf = new TfIdf();
        this.contextPatterns = new Map();
        this.responseVariations = new Map();
        this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    }

    analyzePattern(trigger, response, context = []) {
        const analysis = {
            semantic: this.analyzeSemanticSimilarity(trigger, response),
            context: this.analyzeContextRelevance(trigger, response, context),
            style: this.analyzeStyleConsistency(response, context),
            variations: this.findResponseVariations(response),
            sentiment: this.analyzeSentiment(response)
        };

        return {
            ...analysis,
            score: this.calculateComplexScore(analysis)
        };
    }

    analyzeSemanticSimilarity(trigger, response) {
        const triggerTokens = tokenizer.tokenize(trigger.toLowerCase());
        const responseTokens = tokenizer.tokenize(response.toLowerCase());

        // Calculate word overlap
        const overlap = triggerTokens.filter(word => 
            responseTokens.includes(word)).length;

        // Calculate semantic similarity using Jaro-Winkler
        const similarity = distance(trigger, response);

        return {
            overlap: overlap / Math.max(triggerTokens.length, responseTokens.length),
            similarity
        };
    }

    analyzeContextRelevance(trigger, response, context) {
        const contextKey = this.generateContextKey(trigger);
        
        if (!this.contextPatterns.has(contextKey)) {
            this.contextPatterns.set(contextKey, {
                triggers: new Set(),
                responses: new Set(),
                frequency: 0
            });
        }

        const pattern = this.contextPatterns.get(contextKey);
        pattern.triggers.add(trigger);
        pattern.responses.add(response);
        pattern.frequency++;

        return {
            frequency: pattern.frequency,
            contextScore: this.calculateContextScore(response, context)
        };
    }

    analyzeStyleConsistency(response, context) {
        const styleMetrics = {
            length: response.length,
            wordCount: tokenizer.tokenize(response).length,
            punctuation: (response.match(/[.,!?;]/g) || []).length,
            emoji: (response.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
        };

        // Compare with context style
        const contextStyle = this.analyzeContextStyle(context);
        
        return {
            metrics: styleMetrics,
            consistency: this.calculateStyleConsistency(styleMetrics, contextStyle)
        };
    }

    findResponseVariations(response) {
        const key = this.normalizeResponse(response);
        
        if (!this.responseVariations.has(key)) {
            this.responseVariations.set(key, new Set());
        }

        this.responseVariations.get(key).add(response);

        return {
            variationCount: this.responseVariations.get(key).size,
            variations: Array.from(this.responseVariations.get(key))
        };
    }

    analyzeSentiment(text) {
        return this.sentimentAnalyzer.getSentiment(tokenizer.tokenize(text));
    }

    calculateComplexScore(analysis) {
        const weights = {
            semantic: 0.3,
            context: 0.25,
            style: 0.25,
            sentiment: 0.1,
            variations: 0.1
        };

        return {
            total: (
                analysis.semantic.similarity * weights.semantic +
                analysis.context.contextScore * weights.context +
                analysis.style.consistency * weights.style +
                (analysis.sentiment + 1) / 2 * weights.sentiment +
                Math.min(analysis.variations.variationCount / 5, 1) * weights.variations
            ),
            components: {
                semantic: analysis.semantic.similarity * weights.semantic,
                context: analysis.context.contextScore * weights.context,
                style: analysis.style.consistency * weights.style,
                sentiment: (analysis.sentiment + 1) / 2 * weights.sentiment,
                variations: Math.min(analysis.variations.variationCount / 5, 1) * weights.variations
            }
        };
    }

    generateContextKey(trigger) {
        return trigger.toLowerCase().trim();
    }

    normalizeResponse(response) {
        return response.toLowerCase().replace(/[.,!?;]/g, '').trim();
    }

    calculateContextScore(response, context) {
        if (!context.length) return 0.5;
        
        const contextWords = new Set(
            context.flatMap(msg => tokenizer.tokenize(msg.toLowerCase()))
        );
        const responseWords = new Set(tokenizer.tokenize(response.toLowerCase()));
        const overlap = [...responseWords].filter(word => contextWords.has(word)).length;
        
        return overlap / responseWords.size;
    }

    analyzeContextStyle(context) {
        if (!context.length) return null;

        return context.reduce((acc, msg) => ({
            length: acc.length + msg.length,
            wordCount: acc.wordCount + tokenizer.tokenize(msg).length,
            punctuation: acc.punctuation + (msg.match(/[.,!?;]/g) || []).length,
            emoji: acc.emoji + (msg.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
        }), { length: 0, wordCount: 0, punctuation: 0, emoji: 0 });
    }

    calculateStyleConsistency(current, context) {
        if (!context) return 0.5;

        const metrics = ['length', 'wordCount', 'punctuation', 'emoji'];
        const scores = metrics.map(metric => {
            const contextAvg = context[metric] / context.length;
            const diff = Math.abs(current[metric] - contextAvg);
            return 1 / (1 + diff);
        });

        return scores.reduce((a, b) => a + b) / scores.length;
    }
}

module.exports = new PatternAnalyzer();