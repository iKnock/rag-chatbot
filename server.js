const express = require('express');
const { processPDF, chat } = require('./controllers/pdfController');

const app = express();
app.use(express.json());

// Route to process the PDF file
app.post('/api/process-pdf', processPDF);

// Route for chat interactions
app.post('/api/chat', chat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});