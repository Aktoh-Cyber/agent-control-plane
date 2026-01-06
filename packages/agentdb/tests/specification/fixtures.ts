/**
 * Shared Test Fixtures for AgentDB Specification Tests
 * Provides common test data, database setup, and initialization utilities
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { CausalMemoryGraph } from '../../src/controllers/CausalMemoryGraph';
import { CausalRecall } from '../../src/controllers/CausalRecall';
import { EmbeddingService } from '../../src/controllers/EmbeddingService';
import { NightlyLearner } from '../../src/controllers/NightlyLearner';
import { ReflexionMemory } from '../../src/controllers/ReflexionMemory';
import { SkillLibrary } from '../../src/controllers/SkillLibrary';
import { BatchOperations } from '../../src/optimizations/BatchOperations';

export interface TestContext {
  db: Database.Database;
  embeddingService: EmbeddingService;
  causalGraph: CausalMemoryGraph;
  reflexion: ReflexionMemory;
  skills: SkillLibrary;
  causalRecall: CausalRecall;
  learner: NightlyLearner;
  batchOps: BatchOperations;
  dbPath: string;
}

export function getTestDbPath(name: string = 'test-agentdb.db'): string {
  return path.join(__dirname, '..', name);
}

export function initializeTestSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      session_id TEXT NOT NULL,
      task TEXT NOT NULL,
      input TEXT,
      output TEXT,
      critique TEXT,
      reward REAL NOT NULL,
      success INTEGER NOT NULL,
      latency_ms INTEGER,
      tokens_used INTEGER,
      tags TEXT,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_episodes_session ON episodes(session_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_task ON episodes(task);
    CREATE INDEX IF NOT EXISTS idx_episodes_reward ON episodes(reward);
    CREATE INDEX IF NOT EXISTS idx_episodes_success ON episodes(success);

    CREATE TABLE IF NOT EXISTS episode_embeddings (
      episode_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      signature TEXT,
      code TEXT,
      success_rate REAL DEFAULT 0.0,
      uses INTEGER DEFAULT 0,
      avg_reward REAL DEFAULT 0.0,
      avg_latency_ms REAL DEFAULT 0.0,
      tags TEXT,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_skills_success_rate ON skills(success_rate);

    CREATE TABLE IF NOT EXISTS skill_embeddings (
      skill_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS causal_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      from_memory_id INTEGER NOT NULL,
      from_memory_type TEXT NOT NULL,
      to_memory_id INTEGER NOT NULL,
      to_memory_type TEXT NOT NULL,
      similarity REAL DEFAULT 0.0,
      uplift REAL NOT NULL,
      confidence REAL DEFAULT 0.95,
      sample_size INTEGER DEFAULT 0,
      evidence_ids TEXT,
      confounder_score REAL,
      mechanism TEXT,
      metadata JSON
    );
    CREATE INDEX IF NOT EXISTS idx_causal_from ON causal_edges(from_memory_id, from_memory_type);
    CREATE INDEX IF NOT EXISTS idx_causal_to ON causal_edges(to_memory_id, to_memory_type);
    CREATE INDEX IF NOT EXISTS idx_causal_uplift ON causal_edges(uplift);

    CREATE TABLE IF NOT EXISTS causal_experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      name TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      treatment_id INTEGER NOT NULL,
      treatment_type TEXT NOT NULL,
      control_id INTEGER,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      sample_size INTEGER DEFAULT 0,
      treatment_mean REAL,
      control_mean REAL,
      uplift REAL,
      p_value REAL,
      confidence_interval_low REAL,
      confidence_interval_high REAL,
      status TEXT NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS causal_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      experiment_id INTEGER NOT NULL,
      episode_id INTEGER NOT NULL,
      is_treatment INTEGER NOT NULL,
      outcome_value REAL NOT NULL,
      outcome_type TEXT NOT NULL,
      context TEXT,
      FOREIGN KEY (experiment_id) REFERENCES causal_experiments(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS provenance_certificates (
      id TEXT PRIMARY KEY,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      query_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      query_text TEXT NOT NULL,
      retrieval_method TEXT NOT NULL,
      source_ids TEXT NOT NULL,
      certificate_hash TEXT NOT NULL,
      metadata TEXT
    );
  `);
}

export async function setupTestContext(dbName: string = 'test-agentdb.db'): Promise<TestContext> {
  const dbPath = getTestDbPath(dbName);

  // Clean up any existing test database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Initialize database
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');

  // Initialize schema
  initializeTestSchema(db);

  // Initialize embedding service
  const embeddingService = new EmbeddingService({
    model: 'Xenova/all-MiniLM-L6-v2',
    dimension: 384,
    provider: 'transformers',
  });
  await embeddingService.initialize();

  // Initialize controllers
  const causalGraph = new CausalMemoryGraph(db);
  const reflexion = new ReflexionMemory(db, embeddingService);
  const skills = new SkillLibrary(db, embeddingService);
  const causalRecall = new CausalRecall(db, embeddingService);
  const learner = new NightlyLearner(db, embeddingService);
  const batchOps = new BatchOperations(db, embeddingService);

  return {
    db,
    embeddingService,
    causalGraph,
    reflexion,
    skills,
    causalRecall,
    learner,
    batchOps,
    dbPath,
  };
}

export function cleanupTestContext(ctx: TestContext): void {
  ctx.db.close();
  if (fs.existsSync(ctx.dbPath)) {
    fs.unlinkSync(ctx.dbPath);
  }
}

export function clearTestData(db: Database.Database): void {
  db.prepare('DELETE FROM episodes').run();
  db.prepare('DELETE FROM episode_embeddings').run();
  db.prepare('DELETE FROM skills').run();
  db.prepare('DELETE FROM skill_embeddings').run();
  db.prepare('DELETE FROM causal_edges').run();
  db.prepare('DELETE FROM causal_experiments').run();
  db.prepare('DELETE FROM causal_observations').run();
  db.prepare('DELETE FROM provenance_certificates').run();
}
