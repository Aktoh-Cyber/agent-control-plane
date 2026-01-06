/**
 * Shared types and utilities for AgentDB CLI commands
 */
import Database from 'better-sqlite3';
import { CausalMemoryGraph } from '../../controllers/CausalMemoryGraph.js';
import { CausalRecall } from '../../controllers/CausalRecall.js';
import { EmbeddingService } from '../../controllers/EmbeddingService.js';
import { ExplainableRecall } from '../../controllers/ExplainableRecall.js';
import { NightlyLearner } from '../../controllers/NightlyLearner.js';
import { ReflexionMemory } from '../../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../../controllers/SkillLibrary.js';

// Color codes for terminal output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

export const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

export interface CLIContext {
  db: Database.Database;
  causalGraph: CausalMemoryGraph;
  causalRecall: CausalRecall;
  explainableRecall: ExplainableRecall;
  nightlyLearner: NightlyLearner;
  reflexion: ReflexionMemory;
  skills: SkillLibrary;
  embedder: EmbeddingService;
}
