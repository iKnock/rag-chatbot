const { ChromaClient } = require("chromadb");
const config = require("../config/config");
const crypto = require('crypto');

const chroma = new ChromaClient({
    path: "http://localhost:8000"
});

const generateId = () => crypto.randomBytes(16).toString('hex');

const createEmbeddings = async (messages) => {
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
    
    return {
        ids: messages.map(() => generateId()),
        vectors: messages.map(() => mockEmbedding),
        metadata: messages.map(msg => ({
            text: typeof msg === 'string' ? msg : msg.message,
            user: typeof msg === 'string' ? 'unknown' : msg.user
        })),
    };
};

const storeVectors = async (user, messages) => {
    try {
        if (!user) {
            throw new Error("User parameter is required");
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error(`No valid messages to process. This might be because:
                1. No messages were found in the PDF
                2. No messages matched the configured valid users
                3. The PDF format doesn't match the expected format
                
                Please check your config.validUsers and make sure they match the usernames in your chat.
                Current valid users: ${config.validUsers.join(', ')}`);
        }

        console.log(`Processing ${messages.length} messages for user ${user}`);

        const collectionName = `chat_history_${user}`;
        let collection;
        
        // Try to create or get collection
        try {
            collection = await chroma.createCollection({
                name: collectionName,
                embeddingFunction: {
                    dimensionality: 1536
                },
                metadata: { 
                    "description": `Chat history for ${user}`,
                    "hnsw:space": "cosine"
                }
            });
            console.log(`Created new collection: ${collectionName}`);
        } catch (error) {
            if (error.message?.includes("already exists")) {
                collection = await chroma.getCollection({
                    name: collectionName
                });
                console.log(`Retrieved existing collection: ${collectionName}`);
            } else {
                throw error;
            }
        }

        // Process in smaller batches
        const batchSize = 20;
        const totalBatches = Math.ceil(messages.length / batchSize);
        
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const embeddings = await createEmbeddings(batch);
            await collection.add({
                ids: embeddings.ids,
                embeddings: embeddings.vectors,
                metadatas: embeddings.metadata,
                documents: batch.map(m => typeof m === 'string' ? m : m.message)
            });
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${totalBatches}`);
        }

        return true;
    } catch (error) {
        console.error("Error storing vectors:", error);
        throw error;
    }
};

const retrieveSimilarMessages = async (query) => {
    try {
        const collectionName = `chat_history_${config.impersonateUser}`;
        const collection = await chroma.getCollection({
            name: collectionName
        });

        const queryEmbedding = await createEmbeddings([query]);
        const results = await collection.query({
            queryEmbeddings: queryEmbedding.vectors,
            nResults: 10,
            include: ["metadatas", "documents", "distances"]
        });

        const contextMessages = results.metadatas.flat()
            .map((metadata, index) => ({
                text: metadata.text,
                user: metadata.user,
                distance: results.distances[0][index]
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter(msg => msg.user === config.impersonateUser)
            .map(msg => msg.text);

        return contextMessages;
    } catch (error) {
        console.error("Error retrieving similar messages:", error);
        throw error;
    }
};

module.exports = {
    storeVectors,
    retrieveSimilarMessages
};