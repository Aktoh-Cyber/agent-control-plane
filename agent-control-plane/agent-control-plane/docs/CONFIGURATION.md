# Configuration Management

This document describes the centralized configuration system for managing all application settings.

## Overview

The configuration service provides a centralized, type-safe way to manage all application settings with environment variable support. All configuration is validated at startup to catch errors early.

## Quick Start

1. Copy the example environment file:

```bash
cp src/config/.env.example .env
```

2. Configure your settings in `.env`

3. Use the config service in your code:

```typescript
import { config } from './config/index.js';

// Get specific configuration
const embeddingConfig = config.get('embedding');
console.log(embeddingConfig.provider); // 'hash'

// Get all configuration
const allConfig = config.getAll();
```

## Configuration Categories

### Embedding Configuration

Controls how text embeddings are generated.

**Environment Variables:**

- `EMBEDDING_PROVIDER` - Provider to use (openai, anthropic, hash)
- `EMBEDDING_DIMENSIONS` - Vector dimensions (default: 384)
- `EMBEDDING_MODEL` - Model name (default: text-embedding-ada-002)

**Usage:**

```typescript
const embeddingConfig = config.get('embedding');
console.log(embeddingConfig.provider); // 'hash'
console.log(embeddingConfig.dimensions); // 384
console.log(embeddingConfig.model); // 'text-embedding-ada-002'
```

### PII Scrubbing Configuration

Controls which types of Personally Identifiable Information are scrubbed.

**Environment Variables:**

- `PII_SCRUBBING_ENABLED` - Enable/disable PII scrubbing (default: true)
- `PII_SCRUB_EMAIL` - Scrub email addresses (default: true)
- `PII_SCRUB_SSN` - Scrub Social Security Numbers (default: true)
- `PII_SCRUB_API_KEY` - Scrub API keys (default: true)
- `PII_SCRUB_CREDIT_CARD` - Scrub credit card numbers (default: true)
- `PII_SCRUB_PHONE` - Scrub phone numbers (default: true)
- `PII_SCRUB_IP_ADDRESS` - Scrub IP addresses (default: true)
- `PII_SCRUB_BEARER_TOKEN` - Scrub bearer tokens (default: true)
- `PII_SCRUB_PRIVATE_KEY` - Scrub private keys (default: true)

**Usage:**

```typescript
const piiConfig = config.get('pii');
if (piiConfig.enabled) {
  // PII scrubbing is enabled
}
```

### API Configuration

Configures external API integrations.

**OpenAI Environment Variables:**

- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_BASE_URL` - API base URL (default: https://api.openai.com/v1)
- `OPENAI_TIMEOUT` - Request timeout in ms (default: 30000)
- `OPENAI_MAX_RETRIES` - Maximum retry attempts (default: 3)

**Anthropic Environment Variables:**

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `ANTHROPIC_BASE_URL` - API base URL (default: https://api.anthropic.com)
- `ANTHROPIC_TIMEOUT` - Request timeout in ms (default: 30000)
- `ANTHROPIC_MAX_RETRIES` - Maximum retry attempts (default: 3)

**Usage:**

```typescript
const apiConfig = config.get('api');
const openaiKey = apiConfig.openai.apiKey;
const anthropicTimeout = apiConfig.anthropic.timeout;
```

### Model Configuration

Specifies which models to use for different tasks.

**Environment Variables:**

- `DEFAULT_MODEL` - Default model (default: hash)
- `OPENAI_EMBEDDING_MODEL` - OpenAI embedding model (default: text-embedding-ada-002)
- `ANTHROPIC_EMBEDDING_MODEL` - Anthropic embedding model (default: claude-3-haiku)

**Usage:**

```typescript
const modelConfig = config.get('models');
const defaultModel = modelConfig.default;
const openaiEmbeddingModel = modelConfig.embeddings.openai;
```

### ONNX Configuration

Controls ONNX runtime settings for local model inference.

**Environment Variables:**

- `ONNX_ENABLED` - Enable ONNX runtime (default: false)
- `ONNX_MODEL_PATH` - Path to ONNX model file
- `ONNX_EXECUTION_PROVIDERS` - Comma-separated providers (default: cpu)

**Usage:**

```typescript
const onnxConfig = config.get('onnx');
if (onnxConfig.enabled) {
  const modelPath = onnxConfig.modelPath;
  const providers = onnxConfig.executionProviders;
}
```

### Feature Flags

Enable or disable specific features.

**Environment Variables:**

- `FEATURE_CACHING` - Enable result caching (default: true)
- `FEATURE_METRICS` - Enable metrics collection (default: true)
- `FEATURE_LOGGING` - Enable logging (default: true)
- `FEATURE_DEBUG` - Enable debug mode (default: false)

**Usage:**

```typescript
const features = config.get('features');
if (features.enableCaching) {
  // Use caching
}
```

### Performance Configuration

Controls performance-related settings.

**Environment Variables:**

- `MAX_CONCURRENT_REQUESTS` - Max concurrent API requests (default: 10)
- `REQUEST_TIMEOUT` - Global request timeout in ms (default: 60000)
- `CACHE_SIZE` - Maximum cache entries (default: 1000)
- `CACHE_TTL` - Cache time-to-live in ms (default: 3600000)

**Usage:**

```typescript
const perfConfig = config.get('performance');
const maxConcurrent = perfConfig.maxConcurrentRequests;
const timeout = perfConfig.requestTimeout;
```

### Database Configuration

Configures database connection settings.

**Environment Variables:**

- `DB_PATH` - Database file path (default: ./data/reasoningbank.db)
- `DB_MAX_CONNECTIONS` - Maximum connections (default: 5)
- `DB_TIMEOUT` - Operation timeout in ms (default: 5000)

**Usage:**

```typescript
const dbConfig = config.get('database');
const dbPath = dbConfig.path;
const maxConnections = dbConfig.maxConnections;
```

## Advanced Usage

### Updating Configuration at Runtime

```typescript
import { config } from './config/index.js';

// Update a single configuration section
config.set('embedding', {
  provider: 'openai',
  dimensions: 1536,
  model: 'text-embedding-3-large',
});

// Reload configuration from environment
config.reload();
```

### Configuration Validation

Configuration is automatically validated on load. Invalid configurations throw a `ConfigValidationError`:

```typescript
import { ConfigValidationError } from './config/validator.js';

try {
  config.set('embedding', {
    provider: 'invalid-provider', // Will throw error
    dimensions: 384,
    model: 'test',
  });
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error('Invalid configuration:', error.message);
  }
}
```

## Migration Guide

### Before (Hardcoded Values)

```typescript
// Old way - hardcoded values
const provider = 'hash';
const dimensions = 384;

class HashEmbedding {
  dimensions = 384;
  // ...
}
```

### After (Using Config Service)

```typescript
// New way - centralized config
import { config } from './config/index.js';

const embeddingConfig = config.get('embedding');
const provider = embeddingConfig.provider;
const dimensions = embeddingConfig.dimensions;

class HashEmbedding {
  dimensions: number;

  constructor() {
    this.dimensions = config.get('embedding').dimensions;
  }
}
```

## Best Practices

1. **Always use the config service** - Never hardcode configuration values
2. **Use environment variables** - Store sensitive data in .env files (never commit to git)
3. **Validate early** - Configuration is validated at startup to catch errors
4. **Use type safety** - TypeScript types ensure correct usage
5. **Document changes** - Update this file when adding new configuration options

## Files Modified

The following files were updated to use the centralized config service:

1. `/src/reasoningbank/utils/embeddings.ts` - Now uses config for provider and dimensions
2. `/src/reasoningbank/utils/pii-scrubber.ts` - Now uses config for PII scrubbing settings

## Configuration Schema

The complete configuration schema is defined in `/src/config/types.ts`:

```typescript
interface ConfigSchema {
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
```

## Troubleshooting

### Configuration Validation Errors

If you see validation errors on startup:

1. Check that all required environment variables are set
2. Ensure values are in the correct format (numbers, booleans, etc.)
3. Verify that enum values match allowed options

### Missing Environment Variables

If environment variables are missing:

1. Copy `.env.example` to `.env`
2. Set required values for your environment
3. Restart the application

### API Key Issues

If API keys are not working:

1. Ensure the correct environment variable is set (OPENAI_API_KEY or ANTHROPIC_API_KEY)
2. Check that the provider in EMBEDDING_PROVIDER matches your API key
3. Verify the API key is valid and has appropriate permissions

## Support

For issues or questions about configuration:

1. Check this documentation
2. Review `.env.example` for all available options
3. Examine `/src/config/types.ts` for type definitions
4. See `/src/config/validator.ts` for validation rules
