#!/bin/bash

echo "🔄 Starting revert process..."

# Create backup of current state
echo "📦 Creating backup..."
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r backend/* $BACKUP_DIR/

# Remove files added today
echo "🗑️ Removing new files..."
rm -f backend/services/advancedPatternMatcher.js
rm -f backend/services/enhancedLearning.js
rm -f backend/services/responseValidator.js
rm -f backend/services/analyticsService.js
rm -f backend/services/pdfParserService.js

# Restore original files
echo "♻️ Restoring original files..."

# Restore ollamaService.js
cat > backend/services/ollamaService.js << 'EOL'
const axios = require('axios');
const config = require('../config/config');

async function generateResponse(message, context, impersonateUser) {
    try {
        if (!message) {
            return 'I cannot process an empty message.';
        }

        context = Array.isArray(context) ? context : [];

        const formattedContext = context
            .filter(msg => msg && (msg.message || msg.text))
            .map(msg => ({
                role: msg.user === impersonateUser ? 'assistant' : 'user',
                content: msg.message || msg.text
            }));

        const prompt = {
            model: config.ollamaModel || 'mistral',
            messages: [
                ...formattedContext,
                { role: 'user', content: message }
            ],
            stream: false
        };

        const response = await axios.post('http://localhost:11434/api/chat', prompt);

        if (!response.data || !response.data.message) {
            throw new Error('Invalid response from Ollama');
        }

        return response.data.message.content;

    } catch (error) {
        console.error('Error generating response:', error);
        return 'I apologize, but I encountered an error processing your message.';
    }
}

module.exports = {
    generateResponse
};
EOL

# Restore conversationAnalyzer.js
cat > backend/services/conversationAnalyzer.js << 'EOL'
class ConversationAnalyzer {
    analyzeVocabularyProfile(messages) {
        const wordFrequency = new Map();
        const totalWords = { count: 0 };

        if (!Array.isArray(messages) || messages.length === 0) {
            console.warn('No messages to analyze');
            return {
                mostCommon: [],
                totalWords: 0,
                uniqueWords: 0
            };
        }

        messages.forEach(msg => {
            if (msg && msg.message) {
                const words = msg.message.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 0);

                words.forEach(word => {
                    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
                    totalWords.count++;
                });
            }
        });

        const sortedWords = [...wordFrequency.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));

        return {
            mostCommon: sortedWords,
            totalWords: totalWords.count,
            uniqueWords: wordFrequency.size
        };
    }
}

module.exports = new ConversationAnalyzer();
EOL

# Restore interactiveTest.js
cat > backend/tests/interactiveTest.js << 'EOL'
const readline = require('readline');
const { generateResponse } = require('../services/ollamaService');
const config = require('../config/config');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let context = [];

async function chat() {
    try {
        console.log('\n🤖 Chat Interface Started');
        console.log('Type "exit" to end the conversation\n');

        const askQuestion = () => {
            rl.question('You: ', async (input) => {
                if (input.toLowerCase() === 'exit') {
                    console.log('\nGoodbye! 👋');
                    rl.close();
                    return;
                }

                try {
                    const response = await generateResponse(
                        input,
                        context,
                        config.impersonateUser
                    );

                    context.push(
                        { user: 'user', message: input },
                        { user: config.impersonateUser, message: response }
                    );

                    if (context.length > 10) {
                        context = context.slice(-10);
                    }

                    console.log(`\nBot: ${response}\n`);
                } catch (error) {
                    console.error('Error:', error.message);
                    console.log('\nBot: I apologize, but I encountered an error. Please try again.\n');
                }

                askQuestion();
            });
        };

        askQuestion();

    } catch (error) {
        console.error('Fatal error:', error);
        rl.close();
        process.exit(1);
    }
}

chat();
EOL

# Update package.json to remove new dependencies
cat > package.json << 'EOL'
{
  "dependencies": {
    "axios": "^1.6.0"
  },
  "scripts": {
    "start": "node backend/tests/interactiveTest.js",
    "test": "node backend/tests/interactiveTest.js"
  }
}
EOL

echo "✅ Revert complete!"
echo "📁 Backup saved to: $BACKUP_DIR"
echo "🔍 Please verify the changes and run 'npm install' to update dependencies"
EOL 