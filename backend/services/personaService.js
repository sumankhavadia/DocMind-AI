'use strict';

/**
 * @fileoverview Persona-aware prompt system for DocMind AI.
 *
 * Builds LLM system prompts tailored to a user's role and the document type,
 * so every response matches the expertise level and focus area of the reader.
 *
 * Usage:
 *   const { buildSystemPrompt } = require('./personaPrompts');
 *   const prompt = buildSystemPrompt('research_paper', 'researcher');
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'student' | 'professional' | 'legal' | 'researcher' | 'general'} Persona
 * @typedef {string} DocType  e.g. 'research_paper', 'financial_report', 'contract'
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Persona} */
const DEFAULT_PERSONA = 'general';

/** @type {string} */
const DEFAULT_DOC_TYPE = 'document';

/**
 * Core behavioral rules applied to every persona.
 * Keeps per-persona blocks focused on tone & emphasis, not safety rules.
 */
const GROUNDING_RULES = `
CRITICAL RULES — always follow these regardless of persona:
- Answer ONLY from the document provided. Never fabricate information.
- If the answer is not in the document, respond: "This information is not available in the document."
- When quoting or paraphrasing the document, include the section or page reference if visible.
- Keep responses focused and free of unnecessary filler.
- If the question is ambiguous, ask one clarifying question before answering.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// Persona Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each persona defines:
 *   - role:        one-line description of who the reader is
 *   - tone:        communication style directive
 *   - focus:       what to prioritize in answers
 *   - instructions: bullet-point behavioral rules
 *   - outputHints: preferred formatting / structure guidance
 *
 * @type {Record<Persona, object>}
 */
const PERSONA_CONFIGS = {
  student: {
    role: 'You are explaining this document to a student who is new to the subject.',
    tone: 'Use clear, simple language. Avoid jargon unless you define it immediately.',
    focus: 'Understanding core concepts and the reasoning behind them.',
    instructions: [
      'Break complex ideas into smaller, digestible steps.',
      'Use analogies or everyday examples to ground abstract concepts.',
      'Explain the "why" — not just what something is, but why it matters.',
      'Define technical terms the first time they appear.',
      'End with 1–2 follow-up questions the student could explore next.',
    ],
    outputHints: 'Structure answers with short paragraphs. Use numbered steps for processes.',
  },

  professional: {
    role: 'You are supporting a business professional who needs fast, decision-ready insights.',
    tone: 'Be concise, direct, and confident. Avoid academic hedging.',
    focus: 'Strategic implications, risks, opportunities, and clear action items.',
    instructions: [
      'Lead with the most important takeaway (inverted-pyramid style).',
      'Identify key risks, opportunities, and recommended actions explicitly.',
      'Quantify claims wherever the document provides data or metrics.',
      'Flag any assumptions or gaps that could affect decision-making.',
      'Keep answers scannable — use short bullets for lists of more than three items.',
    ],
    outputHints: 'Use bullet points for lists. Bold key terms. Limit prose paragraphs to 3 sentences.',
  },

  legal: {
    role: 'You are assisting a legal professional conducting a document review.',
    tone: 'Be precise and cautious. Flag ambiguity; never speculate on legal outcomes.',
    focus: 'Obligations, rights, liabilities, defined terms, and enforceable clauses.',
    instructions: [
      'Identify and quote relevant clauses verbatim before interpreting them.',
      'Flag any ambiguous, missing, or potentially unenforceable provisions.',
      'Distinguish clearly between defined terms and general language.',
      'Note jurisdiction-specific language if present.',
      'Always add: "This analysis is for informational purposes only and does not constitute legal advice."',
    ],
    outputHints: 'Reference clause numbers or section headings directly. Use quotation marks for exact document language.',
  },

  researcher: {
    role: 'You are supporting an academic researcher conducting a deep analysis.',
    tone: 'Be thorough, rigorous, and intellectually precise. Embrace appropriate nuance.',
    focus: 'Methodology, findings, evidence quality, limitations, and theoretical implications.',
    instructions: [
      'Cite specific sections, figures, or tables when referencing evidence.',
      'Evaluate the strength and quality of evidence or arguments presented.',
      'Identify stated and unstated assumptions in the document.',
      'Highlight gaps, contradictions, or areas of uncertainty.',
      'Connect findings to broader implications or suggest related areas to investigate.',
    ],
    outputHints: 'Use structured headings for multi-part answers. Include a brief "Limitations" note where relevant.',
  },

  general: {
    role: 'You are a helpful, knowledgeable assistant helping someone understand this document.',
    tone: 'Be clear, friendly, and accessible. Match the complexity of your answer to the question.',
    focus: 'The most important and directly relevant information from the document.',
    instructions: [
      'Answer the question directly, then provide supporting context.',
      'Avoid unnecessary technical jargon unless the question calls for it.',
      'Highlight the most important points without overwhelming the reader.',
      'If multiple interpretations are possible, briefly present them.',
      'Keep responses appropriately concise — expand only when depth is needed.',
    ],
    outputHints: 'Prefer short paragraphs. Use bullets only when listing three or more distinct items.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a persona config into a coherent prompt block.
 *
 * @param {object} config - A PERSONA_CONFIGS entry
 * @returns {string}
 */
function formatPersonaBlock(config) {
  const bullets = config.instructions.map(line => `  - ${line}`).join('\n');
  return [
    `ROLE: ${config.role}`,
    `TONE: ${config.tone}`,
    `FOCUS: ${config.focus}`,
    `INSTRUCTIONS:\n${bullets}`,
    `OUTPUT FORMAT: ${config.outputHints}`,
  ].join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a complete, persona-aware system prompt for the LLM.
 *
 * @param {DocType} docType  - The classified document type.
 * @param {Persona} [persona=DEFAULT_PERSONA] - The user's selected persona.
 * @returns {string} A fully composed system prompt ready to pass to the LLM.
 *
 * @example
 * const prompt = buildSystemPrompt('financial_report', 'professional');
 */
function buildSystemPrompt(docType = DEFAULT_DOC_TYPE, persona = DEFAULT_PERSONA) {
  const resolvedPersona = PERSONA_CONFIGS[persona] ? persona : DEFAULT_PERSONA;

  if (persona !== resolvedPersona) {
    console.warn(`[personaPrompts] Unknown persona "${persona}". Falling back to "${DEFAULT_PERSONA}".`);
  }

  const config = PERSONA_CONFIGS[resolvedPersona];

  const sections = [
    `You are an AI document assistant analyzing a ${docType}.`,
    formatPersonaBlock(config),
    GROUNDING_RULES,
  ];

  return sections.join('\n\n' + '─'.repeat(60) + '\n\n');
}

/**
 * Returns the list of valid persona identifiers.
 *
 * @returns {Persona[]}
 */
function getSupportedPersonas() {
  return Object.keys(PERSONA_CONFIGS);
}

/**
 * Validates whether a given persona string is supported.
 *
 * @param {string} persona
 * @returns {boolean}
 */
function isValidPersona(persona) {
  return Object.prototype.hasOwnProperty.call(PERSONA_CONFIGS, persona);
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildSystemPrompt,
  getSupportedPersonas,
  isValidPersona,
  PERSONA_CONFIGS,   // exported for testing and introspection
  DEFAULT_PERSONA,
};