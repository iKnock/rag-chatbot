require("dotenv").config();

const config = {
    ollamaModel: process.env.OLLAMA_MODEL || "deepseek-coder:14b",
    impersonateUser: process.env.IMPERSONATE_USER,
    validUsers: process.env.VALID_USERS ? process.env.VALID_USERS.split(',').map(user => user.trim()) : [],
    chromaDBPath: process.env.CHROMA_DB_PATH || "./chroma_db",
    dataDirectory: process.env.DATA_DIRECTORY || "./data",
    collectionPrefix: process.env.COLLECTION_PREFIX || 'chat_history',
};

module.exports = config;