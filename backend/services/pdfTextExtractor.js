'use strict';

const fs   = require("fs");
const path = require("path");

/**
 * extractTextFromPDF
 *
 * Extracts text from a PDF file page-by-page using pdfjs-dist.
 * Returns both a flat raw string (for backward compatibility) and
 * a structured page array used by the ingestion pipeline to assign
 * page numbers and bounding boxes to chunks.
 *
 * Install dependency:
 *   npm install pdfjs-dist
 *
 * @param {string} filePath - Absolute or relative path to the PDF file
 * @returns {Promise<PageAwareResult>}
 *
 * @typedef {Object} PageItem
 * @property {number} page       - 1-based page number
 * @property {string} text       - Raw text content of the page
 * @property {number} charStart  - Cumulative char offset where this page starts in rawText
 * @property {number} charEnd    - Cumulative char offset where this page ends in rawText
 * @property {TextItem[]} items  - Raw pdfjs text items (with position data for bbox)
 *
 * @typedef {Object} TextItem
 * @property {string} str        - The text string
 * @property {number[]} transform - PDF transform matrix [scaleX, skewX, skewY, scaleY, x, y]
 * @property {number} width
 * @property {number} height
 *
 * @typedef {Object} PageAwareResult
 * @property {string}     rawText    - Full document text as a single string
 * @property {PageItem[]} pages      - Per-page breakdown with position metadata
 * @property {number}     totalPages - Total page count
 */
async function extractTextFromPDF(filePath) {
  // Lazy-load pdfjs-dist to keep startup fast
  let pdfjsLib;
  try {
    pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
  } catch (err) {
    const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib = pdfjsModule.default || pdfjsModule;
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF file not found: ${absolutePath}`);
  }

  const data       = new Uint8Array(fs.readFileSync(absolutePath));
  const loadingTask = pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdfDoc     = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const pages      = [];
  let   rawText    = "";
  let   charOffset = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page        = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Build page text + collect raw items for bbox extraction later
    let pageText = "";
    const items  = [];

    for (const item of textContent.items) {
      if (!item.str) continue;

      // Preserve line breaks: if item has a significant Y jump, add newline
      pageText += item.str;
      if (item.hasEOL) pageText += "\n";

      items.push({
        str:       item.str,
        transform: item.transform,   // [scaleX, skewX, skewY, scaleY, x, y]
        width:     item.width,
        height:    item.height,
      });
    }

    pageText += "\n"; // separator between pages

    const charStart = charOffset;
    const charEnd   = charOffset + pageText.length;

    pages.push({
      page:      pageNum,
      text:      pageText,
      charStart,
      charEnd,
      items,     // raw items kept for bbox resolution in chunker
    });

    rawText      += pageText;
    charOffset   += pageText.length;
  }

  return { rawText, pages, totalPages };
}

/**
 * resolveChunkBBox
 *
 * Given a chunk's character offsets within rawText and the pages array,
 * finds which page the chunk primarily lives on and computes a
 * bounding box by scanning the page's text items.
 *
 * Called from ingestion.pipeline.js after chunking.
 *
 * @param {number}     startChar - chunk.startChar in rawText
 * @param {number}     endChar   - chunk.endChar in rawText
 * @param {PageItem[]} pages     - from extractTextFromPDF()
 * @returns {{ page: number, bbox: { x, y, width, height } }}
 */
function resolveChunkBBox(startChar, endChar, pages) {
  // Find the page where the majority of the chunk lives
  const midChar    = (startChar + endChar) / 2;
  const targetPage = pages.find(p => midChar >= p.charStart && midChar < p.charEnd)
                     || pages[0];

  if (!targetPage || !targetPage.items.length) {
    return { page: targetPage?.page || 1, bbox: { x: 0, y: 0, width: 0, height: 0 } };
  }

  // Use a subset of items around the target character position
  const itemCount = targetPage.items.length;
  const avgItemsPerChunk = Math.max(2, Math.ceil(itemCount / 20)); // Use ~5% of items per chunk
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let matched = false;

  // Only scan first few items (typically one line or paragraph)
  const itemsToScan = Math.min(avgItemsPerChunk, targetPage.items.length);
  
  for (let i = 0; i < itemsToScan; i++) {
    const item = targetPage.items[i];
    if (!item) continue;

    // transform = [scaleX, skewX, skewY, scaleY, x, y]
    const [scaleX, , , scaleY, x, y] = item.transform;
    const itemWidth  = Math.abs(scaleX) || item.width || 8;   
    const itemHeight = Math.abs(scaleY) || item.height || 12;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + itemWidth);
    maxY = Math.max(maxY, y + itemHeight);
    matched = true;
  }

  if (!matched) {
    // Fallback: use first item's position
    const first = targetPage.items[0];
    if (first) {
      const [scaleX, , , scaleY, x, y] = first.transform;
      return {
        page: targetPage.page,
        bbox: { x: Math.round(x), y: Math.round(y), width: Math.round(Math.abs(scaleX) || 12), height: Math.round(Math.abs(scaleY) || 12) },
      };
    }
    return { page: targetPage.page, bbox: { x: 0, y: 0, width: 0, height: 0 } };
  }

  return {
    page: targetPage.page,
    bbox: {
      x:      Math.round(minX),
      y:      Math.round(minY),
      width:  Math.round(maxX - minX),
      height: Math.round(maxY - minY),
    },
  };
}

module.exports = { extractTextFromPDF, resolveChunkBBox };