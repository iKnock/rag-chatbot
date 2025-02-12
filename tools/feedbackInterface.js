const readline = require('readline');
const patternAnalyzer = require('./patternAnalyzer');
const responseMemory = require('../services/responseMemory');

class FeedbackInterface {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async collectFeedback(trigger, response, context) {
        console.log('\n📝 Response Feedback Collection');
        console.log('--------------------------------');
        console.log(`Trigger: "${trigger}"`);
        console.log(`Response: "${response}"`);

        const analysis = patternAnalyzer.analyzePattern(trigger, response, context);
        
        console.log('\n📊 Analysis Results:');
        console.log('- Semantic Score:', analysis.score.components.semantic.toFixed(2));
        console.log('- Context Score:', analysis.score.components.context.toFixed(2));
        console.log('- Style Score:', analysis.score.components.style.toFixed(2));
        console.log('- Overall Score:', analysis.score.total.toFixed(2));

        const rating = await this.promptFeedback();
        
        if (rating >= 4) {
            responseMemory.rewardResponse(trigger, response, config.impersonateUser);
            console.log('✅ Response pattern rewarded and saved!');
        }

        return {
            rating,
            analysis,
            timestamp: new Date().toISOString()
        };
    }

    async promptFeedback() {
        return new Promise((resolve) => {
            this.rl.question('\nRate this response (1-5): ', (answer) => {
                const rating = parseInt(answer);
                resolve(isNaN(rating) ? 3 : Math.min(Math.max(rating, 1), 5));
            });
        });
    }

    close() {
        this.rl.close();
    }
}

module.exports = new FeedbackInterface();