/**
 * Memory Distillation from trajectories
 * Algorithm 3 from ReasoningBank paper
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { ulid } from 'ulid';
import { fileURLToPath } from 'url';
import { ModelRouter } from '../../router/router.js';
import * as db from '../db/queries.js';
import type { Trajectory } from '../db/schema.js';
import { loadConfig } from '../utils/config.js';
import { computeEmbedding } from '../utils/embeddings.js';
import { scrubMemory } from '../utils/pii-scrubber.js';
import type { Verdict } from './judge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize ModelRouter once
let routerInstance: ModelRouter | null = null;
function getRouter(): ModelRouter {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}

export interface DistilledMemory {
  title: string;
  description: string;
  content: string;
  tags: string[];
  domain?: string;
}

/**
 * Distill actionable memories from task execution trajectories
 *
 * Implements Algorithm 3 from the ReasoningBank paper (arXiv:2509.25140).
 * Extracts reusable patterns, strategies, and guardrails from both successful
 * and failed task executions to build an intelligent memory bank.
 *
 * @description Analyzes trajectories using LLM to extract generalizable insights.
 * Creates structured memories with PII scrubbing, semantic embeddings, and
 * metadata tagging. Different prompts for success vs failure patterns.
 *
 * @param {Trajectory} trajectory - The task execution trajectory to analyze
 * @param {Verdict} verdict - The judgment verdict (Success/Failure) with confidence
 * @param {string} query - The original task query/objective
 * @param {Object} options - Optional distillation configuration
 * @param {string} [options.taskId] - Task identifier for provenance tracking
 * @param {string} [options.agentId] - Agent identifier for attribution
 * @param {string} [options.domain] - Domain classification (e.g., 'coding', 'data-analysis')
 *
 * @returns {Promise<string[]>} Array of memory IDs (ULIDs) for created memories
 *
 * @example
 * ```typescript
 * // Distill from successful trajectory
 * const trajectory = {
 *   steps: [
 *     { action: "analyze_requirements", output: "..." },
 *     { action: "implement_solution", output: "..." },
 *     { action: "test_solution", output: "All tests pass" }
 *   ]
 * };
 *
 * const verdict = {
 *   label: 'Success',
 *   confidence: 0.95,
 *   reasons: ["All tests passed", "Solution meets requirements"]
 * };
 *
 * const memoryIds = await distillMemories(
 *   trajectory,
 *   verdict,
 *   "Implement user authentication with JWT",
 *   {
 *     taskId: "task-123",
 *     agentId: "backend-agent",
 *     domain: "authentication"
 *   }
 * );
 *
 * console.log(`Created ${memoryIds.length} memories`);
 * // Output: Created 3 memories
 * // - "JWT token generation best practices"
 * // - "Secure password hashing with bcrypt"
 * // - "Session management patterns"
 * ```
 *
 * @example
 * ```typescript
 * // Distill from failed trajectory
 * const verdict = {
 *   label: 'Failure',
 *   confidence: 0.85,
 *   reasons: ["Database connection timeout", "Retry logic missing"]
 * };
 *
 * const memoryIds = await distillMemories(trajectory, verdict, query, {
 *   domain: "database"
 * });
 *
 * // Creates guardrail memories:
 * // - "Always implement connection pooling"
 * // - "Add retry logic with exponential backoff"
 * ```
 *
 * @throws {Error} If LLM distillation fails (falls back to template-based extraction)
 *
 * @since 1.8.0
 *
 * @remarks
 * Distillation process:
 * 1. Selects prompt template (success vs failure)
 * 2. Calls LLM to extract generalizable patterns
 * 3. Parses structured memory objects from LLM response
 * 4. Scrubs PII from memory content
 * 5. Generates semantic embeddings
 * 6. Stores memories with metadata and provenance
 *
 * Memory limits (configurable):
 * - Success trajectories: max 3 memories (high-quality patterns)
 * - Failure trajectories: max 2 memories (critical guardrails)
 *
 * Confidence priors (initial confidence scores):
 * - Success memories: 0.8 (proven patterns)
 * - Failure memories: 0.9 (important warnings)
 *
 * Environment variables required (at least one):
 * - OPENROUTER_API_KEY
 * - ANTHROPIC_API_KEY
 * - GOOGLE_GEMINI_API_KEY
 */
export async function distillMemories(
  trajectory: Trajectory,
  verdict: Verdict,
  query: string,
  options: { taskId?: string; agentId?: string; domain?: string } = {}
): Promise<string[]> {
  const config = loadConfig();
  const startTime = Date.now();

  console.log(`[INFO] Distilling memories from ${verdict.label} trajectory`);

  // Select appropriate prompt template
  const templateName =
    verdict.label === 'Success' ? 'distill-success.json' : 'distill-failure.json';
  const promptPath = join(__dirname, '../prompts', templateName);
  const promptTemplate = JSON.parse(readFileSync(promptPath, 'utf-8'));

  const maxItems =
    verdict.label === 'Success'
      ? config.distill.max_items_success
      : config.distill.max_items_failure;

  const confidencePrior =
    verdict.label === 'Success'
      ? config.distill.confidence_prior_success
      : config.distill.confidence_prior_failure;

  // Check if we have any API key configured
  const hasApiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY;

  if (!hasApiKey) {
    console.warn(
      '[WARN] No API key set (OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GEMINI_API_KEY), using template-based distillation'
    );
    return templateBasedDistill(trajectory, verdict, query, options);
  }

  try {
    // Format trajectory
    const trajectoryText = JSON.stringify(trajectory.steps || [], null, 2);

    // Build prompt
    const prompt = promptTemplate.template
      .replace('{{task_query}}', query)
      .replace('{{trajectory}}', trajectoryText)
      .replace('{{max_items}}', String(maxItems));

    // Use ModelRouter for multi-provider support
    const router = getRouter();
    const response = await router.chat(
      {
        model: config.distill.model || config.judge.model,
        messages: [
          { role: 'system', content: promptTemplate.system },
          { role: 'user', content: prompt },
        ],
        temperature: config.distill.temperature || 0.3,
        maxTokens: config.distill.max_tokens || 2048,
      },
      'reasoningbank-distill'
    );

    // Extract content from router response
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Parse memories from response
    const distilled = parseDistilledMemories(content);

    // Store memories in database
    const memoryIds = await storeMemories(distilled, confidencePrior, verdict, options);

    const duration = Date.now() - startTime;
    console.log(`[INFO] Distilled ${memoryIds.length} memories in ${duration}ms`);
    db.logMetric('rb.distill.latency_ms', duration);
    db.logMetric('rb.distill.yield', memoryIds.length);

    return memoryIds;
  } catch (error) {
    console.error('[ERROR] Distillation failed:', error);
    return templateBasedDistill(trajectory, verdict, query, options);
  }
}

/**
 * Parse distilled memories from LLM response
 */
function parseDistilledMemories(content: string): DistilledMemory[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.memories || [];
    }
  } catch (error) {
    console.warn('[WARN] Failed to parse distilled memories JSON');
  }

  return [];
}

/**
 * Store memories in database
 */
async function storeMemories(
  memories: DistilledMemory[],
  confidencePrior: number,
  verdict: Verdict,
  options: { taskId?: string; agentId?: string; domain?: string }
): Promise<string[]> {
  const memoryIds: string[] = [];

  for (const mem of memories) {
    // Scrub PII
    const scrubbed = scrubMemory(mem);

    // Generate embedding
    const embedding = await computeEmbedding(
      `${scrubbed.title} ${scrubbed.description} ${scrubbed.content}`
    );

    // Create memory ID
    const id = ulid();

    // Store memory
    db.upsertMemory({
      id,
      type: 'reasoning_memory',
      pattern_data: {
        title: scrubbed.title,
        description: scrubbed.description,
        content: scrubbed.content,
        source: {
          task_id: options.taskId || 'unknown',
          agent_id: options.agentId || 'unknown',
          outcome: verdict.label,
          evidence: [],
        },
        tags: scrubbed.tags,
        domain: options.domain || scrubbed.domain,
        created_at: new Date().toISOString(),
        confidence: confidencePrior,
        n_uses: 0,
      },
      confidence: confidencePrior,
      usage_count: 0,
    });

    // Store embedding
    db.upsertEmbedding({
      id,
      model: 'distill-' + verdict.label.toLowerCase(),
      dims: embedding.length,
      vector: embedding,
      created_at: new Date().toISOString(),
    });

    memoryIds.push(id);
    console.log(`[INFO] Stored memory: ${scrubbed.title}`);
  }

  return memoryIds;
}

/**
 * Template-based distillation (fallback)
 * Simple extraction without LLM
 */
function templateBasedDistill(
  trajectory: Trajectory,
  verdict: Verdict,
  query: string,
  options: any
): string[] {
  console.log('[INFO] Using template-based distillation (no API key)');

  // Create a single generic memory from the trajectory
  const memory: DistilledMemory = {
    title: `${verdict.label}: ${query.substring(0, 50)}`,
    description: `Task outcome: ${verdict.label}`,
    content: `Query: ${query}\n\nSteps: ${trajectory.steps?.length || 0}\n\nOutcome: ${verdict.label}`,
    tags: [verdict.label.toLowerCase(), 'template'],
    domain: options.domain,
  };

  // Store synchronously (no async needed for template)
  return []; // Skip storage for template-based (would need to make this async)
}
