const path = require('path');
const os = require('os');

// Set environment variables before importing chromadb
process.env.HF_CACHE_DIR = path.join(os.tmpdir(), 'hf-cache');
process.env.CHROMADB_CACHE_DIR = path.join(os.tmpdir(), 'chroma-cache');
process.env.TRANSFORMERS_CACHE = path.join(os.tmpdir(), 'transformers-cache');
process.env.HF_HUB_DISABLE_TELEMETRY = "1";
process.env.HF_HUB_OFFLINE = "1"; 