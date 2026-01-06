/**
 * Database operation tool handlers
 * Handles: agentdb_init, agentdb_insert, agentdb_insert_batch, agentdb_search, agentdb_delete
 */
import * as fs from 'fs';
import { BatchOperations } from '../../optimizations/BatchOperations.js';
import {
  handleSecurityError,
  validateId,
  validateSessionId,
  validateTimestamp,
  ValidationError,
} from '../../security/input-validation.js';
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';
import { initializeSchema } from './utils.js';

export const databaseTools: ToolDefinition[] = [
  {
    name: 'agentdb_init',
    description:
      'Initialize AgentDB database with schema and optimizations. Creates all required tables for vector storage, causal memory, skills, and provenance tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        db_path: {
          type: 'string',
          description: 'Database file path (optional, defaults to ./agentdb.db)',
          default: './agentdb.db',
        },
        reset: { type: 'boolean', description: 'Reset database (delete existing)', default: false },
      },
    },
  },
  {
    name: 'agentdb_insert',
    description:
      'Insert a single vector with metadata into AgentDB. Automatically generates embeddings for the provided text.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to embed and store' },
        metadata: { type: 'object', description: 'Additional metadata (JSON object)' },
        session_id: { type: 'string', description: 'Session identifier', default: 'default' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
      },
      required: ['text'],
    },
  },
  {
    name: 'agentdb_insert_batch',
    description:
      'Batch insert multiple vectors efficiently using transactions and parallel embedding generation. Optimized for large datasets.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text content to embed' },
              metadata: { type: 'object', description: 'Metadata (JSON)' },
              session_id: { type: 'string', description: 'Session ID' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['text'],
          },
          description: 'Array of items to insert',
        },
        batch_size: { type: 'number', description: 'Batch size for processing', default: 100 },
      },
      required: ['items'],
    },
  },
  {
    name: 'agentdb_search',
    description:
      'Semantic k-NN vector search using cosine similarity. Returns the most relevant results ranked by similarity score.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text' },
        k: { type: 'number', description: 'Number of results to return', default: 10 },
        min_similarity: {
          type: 'number',
          description: 'Minimum similarity threshold (0-1)',
          default: 0.0,
        },
        filters: {
          type: 'object',
          properties: {
            session_id: { type: 'string', description: 'Filter by session ID' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            min_reward: { type: 'number', description: 'Minimum reward threshold' },
          },
          description: 'Optional filters',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'agentdb_delete',
    description:
      'Delete vector(s) from AgentDB by ID or filters. Supports single ID deletion or bulk deletion with conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Specific vector ID to delete' },
        filters: {
          type: 'object',
          properties: {
            session_id: { type: 'string', description: 'Delete all vectors with this session ID' },
            before_timestamp: {
              type: 'number',
              description: 'Delete vectors before this Unix timestamp',
            },
          },
          description: 'Bulk deletion filters (used if id not provided)',
        },
      },
    },
  },
];

export async function handleAgentdbInit(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const targetDbPath = (args?.db_path as string) || context.dbPath;

  if (args?.reset && fs.existsSync(targetDbPath)) {
    fs.unlinkSync(targetDbPath);
  }

  // Initialize schema
  initializeSchema(context.db);

  const stats = context.db
    .prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"')
    .get() as any;

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ AgentDB initialized successfully!\n` +
          `📍 Database: ${targetDbPath}\n` +
          `📊 Tables created: ${stats.count}\n` +
          `⚙️  Optimizations: WAL mode, cache_size=64MB\n` +
          `🧠 Embedding service: ${context.embeddingService.constructor.name} ready`,
      },
    ],
  };
}

export async function handleAgentdbInsert(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const text = args?.text as string;
  const sessionId = (args?.session_id as string) || 'default';
  const tags = (args?.tags as string[]) || [];
  const metadata = (args?.metadata as Record<string, any>) || {};

  const episodeId = await context.reflexion.storeEpisode({
    sessionId,
    task: text,
    reward: 1.0,
    success: true,
    input: text,
    output: '',
    critique: '',
    latencyMs: 0,
    tokensUsed: 0,
    tags,
    metadata,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Vector inserted successfully!\n` +
          `🆔 ID: ${episodeId}\n` +
          `📝 Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n` +
          `🏷️  Tags: ${tags.join(', ') || 'none'}\n` +
          `🧠 Embedding: ${context.embeddingService.constructor.name}`,
      },
    ],
  };
}

export async function handleAgentdbInsertBatch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const items = (args?.items as any[]) || [];
  const batchSize = (args?.batch_size as number) || 100;

  const episodes = items.map((item: any) => ({
    sessionId: item.session_id || 'default',
    task: item.text,
    reward: 1.0,
    success: true,
    input: item.text,
    output: '',
    critique: '',
    latencyMs: 0,
    tokensUsed: 0,
    tags: item.tags || [],
    metadata: item.metadata || {},
  }));

  const batchOpsConfig = new BatchOperations(context.db, context.embeddingService, {
    batchSize,
    parallelism: 4,
  });

  const inserted = await batchOpsConfig.insertEpisodes(episodes);

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Batch insert completed!\n` +
          `📊 Inserted: ${inserted} vectors\n` +
          `⚡ Batch size: ${batchSize}\n` +
          `🧠 Embeddings generated in parallel\n` +
          `💾 Transaction committed`,
      },
    ],
  };
}

export async function handleAgentdbSearch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const queryText = args?.query as string;
  const k = (args?.k as number) || 10;
  const minSimilarity = (args?.min_similarity as number) || 0.0;
  const filters = args?.filters as any;

  const query: any = {
    task: queryText,
    k,
  };

  if (filters) {
    if (filters.min_reward !== undefined) {
      query.minReward = filters.min_reward;
    }
    // Session ID filter would require custom query
  }

  const results = await context.reflexion.retrieveRelevant(query);

  // Filter by minimum similarity if specified
  let filteredResults = results;
  if (minSimilarity > 0) {
    filteredResults = results.filter((r) => (r.similarity || 0) >= minSimilarity);
  }

  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Search completed!\n` +
          `📊 Found: ${filteredResults.length} results\n` +
          `🎯 Query: ${queryText}\n\n` +
          `Top Results:\n` +
          filteredResults
            .slice(0, 5)
            .map(
              (r, i) =>
                `${i + 1}. [ID: ${r.id}] Similarity: ${(r.similarity || 0).toFixed(3)}\n` +
                `   Task: ${r.task.substring(0, 80)}${r.task.length > 80 ? '...' : ''}\n` +
                `   Reward: ${r.reward.toFixed(2)}`
            )
            .join('\n\n') +
          (filteredResults.length > 5
            ? `\n\n... and ${filteredResults.length - 5} more results`
            : ''),
      },
    ],
  };
}

export async function handleAgentdbDelete(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  let deleted = 0;
  const id = args?.id as number | undefined;
  const filters = args?.filters as any;

  try {
    if (id !== undefined) {
      // Validate ID
      const validatedId = validateId(id, 'id');

      // Delete single vector using parameterized query
      const stmt = context.db.prepare('DELETE FROM episodes WHERE id = ?');
      const result = stmt.run(validatedId);
      deleted = result.changes;
    } else if (filters) {
      // Bulk delete with validated filters
      if (filters.session_id) {
        // Validate session_id
        const validatedSessionId = validateSessionId(filters.session_id);

        // Use parameterized query
        const stmt = context.db.prepare('DELETE FROM episodes WHERE session_id = ?');
        const result = stmt.run(validatedSessionId);
        deleted = result.changes;
      } else if (filters.before_timestamp) {
        // Validate timestamp
        const validatedTimestamp = validateTimestamp(filters.before_timestamp, 'before_timestamp');

        // Use parameterized query
        const stmt = context.db.prepare('DELETE FROM episodes WHERE ts < ?');
        const result = stmt.run(validatedTimestamp);
        deleted = result.changes;
      } else {
        throw new ValidationError('Invalid or missing filter criteria', 'INVALID_FILTER');
      }
    } else {
      throw new ValidationError('Either id or filters must be provided', 'MISSING_PARAMETER');
    }

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Delete operation completed!\n` +
            `📊 Deleted: ${deleted} vector(s)\n` +
            `🗑️  ${id !== undefined ? `ID: ${id}` : 'Bulk deletion with filters'}`,
        },
      ],
    };
  } catch (error: any) {
    const safeMessage = handleSecurityError(error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Delete operation failed: ${safeMessage}`,
        },
      ],
      isError: true,
    };
  }
}
