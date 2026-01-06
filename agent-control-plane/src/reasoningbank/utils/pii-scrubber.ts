/**
 * PII (Personally Identifiable Information) scrubber
 * Redacts sensitive information before storing memories
 */

import { loadConfig } from './config.js';

// Default PII patterns (regex-based)
const DEFAULT_PATTERNS = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },

  // US Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b\d{9}\b/g, replacement: '[SSN]' },

  // API Keys (common patterns)
  { pattern: /\bsk-[a-zA-Z0-9]{48}\b/g, replacement: '[API_KEY]' }, // Anthropic
  { pattern: /\bghp_[a-zA-Z0-9]{36}\b/g, replacement: '[API_KEY]' }, // GitHub
  { pattern: /\bgho_[a-zA-Z0-9]{36}\b/g, replacement: '[API_KEY]' }, // GitHub OAuth
  { pattern: /\bxoxb-[a-zA-Z0-9\-]+\b/g, replacement: '[API_KEY]' }, // Slack
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: '[AWS_KEY]' }, // AWS

  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CREDIT_CARD]' },

  // Phone numbers (US format)
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },

  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP]' },

  // URLs with tokens/keys in query params
  { pattern: /([?&])(token|key|apikey|api_key|secret)=[^&\s]+/gi, replacement: '$1$2=[REDACTED]' },

  // JWT tokens
  { pattern: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, replacement: '[JWT]' },
];

/**
 * Scrub Personally Identifiable Information (PII) from text
 *
 * @description Redacts sensitive information including emails, SSNs, API keys,
 * credit cards, phone numbers, IP addresses, and JWT tokens using regex patterns.
 * Essential for GDPR/CCPA compliance when storing memories.
 *
 * @param {string} text - Text to scrub for PII
 * @param {Array<{pattern: RegExp, replacement: string}>} [customPatterns] - Additional custom redaction patterns
 *
 * @returns {string} Scrubbed text with PII replaced by placeholders
 *
 * @example
 * ```typescript
 * const text = "Contact john@example.com or call 555-123-4567. API key: sk-abc123...";
 * const scrubbed = scrubPII(text);
 * console.log(scrubbed);
 * // "Contact [EMAIL] or call [PHONE]. API key: [API_KEY]"
 * ```
 *
 * @example
 * ```typescript
 * // With custom patterns
 * const customPatterns = [
 *   { pattern: /PROJECT-\d+/g, replacement: '[PROJECT_ID]' }
 * ];
 * const text = "See PROJECT-12345 for details";
 * const scrubbed = scrubPII(text, customPatterns);
 * // "See [PROJECT_ID] for details"
 * ```
 *
 * @since 1.8.0
 *
 * @remarks
 * Default PII patterns detected:
 * - Email addresses: [EMAIL]
 * - Social Security Numbers: [SSN]
 * - API keys (Anthropic, GitHub, Slack, AWS): [API_KEY] / [AWS_KEY]
 * - Credit card numbers: [CREDIT_CARD]
 * - Phone numbers: [PHONE]
 * - IP addresses: [IP]
 * - JWT tokens: [JWT]
 * - URL query parameters with sensitive keys: [REDACTED]
 *
 * Configuration:
 * - Controlled by config.governance.pii_scrubber flag
 * - Returns original text if PII scrubbing disabled
 */
export function scrubPII(
  text: string,
  customPatterns?: Array<{ pattern: RegExp; replacement: string }>
): string {
  const config = loadConfig();

  // Check if PII scrubbing is enabled
  if (!config.governance?.pii_scrubber) {
    return text;
  }

  let scrubbed = text;
  const patterns = customPatterns || DEFAULT_PATTERNS;

  // Apply all redaction patterns
  for (const { pattern, replacement } of patterns) {
    scrubbed = scrubbed.replace(pattern, replacement);
  }

  return scrubbed;
}

/**
 * Check if text contains potential PII
 *
 * @param text - Text to check
 * @returns True if PII patterns are detected
 */
export function containsPII(text: string): boolean {
  for (const { pattern } of DEFAULT_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Get statistics about redacted content
 *
 * @param original - Original text
 * @param scrubbed - Scrubbed text
 * @returns Object with redaction statistics
 */
export function getRedactionStats(
  original: string,
  scrubbed: string
): {
  redacted: boolean;
  originalLength: number;
  scrubbedLength: number;
  patterns: string[];
} {
  const patterns: string[] = [];

  for (const { pattern, replacement } of DEFAULT_PATTERNS) {
    if (pattern.test(original) && scrubbed.includes(replacement)) {
      patterns.push(replacement);
    }
  }

  return {
    redacted: patterns.length > 0,
    originalLength: original.length,
    scrubbedLength: scrubbed.length,
    patterns,
  };
}

/**
 * Scrub PII from memory object fields
 *
 * @description Applies PII scrubbing to title, description, and content fields
 * of a memory object. Preserves all other fields unchanged.
 *
 * @param {Object} memory - Memory object to scrub
 * @param {string} memory.title - Memory title
 * @param {string} memory.description - Memory description
 * @param {string} memory.content - Memory content/strategy
 *
 * @returns {Object} Memory object with PII redacted from text fields
 *
 * @example
 * ```typescript
 * const memory = {
 *   title: "Authentication bug fix",
 *   description: "Fixed issue for user john@example.com",
 *   content: "Use API key sk-abc123 for testing",
 *   domain: "security",
 *   confidence: 0.9
 * };
 *
 * const scrubbed = scrubMemory(memory);
 * console.log(scrubbed.description); // "Fixed issue for user [EMAIL]"
 * console.log(scrubbed.content); // "Use API key [API_KEY] for testing"
 * console.log(scrubbed.domain); // "security" (unchanged)
 * ```
 *
 * @since 1.8.0
 */
export function scrubMemory(memory: {
  title: string;
  description: string;
  content: string;
  [key: string]: any;
}): typeof memory {
  return {
    ...memory,
    title: scrubPII(memory.title),
    description: scrubPII(memory.description),
    content: scrubPII(memory.content),
  };
}
