'use strict';

const mongoose = require("mongoose");

/**
 * BBox — bounding box of a chunk's text on a PDF page.
 * Coordinates are in PDF user-space units (points).
 * Used by the frontend to draw a highlight overlay on the rendered page.
 *
 *  x, y        — top-left corner (origin = top-left of page)
 *  width       — horizontal span
 *  height      — vertical span
 */
const bboxSchema = new mongoose.Schema(
  {
    x:      { type: Number, default: 0 },
    y:      { type: Number, default: 0 },
    width:  { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false }
);

const chunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    // ── Position in source text ──────────────────────────────
    startChar: Number,
    endChar:   Number,

    // ── Position in PDF ──────────────────────────────────────
    page: {
      type: Number,
      default: 1,
    },

    /**
     * Bounding box on the PDF page for highlight overlay.
     * Populated during ingestion via pdfjs-dist text-position extraction.
     * null = position not available (gracefully degraded in UI).
     */
    bbox: {
      type: bboxSchema,
      default: null,
    },

    // ── Section / heading context ────────────────────────────
    section: {
      type: String,
      default: "",
    },

    // ── Token / char metadata ────────────────────────────────
    metadata: {
      wordCount:  Number,
      charCount:  Number,
      tokenCount: Number,
    },

    // ── Vector embedding (mirrored from FAISS for reference) ─
    embedding: {
      type: [Number],
      required: false,
    },
  },
  { timestamps: true }
);

// Efficient lookup by document + order
chunkSchema.index({ document: 1, chunkIndex: 1 });
// Efficient lookup by document + page (used by citation panel)
chunkSchema.index({ document: 1, page: 1 });

module.exports = mongoose.model("Chunk", chunkSchema);