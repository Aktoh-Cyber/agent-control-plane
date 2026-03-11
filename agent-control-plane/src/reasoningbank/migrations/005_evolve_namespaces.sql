-- ============================================================================
-- Migration: 005_evolve_namespaces
-- Description: Register Evolve namespaces in the ReasoningBank for cross-system
--              learning, trajectory tracking, and pattern storage.
-- Source: Evolve integration (evolve/integrations/acp)
-- Compatible with: SQLite 3.35+
-- Idempotent: Yes (CREATE TABLE IF NOT EXISTS, INSERT OR REPLACE)
-- ============================================================================

-- Evolve namespace registry -- tracks which Evolve subsystems store reasoning
-- data in the ReasoningBank. This extends the existing memory_namespaces table
-- from 000_base_schema.sql with richer metadata specific to Evolve.

CREATE TABLE IF NOT EXISTS evolve_namespaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 90,
  max_entries_per_key INTEGER NOT NULL DEFAULT 500,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_namespaces_name ON evolve_namespaces(name);

-- Evolve reasoning entries -- individual entries stored by Evolve subsystems,
-- linked to their namespace for retention and quota enforcement.

CREATE TABLE IF NOT EXISTS evolve_reasoning_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namespace_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  session_id TEXT,
  task TEXT,
  input JSON,
  output JSON,
  reward REAL,
  success BOOLEAN,
  critique TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY(namespace_id) REFERENCES evolve_namespaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evolve_re_namespace_key
  ON evolve_reasoning_entries(namespace_id, key);

CREATE INDEX IF NOT EXISTS idx_evolve_re_session
  ON evolve_reasoning_entries(session_id);

CREATE INDEX IF NOT EXISTS idx_evolve_re_created
  ON evolve_reasoning_entries(created_at DESC);

-- ============================================================================
-- Seed Evolve Namespaces
-- ============================================================================
-- Uses INSERT OR REPLACE so re-running the migration updates descriptions
-- and retention settings without duplicating rows.

INSERT OR REPLACE INTO evolve_namespaces (name, description, retention_days, max_entries_per_key)
VALUES (
  'tool-generation',
  'Stores reasoning traces and outcomes from the Tool Factory code generation pipeline, including prompt engineering decisions, compilation results, and signing metadata',
  90,
  500
);

INSERT OR REPLACE INTO evolve_namespaces (name, description, retention_days, max_entries_per_key)
VALUES (
  'inference-routing',
  'Captures LLM Router decisions including tier selection, cost analysis, latency measurements, and model fallback chains across the 3-tier inference mesh',
  30,
  1000
);

INSERT OR REPLACE INTO evolve_namespaces (name, description, retention_days, max_entries_per_key)
VALUES (
  'workflows',
  'Stores workflow definitions, execution plans, and dependency graphs for cross-system orchestration spanning Agentopia, ACP, and Synapse',
  180,
  200
);

INSERT OR REPLACE INTO evolve_namespaces (name, description, retention_days, max_entries_per_key)
VALUES (
  'executions',
  'Records individual tool execution traces, including dispatch decisions, node selection rationale, timing data, and error diagnostics',
  60,
  2000
);

INSERT OR REPLACE INTO evolve_namespaces (name, description, retention_days, max_entries_per_key)
VALUES (
  'bridge-metrics',
  'Aggregated performance metrics from the Edge Bridge including MCP-to-SGA translation latencies, cache hit rates, and protocol conversion statistics',
  30,
  5000
);

-- Also register Evolve namespaces in the core memory_namespaces table
-- (from 000_base_schema.sql) so the existing namespace listing tools see them.

INSERT OR IGNORE INTO memory_namespaces (namespace, metadata)
VALUES ('evolve:tool-generation', '{"source":"evolve","retention_days":90}');

INSERT OR IGNORE INTO memory_namespaces (namespace, metadata)
VALUES ('evolve:inference-routing', '{"source":"evolve","retention_days":30}');

INSERT OR IGNORE INTO memory_namespaces (namespace, metadata)
VALUES ('evolve:workflows', '{"source":"evolve","retention_days":180}');

INSERT OR IGNORE INTO memory_namespaces (namespace, metadata)
VALUES ('evolve:executions', '{"source":"evolve","retention_days":60}');

INSERT OR IGNORE INTO memory_namespaces (namespace, metadata)
VALUES ('evolve:bridge-metrics', '{"source":"evolve","retention_days":30}');

-- ============================================================================
-- View: Active Evolve namespaces with entry counts
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_evolve_namespace_stats AS
SELECT
  en.name,
  en.description,
  en.retention_days,
  en.max_entries_per_key,
  COUNT(ere.id) as total_entries,
  MAX(ere.created_at) as last_entry_at
FROM evolve_namespaces en
LEFT JOIN evolve_reasoning_entries ere ON en.id = ere.namespace_id
GROUP BY en.id
ORDER BY en.name;

-- ============================================================================
-- Trigger: Auto-update the updated_at timestamp on namespace changes
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_evolve_namespace_updated
AFTER UPDATE ON evolve_namespaces
BEGIN
  UPDATE evolve_namespaces
  SET updated_at = strftime('%s', 'now')
  WHERE id = NEW.id;
END;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration adds:
-- 1. evolve_namespaces table for Evolve-specific namespace management
-- 2. evolve_reasoning_entries table for Evolve subsystem reasoning data
-- 3. 5 seed namespaces (tool-generation, inference-routing, workflows,
--    executions, bridge-metrics)
-- 4. Cross-registration in core memory_namespaces table
-- 5. Stats view and maintenance trigger
--
-- Usage: sqlite3 .swarm/memory.db < 005_evolve_namespaces.sql
-- ============================================================================
