const express = require("express");
const { processPDF } = require("../controllers/pdfController");

const router = express.Router();

// Route for processing PDFs in the 'data' folder
router.post("/process-pdf", processPDF);

module.exports = router;
