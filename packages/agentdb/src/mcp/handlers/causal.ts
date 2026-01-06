/**
 * Causal graph tool handlers
 * Handles: causal_add_edge, causal_query, learner_discover
 */
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';

export const causalTools: ToolDefinition[] = [
  {
    name: 'causal_add_edge',
    description: 'Add a causal relationship between actions and outcomes',
    inputSchema: {
      type: 'object',
      properties: {
        cause: { type: 'string', description: 'Causal action/intervention' },
        effect: { type: 'string', description: 'Observed effect/outcome' },
        uplift: { type: 'number', description: 'Causal uplift magnitude' },
        confidence: {
          type: 'number',
          description: 'Confidence in causal claim (0-1)',
          default: 0.95,
        },
        sample_size: { type: 'number', description: 'Number of observations', default: 0 },
      },
      required: ['cause', 'effect', 'uplift'],
    },
  },
  {
    name: 'causal_query',
    description: 'Query causal effects to understand what actions cause what outcomes',
    inputSchema: {
      type: 'object',
      properties: {
        cause: { type: 'string', description: 'Filter by cause (optional)' },
        effect: { type: 'string', description: 'Filter by effect (optional)' },
        min_confidence: { type: 'number', description: 'Minimum confidence', default: 0.5 },
        min_uplift: { type: 'number', description: 'Minimum uplift', default: 0.0 },
        limit: { type: 'number', description: 'Maximum results', default: 10 },
      },
    },
  },
  {
    name: 'learner_discover',
    description: 'Automatically discover causal patterns from episode history',
    inputSchema: {
      type: 'object',
      properties: {
        min_attempts: { type: 'number', description: 'Minimum attempts required', default: 3 },
        min_success_rate: { type: 'number', description: 'Minimum success rate', default: 0.6 },
        min_confidence: {
          type: 'number',
          description: 'Minimum statistical confidence',
          default: 0.7,
        },
        dry_run: { type: 'boolean', description: 'Preview without storing', default: false },
      },
    },
  },
];

export async function handleCausalAddEdge(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const cause = args?.cause as string;
  const effect = args?.effect as string;
  const uplift = args?.uplift as number;
  const confidence = (args?.confidence as number) || 0.95;
  const sampleSize = (args?.sample_size as number) || 0;

  const edgeId = context.causalGraph.addCausalEdge({
    fromMemoryId: 0,
    fromMemoryType: cause as 'episode' | 'skill' | 'note' | 'fact',
    toMemoryId: 0,
    toMemoryType: effect as 'episode' | 'skill' | 'note' | 'fact',
    similarity: 0,
    uplift,
    confidence,
    sampleSize,
    evidenceIds: [],
  });
  return {
    content: [
      {
        type: 'text',
        text: `✅ Added causal edge #${edgeId}\n${cause} → ${effect}\nUplift: ${uplift}`,
      },
    ],
  };
}

export async function handleCausalQuery(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const cause = args?.cause as string | undefined;
  const effect = args?.effect as string | undefined;
  const minConfidence = (args?.min_confidence as number) || 0.5;
  const minUplift = (args?.min_uplift as number) || 0.0;
  const limit = (args?.limit as number) || 10;

  const edges = context.causalGraph.queryCausalEffects({
    interventionMemoryId: 0,
    interventionMemoryType: cause || '',
    outcomeMemoryId: effect ? 0 : undefined,
    minConfidence,
    minUplift,
  });
  const limited = edges.slice(0, limit);
  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Found ${edges.length} causal edges:\n\n` +
          limited
            .map(
              (edge, i) =>
                `${i + 1}. ${edge.fromMemoryType} → ${edge.toMemoryType}\n   Uplift: ${(edge.uplift || 0).toFixed(3)} (confidence: ${edge.confidence.toFixed(2)})`
            )
            .join('\n\n'),
      },
    ],
  };
}

export async function handleLearnerDiscover(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const minAttempts = (args?.min_attempts as number) || 3;
  const minSuccessRate = (args?.min_success_rate as number) || 0.6;
  const minConfidence = (args?.min_confidence as number) || 0.7;
  const dryRun = (args?.dry_run as boolean) || false;

  const discovered = await context.learner.discover({
    minAttempts,
    minSuccessRate,
    minConfidence,
    dryRun,
  });
  return {
    content: [
      {
        type: 'text',
        text:
          `🌙 Discovered ${discovered.length} causal patterns:\n\n` +
          discovered
            .slice(0, 10)
            .map(
              (edge, i) =>
                `${i + 1}. ${edge.fromMemoryType} → ${edge.toMemoryType}\n   Uplift: ${(edge.uplift || 0).toFixed(3)} (n=${edge.sampleSize || 0})`
            )
            .join('\n\n'),
      },
    ],
  };
}
