/**
 * LiteLLM Admin API Client
 *
 * Wraps the LiteLLM admin REST API for virtual key management,
 * model discovery, and usage retrieval.
 *
 * Auth: Bearer token from LITELLM_MASTER_KEY env var.
 * Base URL: LITELLM_ADMIN_URL env var or https://llm.aktohcyber.com.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VirtualKeyConfig {
  /** Human-readable alias for the key. */
  alias?: string;
  /** Optional list of models this key is allowed to use. */
  allowedModels?: string[];
  /** Maximum monthly budget (USD) for this key. Null = unlimited. */
  maxBudget?: number | null;
  /** Budget duration. Defaults to 'monthly'. */
  budgetDuration?: string;
  /** Optional metadata attached to the key. */
  metadata?: Record<string, unknown>;
}

export interface VirtualKey {
  token: string;
  keyAlias: string | null;
  keyName: string | null;
  spend: number;
  maxBudget: number | null;
  models: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  expiresAt: string | null;
}

export interface UsageSummary {
  totalCostUsd: number;
  totalTokens: number;
  requestCount: number;
  byModel: Record<string, { cost: number; tokens: number; requests: number }>;
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class LiteLLMError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'LiteLLMError';
  }
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

export interface ILiteLLMAdminClient {
  createVirtualKey(orgId: string, config: VirtualKeyConfig): Promise<{ key: string }>;
  listVirtualKeys(): Promise<VirtualKey[]>;
  revokeVirtualKey(keyId: string): Promise<void>;
  listModels(): Promise<string[]>;
  getUsage(keyId: string, since?: Date): Promise<UsageSummary>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://llm.aktohcyber.com';

export class LiteLLMAdminClient implements ILiteLLMAdminClient {
  private baseUrl: string;
  private masterKey: string;

  constructor(options?: { baseUrl?: string; masterKey?: string }) {
    this.baseUrl = (options?.baseUrl ?? process.env.LITELLM_ADMIN_URL ?? DEFAULT_BASE_URL).replace(
      /\/+$/,
      ''
    );

    this.masterKey = options?.masterKey ?? process.env.LITELLM_MASTER_KEY ?? '';
  }

  // -----------------------------------------------------------------------
  // Virtual key management
  // -----------------------------------------------------------------------

  async createVirtualKey(orgId: string, config: VirtualKeyConfig): Promise<{ key: string }> {
    const payload: Record<string, unknown> = {
      metadata: { ...(config.metadata ?? {}), orgId },
    };
    if (config.alias) payload.key_alias = config.alias;
    if (config.allowedModels?.length) payload.models = config.allowedModels;
    if (config.maxBudget !== undefined) payload.max_budget = config.maxBudget;
    if (config.budgetDuration) payload.budget_duration = config.budgetDuration;

    const data = await this.request<{ key: string }>('POST', '/key/generate', payload);
    return { key: data.key };
  }

  async listVirtualKeys(): Promise<VirtualKey[]> {
    const data = await this.request<{ keys?: unknown[] }>('GET', '/key/info');
    if (!Array.isArray(data.keys)) return [];

    return data.keys.map((raw: unknown) => {
      const k = raw as Record<string, unknown>;
      return {
        token: String(k.token ?? ''),
        keyAlias: (k.key_alias as string) ?? null,
        keyName: (k.key_name as string) ?? null,
        spend: Number(k.spend ?? 0),
        maxBudget: k.max_budget != null ? Number(k.max_budget) : null,
        models: Array.isArray(k.models) ? (k.models as string[]) : [],
        metadata: (k.metadata as Record<string, unknown>) ?? {},
        createdAt: String(k.created_at ?? ''),
        expiresAt: k.expires != null ? String(k.expires) : null,
      };
    });
  }

  async revokeVirtualKey(keyId: string): Promise<void> {
    await this.request('POST', '/key/delete', { keys: [keyId] });
  }

  // -----------------------------------------------------------------------
  // Model discovery
  // -----------------------------------------------------------------------

  async listModels(): Promise<string[]> {
    const data = await this.request<{ data?: unknown[] }>('GET', '/models');
    if (!Array.isArray(data.data)) return [];

    return data.data
      .map((entry: unknown) => {
        const m = entry as Record<string, unknown>;
        return String(m.id ?? m.model ?? '');
      })
      .filter(Boolean);
  }

  // -----------------------------------------------------------------------
  // Usage
  // -----------------------------------------------------------------------

  async getUsage(keyId: string, since?: Date): Promise<UsageSummary> {
    let path = `/spend/logs?api_key=${encodeURIComponent(keyId)}`;
    if (since) {
      path += `&start_date=${encodeURIComponent(since.toISOString())}`;
    }

    const data = await this.request<unknown[]>('GET', path);
    const logs = Array.isArray(data) ? data : [];

    let totalCostUsd = 0;
    let totalTokens = 0;
    let requestCount = 0;
    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};

    for (const raw of logs) {
      const log = raw as Record<string, unknown>;
      const cost = Number(log.spend ?? 0);
      const tokens = Number(log.total_tokens ?? 0);
      const model = String(log.model ?? 'unknown');

      totalCostUsd += cost;
      totalTokens += tokens;
      requestCount += 1;

      if (!byModel[model]) {
        byModel[model] = { cost: 0, tokens: 0, requests: 0 };
      }
      const entry = byModel[model]!;
      entry.cost += cost;
      entry.tokens += tokens;
      entry.requests += 1;
    }

    return { totalCostUsd, totalTokens, requestCount, byModel };
  }

  // -----------------------------------------------------------------------
  // HTTP helper
  // -----------------------------------------------------------------------

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.masterKey) {
      headers['Authorization'] = `Bearer ${this.masterKey}`;
    }

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      throw new LiteLLMError(
        `Network error reaching LiteLLM at ${url}: ${(err as Error).message}`,
        0
      );
    }

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text().catch(() => null);
      }
      throw new LiteLLMError(
        `LiteLLM API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const litellmAdmin = new LiteLLMAdminClient();
