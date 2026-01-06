/**
 * Configuration Type Definitions
 */

export interface EmbeddingConfig {
  provider: 'openai' | 'anthropic' | 'hash';
  dimensions: number;
  model: string;
}

export interface PIIConfig {
  enabled: boolean;
  patterns: {
    email: boolean;
    ssn: boolean;
    apiKey: boolean;
    creditCard: boolean;
    phone: boolean;
    ipAddress: boolean;
    bearerToken: boolean;
    privateKey: boolean;
  };
}

export interface APIConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export interface ModelConfig {
  default: string;
  embeddings: {
    openai: string;
    anthropic: string;
  };
}

export interface ONNXConfig {
  enabled: boolean;
  modelPath: string;
  executionProviders: string[];
}

export interface FeatureFlagsConfig {
  enableCaching: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  enableDebug: boolean;
}

export interface PerformanceConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  cacheSize: number;
  cacheTTL: number;
}

export interface DatabaseConfig {
  path: string;
  maxConnections: number;
  timeout: number;
}

export interface ConfigSchema {
  embedding: EmbeddingConfig;
  pii: PIIConfig;
  api: {
    openai: APIConfig;
    anthropic: APIConfig;
  };
  models: ModelConfig;
  onnx: ONNXConfig;
  features: FeatureFlagsConfig;
  performance: PerformanceConfig;
  database: DatabaseConfig;
}

export interface ConfigOptions {
  provider?: 'openai' | 'anthropic' | 'hash';
  apiKey?: string;
  model?: string;
}
