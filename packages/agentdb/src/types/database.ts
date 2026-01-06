/**
 * Database Type Definitions
 *
 * Provides type-safe interfaces for sql.js and better-sqlite3 compatible databases
 * Replaces all `type Database = any` instances across the codebase
 */

/**
 * Statement execution result from run() operations
 */
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

/**
 * Prepared SQL statement interface
 * Compatible with both better-sqlite3 and sql.js wrappers
 */
export interface Statement<T = any> {
  /**
   * Execute statement without returning rows (INSERT, UPDATE, DELETE)
   */
  run(...params: any[]): RunResult;

  /**
   * Get a single row result
   */
  get(...params: any[]): T | undefined;

  /**
   * Get all matching rows
   */
  all(...params: any[]): T[];

  /**
   * Finalize/free the statement
   */
  finalize(): void;
}

/**
 * Transaction options for database operations
 */
export interface TransactionOptions {
  /**
   * Transaction mode (default: 'deferred')
   */
  mode?: 'deferred' | 'immediate' | 'exclusive';
}

/**
 * Database constructor options
 */
export interface DatabaseOptions {
  /**
   * Enable read-only mode
   */
  readonly?: boolean;

  /**
   * File must exist (throws if not found)
   */
  fileMustExist?: boolean;

  /**
   * Timeout in milliseconds for busy operations
   */
  timeout?: number;

  /**
   * Enable verbose logging
   */
  verbose?: (message: string) => void;

  /**
   * Number of threads for WASM operations (sql.js specific)
   */
  nThreads?: number;
}

/**
 * Main Database interface
 * Compatible with both better-sqlite3 and sql.js wrapper
 */
export interface Database {
  /**
   * Prepare a SQL statement for execution
   */
  prepare<T = any>(sql: string): Statement<T>;

  /**
   * Execute raw SQL (for schema creation, no parameters)
   */
  exec(sql: string): any;

  /**
   * Set or get PRAGMA values
   */
  pragma(pragma: string, options?: { simple?: boolean }): any;

  /**
   * Create a transaction function
   * Returns a function that executes the callback in a transaction
   */
  transaction<T extends (...args: any[]) => any>(fn: T): T;

  /**
   * Close the database connection
   */
  close(): void;

  /**
   * Save database to file (sql.js specific)
   */
  save?(): void;
}

/**
 * Database row types for common AgentDB tables
 */

export interface LearningSessionRow {
  id: string;
  user_id: string;
  session_type: string;
  config: string; // JSON
  start_time: number;
  end_time: number | null;
  status: string;
  metadata: string | null; // JSON
}

export interface LearningExperienceRow {
  id: number;
  session_id: string;
  state: string;
  action: string;
  reward: number;
  next_state: string | null;
  success: number; // 0 or 1
  timestamp: number;
  metadata: string | null; // JSON
}

export interface LearningPolicyRow {
  id: number;
  session_id: string;
  state_action_pairs: string; // JSON
  q_values: string; // JSON
  visit_counts: string; // JSON
  avg_rewards: string; // JSON
  version: number;
  created_at: number;
}

export interface LearningStateEmbeddingRow {
  id: number;
  session_id: string;
  state: string;
  embedding: Buffer;
}

export interface MemoryRow {
  id: number;
  content: string;
  embedding: Buffer;
  metadata: string | null; // JSON
  created_at: number;
}

export interface CausalEdgeRow {
  id: number;
  from_memory_id: number;
  to_memory_id: number;
  edge_type: string;
  strength: number;
  uplift: number;
  confidence: number;
  evidence: string | null; // JSON
  created_at: number;
}

export interface ReflexionTrajectoryRow {
  id: number;
  episode_id: string;
  task: string;
  actions: string; // JSON array
  observations: string; // JSON array
  reflection: string | null;
  verdict: string;
  score: number;
  created_at: number;
}

export interface SkillRow {
  id: number;
  skill_name: string;
  description: string;
  code: string;
  success_count: number;
  failure_count: number;
  avg_execution_time_ms: number;
  created_at: number;
  updated_at: number;
}

export interface SyncCheckpointRow {
  id: number;
  peer_id: string;
  last_sync_time: number;
  checkpoint_data: Buffer;
  version: number;
}

/**
 * Type guard to check if a database implementation is available
 */
export function isDatabaseInstance(obj: any): obj is Database {
  return (
    obj &&
    typeof obj.prepare === 'function' &&
    typeof obj.exec === 'function' &&
    typeof obj.close === 'function'
  );
}

/**
 * Helper type for row results with JSON parsing
 */
export type WithParsedJson<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] extends string ? any : T[P];
};
