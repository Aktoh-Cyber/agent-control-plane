#!/usr/bin/env node
/**
 * AgentDB CLI - Command-line interface for frontier memory features
 * Refactored modular entry point
 *
 * Provides commands for:
 * - Causal memory graph operations
 * - Explainable recall with certificates
 * - Nightly learner automation
 * - Database management
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph.js';
import { CausalRecall } from '../controllers/CausalRecall.js';
import { EmbeddingService } from '../controllers/EmbeddingService.js';
import { ExplainableRecall } from '../controllers/ExplainableRecall.js';
import { NightlyLearner } from '../controllers/NightlyLearner.js';
import { ReflexionMemory } from '../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../controllers/SkillLibrary.js';
import { handleCausalCommands } from './commands/causal.js';
import { handleDbCommands } from './commands/database.js';
import { printHelp } from './commands/help.js';
import { handleLearnerCommands } from './commands/learner.js';
import { handleRecallCommands } from './commands/recall.js';
import { handleReflexionCommands } from './commands/reflexion.js';
import { handleSkillCommands } from './commands/skills.js';
import { CLIContext, log } from './commands/types.js';

class AgentDBCLI {
  private context?: CLIContext;

  async initialize(dbPath: string = './agentdb.db'): Promise<void> {
    // Initialize database
    const db = new Database(dbPath);

    // Configure for performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000');

    // Load schema if needed
    const schemaPath = path.join(__dirname, '../schemas/frontier-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
    }

    // Initialize embedding service
    const embedder = new EmbeddingService({
      model: 'all-MiniLM-L6-v2',
      dimension: 384,
      provider: 'transformers',
    });
    await embedder.initialize();

    // Initialize controllers
    const causalGraph = new CausalMemoryGraph(db);
    const explainableRecall = new ExplainableRecall(db);
    const causalRecall = new CausalRecall(db, embedder, causalGraph, explainableRecall);
    const nightlyLearner = new NightlyLearner(db, embedder, causalGraph);
    const reflexion = new ReflexionMemory(db, embedder);
    const skills = new SkillLibrary(db, embedder);

    this.context = {
      db,
      causalGraph,
      causalRecall,
      explainableRecall,
      nightlyLearner,
      reflexion,
      skills,
      embedder,
    };
  }

  getContext(): CLIContext {
    if (!this.context) {
      throw new Error('CLI not initialized. Call initialize() first.');
    }
    return this.context;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const cli = new AgentDBCLI();
  const dbPath = process.env.AGENTDB_PATH || './agentdb.db';

  try {
    await cli.initialize(dbPath);
    const ctx = cli.getContext();

    const command = args[0];
    const subcommand = args[1];

    if (command === 'causal') {
      await handleCausalCommands(ctx, subcommand, args.slice(2));
    } else if (command === 'recall') {
      await handleRecallCommands(ctx, subcommand, args.slice(2));
    } else if (command === 'learner') {
      await handleLearnerCommands(ctx, subcommand, args.slice(2));
    } else if (command === 'reflexion') {
      await handleReflexionCommands(ctx, subcommand, args.slice(2));
    } else if (command === 'skill') {
      await handleSkillCommands(ctx, subcommand, args.slice(2));
    } else if (command === 'db') {
      await handleDbCommands(ctx, subcommand, args.slice(2));
    } else {
      log.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
    }
  } catch (error) {
    log.error((error as Error).message);
    process.exit(1);
  }
}

// ESM entry point check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { AgentDBCLI };
