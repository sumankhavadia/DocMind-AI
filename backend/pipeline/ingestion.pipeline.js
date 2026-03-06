'use strict';

const { extractTextFromPDF, resolveChunkBBox } = require("../services/pdfTextExtractor.js");
const { cleanText }                             = require("../utils/textCleaner.js");
const { tokenBasedChunking }                    = require("../utils/textChunker.js");
const { generateAndStoreEmbeddings }            = require("../services/embeddingService.js");
const Chunk                                     = require("../models/chunkmodel.js");

/**
 * ingestionPipeline
 *
 * Processes a PDF file end-to-end:
 *   1. Extract page-aware text via pdfjs-dist
 *   2. Clean and normalize text
 *   3. Chunk with page numbers + character offsets
 *   4. Resolve bounding boxes per chunk
 *   5. Generate embeddings and store in FAISS
 *   6. Persist chunks to MongoDB with page + bbox
 *
 * @param {string}   pdfPath    - Path to the uploaded PDF
 * @param {ObjectId} documentId - MongoDB Document _id
 * @param {object}   options
 * @param {number}   options.maxTokens      - Max tokens per chunk (default 400)
 * @param {number}   options.overlapTokens  - Overlap tokens (default 80)
 * @returns {Promise<IngestionResult>}
 *
 * @typedef {Object} IngestionResult
 * @property {string}  rawText     - Raw extracted text
 * @property {string}  cleanedText - Cleaned text
 * @property {Array}   chunks      - Saved MongoDB chunk documents
 * @property {number}  totalPages  - Total PDF page count
 * @property {object}  stats       - Processing statistics
 */
async function ingestionPipeline(pdfPath, documentId, options = {}) {

  // ── Step 1: Extract text with page boundaries ─────────────
  console.log(`[INGESTION] Extracting text from: ${pdfPath}`);
  const { rawText, pages, totalPages } = await extractTextFromPDF(pdfPath);
  console.log(`[INGESTION] Extracted ${rawText.length} chars across ${totalPages} pages`);

  // ── Step 2: Clean text ────────────────────────────────────
  const cleanedText = cleanText(rawText);

  // ── Step 3: Chunk with page awareness ─────────────────────
  const chunks = tokenBasedChunking(
    cleanedText,
    {
      maxTokens:     options.maxTokens     || 400,
      overlapTokens: options.overlapTokens || 80,
    },
    pages  // <-- pass pages so chunker assigns correct page numbers
  );

  console.log(`[INGESTION] Created ${chunks.length} chunks`);

  // ── Step 4: Resolve bounding boxes ───────────────────────
  // Map each chunk's char offsets → PDF page + bbox coordinates
  const chunksWithBBox = chunks.map(chunk => {
    const { page, bbox } = resolveChunkBBox(chunk.startChar, chunk.endChar, pages);
    return { ...chunk, page, bbox };
  });

  // ── Step 5: Generate embeddings and store in FAISS ────────
  const chunkTexts = chunksWithBBox.map(c => c.text);
  const embeddings = await generateAndStoreEmbeddings(chunkTexts, documentId);

  // ── Step 6: Save chunks to MongoDB ───────────────────────
  const savedChunks = await Promise.all(
    chunksWithBBox.map((chunk, index) =>
      Chunk.create({
        document:   documentId,
        text:       chunk.text,
        chunkIndex: chunk.id,
        startChar:  chunk.startChar,
        endChar:    chunk.endChar,
        page:       chunk.page,        // ← real page number
        bbox:       chunk.bbox,        // ← bounding box for highlight overlay
        section:    chunk.section,     // ← detected heading
        embedding:  embeddings[index],
        metadata: {
          tokenCount: chunk.tokenCount,
          charCount:  chunk.text.length,
          wordCount:  chunk.text.split(/\s+/).length,
        },
      })
    )
  );

  // ── Stats ──────────────────────────────────────────────────
  const totalTokens = chunks.reduce((sum, c) => sum + (c.tokenCount || 0), 0);
  const avgTokens   = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;

  return {
    rawText,
    cleanedText,
    chunks:     savedChunks,
    totalPages,                        // ← returned so uploadController can save it
    stats: {
      rawLength:        rawText.length,
      cleanedLength:    cleanedText.length,
      chunkCount:       savedChunks.length,
      totalPages,
      totalTokens,
      avgTokensPerChunk: avgTokens,
    },
  };
}

module.exports = ingestionPipeline;