'use strict';

const mongoose = require("mongoose");

/**
 * Message — a single Q&A turn inside a ChatSession.
 * Stores both the user question and the AI answer with its citation.
 */
const messageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // ── Question ─────────────────────────────────────────────
    question: {
      type: String,
      required: true,
    },

    // ── Answer ───────────────────────────────────────────────
    answer: {
      type: String,
      required: true,
    },

    // ── Citation ref (populated after Citation is saved) ─────
    citation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citation",
      default: null,
    },

    // ── Persona used for this message ────────────────────────
    persona: {
      type: String,
      enum: ["student", "professional", "legal", "researcher", "general"],
      default: "general",
    },

    // ── Doc type at time of query ────────────────────────────
    docType: {
      type: String,
      default: "general",
    },

    // ── LLM response metadata ────────────────────────────────
    meta: {
      // FAISS search hit count
      contextChunks: { type: Number, default: 0 },
      // Top chunk similarity score
      topScore:      { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

messageSchema.index({ session: 1, createdAt: 1 });
messageSchema.index({ document: 1 });

module.exports = mongoose.model("Message", messageSchema);