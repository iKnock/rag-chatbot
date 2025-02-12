const responseMemory = require('./responseMemory');
const config = require('../config/config');

class PatternLearningService {
    constructor() {
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.2;
    }

    async learnFromInteraction(trigger, response, feedback) {
        try {
            const patternKey = this.generatePatternKey(trigger);
            const currentScore = await this.getPatternScore(patternKey, response);
            
            // Calculate new score using Q-learning
            const reward = this.calculateReward(feedback);
            const newScore = currentScore + 
                this.learningRate * (reward + this.discountFactor * this.getMaxFutureScore(patternKey) - currentScore);

            // Update pattern memory
            await responseMemory.updatePatternScore(patternKey, response, newScore);

            return {
                patternKey,
                oldScore: currentScore,
                newScore,
                reward
            };
        } catch (error) {
            console.error('Error in pattern learning:', error);
            return null;
        }
    }

    calculateReward(feedback) {
        // Convert feedback to reward
        const rewards = {
            'excellent': 1.0,
            'good': 0.7,
            'neutral': 0.5,
            'poor': 0.2,
            'bad': 0.0
        };
        return rewards[feedback] || 0.5;
    }

    async getPatternScore(patternKey, response) {
        const pattern = await responseMemory.getPattern(patternKey);
        return pattern?.responses?.[response]?.score || 0;
    }

    getMaxFutureScore(patternKey) {
        const pattern = responseMemory.getPattern(patternKey);
        if (!pattern?.responses) return 0;

        return Math.max(...Object.values(pattern.responses)
            .map(r => r.score || 0));
    }

    generatePatternKey(trigger) {
        return trigger.toLowerCase().trim();
    }

    shouldExplore() {
        return Math.random() < this.explorationRate;
    }
}

module.exports = new PatternLearningService(); 