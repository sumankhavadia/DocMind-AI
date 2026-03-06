const axios = require("axios");
const Document = require("../models/documentmodel.js");
const Chunk = require("../models/chunkmodel.js");
const ChatSession = require("../models/chatsessionmodel.js");
const Message = require("../models/messagemodel.js");
const Citation = require("../models/citationmodel.js");
const { searchVectorStore } = require("../services/embeddingService.js");
const { buildSystemPrompt } = require("../services/personaService.js");

const ANSWER_URL = process.env.ANSWER_URL || "http://localhost:8000/answer";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "on", "at", "by", "for", "with", "about",
  "against", "between", "into", "through", "during", "before", "after",
  "above", "below", "from", "up", "down", "out", "off", "over", "under",
  "again", "then", "once", "what", "which", "who", "whom", "this", "that",
  "these", "those", "i", "me", "my", "we", "our", "you", "your", "it", "its",
  "how", "when", "where", "why", "and", "or", "but", "if", "so", "as",
]);

function extractKeywords(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function findMatchedTerms(question, chunkText) {
  const keywords = extractKeywords(question);
  const lowerText = (chunkText || "").toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword));
}

async function normalizeAndEnrichChunk(raw, idx, question, documentId) {
  const text = typeof raw === "string" ? raw : (raw?.text || "");
  const score = typeof raw?.score === "number" ? raw.score : Math.max(0.5, 1 - idx * 0.1);

  let page = raw?.page || 1;
  let bbox = raw?.bbox || { x: 0, y: 0, width: 0, height: 0 };
  let section = raw?.section || "";
  let chunkId = null;

  if (documentId && text) {
    try {
      const escaped = text.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const dbChunk = await Chunk.findOne({
        document: documentId,
        text: { $regex: escaped },
      }).select("_id page bbox section").lean();

      if (dbChunk) {
        page = dbChunk.page || page;
        bbox = dbChunk.bbox || bbox;
        section = dbChunk.section || section;
        chunkId = dbChunk._id;
      }
    } catch (err) {
      console.warn(`[ASK] Could not enrich chunk ${idx}:`, err.message);
    }
  }

  return {
    id: chunkId || `chunk_${idx}`,
    chunkId,
    page,
    section,
    text,
    score,
    bbox,
    matchedTerms: findMatchedTerms(question, text),
  };
}

async function resolveSession(userId, documentId, persona) {
  let session = await ChatSession.findOne({
    user: userId || null,
    document: documentId,
    isDeleted: false,
  }).sort({ createdAt: -1 });

  if (!session) {
    const doc = await Document.findById(documentId).select("originalName").lean();
    session = await ChatSession.create({
      user: userId || null,
      document: documentId,
      title: doc?.originalName || "New Chat",
      persona,
    });
  }

  return session;
}

exports.searchDocuments = async (req, res) => {
  try {
    const { query, documentId } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query must be a non-empty string",
      });
    }

    let results = await searchVectorStore(query, documentId);
    if ((!results || results.length === 0) && documentId) {
      console.warn(`[SEARCH] No results with doc filter ${documentId}; retrying global search`);
      results = await searchVectorStore(query, null);
    }

    return res.status(200).json({
      success: true,
      query,
      documentId: documentId || "all",
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("[SEARCH ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
};

exports.askQuestion = async (req, res) => {
  try {
    const { question, documentId, docType, persona } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ success: false, message: "Question must be a non-empty string" });
    }

    let rawContext = await searchVectorStore(question, documentId);

    if ((!rawContext || rawContext.length === 0) && documentId) {
      console.warn(`[ASK] No context with doc filter ${documentId}; retrying global search`);
      rawContext = await searchVectorStore(question, null);
    }

    if (!rawContext || !rawContext.length) {
      return res.status(200).json({
        success: true,
        question,
        answer: "I don't know — no relevant context found in the document.",
        citation: null,
        persona: persona || "general",
      });
    }

    const enrichedChunks = await Promise.all(
      rawContext.map((raw, idx) => normalizeAndEnrichChunk(raw, idx, question, documentId))
    );

    const contextText = enrichedChunks.map((chunk) => chunk.text).join("\n\n");

    const systemPrompt = buildSystemPrompt(docType || "document", persona || "general");
    console.log(`[ASK] persona=${persona || "general"} docType=${docType || "general"}`);

    const llmResponse = await axios.post(
      ANSWER_URL,
      { question, context: contextText, systemPrompt },
      { timeout: 30000 }
    );

    const answer = llmResponse.data.answer || "No answer returned.";

    const primary = enrichedChunks[0];
    const citationData = {
      text: `p.${primary.page}${primary.section ? `, ${primary.section}` : ""}`,
      label: `p.${primary.page}${primary.section ? `, ${primary.section}` : ""}`,
      page: primary.page,
      section: primary.section,
      excerpt: primary.text,
      highlight: extractKeywords(question)[0] || "",
      chunks: enrichedChunks.slice(0, 5),
    };

    let messageId = null;
    let citationId = null;

    if (documentId) {
      try {
        const session = await resolveSession(req.user?.id, documentId, persona || "general");

        const message = await Message.create({
          session: session._id,
          document: documentId,
          question,
          answer,
          persona: persona || "general",
          docType: docType || "general",
          meta: {
            contextChunks: enrichedChunks.length,
            topScore: primary.score,
          },
        });

        const citation = await Citation.create({
          message: message._id,
          document: documentId,
          label: citationData.label,
          page: citationData.page,
          section: citationData.section,
          excerpt: citationData.excerpt,
          highlight: citationData.highlight,
          chunks: citationData.chunks.map((chunk) => ({
            chunkId: chunk.chunkId,
            page: chunk.page,
            section: chunk.section,
            text: chunk.text,
            score: chunk.score,
            bbox: chunk.bbox,
            matchedTerms: chunk.matchedTerms,
          })),
        });

        await Message.findByIdAndUpdate(message._id, { citation: citation._id });

        messageId = message._id;
        citationId = citation._id;
        console.log(`[ASK] Saved message=${messageId} citation=${citationId}`);
      } catch (persistError) {
        console.error("[ASK] Failed to persist message/citation:", persistError.message);
      }
    }

    return res.status(200).json({
      success: true,
      question,
      answer,
      messageId,
      citation: {
        ...citationData,
        citationId,
      },
      persona: persona || "general",
      docType: docType || "general",
    });
  } catch (error) {
    console.error("[ASK ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Question answering failed",
      error: error.message,
    });
  }
};

exports.getCitation = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).select("citation").lean();
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const citation = await Citation.findById(message.citation).lean();
    if (!citation) {
      return res.status(404).json({ success: false, message: "Citation not found" });
    }

    return res.status(200).json({ success: true, citation });
  } catch (error) {
    console.error("[GET CITATION ERROR]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch citation", error: error.message });
  }
};

exports.summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "documentId is required",
      });
    }

    console.log(`[SUMMARIZE] Searching for documentId: ${documentId}`);

    const allChunks = await searchVectorStore(
      "summary overview main points key information",
      documentId
    );

    console.log(`[SUMMARIZE] Found ${allChunks.length} chunks for documentId: ${documentId}`);

    if (allChunks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No content found for this document",
      });
    }

    const fullText = allChunks
      .map((chunk) => (typeof chunk === "string" ? chunk : (chunk?.text || "")))
      .join("\n\n");

    const response = await axios.post(
      ANSWER_URL,
      {
        question: "Provide a comprehensive summary of this document in short",
        context: fullText,
      },
      { timeout: 60000 }
    );

    return res.status(200).json({
      success: true,
      documentId,
      summary: response.data.answer,
    });
  } catch (error) {
    console.error("[SUMMARY ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Summary generation failed",
      error: error.message,
    });
  }
};
