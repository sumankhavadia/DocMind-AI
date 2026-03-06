'use strict';

/**
 * textChunker.js
 *
 * Token-based text chunker that preserves character offsets and page numbers.
 * Works in two modes:
 *
 *   1. Legacy mode  — pass plain text string → chunks have no page info (backward compat)
 *   2. Page mode    — pass pages array from extractTextFromPDF → chunks have page + startChar/endChar
 *
 * Usage:
 *   const { tokenBasedChunking } = require('./textChunker');
 *
 *   // Page-aware (recommended):
 *   const chunks = tokenBasedChunking(cleanedText, { maxTokens: 400, overlapTokens: 80 }, pages);
 *
 *   // Legacy (backward compat):
 *   const chunks = tokenBasedChunking(cleanedText, { maxTokens: 400, overlapTokens: 80 });
 */

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Rough token estimator — 1 token ≈ 4 chars (English). */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/** Split text into paragraphs on blank lines. */
function splitIntoParagraphs(text) {
  return text.split(/\n\s*\n/).filter(p => p.trim());
}

/**
 * Given a character offset in rawText and the pages array,
 * returns the 1-based page number that contains that offset.
 *
 * @param {number}   charPos
 * @param {Array}    pages    - from extractTextFromPDF (may be undefined)
 * @returns {number}
 */
function resolvePageNumber(charPos, pages) {
  if (!pages || !pages.length) return 1;

  for (const p of pages) {
    if (charPos >= p.charStart && charPos < p.charEnd) return p.page;
  }

  // charPos past last page → assign last page
  return pages[pages.length - 1].page;
}

/**
 * Detect a section heading from the beginning of a text block.
 * Returns empty string if no heading detected.
 *
 * @param {string} text
 * @returns {string}
 */
function detectSection(text) {
  const trimmed = text.trimStart();

  // Numbered heading: "3.2 Results" / "Section 4 — Discussion"
  const numbered = trimmed.match(/^(\d+(\.\d+)*\.?\s+[A-Z][^\n]{3,60})/);
  if (numbered) return numbered[1].trim();

  // ALL CAPS heading under 80 chars on its own line
  const capsLine = trimmed.match(/^([A-Z][A-Z\s]{4,78})\n/);
  if (capsLine) return capsLine[1].trim();

  return "";
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

/**
 * tokenBasedChunking
 *
 * @param {string}  text            - Full document text (cleaned)
 * @param {object}  opts
 * @param {number}  opts.maxTokens      - Max tokens per chunk (default 400)
 * @param {number}  opts.overlapTokens  - Overlap tokens between chunks (default 80)
 * @param {Array}   [pages]         - Page array from extractTextFromPDF (optional)
 * @returns {ChunkOutput[]}
 *
 * @typedef {Object} ChunkOutput
 * @property {number} id          - 0-based chunk index
 * @property {string} text        - Chunk text content
 * @property {number} tokenCount  - Estimated token count
 * @property {number} startChar   - Start offset in full document text
 * @property {number} endChar     - End offset in full document text
 * @property {number} page        - 1-based page number (1 if pages not provided)
 * @property {string} section     - Detected section heading (empty string if none)
 */
function tokenBasedChunking(text, opts = {}, pages = null) {
  const {
    maxTokens    = 400,
    overlapTokens = 80,
  } = opts;

  const paragraphs  = splitIntoParagraphs(text);
  const chunks      = [];

  let currentChunk  = "";
  let currentTokens = 0;
  let chunkIndex    = 0;

  // Track character position in the full text
  let globalCharPos = 0;

  // Running start position for current chunk
  let chunkStartChar = 0;

  // ── Helper: flush current buffer as a chunk ───────────────
  const flushChunk = () => {
    if (!currentChunk.trim()) return;

    const chunkText = currentChunk.trim();
    const startChar = chunkStartChar;
    const endChar   = startChar + chunkText.length;

    chunks.push({
      id:         chunkIndex++,
      text:       chunkText,
      tokenCount: currentTokens,
      startChar,
      endChar,
      page:       resolvePageNumber(startChar + Math.floor(chunkText.length / 2), pages),
      section:    detectSection(chunkText),
    });
  };

  // ── Helper: apply overlap after flush ────────────────────
  const applyOverlap = () => {
    const overlapChars = Math.min(overlapTokens * 4, currentChunk.length);
    const overlapText  = currentChunk.slice(-overlapChars);
    currentChunk       = overlapText;
    currentTokens      = estimateTokens(overlapText);
    // New chunk starts at the overlap's position
    chunkStartChar     = globalCharPos - overlapChars;
  };

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    // ── Oversized paragraph → split by sentence ─────────────
    if (paraTokens > maxTokens) {
      const sentences = para.split(/(?<=[.!?])\s+/).filter(s => s.trim());

      for (const sentence of sentences) {
        const sentTokens = estimateTokens(sentence);

        // Single sentence too large → flush current + save sentence alone
        if (sentTokens > maxTokens) {
          if (currentChunk.trim()) {
            flushChunk();
            applyOverlap();
          }

          const startChar = globalCharPos;
          chunks.push({
            id:         chunkIndex++,
            text:       sentence.trim(),
            tokenCount: sentTokens,
            startChar,
            endChar:    startChar + sentence.length,
            page:       resolvePageNumber(startChar, pages),
            section:    detectSection(sentence),
          });

          globalCharPos  += sentence.length + 1;
          currentChunk    = "";
          currentTokens   = 0;
          chunkStartChar  = globalCharPos;
          continue;
        }

        if (currentTokens + sentTokens > maxTokens) {
          flushChunk();
          applyOverlap();
        }

        if (!currentChunk) chunkStartChar = globalCharPos;
        currentChunk  += (currentChunk ? " " : "") + sentence;
        currentTokens += sentTokens;
        globalCharPos += sentence.length + 1;
      }
    }
    // ── Normal paragraph ─────────────────────────────────────
    else {
      if (currentTokens + paraTokens > maxTokens) {
        flushChunk();
        applyOverlap();
      }

      if (!currentChunk) chunkStartChar = globalCharPos;
      currentChunk  += (currentChunk ? "\n\n" : "") + para;
      currentTokens += paraTokens;
      globalCharPos += para.length + 2; // +2 for \n\n
    }
  }

  // Flush the last remaining buffer
  flushChunk();

  return chunks;
}

module.exports = { tokenBasedChunking, resolvePageNumber, detectSection };