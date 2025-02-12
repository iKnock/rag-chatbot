const { ChromaClient } = require('chromadb');

async function testChromaConnection() {
    try {
        console.log('🔄 Testing Chroma connection...');
        
        // Create a client
        const client = new ChromaClient({
            path: "http://localhost:8000" // default Chroma server address
        });

        // Test the connection by getting the heartbeat
        const heartbeat = await client.heartbeat();
        console.log('💓 Chroma heartbeat:', heartbeat);

        // List all collections
        const collections = await client.listCollections();
        console.log('\n📚 Available collections:', collections.length);
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        console.log('\n✅ Chroma is running properly!');
        return true;

    } catch (error) {
        console.error('\n❌ Error connecting to Chroma:');
        console.error(error.message);
        console.error('\nMake sure Chroma is running with:');
        console.error('docker run -p 8000:8000 chromadb/chroma');
        return false;
    }
}

// Run the test
testChromaConnection(); 