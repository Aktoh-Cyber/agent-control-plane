/**
 * Centralized Configuration Service
 * Manages all configuration values with environment variable support
 */

import { ConfigSchema } from './types.js';
import { validateConfig } from './validator.js';

export class ConfigService {
  private static instance: ConfigService;
  private config: ConfigSchema;

  private constructor() {
    this.config = this.loadConfig();
    validateConfig(this.config);
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): ConfigSchema {
    return {
      // Embedding Configuration
      embedding: {
        provider: this.getEnv('EMBEDDING_PROVIDER', 'hash') as 'openai' | 'anthropic' | 'hash',
        dimensions: this.getEnvNumber('EMBEDDING_DIMENSIONS', 384),
        model: this.getEnv('EMBEDDING_MODEL', 'text-embedding-ada-002'),
      },

      // PII Scrubbing Configuration
      pii: {
        enabled: this.getEnvBoolean('PII_SCRUBBING_ENABLED', true),
        patterns: {
          email: this.getEnvBoolean('PII_SCRUB_EMAIL', true),
          ssn: this.getEnvBoolean('PII_SCRUB_SSN', true),
          apiKey: this.getEnvBoolean('PII_SCRUB_API_KEY', true),
          creditCard: this.getEnvBoolean('PII_SCRUB_CREDIT_CARD', true),
          phone: this.getEnvBoolean('PII_SCRUB_PHONE', true),
          ipAddress: this.getEnvBoolean('PII_SCRUB_IP_ADDRESS', true),
          bearerToken: this.getEnvBoolean('PII_SCRUB_BEARER_TOKEN', true),
          privateKey: this.getEnvBoolean('PII_SCRUB_PRIVATE_KEY', true),
        },
      },

      // API Configuration
      api: {
        openai: {
          apiKey: this.getEnv('OPENAI_API_KEY', ''),
          baseUrl: this.getEnv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
          timeout: this.getEnvNumber('OPENAI_TIMEOUT', 30000),
          maxRetries: this.getEnvNumber('OPENAI_MAX_RETRIES', 3),
        },
        anthropic: {
          apiKey: this.getEnv('ANTHROPIC_API_KEY', ''),
          baseUrl: this.getEnv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
          timeout: this.getEnvNumber('ANTHROPIC_TIMEOUT', 30000),
          maxRetries: this.getEnvNumber('ANTHROPIC_MAX_RETRIES', 3),
        },
      },

      // Model Configuration
      models: {
        default: this.getEnv('DEFAULT_MODEL', 'hash'),
        embeddings: {
          openai: this.getEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002'),
          anthropic: this.getEnv('ANTHROPIC_EMBEDDING_MODEL', 'claude-3-haiku'),
        },
      },

      // ONNX Configuration
      onnx: {
        enabled: this.getEnvBoolean('ONNX_ENABLED', false),
        modelPath: this.getEnv('ONNX_MODEL_PATH', ''),
        executionProviders: this.getEnvArray('ONNX_EXECUTION_PROVIDERS', ['cpu']),
      },

      // Feature Flags
      features: {
        enableCaching: this.getEnvBoolean('FEATURE_CACHING', true),
        enableMetrics: this.getEnvBoolean('FEATURE_METRICS', true),
        enableLogging: this.getEnvBoolean('FEATURE_LOGGING', true),
        enableDebug: this.getEnvBoolean('FEATURE_DEBUG', false),
      },

      // Performance Configuration
      performance: {
        maxConcurrentRequests: this.getEnvNumber('MAX_CONCURRENT_REQUESTS', 10),
        requestTimeout: this.getEnvNumber('REQUEST_TIMEOUT', 60000),
        cacheSize: this.getEnvNumber('CACHE_SIZE', 1000),
        cacheTTL: this.getEnvNumber('CACHE_TTL', 3600000),
      },

      // Database Configuration
      database: {
        path: this.getEnv('DB_PATH', './data/reasoningbank.db'),
        maxConnections: this.getEnvNumber('DB_MAX_CONNECTIONS', 5),
        timeout: this.getEnvNumber('DB_TIMEOUT', 5000),
      },
    };
  }

  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue;
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  private getEnvArray(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    return value ? value.split(',').map((v) => v.trim()) : defaultValue;
  }

  public get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.config[key];
  }

  public set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.config[key] = value;
    validateConfig(this.config);
  }

  public getAll(): ConfigSchema {
    return { ...this.config };
  }

  public reload(): void {
    this.config = this.loadConfig();
    validateConfig(this.config);
  }
}

// Export singleton instance
export const config = ConfigService.getInstance();

// Export types
export * from './types.js';
