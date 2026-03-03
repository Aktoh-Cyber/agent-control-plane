/**
 * Tool Factory Client
 *
 * Calls the Evolve Tool Factory service to check, propose, build,
 * and query status of dynamically generated tools.
 *
 * All endpoints are routed through the Evolve orchestration and
 * tool-factory URLs defined in src/config/evolve.ts.
 */

// ---------------------------------------------------------------------------
// Inline Evolve config (loaded from env, no cross-directory imports needed)
// ---------------------------------------------------------------------------

interface EvolveServiceConfig {
  orchestrationUrl: string;
  toolFactoryUrl: string;
  serviceToken: string;
  defaultTimeoutMs: number;
}

function loadEvolveConfig(): EvolveServiceConfig {
  return {
    orchestrationUrl: process.env.EVOLVE_ORCHESTRATION_URL || 'http://localhost:8090',
    toolFactoryUrl: process.env.EVOLVE_TOOL_FACTORY_URL || 'http://localhost:8091',
    serviceToken: process.env.EVOLVE_SERVICE_TOKEN || '',
    defaultTimeoutMs: parseInt(process.env.EVOLVE_DEFAULT_TIMEOUT_MS || '30000', 10),
  };
}

const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === 'debug') console.debug(msg, ctx);
  },
  info: (msg: string, ctx?: Record<string, unknown>) => console.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => console.warn(msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => console.error(msg, ctx),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ToolProposal {
  proposalId: string;
  estimatedBuildTime: number;
}

export interface ToolBuildResult {
  toolId: string;
  name: string;
  status: 'built' | 'failed';
  deployUrl?: string;
  error?: string;
}

export interface ToolStatus {
  status: string;
  deployUrl?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ToolFactoryClient {
  private readonly config: EvolveServiceConfig;

  constructor(config?: EvolveServiceConfig) {
    this.config = config ?? loadEvolveConfig();
  }

  // ---- helpers ------------------------------------------------------------

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Source': 'agent-control-plane',
    };
    if (this.config.serviceToken) {
      h['Authorization'] = `Bearer ${this.config.serviceToken}`;
    }
    return h;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.defaultTimeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: { ...this.headers(), ...((init?.headers as Record<string, string>) ?? {}) },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Tool Factory request failed: ${res.status} ${res.statusText} - ${body}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---- public API ---------------------------------------------------------

  /**
   * Check whether a tool with the given name is already registered
   * in the Evolve orchestration service.
   */
  async checkToolExists(toolName: string): Promise<boolean> {
    const url = `${this.config.orchestrationUrl}/api/tools/${encodeURIComponent(toolName)}`;
    logger.debug('Checking tool existence', { toolName, url });

    try {
      await this.request<unknown>(url);
      return true;
    } catch {
      // 404 or network error -> tool does not exist
      return false;
    }
  }

  /**
   * Submit a tool generation proposal to the Tool Factory.
   * Returns a proposalId and the estimated build time in seconds.
   */
  async proposeToolGeneration(spec: ToolSpec): Promise<ToolProposal> {
    const url = `${this.config.toolFactoryUrl}/api/tools/propose`;
    logger.info('Proposing tool generation', { tool: spec.name, url });

    return this.request<ToolProposal>(url, {
      method: 'POST',
      body: JSON.stringify(spec),
    });
  }

  /**
   * Trigger a build for a previously proposed tool.
   * Blocks until the build completes (or the default timeout fires).
   */
  async buildTool(proposalId: string): Promise<ToolBuildResult> {
    const url = `${this.config.toolFactoryUrl}/api/tools/build`;
    logger.info('Building tool', { proposalId, url });

    return this.request<ToolBuildResult>(url, {
      method: 'POST',
      body: JSON.stringify({ proposalId }),
    });
  }

  /**
   * Poll the current build / deploy status of a tool.
   */
  async getToolStatus(toolId: string): Promise<ToolStatus> {
    const url = `${this.config.toolFactoryUrl}/api/tools/${encodeURIComponent(toolId)}/status`;
    logger.debug('Getting tool status', { toolId, url });

    return this.request<ToolStatus>(url);
  }

  /**
   * List all tools registered in the Evolve orchestration service.
   * Proxied from the orchestration /api/tools endpoint.
   */
  async listTools(): Promise<unknown> {
    const url = `${this.config.orchestrationUrl}/api/tools`;
    logger.debug('Listing tools', { url });

    return this.request<unknown>(url);
  }
}
