/**
 * Unit tests for Router model mapping utilities.
 *
 * Tests pure functions: mapModelId, getModelName, listModels.
 * No external dependencies — fully isolated.
 */

import { describe, expect, it } from 'vitest';
import {
  CLAUDE_MODELS,
  getModelName,
  listModels,
  mapModelId,
} from '../../agent-control-plane/src/router/model-mapping.js';

describe('mapModelId', () => {
  describe('anthropic → openrouter', () => {
    it('maps a known Anthropic API ID to OpenRouter format', () => {
      const result = mapModelId('claude-sonnet-4-5-20250929', 'openrouter');
      expect(result).toBe('anthropic/claude-sonnet-4.5');
    });

    it('maps claude-3-5-sonnet dated ID to OpenRouter format', () => {
      const result = mapModelId('claude-3-5-sonnet-20241022', 'openrouter');
      expect(result).toBe('anthropic/claude-3.5-sonnet-20241022');
    });

    it('maps claude-3-7-sonnet dated ID to OpenRouter format', () => {
      const result = mapModelId('claude-3-7-sonnet-20250219', 'openrouter');
      expect(result).toBe('anthropic/claude-3.7-sonnet');
    });
  });

  describe('openrouter → anthropic', () => {
    it('maps an OpenRouter canonical ID to Anthropic format', () => {
      const result = mapModelId('anthropic/claude-sonnet-4.5', 'anthropic');
      expect(result).toBe('claude-sonnet-4-5-20250929');
    });

    it('maps an OpenRouter 3.5 sonnet ID to Anthropic format', () => {
      const result = mapModelId('anthropic/claude-3.5-sonnet-20241022', 'anthropic');
      expect(result).toBe('claude-3-5-sonnet-20241022');
    });
  });

  describe('canonical key lookups', () => {
    it('maps a canonical key (claude-sonnet-4.5) to anthropic format', () => {
      const result = mapModelId('claude-sonnet-4.5', 'anthropic');
      expect(result).toBe('claude-sonnet-4-5-20250929');
    });

    it('maps a canonical key to openrouter format', () => {
      const result = mapModelId('claude-sonnet-4.5', 'openrouter');
      expect(result).toBe('anthropic/claude-sonnet-4.5');
    });

    it('maps claude-opus-4.1 canonical key to anthropic format', () => {
      const result = mapModelId('claude-opus-4.1', 'anthropic');
      expect(result).toBe('claude-opus-4-1-20250514');
    });
  });

  describe('already-correct format passthrough', () => {
    it('returns Anthropic dated ID unchanged when target is anthropic', () => {
      const id = 'claude-sonnet-4-5-20250929';
      expect(mapModelId(id, 'anthropic')).toBe(id);
    });

    it('returns OpenRouter prefixed ID unchanged when target is openrouter', () => {
      const id = 'anthropic/claude-sonnet-4.5';
      expect(mapModelId(id, 'openrouter')).toBe(id);
    });
  });

  describe('bedrock mapping', () => {
    it('maps canonical claude-sonnet-4.5 to bedrock ARN', () => {
      const result = mapModelId('claude-sonnet-4.5', 'bedrock');
      expect(result).toBe('anthropic.claude-sonnet-4-5-v2:0');
    });

    it('maps anthropic dated ID to bedrock ARN', () => {
      const result = mapModelId('claude-sonnet-4-5-20250929', 'bedrock');
      expect(result).toBe('anthropic.claude-sonnet-4-5-v2:0');
    });
  });

  describe('unknown model fallback', () => {
    it('returns the original ID when no mapping exists', () => {
      const unknownId = 'some-unknown-model-v1';
      expect(mapModelId(unknownId, 'openrouter')).toBe(unknownId);
    });

    it('returns original ID for unknown anthropic target', () => {
      const unknownId = 'gpt-4-turbo';
      expect(mapModelId(unknownId, 'anthropic')).toBe(unknownId);
    });
  });
});

describe('getModelName', () => {
  it('returns human-readable canonical name for Anthropic API ID', () => {
    expect(getModelName('claude-sonnet-4-5-20250929')).toBe('Claude Sonnet 4.5');
  });

  it('returns human-readable canonical name for OpenRouter ID', () => {
    expect(getModelName('anthropic/claude-sonnet-4.5')).toBe('Claude Sonnet 4.5');
  });

  it('returns human-readable name for claude-3.5-haiku', () => {
    expect(getModelName('claude-3-5-haiku-20241022')).toBe('Claude 3.5 Haiku');
  });

  it('returns original ID when no mapping found', () => {
    expect(getModelName('unknown-model-id')).toBe('unknown-model-id');
  });
});

describe('listModels', () => {
  it('returns all anthropic model IDs', () => {
    const models = listModels('anthropic');
    expect(models.length).toBeGreaterThan(0);
    // All returned IDs should be anthropic-format strings
    for (const m of models) {
      expect(typeof m).toBe('string');
      expect(m.length).toBeGreaterThan(0);
    }
  });

  it('returns all openrouter model IDs with anthropic/ prefix', () => {
    const models = listModels('openrouter');
    expect(models.length).toBeGreaterThan(0);
    for (const m of models) {
      expect(m).toMatch(/^anthropic\//);
    }
  });

  it('returns only defined bedrock IDs (some models lack bedrock mappings)', () => {
    const models = listModels('bedrock');
    const allMappings = Object.values(CLAUDE_MODELS);
    const expectedCount = allMappings.filter((m) => m.bedrock !== undefined).length;
    expect(models.length).toBe(expectedCount);
  });

  it('returns the same count across providers (excluding bedrock)', () => {
    const anthropic = listModels('anthropic');
    const openrouter = listModels('openrouter');
    expect(anthropic.length).toBe(openrouter.length);
  });
});

describe('CLAUDE_MODELS constant', () => {
  it('each model entry has anthropic, openrouter, and canonical fields', () => {
    for (const [key, mapping] of Object.entries(CLAUDE_MODELS)) {
      expect(mapping.anthropic, `${key}.anthropic`).toBeTruthy();
      expect(mapping.openrouter, `${key}.openrouter`).toBeTruthy();
      expect(mapping.canonical, `${key}.canonical`).toBeTruthy();
    }
  });

  it('all Anthropic IDs follow dated format (claude-*-YYYYMMDD)', () => {
    for (const [key, mapping] of Object.entries(CLAUDE_MODELS)) {
      expect(
        /^claude-.+-\d{8}$/.test(mapping.anthropic),
        `${key} anthropic ID "${mapping.anthropic}" should end in 8-digit date`
      ).toBe(true);
    }
  });

  it('all OpenRouter IDs follow anthropic/model format', () => {
    for (const [key, mapping] of Object.entries(CLAUDE_MODELS)) {
      expect(
        mapping.openrouter.startsWith('anthropic/'),
        `${key} openrouter ID "${mapping.openrouter}" should start with anthropic/`
      ).toBe(true);
    }
  });
});
