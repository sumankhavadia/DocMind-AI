'use strict';

const mongoose = require("mongoose");

/**
 * RetrievedChunk — a single FAISS result stored inside a Citation.
 * Mirrors the chunk data at query time so citations remain accurate
 * even if chunks are later re-indexed.
 */
const retrievedChunkSchema = new mongoose.Schema(
  {
    // Reference to the Chunk document (for deep linking)
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chunk",
      required: false,
    },

    page:    { type: Number, default: 1 },
    section: { type: String, default: "" },
    text:    { type: String, required: true },

    // FAISS cosine similarity score (0–1)
    score: {
      type: Number,
      default: 0,
    },

    // Bounding box snapshot at query time
    bbox: {
      x:      { type: Number, default: 0 },
      y:      { type: Number, default: 0 },
      width:  { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    // Keywords from the question that matched this chunk
    matchedTerms: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Citation — the full source attribution for one AI answer.
 * Stored permanently so any historical message can reopen its citation panel.
 */
const citationSchema = new mongoose.Schema(
  {
    // The message this citation belongs to
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // ── Primary source (top chunk) ───────────────────────────
    // Short label shown on the message bubble e.g. "p.14, Section 3.2"
    label: {
      type: String,
      default: "",
    },

    page:    { type: Number, default: 1 },
    section: { type: String, default: "" },

    // Exact passage used as primary context
    excerpt: { type: String, default: "" },

    // Phrase to highlight inside the excerpt
    highlight: { type: String, default: "" },

    // ── All retrieved chunks (up to 5) ───────────────────────
    chunks: {
      type: [retrievedChunkSchema],
      default: [],
    },
  },
  { timestamps: true }
);

citationSchema.index({ message: 1 });
citationSchema.index({ document: 1 });

module.exports = mongoose.model("Citation", citationSchema);