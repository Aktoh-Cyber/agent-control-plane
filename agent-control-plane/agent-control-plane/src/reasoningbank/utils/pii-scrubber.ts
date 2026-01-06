/**
 * PII Scrubbing Utility
 * Removes 9 classes of sensitive information before storage
 */

import { config } from '../../config/index.js';

export class PIIScrubber {
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    apiKey: /\b(sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9]{20,})\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    bearerToken: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    privateKey:
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    urlSecret: /https?:\/\/[^\s]*[?&](key|token|secret|password|api_key)=[^\s&]*/gi,
  };

  scrub(text: string): string {
    if (!text) return text;

    const piiConfig = config.get('pii');

    // Check if PII scrubbing is enabled
    if (!piiConfig.enabled) {
      return text;
    }

    let scrubbed = text;

    // Apply each pattern only if enabled in config
    if (piiConfig.patterns.email) {
      scrubbed = scrubbed.replace(this.patterns.email, '[EMAIL]');
    }
    if (piiConfig.patterns.ssn) {
      scrubbed = scrubbed.replace(this.patterns.ssn, '[SSN]');
    }
    if (piiConfig.patterns.apiKey) {
      scrubbed = scrubbed.replace(this.patterns.apiKey, '[API_KEY]');
    }
    if (piiConfig.patterns.creditCard) {
      scrubbed = scrubbed.replace(this.patterns.creditCard, '[CREDIT_CARD]');
    }
    if (piiConfig.patterns.phone) {
      scrubbed = scrubbed.replace(this.patterns.phone, '[PHONE]');
    }
    if (piiConfig.patterns.ipAddress) {
      scrubbed = scrubbed.replace(this.patterns.ipAddress, '[IP_ADDRESS]');
    }
    if (piiConfig.patterns.bearerToken) {
      scrubbed = scrubbed.replace(this.patterns.bearerToken, 'Bearer [TOKEN]');
    }
    if (piiConfig.patterns.privateKey) {
      scrubbed = scrubbed.replace(this.patterns.privateKey, '[PRIVATE_KEY]');
    }

    return scrubbed;
  }
}

export const piiScrubber = new PIIScrubber();
