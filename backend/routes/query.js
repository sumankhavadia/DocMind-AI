const express = require("express");
const router = express.Router();
const { searchDocuments, askQuestion, summarizeDocument } = require("../controllers/queryController");

// POST /api/query/search - semantic search
router.post("/search", searchDocuments);

// POST /api/query/ask - Q&A with LLM
router.post("/ask", askQuestion);

// POST /api/query/summary - generate document summary
router.post("/summary", summarizeDocument);

module.exports = router;
