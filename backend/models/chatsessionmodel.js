'use strict';

const mongoose = require("mongoose");

/**
 * ChatSession — one conversation thread tied to a document.
 * A user can have multiple sessions per document.
 */
const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // Display title shown in the sidebar (defaults to document name)
    title: {
      type: String,
      default: "New Chat",
    },

    // Persona active for this session
    persona: {
      type: String,
      enum: ["student", "professional", "legal", "researcher", "general"],
      default: "general",
    },

    // Soft delete — keeps history recoverable
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, document: 1 });
chatSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);