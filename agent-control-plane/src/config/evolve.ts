/**
 * Evolve service endpoint configuration for ACP integration.
 *
 * Evolve services communicate with ACP through HTTP endpoints.
 * This module provides typed configuration loaded from environment
 * variables, following the same pattern as claudeFlow.ts.
 */

import { logger } from '../utils/logger.js';

export interface EvolveServiceConfig {
  /** Whether Evolve integration is enabled */
  enabled: boolean;
  /** Evolve Orchestration service URL */
  orchestrationUrl: string;
  /** Evolve Tool Factory service URL */
  toolFactoryUrl: string;
  /** Evolve Edge Bridge service URL */
  edgeBridgeUrl: string;
  /** Evolve LLM Router service URL */
  llmRouterUrl: string;
  /** Evolve Learning Loop service URL */
  learningLoopUrl: string;
  /** Service-to-service auth token (read from env, never hardcoded) */
  serviceToken: string;
  /** Default timeout for HTTP calls to Evolve services (ms) */
  defaultTimeoutMs: number;
}

/**
 * Default endpoints for local development.
 * Production values should always come from environment variables.
 *
 * Production URLs (aktohcyber.com):
 *   EVOLVE_ORCHESTRATION_URL  = https://evolve-orchestration.aktohcyber.com
 *   EVOLVE_EDGE_BRIDGE_URL    = https://edge-bridge.aktohcyber.com
 *   EVOLVE_LLM_ROUTER_URL     = https://llm-router.aktohcyber.com
 */
const DEFAULTS = {
  orchestrationUrl: 'http://localhost:8090',
  toolFactoryUrl: 'http://localhost:8091',
  edgeBridgeUrl: 'http://localhost:8787',
  llmRouterUrl: 'http://localhost:8788',
  learningLoopUrl: 'http://localhost:8092',
  defaultTimeoutMs: 30_000,
} as const;

/**
 * Load Evolve service configuration from environment variables.
 *
 * Environment variables:
 * - EVOLVE_ENABLED              (default: false)
 * - EVOLVE_ORCHESTRATION_URL    (default: http://localhost:8090)
 * - EVOLVE_TOOL_FACTORY_URL     (default: http://localhost:8091)
 * - EVOLVE_EDGE_BRIDGE_URL      (default: http://localhost:8787)
 * - EVOLVE_LLM_ROUTER_URL       (default: http://localhost:8788)
 * - EVOLVE_LEARNING_LOOP_URL    (default: http://localhost:8092)
 * - EVOLVE_SERVICE_TOKEN         (required when enabled)
 * - EVOLVE_DEFAULT_TIMEOUT_MS    (default: 30000)
 */
export function loadEvolveConfig(
  env: Record<string, string | undefined> = process.env
): EvolveServiceConfig {
  const enabled = env['EVOLVE_ENABLED'] === 'true';

  const config: EvolveServiceConfig = {
    enabled,
    orchestrationUrl: env['EVOLVE_ORCHESTRATION_URL'] ?? DEFAULTS.orchestrationUrl,
    toolFactoryUrl: env['EVOLVE_TOOL_FACTORY_URL'] ?? DEFAULTS.toolFactoryUrl,
    edgeBridgeUrl: env['EVOLVE_EDGE_BRIDGE_URL'] ?? DEFAULTS.edgeBridgeUrl,
    llmRouterUrl: env['EVOLVE_LLM_ROUTER_URL'] ?? DEFAULTS.llmRouterUrl,
    learningLoopUrl: env['EVOLVE_LEARNING_LOOP_URL'] ?? DEFAULTS.learningLoopUrl,
    serviceToken: env['EVOLVE_SERVICE_TOKEN'] ?? '',
    defaultTimeoutMs: env['EVOLVE_DEFAULT_TIMEOUT_MS']
      ? parseInt(env['EVOLVE_DEFAULT_TIMEOUT_MS'], 10)
      : DEFAULTS.defaultTimeoutMs,
  };

  if (enabled) {
    if (!config.serviceToken) {
      logger.warn('Evolve integration enabled but EVOLVE_SERVICE_TOKEN is not set');
    }
    logger.info('Evolve integration configured', {
      orchestrationUrl: config.orchestrationUrl,
      toolFactoryUrl: config.toolFactoryUrl,
      edgeBridgeUrl: config.edgeBridgeUrl,
      llmRouterUrl: config.llmRouterUrl,
      learningLoopUrl: config.learningLoopUrl,
      defaultTimeoutMs: config.defaultTimeoutMs,
    });
  }

  return config;
}

/**
 * Evolve agent type definitions for registration purposes.
 * These describe the Evolve subsystems that participate in ACP workflows.
 */
export const EVOLVE_AGENT_TYPES = [
  {
    name: 'evolve-bridge',
    description:
      'Evolve Edge Bridge -- translates Agentopia MCP to Synapse SGA protocol and manages bidirectional tool routing with response caching',
    capabilities: ['tool-routing', 'mcp-translation', 'cache-management', 'protocol-bridging'],
    version: '0.1.0',
    healthEndpoint: '/health',
  },
  {
    name: 'evolve-orchestrator',
    description:
      'Evolve Orchestration -- dispatches multi-step workflows across Agentopia, ACP, and Synapse with dependency resolution',
    capabilities: [
      'workflow-execution',
      'node-management',
      'tool-dispatch',
      'dependency-resolution',
    ],
    version: '0.1.0',
    healthEndpoint: '/health',
  },
  {
    name: 'tool-factory',
    description:
      'Evolve Tool Factory -- AI-driven WASM tool generation, compilation, signing, and distribution to Synapse nodes',
    capabilities: ['code-generation', 'wasm-compilation', 'tool-signing', 'distribution'],
    version: '0.1.0',
    healthEndpoint: '/health',
  },
] as const;

/**
 * Evolve ReasoningBank namespace names for use in memory operations.
 */
export const EVOLVE_NAMESPACES = [
  'evolve:tool-generation',
  'evolve:inference-routing',
  'evolve:workflows',
  'evolve:executions',
  'evolve:bridge-metrics',
] as const;
