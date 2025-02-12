const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { ChromaClient } = require('chromadb');

class PDFParserService {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'data');
        this.chromaClient = new ChromaClient({
            path: "http://localhost:8000"
        });
        this.collection = null;
        this.initializeChroma();
    }

    async initializeChroma() {
        try {
            this.collection = await this.chromaClient.getOrCreateCollection({
                name: "pdf_store"
            });
            console.log('ChromaDB collection initialized successfully');
        } catch (error) {
            console.error('Error initializing ChromaDB:', error);
            throw error;
        }
    }

    async parsePDF(file) {
        try {
            console.log('Starting to parse chat.pdf');
            
            // Parse PDF
            const data = await pdf(file.buffer);
            
            // Process the content
            const content = this.processContent(data.text);
            
            // Ensure ChromaDB is initialized
            if (!this.collection) {
                await this.initializeChroma();
            }
            
            // Store in Chroma
            await this.storeInChroma('chat.pdf', content);

            return {
                filename: 'chat.pdf',
                content: content,
                pages: data.numpages,
                info: data.info
            };

        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error(`Failed to parse chat.pdf: ${error.message}`);
        }
    }

    processContent(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();
    }

    async storeInChroma(filename, content) {
        try {
            if (!this.collection) {
                await this.initializeChroma();
            }

            // Split content into smaller chunks
            const chunks = this.splitContent(content);
            const ids = chunks.map((_, i) => `${filename}_${i}`);

            // Try to delete existing entries first
            try {
                await this.collection.delete({
                    ids: ids
                });
            } catch (e) {
                // Ignore deletion errors
            }

            // Store new chunks
            await this.collection.add({
                ids: ids,
                documents: chunks,
                metadatas: chunks.map(() => ({ source: filename }))
            });
            
            console.log('Content stored in Chroma successfully');
        } catch (error) {
            console.error('Error storing in Chroma:', error);
            throw error;
        }
    }

    splitContent(content, maxChunkSize = 1000) {
        // Split content into sentences
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize) {
                chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    async queryChroma(query, limit = 5) {
        try {
            if (!this.collection) {
                await this.initializeChroma();
            }

            const results = await this.collection.query({
                queryTexts: [query],
                nResults: limit
            });

            return results;
        } catch (error) {
            console.error('Error querying Chroma:', error);
            throw error;
        }
    }

    async listPDFs() {
        try {
            if (!fs.existsSync(this.dataPath)) {
                return [];
            }

            const files = fs.readdirSync(this.dataPath)
                .filter(file => file.toLowerCase().endsWith('.pdf'))
                .map(file => ({
                    name: file,
                    path: path.join(this.dataPath, file),
                    size: fs.statSync(path.join(this.dataPath, file)).size
                }));

            return files;
        } catch (error) {
            console.error('Error listing PDFs:', error);
            throw error;
        }
    }

    async deletePDF(filename) {
        try {
            const filePath = path.join(this.dataPath, filename);
            
            if (!fs.existsSync(filePath)) {
                throw new Error('PDF not found');
            }

            // Remove from filesystem
            fs.unlinkSync(filePath);

            return true;
        } catch (error) {
            console.error('Error deleting PDF:', error);
            throw error;
        }
    }
}

module.exports = new PDFParserService(); 