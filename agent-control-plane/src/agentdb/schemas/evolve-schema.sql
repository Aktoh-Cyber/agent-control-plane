-- ============================================================================
-- AgentDB Evolve Schema Extension
-- ============================================================================
-- Adds Evolve-specific node and edge types to the AgentDB graph.
-- These model the Evolve ecosystem topology: tool manifests, Synapse nodes,
-- tool blueprints, inference routes, and capabilities.
--
-- Compatible with: AgentDB 1.x, SQLite 3.35+
-- Idempotent: Yes (CREATE TABLE/INDEX IF NOT EXISTS)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- Node Types
-- ============================================================================

-- Evolve tool manifests -- published tools in the Evolve ecosystem
CREATE TABLE IF NOT EXISTS evolve_tool_manifests (
  tool_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  runtime TEXT NOT NULL CHECK(runtime IN ('wasm', 'oci')),
  input_schema JSON NOT NULL,
  output_schema JSON NOT NULL,
  checksum TEXT NOT NULL,
  signed_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_tools_name ON evolve_tool_manifests(name);
CREATE INDEX IF NOT EXISTS idx_evolve_tools_runtime ON evolve_tool_manifests(runtime);

-- Synapse network nodes -- hosts for tools and models
CREATE TABLE IF NOT EXISTS evolve_synapse_nodes (
  node_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('online', 'offline', 'degraded')),
  models JSON NOT NULL,  -- JSON array of model identifiers
  region TEXT,
  latency_ms REAL NOT NULL DEFAULT 0,
  last_seen INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_nodes_status ON evolve_synapse_nodes(status);
CREATE INDEX IF NOT EXISTS idx_evolve_nodes_region ON evolve_synapse_nodes(region);

-- Tool blueprints -- generation requests submitted to the Tool Factory
CREATE TABLE IF NOT EXISTS evolve_tool_blueprints (
  blueprint_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  input_schema JSON NOT NULL,
  output_schema JSON NOT NULL,
  runtime TEXT NOT NULL CHECK(runtime IN ('wasm', 'oci')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'building', 'compiled', 'failed')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_blueprints_status ON evolve_tool_blueprints(status);

-- Inference routes -- LLM Router routing rules
CREATE TABLE IF NOT EXISTS evolve_inference_routes (
  route_id TEXT PRIMARY KEY,
  model_pattern TEXT NOT NULL,
  cost_tier TEXT NOT NULL CHECK(cost_tier IN ('free', 'low', 'medium', 'high')),
  prefer_local BOOLEAN NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_routes_tier ON evolve_inference_routes(cost_tier);
CREATE INDEX IF NOT EXISTS idx_evolve_routes_active ON evolve_inference_routes(active);
CREATE INDEX IF NOT EXISTS idx_evolve_routes_priority ON evolve_inference_routes(priority);

-- Capability entries -- registered capabilities in the Evolve ecosystem
CREATE TABLE IF NOT EXISTS evolve_capabilities (
  capability_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('tool', 'model', 'protocol')),
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  metadata JSON,
  registered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evolve_caps_category ON evolve_capabilities(category);
CREATE INDEX IF NOT EXISTS idx_evolve_caps_name ON evolve_capabilities(name);

-- ============================================================================
-- Edge Types (Relationships)
-- ============================================================================

-- HOSTED_ON: tool_manifest -> synapse_node
CREATE TABLE IF NOT EXISTS evolve_edge_hosted_on (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  deployed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  status TEXT NOT NULL CHECK(status IN ('active', 'draining', 'inactive')),
  FOREIGN KEY(tool_id) REFERENCES evolve_tool_manifests(tool_id) ON DELETE CASCADE,
  FOREIGN KEY(node_id) REFERENCES evolve_synapse_nodes(node_id) ON DELETE CASCADE,
  UNIQUE(tool_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_evolve_hosted_tool ON evolve_edge_hosted_on(tool_id);
CREATE INDEX IF NOT EXISTS idx_evolve_hosted_node ON evolve_edge_hosted_on(node_id);

-- GENERATED_BY: tool_manifest -> tool_blueprint
CREATE TABLE IF NOT EXISTS evolve_edge_generated_by (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  blueprint_id TEXT NOT NULL,
  generated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  build_duration_ms INTEGER NOT NULL,
  FOREIGN KEY(tool_id) REFERENCES evolve_tool_manifests(tool_id) ON DELETE CASCADE,
  FOREIGN KEY(blueprint_id) REFERENCES evolve_tool_blueprints(blueprint_id) ON DELETE CASCADE,
  UNIQUE(tool_id, blueprint_id)
);

-- DEPLOYED_TO: tool_blueprint -> synapse_node
CREATE TABLE IF NOT EXISTS evolve_edge_deployed_to (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blueprint_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  requested_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  status TEXT NOT NULL CHECK(status IN ('pending', 'deploying', 'deployed', 'failed')),
  FOREIGN KEY(blueprint_id) REFERENCES evolve_tool_blueprints(blueprint_id) ON DELETE CASCADE,
  FOREIGN KEY(node_id) REFERENCES evolve_synapse_nodes(node_id) ON DELETE CASCADE,
  UNIQUE(blueprint_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_evolve_deployed_status ON evolve_edge_deployed_to(status);

-- ROUTES_TO: inference_route -> synapse_node
CREATE TABLE IF NOT EXISTS evolve_edge_routes_to (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT 1,
  FOREIGN KEY(route_id) REFERENCES evolve_inference_routes(route_id) ON DELETE CASCADE,
  FOREIGN KEY(node_id) REFERENCES evolve_synapse_nodes(node_id) ON DELETE CASCADE,
  UNIQUE(route_id, node_id)
);

-- REQUIRES: capability -> capability (dependency graph)
CREATE TABLE IF NOT EXISTS evolve_edge_requires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_capability_id TEXT NOT NULL,
  target_capability_id TEXT NOT NULL,
  min_version TEXT,
  optional BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY(source_capability_id) REFERENCES evolve_capabilities(capability_id) ON DELETE CASCADE,
  FOREIGN KEY(target_capability_id) REFERENCES evolve_capabilities(capability_id) ON DELETE CASCADE,
  UNIQUE(source_capability_id, target_capability_id)
);

-- ============================================================================
-- Integration with existing AgentDB exp_nodes/exp_edges
-- ============================================================================
-- Register Evolve node kinds in the existing graph-aware recall system
-- so exp_nodes queries can discover Evolve entities.

INSERT OR IGNORE INTO exp_nodes (kind, label, payload)
VALUES ('evolve_registry', 'Evolve Tool Registry', '{"type":"evolve","description":"Root node for Evolve tool ecosystem"}');

INSERT OR IGNORE INTO exp_nodes (kind, label, payload)
VALUES ('evolve_registry', 'Evolve Synapse Network', '{"type":"evolve","description":"Root node for Synapse network topology"}');

INSERT OR IGNORE INTO exp_nodes (kind, label, payload)
VALUES ('evolve_registry', 'Evolve Inference Mesh', '{"type":"evolve","description":"Root node for LLM inference routing"}');

-- ============================================================================
-- Views
-- ============================================================================

-- Tools with their hosting nodes
CREATE VIEW IF NOT EXISTS v_evolve_tool_topology AS
SELECT
  tm.tool_id,
  tm.name as tool_name,
  tm.version,
  tm.runtime,
  sn.node_id,
  sn.name as node_name,
  sn.endpoint,
  sn.status as node_status,
  eh.status as deployment_status,
  eh.deployed_at
FROM evolve_tool_manifests tm
JOIN evolve_edge_hosted_on eh ON tm.tool_id = eh.tool_id
JOIN evolve_synapse_nodes sn ON eh.node_id = sn.node_id
ORDER BY tm.name, sn.name;

-- Active inference routes with target nodes
CREATE VIEW IF NOT EXISTS v_evolve_active_routes AS
SELECT
  ir.route_id,
  ir.model_pattern,
  ir.cost_tier,
  ir.priority,
  sn.node_id,
  sn.name as node_name,
  sn.latency_ms,
  er.weight
FROM evolve_inference_routes ir
JOIN evolve_edge_routes_to er ON ir.route_id = er.route_id
JOIN evolve_synapse_nodes sn ON er.node_id = sn.node_id
WHERE ir.active = 1 AND er.active = 1
ORDER BY ir.priority, er.weight DESC;

-- ============================================================================
-- Schema Version
-- ============================================================================
-- Version: 1.0.0 (Evolve Integration)
-- Node types: tool_manifest, synapse_node, tool_blueprint, inference_route,
--             capability_entry
-- Edge types: HOSTED_ON, GENERATED_BY, DEPLOYED_TO, ROUTES_TO, REQUIRES
-- Compatible with: AgentDB 1.x, frontier-schema.sql
-- ============================================================================
