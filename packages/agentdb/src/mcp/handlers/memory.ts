/**
 * Memory operation tool handlers (Reflexion, Recall, Pattern Management)
 * Handles: reflexion_store, reflexion_retrieve, reflexion_store_batch,
 *          recall_with_certificate, agentdb_pattern_store, agentdb_pattern_search,
 *          agentdb_pattern_stats, agentdb_pattern_store_batch
 */
import { BatchOperations } from '../../optimizations/BatchOperations.js';
import {
  handleSecurityError,
  validateArrayLength,
  validateBoolean,
  validateEnum,
  validateNumericRange,
  validateSessionId,
  validateTaskString,
} from '../../security/input-validation.js';
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';

export const memoryTools: ToolDefinition[] = [
  {
    name: 'reflexion_store',
    description: 'Store an episode with self-critique for reflexion-based learning',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session identifier' },
        task: { type: 'string', description: 'Task description' },
        reward: { type: 'number', description: 'Task reward (0-1)' },
        success: { type: 'boolean', description: 'Whether task succeeded' },
        critique: { type: 'string', description: 'Self-critique reflection' },
        input: { type: 'string', description: 'Task input' },
        output: { type: 'string', description: 'Task output' },
        latency_ms: { type: 'number', description: 'Execution latency' },
        tokens: { type: 'number', description: 'Tokens used' },
      },
      required: ['session_id', 'task', 'reward', 'success'],
    },
  },
  {
    name: 'reflexion_retrieve',
    description: 'Retrieve relevant past episodes for learning from experience',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task to find similar episodes for' },
        k: { type: 'number', description: 'Number of episodes to retrieve', default: 5 },
        only_failures: { type: 'boolean', description: 'Only retrieve failures' },
        only_successes: { type: 'boolean', description: 'Only retrieve successes' },
        min_reward: { type: 'number', description: 'Minimum reward threshold' },
      },
      required: ['task'],
    },
  },
  {
    name: 'reflexion_store_batch',
    description:
      'Batch store multiple episodes efficiently using transactions and parallel embedding generation. 3.3x faster than sequential reflexion_store calls (152 → 500 ops/sec). 🔄 PARALLEL-SAFE: Can be used alongside other batch operations.',
    inputSchema: {
      type: 'object',
      properties: {
        episodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'Session identifier' },
              task: { type: 'string', description: 'Task description' },
              reward: { type: 'number', description: 'Task reward (0-1)' },
              success: { type: 'boolean', description: 'Whether task succeeded' },
              critique: { type: 'string', description: 'Self-critique reflection' },
              input: { type: 'string', description: 'Task input' },
              output: { type: 'string', description: 'Task output' },
              latency_ms: { type: 'number', description: 'Execution latency' },
              tokens: { type: 'number', description: 'Tokens used' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
              metadata: { type: 'object', description: 'Additional metadata' },
            },
            required: ['session_id', 'task', 'reward', 'success'],
          },
          description: 'Array of episodes to store',
          minItems: 1,
          maxItems: 1000,
        },
        batch_size: {
          type: 'number',
          description: 'Batch size for processing (default: 100)',
          default: 100,
        },
        format: {
          type: 'string',
          enum: ['concise', 'detailed', 'json'],
          description: 'Response format (default: concise)',
          default: 'concise',
        },
      },
      required: ['episodes'],
    },
  },
  {
    name: 'recall_with_certificate',
    description: 'Retrieve memories with causal utility scoring and provenance certificate',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query for memory retrieval' },
        k: { type: 'number', description: 'Number of results', default: 12 },
        alpha: { type: 'number', description: 'Similarity weight', default: 0.7 },
        beta: { type: 'number', description: 'Causal uplift weight', default: 0.2 },
        gamma: { type: 'number', description: 'Recency weight', default: 0.1 },
      },
      required: ['query'],
    },
  },
  {
    name: 'agentdb_pattern_store',
    description: 'Store reasoning pattern with embedding, taskType, approach, and successRate',
    inputSchema: {
      type: 'object',
      properties: {
        taskType: {
          type: 'string',
          description: 'Type of task (e.g., "code_review", "data_analysis")',
        },
        approach: { type: 'string', description: 'Description of the reasoning approach' },
        successRate: { type: 'number', description: 'Success rate (0-1)', default: 0.0 },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['taskType', 'approach', 'successRate'],
    },
  },
  {
    name: 'agentdb_pattern_search',
    description: 'Search patterns with taskEmbedding, k, threshold, and filters',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description to search for' },
        k: { type: 'number', description: 'Number of results to return', default: 10 },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold (0-1)',
          default: 0.0,
        },
        filters: {
          type: 'object',
          properties: {
            taskType: { type: 'string', description: 'Filter by task type' },
            minSuccessRate: { type: 'number', description: 'Minimum success rate' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          },
          description: 'Optional filters',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'agentdb_pattern_stats',
    description:
      'Get pattern statistics including total patterns, success rates, and top task types',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'agentdb_pattern_store_batch',
    description:
      'Batch store multiple reasoning patterns efficiently using transactions and parallel embedding generation. 4x faster than sequential agentdb_pattern_store calls. 🔄 PARALLEL-SAFE: Can be used alongside other batch operations.',
    inputSchema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskType: {
                type: 'string',
                description: 'Type of task (e.g., "code_review", "data_analysis")',
              },
              approach: { type: 'string', description: 'Description of the reasoning approach' },
              successRate: { type: 'number', description: 'Success rate (0-1)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
              metadata: { type: 'object', description: 'Additional metadata' },
            },
            required: ['taskType', 'approach', 'successRate'],
          },
          description: 'Array of reasoning patterns to store',
          minItems: 1,
          maxItems: 500,
        },
        batch_size: {
          type: 'number',
          description: 'Batch size for processing (default: 50)',
          default: 50,
        },
        format: {
          type: 'string',
          enum: ['concise', 'detailed', 'json'],
          description: 'Response format (default: concise)',
          default: 'concise',
        },
      },
      required: ['patterns'],
    },
  },
];

export async function handleReflexionStore(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const episodeId = await context.reflexion.storeEpisode({
    sessionId: args?.session_id as string,
    task: args?.task as string,
    reward: args?.reward as number,
    success: args?.success as boolean,
    critique: (args?.critique as string) || '',
    input: (args?.input as string) || '',
    output: (args?.output as string) || '',
    latencyMs: (args?.latency_ms as number) || 0,
    tokensUsed: (args?.tokens as number) || 0,
  });
  return {
    content: [
      {
        type: 'text',
        text: `✅ Stored episode #${episodeId}\nTask: ${args?.task}\nReward: ${args?.reward}\nSuccess: ${args?.success}`,
      },
    ],
  };
}

export async function handleReflexionRetrieve(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const episodes = await context.reflexion.retrieveRelevant({
    task: args?.task as string,
    k: (args?.k as number) || 5,
    onlyFailures: args?.only_failures as boolean | undefined,
    onlySuccesses: args?.only_successes as boolean | undefined,
    minReward: args?.min_reward as number | undefined,
  });
  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Retrieved ${episodes.length} episodes:\n\n` +
          episodes
            .map(
              (ep, i) =>
                `${i + 1}. Episode ${ep.id}\n   Task: ${ep.task}\n   Reward: ${ep.reward.toFixed(2)}\n   Similarity: ${ep.similarity?.toFixed(3) || 'N/A'}`
            )
            .join('\n\n'),
      },
    ],
  };
}

export async function handleReflexionStoreBatch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  try {
    // Validate inputs
    const episodesArray = validateArrayLength(args?.episodes, 'episodes', 1, 1000);
    const batchSize = args?.batch_size
      ? validateNumericRange(args.batch_size, 'batch_size', 1, 1000)
      : 100;
    const format = args?.format
      ? validateEnum(args.format, 'format', ['concise', 'detailed', 'json'] as const)
      : 'concise';

    // Validate each episode
    const validatedEpisodes = episodesArray.map((ep: any, index: number) => {
      const sessionId = validateSessionId(ep.session_id);
      const task = validateTaskString(ep.task, `episodes[${index}].task`);
      const reward = validateNumericRange(ep.reward, `episodes[${index}].reward`, 0, 1);
      const success = validateBoolean(ep.success, `episodes[${index}].success`);

      return {
        sessionId,
        task,
        reward,
        success,
        critique: ep.critique || '',
        input: ep.input || '',
        output: ep.output || '',
        latencyMs: ep.latency_ms || 0,
        tokensUsed: ep.tokens || 0,
        tags: ep.tags || [],
        metadata: ep.metadata || {},
      };
    });

    // Use BatchOperations for efficient insertion
    const startTime = Date.now();
    const batchOpsConfig = new BatchOperations(context.db, context.embeddingService, {
      batchSize,
      parallelism: 4,
    });

    const insertedCount = await batchOpsConfig.insertEpisodes(validatedEpisodes);
    const duration = Date.now() - startTime;

    // Format response
    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                inserted: insertedCount,
                duration_ms: duration,
                batch_size: batchSize,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (format === 'detailed') {
      return {
        content: [
          {
            type: 'text',
            text:
              `✅ Batch episode storage completed!\n\n` +
              `📊 Performance:\n` +
              `   • Episodes Stored: ${insertedCount}\n` +
              `   • Duration: ${duration}ms\n` +
              `   • Throughput: ${(insertedCount / (duration / 1000)).toFixed(1)} episodes/sec\n` +
              `   • Batch Size: ${batchSize}\n` +
              `   • Parallelism: 4 workers\n\n` +
              `📈 Statistics:\n` +
              `   • Sessions: ${new Set(validatedEpisodes.map((e) => e.sessionId)).size}\n` +
              `   • Success Rate: ${((validatedEpisodes.filter((e) => e.success).length / validatedEpisodes.length) * 100).toFixed(1)}%\n` +
              `   • Avg Reward: ${(validatedEpisodes.reduce((sum, e) => sum + e.reward, 0) / validatedEpisodes.length).toFixed(3)}\n\n` +
              `🧠 All embeddings generated in parallel\n` +
              `💾 Transaction committed successfully`,
          },
        ],
      };
    } else {
      // Concise format (default)
      return {
        content: [
          {
            type: 'text',
            text: `✅ Stored ${insertedCount} episodes in ${duration}ms (${(insertedCount / (duration / 1000)).toFixed(1)} episodes/sec)`,
          },
        ],
      };
    }
  } catch (error: any) {
    const safeMessage = handleSecurityError(error);
    return {
      content: [
        {
          type: 'text',
          text:
            `❌ Batch episode storage failed: ${safeMessage}\n\n` +
            `💡 Troubleshooting:\n` +
            `   • Ensure all session_ids are valid (alphanumeric, hyphens, underscores)\n` +
            `   • Verify rewards are between 0 and 1\n` +
            `   • Check that episodes array has 1-1000 items\n` +
            `   • Ensure tasks are not empty or excessively long`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleRecallWithCertificate(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const query = args?.query as string;
  const k = (args?.k as number) || 12;

  const result = await context.causalRecall.recall(
    'mcp-' + Date.now(),
    query,
    k,
    undefined,
    'internal'
  );
  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Retrieved ${result.candidates.length} results:\n\n` +
          result.candidates
            .slice(0, 5)
            .map(
              (r, i) =>
                `${i + 1}. ${r.type} ${r.id}\n   Similarity: ${r.similarity.toFixed(3)}\n   Uplift: ${r.uplift?.toFixed(3) || '0.000'}`
            )
            .join('\n\n') +
          `\n\n📜 Certificate ID: ${result.certificate.id}`,
      },
    ],
  };
}

export async function handlePatternStore(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const taskType = args?.taskType as string;
  const approach = args?.approach as string;
  const successRate = args?.successRate as number;
  const tags = (args?.tags as string[]) || [];
  const metadata = (args?.metadata as Record<string, any>) || {};

  const patternId = await context.reasoningBank.storePattern({
    taskType,
    approach,
    successRate,
    tags,
    metadata,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Reasoning pattern stored successfully!\n\n` +
          `🆔 Pattern ID: ${patternId}\n` +
          `📋 Task Type: ${taskType}\n` +
          `💡 Approach: ${approach.substring(0, 100)}${approach.length > 100 ? '...' : ''}\n` +
          `📊 Success Rate: ${(successRate * 100).toFixed(1)}%\n` +
          `🏷️  Tags: ${tags.join(', ') || 'none'}\n` +
          `🧠 Embedding generated and stored`,
      },
    ],
  };
}

export async function handlePatternSearch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const task = args?.task as string;
  const k = (args?.k as number) || 10;
  const threshold = (args?.threshold as number) || 0.0;
  const filters = args?.filters as any;

  // Generate embedding for the task
  const taskEmbedding = await context.embeddingService.embed(task);

  const patterns = await context.reasoningBank.searchPatterns({
    taskEmbedding,
    k,
    threshold,
    filters: filters
      ? {
          taskType: filters.taskType,
          minSuccessRate: filters.minSuccessRate,
          tags: filters.tags,
        }
      : undefined,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Pattern search completed!\n\n` +
          `📊 Found: ${patterns.length} matching patterns\n` +
          `🎯 Query: ${task}\n` +
          `🎚️  Threshold: ${threshold.toFixed(2)}\n\n` +
          `Top Results:\n` +
          patterns
            .slice(0, 5)
            .map(
              (p, i) =>
                `${i + 1}. [ID: ${p.id}] ${p.taskType}\n` +
                `   Similarity: ${(p.similarity || 0).toFixed(3)}\n` +
                `   Success Rate: ${(p.successRate * 100).toFixed(1)}%\n` +
                `   Approach: ${p.approach.substring(0, 80)}${p.approach.length > 80 ? '...' : ''}\n` +
                `   Uses: ${p.uses || 0}`
            )
            .join('\n\n') +
          (patterns.length > 5 ? `\n\n... and ${patterns.length - 5} more patterns` : ''),
      },
    ],
  };
}

export async function handlePatternStats(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  // Check cache first (60s TTL)
  const cacheKey = 'pattern_stats';
  const cached = context.caches.stats.get(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: 'text',
          text: `${cached}\n\n⚡ (cached)`,
        },
      ],
    };
  }

  const stats = context.reasoningBank.getPatternStats();

  const output =
    `📊 Reasoning Pattern Statistics\n\n` +
    `📈 Overview:\n` +
    `   Total Patterns: ${stats.totalPatterns}\n` +
    `   Avg Success Rate: ${(stats.avgSuccessRate * 100).toFixed(1)}%\n` +
    `   Avg Uses per Pattern: ${stats.avgUses.toFixed(1)}\n` +
    `   High Performing (≥80%): ${stats.highPerformingPatterns}\n` +
    `   Recent (7 days): ${stats.recentPatterns}\n\n` +
    `🏆 Top Task Types:\n` +
    stats.topTaskTypes
      .slice(0, 10)
      .map((tt, i) => `   ${i + 1}. ${tt.taskType}: ${tt.count} patterns`)
      .join('\n') +
    (stats.topTaskTypes.length === 0 ? '   No patterns stored yet' : '');

  // Cache the result (60s TTL)
  context.caches.stats.set(cacheKey, output);

  return {
    content: [
      {
        type: 'text',
        text: output,
      },
    ],
  };
}

export async function handlePatternStoreBatch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  try {
    // Validate inputs
    const patternsArray = validateArrayLength(args?.patterns, 'patterns', 1, 500);
    const batchSize = args?.batch_size
      ? validateNumericRange(args.batch_size, 'batch_size', 1, 500)
      : 50;
    const format = args?.format
      ? validateEnum(args.format, 'format', ['concise', 'detailed', 'json'] as const)
      : 'concise';

    // Validate each pattern
    const validatedPatterns = patternsArray.map((pattern: any, index: number) => {
      const taskType = validateTaskString(pattern.taskType, `patterns[${index}].taskType`);
      const approach = validateTaskString(pattern.approach, `patterns[${index}].approach`);
      const successRate = validateNumericRange(
        pattern.successRate,
        `patterns[${index}].successRate`,
        0,
        1
      );

      return {
        taskType,
        approach,
        successRate,
        tags: pattern.tags || [],
        metadata: pattern.metadata || {},
      };
    });

    // Use BatchOperations for efficient insertion
    const startTime = Date.now();
    const batchOpsConfig = new BatchOperations(context.db, context.embeddingService, {
      batchSize,
      parallelism: 4,
    });

    const patternIds = await batchOpsConfig.insertPatterns(validatedPatterns);
    const duration = Date.now() - startTime;

    // Format response
    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                inserted: patternIds.length,
                pattern_ids: patternIds,
                duration_ms: duration,
                batch_size: batchSize,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (format === 'detailed') {
      return {
        content: [
          {
            type: 'text',
            text:
              `✅ Batch pattern storage completed!\n\n` +
              `📊 Performance:\n` +
              `   • Patterns Stored: ${patternIds.length}\n` +
              `   • Duration: ${duration}ms\n` +
              `   • Throughput: ${(patternIds.length / (duration / 1000)).toFixed(1)} patterns/sec\n` +
              `   • Batch Size: ${batchSize}\n` +
              `   • Parallelism: 4 workers\n\n` +
              `📈 Statistics:\n` +
              `   • Task Types: ${new Set(validatedPatterns.map((p) => p.taskType)).size}\n` +
              `   • Avg Success Rate: ${((validatedPatterns.reduce((sum, p) => sum + p.successRate, 0) / validatedPatterns.length) * 100).toFixed(1)}%\n` +
              `   • High Performing (≥80%): ${validatedPatterns.filter((p) => p.successRate >= 0.8).length}\n\n` +
              `🆔 Sample Pattern IDs: ${patternIds.slice(0, 5).join(', ')}${patternIds.length > 5 ? '...' : ''}\n` +
              `🧠 All embeddings generated in parallel\n` +
              `💾 Transaction committed successfully`,
          },
        ],
      };
    } else {
      // Concise format (default)
      return {
        content: [
          {
            type: 'text',
            text: `✅ Stored ${patternIds.length} patterns in ${duration}ms (${(patternIds.length / (duration / 1000)).toFixed(1)} patterns/sec)`,
          },
        ],
      };
    }
  } catch (error: any) {
    const safeMessage = handleSecurityError(error);
    return {
      content: [
        {
          type: 'text',
          text:
            `❌ Batch pattern storage failed: ${safeMessage}\n\n` +
            `💡 Troubleshooting:\n` +
            `   • Ensure taskType and approach are not empty\n` +
            `   • Verify successRate is between 0 and 1\n` +
            `   • Check that patterns array has 1-500 items\n` +
            `   • Avoid excessively long task types or approaches`,
        },
      ],
      isError: true,
    };
  }
}
