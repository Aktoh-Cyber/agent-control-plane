/**
 * Configuration Validator
 * Validates configuration values and throws errors for invalid configurations
 */

import { ConfigSchema } from './types.js';

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function validateConfig(config: ConfigSchema): void {
  // Validate embedding configuration
  if (!['openai', 'anthropic', 'hash'].includes(config.embedding.provider)) {
    throw new ConfigValidationError(
      `Invalid embedding provider: ${config.embedding.provider}. Must be 'openai', 'anthropic', or 'hash'.`
    );
  }

  if (config.embedding.dimensions <= 0) {
    throw new ConfigValidationError(
      `Invalid embedding dimensions: ${config.embedding.dimensions}. Must be greater than 0.`
    );
  }

  // Validate API configuration
  if (config.embedding.provider === 'openai' && !config.api.openai.apiKey) {
    console.warn(
      'OpenAI provider selected but no API key provided. Set OPENAI_API_KEY environment variable.'
    );
  }

  if (config.embedding.provider === 'anthropic' && !config.api.anthropic.apiKey) {
    console.warn(
      'Anthropic provider selected but no API key provided. Set ANTHROPIC_API_KEY environment variable.'
    );
  }

  // Validate timeouts
  if (config.api.openai.timeout <= 0) {
    throw new ConfigValidationError(
      `Invalid OpenAI timeout: ${config.api.openai.timeout}. Must be greater than 0.`
    );
  }

  if (config.api.anthropic.timeout <= 0) {
    throw new ConfigValidationError(
      `Invalid Anthropic timeout: ${config.api.anthropic.timeout}. Must be greater than 0.`
    );
  }

  // Validate performance configuration
  if (config.performance.maxConcurrentRequests <= 0) {
    throw new ConfigValidationError(
      `Invalid max concurrent requests: ${config.performance.maxConcurrentRequests}. Must be greater than 0.`
    );
  }

  if (config.performance.requestTimeout <= 0) {
    throw new ConfigValidationError(
      `Invalid request timeout: ${config.performance.requestTimeout}. Must be greater than 0.`
    );
  }

  if (config.performance.cacheSize < 0) {
    throw new ConfigValidationError(
      `Invalid cache size: ${config.performance.cacheSize}. Must be non-negative.`
    );
  }

  // Validate ONNX configuration
  if (config.onnx.enabled && !config.onnx.modelPath) {
    throw new ConfigValidationError(
      'ONNX is enabled but no model path provided. Set ONNX_MODEL_PATH environment variable.'
    );
  }

  // Validate database configuration
  if (config.database.maxConnections <= 0) {
    throw new ConfigValidationError(
      `Invalid max database connections: ${config.database.maxConnections}. Must be greater than 0.`
    );
  }

  if (config.database.timeout <= 0) {
    throw new ConfigValidationError(
      `Invalid database timeout: ${config.database.timeout}. Must be greater than 0.`
    );
  }
}
