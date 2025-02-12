const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class ResponseMemory {
    constructor() {
        this.memoryPath = path.join(__dirname, '..', 'data', 'response_memory.json');
        this.memory = this.loadMemory();
    }

    loadMemory() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
            }
            return {
                patterns: {},
                successfulMatches: {},
                userStyles: {}
            };
        } catch (error) {
            console.error('Error loading response memory:', error);
            return {
                patterns: {},
                successfulMatches: {},
                userStyles: {}
            };
        }
    }

    saveMemory() {
        try {
            fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
        } catch (error) {
            console.error('Error saving response memory:', error);
        }
    }

    rewardResponse(trigger, response, user) {
        const key = this.generateKey(trigger, user);
        
        if (!this.memory.patterns[key]) {
            this.memory.patterns[key] = {
                trigger,
                user,
                responses: {}
            };
        }

        if (!this.memory.patterns[key].responses[response]) {
            this.memory.patterns[key].responses[response] = {
                count: 0,
                successCount: 0,
                lastUsed: null
            };
        }

        const responseData = this.memory.patterns[key].responses[response];
        responseData.successCount++;
        responseData.count++;
        responseData.lastUsed = new Date().toISOString();

        // Update user style preferences
        if (!this.memory.userStyles[user]) {
            this.memory.userStyles[user] = {
                preferredResponses: {},
                contextPatterns: {}
            };
        }

        this.memory.successfulMatches[key] = {
            lastSuccess: new Date().toISOString(),
            successCount: (this.memory.successfulMatches[key]?.successCount || 0) + 1
        };

        this.saveMemory();
        console.log(`✅ Rewarded response pattern for "${trigger}" -> "${response}"`);
    }

    getBestResponse(trigger, user) {
        const key = this.generateKey(trigger, user);
        const pattern = this.memory.patterns[key];

        if (pattern) {
            const responses = Object.entries(pattern.responses)
                .map(([response, data]) => ({
                    response,
                    score: this.calculateScore(data)
                }))
                .sort((a, b) => b.score - a.score);

            if (responses.length > 0) {
                return responses[0].response;
            }
        }

        return null;
    }

    calculateScore(data) {
        const successRate = data.successCount / data.count;
        const recency = new Date() - new Date(data.lastUsed);
        const recencyFactor = Math.exp(-recency / (1000 * 60 * 60 * 24)); // Decay over days
        return successRate * (0.7 + 0.3 * recencyFactor);
    }

    generateKey(trigger, user) {
        return `${user}:${trigger.toLowerCase().trim()}`;
    }

    getPatternStats() {
        return {
            totalPatterns: Object.keys(this.memory.patterns).length,
            successfulPatterns: Object.keys(this.memory.successfulMatches).length,
            userStats: Object.entries(this.memory.userStyles).map(([user, data]) => ({
                user,
                patterns: Object.keys(data.preferredResponses).length
            }))
        };
    }
}

module.exports = new ResponseMemory();