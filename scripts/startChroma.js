const { ChromaClient } = require('chromadb');

async function testChromaConnection() {
    try {
        console.log('🔄 Testing Chroma connection...');
        
        // Create a client
        const client = new ChromaClient({
            path: "http://localhost:8000"
        });

        // Test the connection
        const heartbeat = await client.heartbeat();
        console.log('💓 Chroma heartbeat:', heartbeat);

        // List collections
        const collections = await client.listCollections();
        console.log('\n📚 Collections:', collections);

        console.log('\n✅ Connected to Chroma successfully!');
        
    } catch (error) {
        console.error('\n❌ Error connecting to Chroma:');
        console.error(error.message);
        console.error('\nMake sure Chroma backend is running. You can start it with:');
        console.error('chroma run --path /path/to/your/data');
        process.exit(1);
    }
}

testChromaConnection();