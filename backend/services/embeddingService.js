const axios = require("axios");

const ADD_URL = process.env.ADD_URL || "http://localhost:8000/add";
const SEARCH_URL = process.env.SEARCH_URL || "http://localhost:8000/search";

async function generateAndStoreEmbeddings(chunks, documentId, options = {}) {
  const timeout = options.timeout || 30000;
  
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("chunks must be a non-empty array");
    }

    console.log(`[EMBEDDING] Generating embeddings for ${chunks.length} chunks, documentId: ${documentId}`);

    const response = await axios.post(
      ADD_URL,
      { chunks, doc_id: documentId.toString() },
      { timeout }
    );

    console.log(`[EMBEDDING] Successfully stored ${chunks.length} chunks in vector store`);

    return response.data.embeddings;
  } catch (error) {
    console.error(`[EMBEDDING ERROR] Failed to store embeddings:`, error.message);
    if (error.code === "ECONNREFUSED") {
      throw new Error("Embedding service unavailable. Ensure it's running on port 8000");
    }
    throw error;
  }
}

async function searchVectorStore(query, documentId = null, options = {}) {
  const timeout = options.timeout || 30000;
  
  try {
    if (!query || typeof query !== "string") {
      throw new Error("query must be a non-empty string");
    }

    const payload = { query };
    if (documentId) {
      payload.doc_id = documentId.toString();
    }

    const response = await axios.post(
      SEARCH_URL,
      payload,
      { timeout }
    );

    return response.data.context;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      throw new Error("Vector store service unavailable. Ensure it's running on port 8000");
    }
    throw error;
  }
}

module.exports = { generateAndStoreEmbeddings, searchVectorStore };
