const config = require('../config/config');

class ChatHistory {
    constructor(rawText) {
        this.messages = this.parseMessages(rawText);
    }

    parseMessages(rawText) {
        const lines = rawText.split("\n").filter((line) => line.trim() !== "");
        const messages = [];
        const validUsers = new Set(config.validUsers);

        // Parse messages using configured usernames
        let currentUser = null;
        lines.forEach((line) => {
            // Create dynamic regex pattern from valid users
            const userPattern = `^(${config.validUsers.join('|')}): (.+)$`;
            const match = line.match(new RegExp(userPattern));
            
            if (match && validUsers.has(match[1])) {
                currentUser = match[1];
                messages.push({ user: currentUser, text: match[2] });
            } else if (currentUser) {
                // Continuation of a message
                messages[messages.length - 1].text += ` ${line}`;
            }
        });

        return messages;
    }

    filterByUser(user) {
        if (!config.validUsers.includes(user)) {
            console.warn(`Warning: Filtering for unknown user ${user}`);
            return [];
        }
        return this.messages
            .filter((msg) => msg.user === user)
            .map((msg) => msg.text);
    }
}

module.exports = ChatHistory;