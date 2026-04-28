/**
 * Unit tests for ModelRouter core logic.
 *
 * Focuses on:
 *   - Initial metrics state
 *   - Config loading from environment variables
 *   - Provider initialization gating (only initialises when API key present)
 *   - getDefaultProvider error when provider not configured
 *   - Rule-matching logic via the routing configuration
 *
 * External API calls are never made — we either use no API keys,
 * or we verify behaviour before any chat() call.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelRouter } from '../../agent-control-plane/src/router/router.js';

// Helpers to isolate env state
function clearRouterEnv() {
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.stubEnv('OPENROUTER_API_KEY', '');
  vi.stubEnv('GOOGLE_GEMINI_API_KEY', '');
  vi.stubEnv('PROVIDER', '');
  vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '');
}

describe('ModelRouter — initial metrics state', () => {
  beforeEach(clearRouterEnv);
  afterEach(() => vi.unstubAllEnvs());

  it('starts with zero totalRequests', () => {
    const router = new ModelRouter();
    expect(router.getMetrics().totalRequests).toBe(0);
  });

  it('starts with zero totalCost', () => {
    const router = new ModelRouter();
    expect(router.getMetrics().totalCost).toBe(0);
  });

  it('starts with zero token counts', () => {
    const router = new ModelRouter();
    const tokens = router.getMetrics().totalTokens;
    expect(tokens.input).toBe(0);
    expect(tokens.output).toBe(0);
  });

  it('starts with empty providerBreakdown', () => {
    const router = new ModelRouter();
    expect(Object.keys(router.getMetrics().providerBreakdown)).toHaveLength(0);
  });
});

describe('ModelRouter — config loaded from environment variables', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the PROVIDER env var as defaultProvider', () => {
    vi.stubEnv('PROVIDER', 'openrouter');
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getConfig().defaultProvider).toBe('openrouter');
  });

  it('falls back to "anthropic" when PROVIDER env is not set', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getConfig().defaultProvider).toBe('anthropic');
  });

  it('uses manual routing mode when built from env', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getConfig().routing?.mode).toBe('manual');
  });
});

describe('ModelRouter — provider initialization gating', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not initialize Anthropic provider when API key is absent', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getProviders().has('anthropic')).toBe(false);
  });

  it('does not initialize OpenRouter provider when API key is absent', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getProviders().has('openrouter')).toBe(false);
  });

  it('does not initialize Gemini provider when API key is absent', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    expect(router.getProviders().has('gemini')).toBe(false);
  });

  it('returns a copy of providers map (mutations do not affect internal state)', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    const copy = router.getProviders();
    copy.set('anthropic', {} as any);
    expect(router.getProviders().has('anthropic')).toBe(false);
  });
});

describe('ModelRouter — getDefaultProvider throws when provider missing', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rejects chat() when default provider is not configured', async () => {
    clearRouterEnv();
    vi.stubEnv('PROVIDER', 'anthropic');
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');

    const router = new ModelRouter();
    // No Anthropic API key → provider not initialized → should throw
    await expect(
      router.chat({
        model: 'claude-sonnet-4-5-20250929',
        messages: [{ role: 'user', content: 'hello' }],
      })
    ).rejects.toThrow(/Default provider anthropic not initialized/);
  });
});

describe('ModelRouter — getConfig returns a copy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('getConfig does not expose internal mutable reference', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    const cfg1 = router.getConfig();
    const cfg2 = router.getConfig();
    // Should be equal in value
    expect(cfg1).toEqual(cfg2);
    // Mutating the returned config must not change internal state
    cfg1.defaultProvider = 'gemini' as any;
    expect(router.getConfig().defaultProvider).not.toBe('gemini');
  });
});

describe('ModelRouter — metrics return a copy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('mutating returned metrics does not affect internal state', () => {
    clearRouterEnv();
    vi.stubEnv('AGENTIC_FLOW_ROUTER_CONFIG', '/nonexistent-path/router.config.json');
    const router = new ModelRouter();
    const m = router.getMetrics();
    m.totalRequests = 999;
    expect(router.getMetrics().totalRequests).toBe(0);
  });
});
