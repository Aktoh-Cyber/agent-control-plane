/**
 * Provider Abstraction & Registry
 *
 * Defines a uniform IModelProvider interface and concrete implementations
 * for LiteLLM, OpenRouter, direct Anthropic/OpenAI/Google, and local
 * (Ollama/Synapse) providers.
 *
 * ProviderRegistry manages registration, lookup, and org-aware selection.
 */

import type { ProviderLocality } from './sensitivity-router.js';

// ---------------------------------------------------------------------------
// LLM Request / Response types
// ---------------------------------------------------------------------------

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export type ProviderType =
  | 'litellm'
  | 'openrouter'
  | 'direct-anthropic'
  | 'direct-openai'
  | 'direct-google'
  | 'local';

export interface IModelProvider {
  name: string;
  type: ProviderType;
  locality: ProviderLocality;
  isThirdParty: boolean;
  route(request: LLMRequest): Promise<LLMResponse>;
  listModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Base provider with shared fetch logic
// ---------------------------------------------------------------------------

abstract class BaseProvider implements IModelProvider {
  abstract name: string;
  abstract type: ProviderType;
  abstract locality: ProviderLocality;
  abstract isThirdParty: boolean;
  abstract route(request: LLMRequest): Promise<LLMResponse>;
  abstract listModels(): Promise<string[]>;

  async isAvailable(): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.length > 0;
    } catch {
      return false;
    }
  }

  protected async fetchJSON<T>(url: string, options: RequestInit): Promise<T> {
    const start = Date.now();
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    const data = (await response.json()) as T;
    return data;
  }

  protected authHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }
}

// ---------------------------------------------------------------------------
// LiteLLM Provider
// ---------------------------------------------------------------------------

export class LiteLLMProvider extends BaseProvider {
  name = 'litellm';
  type: ProviderType = 'litellm';
  locality: ProviderLocality = 'self-hosted';
  isThirdParty = false;

  private baseUrl: string;
  private apiKey: string;

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    super();
    this.baseUrl = (
      options?.baseUrl ??
      process.env.LITELLM_ADMIN_URL ??
      'https://llm.aktohcyber.com'
    ).replace(/\/+$/, '');
    this.apiKey = options?.apiKey ?? process.env.LITELLM_MASTER_KEY ?? '';
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const data = await this.fetchJSON<Record<string, unknown>>(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.authHeaders(this.apiKey),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false,
      }),
    });
    const latencyMs = Date.now() - start;
    return this.parseOpenAIResponse(data, latencyMs);
  }

  async listModels(): Promise<string[]> {
    const data = await this.fetchJSON<{ data?: { id: string }[] }>(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.authHeaders(this.apiKey),
    });
    return (data.data ?? []).map((m) => m.id);
  }

  private parseOpenAIResponse(data: Record<string, unknown>, latencyMs: number): LLMResponse {
    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
    return {
      id: String(data.id ?? ''),
      model: String(data.model ?? ''),
      provider: this.name,
      content: choices?.[0]?.message?.content ?? '',
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      costUsd: 0,
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// OpenRouter Provider
// ---------------------------------------------------------------------------

export class OpenRouterProvider extends BaseProvider {
  name = 'openrouter';
  type: ProviderType = 'openrouter';
  locality: ProviderLocality = 'cloud';
  isThirdParty = true;

  private baseUrl = 'https://openrouter.ai/api/v1';
  private apiKey: string;

  constructor(options?: { apiKey?: string }) {
    super();
    this.apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const data = await this.fetchJSON<Record<string, unknown>>(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.authHeaders(this.apiKey),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      }),
    });
    const latencyMs = Date.now() - start;
    return this.parseResponse(data, latencyMs);
  }

  async listModels(): Promise<string[]> {
    const data = await this.fetchJSON<{ data?: { id: string }[] }>(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.authHeaders(this.apiKey),
    });
    return (data.data ?? []).map((m) => m.id);
  }

  private parseResponse(data: Record<string, unknown>, latencyMs: number): LLMResponse {
    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
    return {
      id: String(data.id ?? ''),
      model: String(data.model ?? ''),
      provider: this.name,
      content: choices?.[0]?.message?.content ?? '',
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      costUsd: 0,
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// Direct Anthropic Provider
// ---------------------------------------------------------------------------

export class DirectAnthropicProvider extends BaseProvider {
  name = 'direct-anthropic';
  type: ProviderType = 'direct-anthropic';
  locality: ProviderLocality = 'cloud';
  isThirdParty = true;

  private baseUrl = 'https://api.anthropic.com/v1';
  private apiKey: string;

  constructor(options?: { apiKey?: string }) {
    super();
    this.apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const payload: Record<string, unknown> = {
      model: request.model,
      messages: nonSystemMsgs,
      max_tokens: request.maxTokens ?? 1024,
    };
    if (systemMsg) payload.system = systemMsg.content;
    if (request.temperature !== undefined) payload.temperature = request.temperature;

    const data = await this.fetchJSON<Record<string, unknown>>(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
    const latencyMs = Date.now() - start;

    const content = data.content as { type: string; text?: string }[] | undefined;
    const text = content?.find((c) => c.type === 'text')?.text ?? '';
    const usage = data.usage as { input_tokens?: number; output_tokens?: number } | undefined;

    return {
      id: String(data.id ?? ''),
      model: String(data.model ?? request.model),
      provider: this.name,
      content: text,
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      costUsd: 0,
      latencyMs,
    };
  }

  async listModels(): Promise<string[]> {
    // Anthropic does not expose a model listing endpoint.
    // Return a static set of known models.
    return [
      'claude-3.5-sonnet',
      'claude-3.5-haiku',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
    ];
  }
}

// ---------------------------------------------------------------------------
// Direct OpenAI Provider
// ---------------------------------------------------------------------------

export class DirectOpenAIProvider extends BaseProvider {
  name = 'direct-openai';
  type: ProviderType = 'direct-openai';
  locality: ProviderLocality = 'cloud';
  isThirdParty = true;

  private baseUrl = 'https://api.openai.com/v1';
  private apiKey: string;

  constructor(options?: { apiKey?: string }) {
    super();
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const data = await this.fetchJSON<Record<string, unknown>>(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.authHeaders(this.apiKey),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      }),
    });
    const latencyMs = Date.now() - start;

    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;

    return {
      id: String(data.id ?? ''),
      model: String(data.model ?? request.model),
      provider: this.name,
      content: choices?.[0]?.message?.content ?? '',
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      costUsd: 0,
      latencyMs,
    };
  }

  async listModels(): Promise<string[]> {
    const data = await this.fetchJSON<{ data?: { id: string }[] }>(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.authHeaders(this.apiKey),
    });
    return (data.data ?? []).map((m) => m.id);
  }
}

// ---------------------------------------------------------------------------
// Direct Google Provider
// ---------------------------------------------------------------------------

export class DirectGoogleProvider extends BaseProvider {
  name = 'direct-google';
  type: ProviderType = 'direct-google';
  locality: ProviderLocality = 'cloud';
  isThirdParty = true;

  private apiKey: string;

  constructor(options?: { apiKey?: string }) {
    super();
    this.apiKey = options?.apiKey ?? process.env.GOOGLE_AI_API_KEY ?? '';
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${this.apiKey}`;

    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const data = await this.fetchJSON<Record<string, unknown>>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    const latencyMs = Date.now() - start;

    const candidates = data.candidates as
      | { content?: { parts?: { text?: string }[] } }[]
      | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usageMeta = data.usageMetadata as
      | {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        }
      | undefined;

    return {
      id: `google-${Date.now()}`,
      model: request.model,
      provider: this.name,
      content: text,
      inputTokens: usageMeta?.promptTokenCount ?? 0,
      outputTokens: usageMeta?.candidatesTokenCount ?? 0,
      costUsd: 0,
      latencyMs,
    };
  }

  async listModels(): Promise<string[]> {
    // Return known Gemini models; Google does not have a simple list endpoint.
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  }
}

// ---------------------------------------------------------------------------
// Local Provider (Ollama / Synapse)
// ---------------------------------------------------------------------------

export class LocalProvider extends BaseProvider {
  name = 'local';
  type: ProviderType = 'local';
  locality: ProviderLocality = 'local';
  isThirdParty = false;

  private baseUrl: string;

  constructor(options?: { baseUrl?: string }) {
    super();
    this.baseUrl = (
      options?.baseUrl ??
      process.env.LOCAL_LLM_URL ??
      'http://localhost:11434'
    ).replace(/\/+$/, '');
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    // Ollama-compatible /api/chat endpoint
    const data = await this.fetchJSON<Record<string, unknown>>(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: false,
        options: {
          num_predict: request.maxTokens,
          temperature: request.temperature,
        },
      }),
    });
    const latencyMs = Date.now() - start;

    const message = data.message as { content?: string } | undefined;
    const promptEval = Number(data.prompt_eval_count ?? 0);
    const evalCount = Number(data.eval_count ?? 0);

    return {
      id: `local-${Date.now()}`,
      model: request.model,
      provider: this.name,
      content: message?.content ?? '',
      inputTokens: promptEval,
      outputTokens: evalCount,
      costUsd: 0,
      latencyMs,
    };
  }

  async listModels(): Promise<string[]> {
    try {
      const data = await this.fetchJSON<{ models?: { name: string }[] }>(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' }
      );
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

export interface OrgProviderConfig {
  orgId: string;
  defaultProvider: string;
  overrides?: Record<string, string>;
}

export class ProviderRegistry {
  private providers: Map<string, IModelProvider> = new Map();
  private orgConfigs: Map<string, OrgProviderConfig> = new Map();

  /** Register a provider. */
  register(provider: IModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  /** Unregister a provider by name. */
  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /** Get a provider by name. */
  getProvider(name: string): IModelProvider | undefined {
    return this.providers.get(name);
  }

  /** List all registered providers. */
  listProviders(): IModelProvider[] {
    return Array.from(this.providers.values());
  }

  /** Set org-specific provider configuration. */
  setOrgConfig(config: OrgProviderConfig): void {
    this.orgConfigs.set(config.orgId, config);
  }

  /** Get org-specific provider configuration. */
  getOrgConfig(orgId: string): OrgProviderConfig | undefined {
    return this.orgConfigs.get(orgId);
  }

  /**
   * Select the best provider for an org and request.
   *
   * Resolution order:
   * 1. Org-specific model override (if configured).
   * 2. Org default provider.
   * 3. Global default (litellm).
   */
  selectProvider(orgId: string, request: LLMRequest): IModelProvider | undefined {
    const orgConfig = this.orgConfigs.get(orgId);

    if (orgConfig) {
      // Check model-specific override
      if (orgConfig.overrides?.[request.model]) {
        const override = this.providers.get(orgConfig.overrides[request.model]!);
        if (override) return override;
      }
      // Org default
      const orgDefault = this.providers.get(orgConfig.defaultProvider);
      if (orgDefault) return orgDefault;
    }

    // Global default: litellm
    return this.providers.get('litellm') ?? this.providers.values().next().value;
  }
}

// ---------------------------------------------------------------------------
// Singleton instance with default providers registered
// ---------------------------------------------------------------------------

export const providerRegistry = new ProviderRegistry();

// Register default providers
providerRegistry.register(new LiteLLMProvider());
providerRegistry.register(new OpenRouterProvider());
providerRegistry.register(new DirectAnthropicProvider());
providerRegistry.register(new DirectOpenAIProvider());
providerRegistry.register(new DirectGoogleProvider());
providerRegistry.register(new LocalProvider());
