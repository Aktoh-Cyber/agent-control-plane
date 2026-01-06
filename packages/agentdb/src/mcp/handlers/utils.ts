/**
 * Shared utility functions for MCP tool handlers
 */

/**
 * Serialize embedding to BLOB
 */
export function serializeEmbedding(embedding: Float32Array): Buffer {
  return Buffer.from(embedding.buffer);
}

/**
 * Deserialize embedding from BLOB
 */
export function deserializeEmbedding(blob: Buffer): Float32Array {
  return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Initialize database schema
 */
export function initializeSchema(database: any): void {
  const db = database;
  // Episodes table (vector store)
  db.exec(`
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
  `);

  // Episode embeddings (vector storage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS episode_embeddings (
      episode_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );
  `);

  // Skills table
  db.exec(`
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
  `);

  // Skill embeddings
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_embeddings (
      skill_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );
  `);

  // Causal edges table
  db.exec(`
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
      experiment_ids TEXT,
      confounder_score REAL DEFAULT 0.0,
      mechanism TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_causal_from ON causal_edges(from_memory_id, from_memory_type);
    CREATE INDEX IF NOT EXISTS idx_causal_to ON causal_edges(to_memory_id, to_memory_type);
    CREATE INDEX IF NOT EXISTS idx_causal_uplift ON causal_edges(uplift);
  `);

  // Causal experiments
  db.exec(`
    CREATE TABLE IF NOT EXISTS causal_experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      intervention_id INTEGER NOT NULL,
      control_outcome REAL NOT NULL,
      treatment_outcome REAL NOT NULL,
      uplift REAL NOT NULL,
      sample_size INTEGER DEFAULT 1,
      metadata TEXT
    );
  `);

  // Causal observations
  db.exec(`
    CREATE TABLE IF NOT EXISTS causal_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER DEFAULT (strftime('%s', 'now')),
      action TEXT NOT NULL,
      outcome TEXT NOT NULL,
      reward REAL NOT NULL,
      session_id TEXT,
      metadata TEXT
    );
  `);

  // Provenance certificates
  db.exec(`
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

/**
 * Safe table count helper
 */
export function safeCount(db: any, tableName: string): number {
  try {
    return (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any)?.count || 0;
  } catch {
    return 0; // Table doesn't exist
  }
}
