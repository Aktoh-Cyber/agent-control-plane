/**
 * Admin and utility tool handlers
 * Handles: db_stats, agentdb_stats, agentdb_clear_cache
 */
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';
import { safeCount } from './utils.js';

export const adminTools: ToolDefinition[] = [
  {
    name: 'db_stats',
    description: 'Get database statistics showing record counts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'agentdb_stats',
    description:
      'Get comprehensive database statistics including table counts, storage usage, and performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: { type: 'boolean', description: 'Include detailed statistics', default: false },
      },
    },
  },
  {
    name: 'agentdb_clear_cache',
    description: 'Clear query cache to refresh statistics and search results',
    inputSchema: {
      type: 'object',
      properties: {
        cache_type: {
          type: 'string',
          description: 'Type of cache to clear (all, patterns, stats)',
          enum: ['all', 'patterns', 'stats'],
          default: 'all',
        },
      },
    },
  },
];

export async function handleDbStats(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const stats: Record<string, number> = {
    causal_edges:
      (context.db.prepare('SELECT COUNT(*) as count FROM causal_edges').get() as any)?.count || 0,
    causal_experiments:
      (context.db.prepare('SELECT COUNT(*) as count FROM causal_experiments').get() as any)
        ?.count || 0,
    causal_observations:
      (context.db.prepare('SELECT COUNT(*) as count FROM causal_observations').get() as any)
        ?.count || 0,
    episodes:
      (context.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)?.count || 0,
    episode_embeddings:
      (context.db.prepare('SELECT COUNT(*) as count FROM episode_embeddings').get() as any)
        ?.count || 0,
    skills: (context.db.prepare('SELECT COUNT(*) as count FROM skills').get() as any)?.count || 0,
  };
  return {
    content: [
      {
        type: 'text',
        text:
          `📊 Database Statistics:\n\n` +
          `Causal Edges: ${stats.causal_edges}\n` +
          `Experiments: ${stats.causal_experiments}\n` +
          `Observations: ${stats.causal_observations}\n` +
          `Episodes (Vectors): ${stats.episodes}\n` +
          `Episode Embeddings: ${stats.episode_embeddings}\n` +
          `Skills: ${stats.skills}`,
      },
    ],
  };
}

export async function handleAgentdbStats(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const detailed = (args?.detailed as boolean) || false;

  // Check cache first (60s TTL)
  const cacheKey = `stats:${detailed ? 'detailed' : 'summary'}`;
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

  const stats: Record<string, number> = {
    causal_edges: safeCount(context.db, 'causal_edges'),
    causal_experiments: safeCount(context.db, 'causal_experiments'),
    causal_observations: safeCount(context.db, 'causal_observations'),
    episodes: safeCount(context.db, 'episodes'),
    episode_embeddings: safeCount(context.db, 'episode_embeddings'),
    skills: safeCount(context.db, 'skills'),
    skill_embeddings: safeCount(context.db, 'skill_embeddings'),
    reasoning_patterns: safeCount(context.db, 'reasoning_patterns'),
    pattern_embeddings: safeCount(context.db, 'pattern_embeddings'),
    learning_sessions: safeCount(context.db, 'rl_sessions'),
  };

  let output =
    `📊 AgentDB Comprehensive Statistics\n\n` +
    `🧠 Memory & Learning:\n` +
    `   Episodes (Vectors): ${stats.episodes}\n` +
    `   Episode Embeddings: ${stats.episode_embeddings}\n` +
    `   Skills: ${stats.skills}\n` +
    `   Skill Embeddings: ${stats.skill_embeddings}\n` +
    `   Reasoning Patterns: ${stats.reasoning_patterns}\n` +
    `   Pattern Embeddings: ${stats.pattern_embeddings}\n` +
    `   Learning Sessions: ${stats.learning_sessions}\n\n` +
    `🔗 Causal Intelligence:\n` +
    `   Causal Edges: ${stats.causal_edges}\n` +
    `   Experiments: ${stats.causal_experiments}\n` +
    `   Observations: ${stats.causal_observations}\n`;

  if (detailed) {
    // Add storage statistics
    const dbStats = context.db
      .prepare(
        `
      SELECT page_count * page_size as total_bytes
      FROM pragma_page_count(), pragma_page_size()
    `
      )
      .get() as any;

    const totalMB = (dbStats.total_bytes / (1024 * 1024)).toFixed(2);

    // Add recent activity stats
    const recentActivity = context.db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM episodes
      WHERE ts >= strftime('%s', 'now', '-7 days')
    `
      )
      .get() as any;

    output +=
      `\n📦 Storage:\n` +
      `   Database Size: ${totalMB} MB\n` +
      `   Recent Activity (7d): ${recentActivity.count} episodes\n`;
  }

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

export async function handleClearCache(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const cacheType = (args?.cache_type as string) || 'all';

  let cleared = 0;

  switch (cacheType) {
    case 'patterns':
      cleared += context.caches.patterns.clear();
      context.reasoningBank.clearCache();
      break;
    case 'stats':
      cleared += context.caches.stats.clear();
      cleared += context.caches.metrics.clear();
      break;
    case 'all':
      context.caches.clearAll();
      context.reasoningBank.clearCache();
      cleared = -1; // All cleared
      break;
  }

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Cache cleared successfully!\n\n` +
          `🧹 Cache Type: ${cacheType}\n` +
          `♻️  ${cleared === -1 ? 'All caches' : `${cleared} cache entries`} cleared\n` +
          `📊 Statistics and search results will be refreshed on next query`,
      },
    ],
  };
}
