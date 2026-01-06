#!/usr/bin/env node
/**
 * AgentDB MCP Server (Refactored)
 * Production-ready MCP server for Claude Desktop integration
 * Exposes AgentDB frontier memory features + core vector DB operations via MCP protocol
 *
 * REFACTORED: Now uses modular handler architecture for maintainability
 * Original file (2,317 lines) split into 11 modular files (<500 lines each)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph.js';
import { CausalRecall } from '../controllers/CausalRecall.js';
import { EmbeddingService } from '../controllers/EmbeddingService.js';
import { LearningSystem } from '../controllers/LearningSystem.js';
import { NightlyLearner } from '../controllers/NightlyLearner.js';
import { ReasoningBank } from '../controllers/ReasoningBank.js';
import { ReflexionMemory } from '../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../controllers/SkillLibrary.js';
import { createDatabase } from '../db-fallback.js';
import { BatchOperations } from '../optimizations/BatchOperations.js';
import { MCPToolCaches } from '../optimizations/ToolCache.js';
import { allTools, executeToolHandler } from './handlers/index.js';
import type { HandlerContext } from './handlers/types.js';
import { initializeSchema } from './handlers/utils.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Initialize Database and Controllers
// ============================================================================
const dbPath = process.env.AGENTDB_PATH || './agentdb.db';
const db = await createDatabase(dbPath);

// Configure for performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');

// Initialize schema automatically on server start using SQL files
const schemaPath = path.join(__dirname, '../schemas/schema.sql');
const frontierSchemaPath = path.join(__dirname, '../schemas/frontier-schema.sql');

try {
  if (fs.existsSync(schemaPath)) {
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSQL);
    console.error('✅ Main schema loaded');
  }

  if (fs.existsSync(frontierSchemaPath)) {
    const frontierSQL = fs.readFileSync(frontierSchemaPath, 'utf-8');
    db.exec(frontierSQL);
    console.error('✅ Frontier schema loaded');
  }

  console.error('✅ Database schema initialized');
} catch (error) {
  console.error('⚠️  Schema initialization failed, using fallback:', (error as Error).message);
  // Fallback to initializeSchema function if SQL files not found
  initializeSchema(db);
}

// Initialize embedding service
const embeddingService = new EmbeddingService({
  model: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  provider: 'transformers',
});
await embeddingService.initialize();

// Initialize all controllers
const causalGraph = new CausalMemoryGraph(db);
const reflexion = new ReflexionMemory(db, embeddingService);
const skills = new SkillLibrary(db, embeddingService);
const causalRecall = new CausalRecall(db, embeddingService);
const learner = new NightlyLearner(db, embeddingService);
const learningSystem = new LearningSystem(db, embeddingService);
const batchOps = new BatchOperations(db, embeddingService);
const reasoningBank = new ReasoningBank(db, embeddingService);
const caches = new MCPToolCaches();

// Create handler context
const handlerContext: HandlerContext = {
  db,
  embeddingService,
  causalGraph,
  reflexion,
  skills,
  causalRecall,
  learner,
  learningSystem,
  batchOps,
  reasoningBank,
  caches,
  dbPath,
};

// ============================================================================
// MCP Server Setup
// ============================================================================
const server = new Server(
  {
    name: 'agentdb',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// Tool Handlers (Modular)
// ============================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await executeToolHandler(name, args || {}, handlerContext);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}\n${error.stack || ''}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Start Server
// ============================================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('🚀 AgentDB MCP Server v2.0.0 running on stdio');
  console.error(`📦 ${allTools.length} tools available (modular architecture)`);
  console.error('🧠 Embedding service initialized');
  console.error('🎓 Learning system ready (9 RL algorithms)');
  console.error(
    '⚡ NEW v2.0: Modular handlers, batch operations (3-4x faster), enhanced validation'
  );
  console.error(
    '🔬 Features: transfer learning, XAI explanations, reward shaping, intelligent caching'
  );

  // Keep the process alive - the StdioServerTransport handles stdin/stdout
  // but we need to ensure Node.js doesn't exit when main() completes

  // Use setInterval to keep event loop alive (like many MCP servers do)
  // This ensures the process doesn't exit even if stdin closes
  const keepAlive = setInterval(
    () => {
      // Empty interval just to keep event loop alive
    },
    1000 * 60 * 60
  ); // Every hour (basically forever)

  // Handle graceful shutdown
  const shutdown = () => {
    clearInterval(keepAlive);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Return a never-resolving promise
  return new Promise(() => {
    // The setInterval above keeps the event loop alive
    // StdioServerTransport handles all MCP communication
  });
}

main().catch(console.error);
