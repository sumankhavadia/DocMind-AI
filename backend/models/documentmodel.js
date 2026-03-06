'use strict';

const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    originalName: String,
    fileName:     String,
    filePath:     String,
    size:         Number,
    mimeType:     String,
    textFilePath: String,

    // ── Chunk stats ──────────────────────────────────────────
    chunkCount: {
      type: Number,
      default: 0,
    },

    // ── PDF structure ────────────────────────────────────────
    totalPages: {
      type: Number,
      default: 1,
    },

    // ── Classification ───────────────────────────────────────
    docType: {
      type: String,
      enum: ["class_notes", "research_paper", "sales_report", "legal_contract", "code", "general"],
      default: "general",
    },
    classificationConfidence: {
      type: Number,
      default: 0.0,
    },

    // ── Persona (kept in sync with UI personas) ──────────────
    userPersona: {
      type: String,
      enum: ["student", "professional", "legal", "researcher", "general"],
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);