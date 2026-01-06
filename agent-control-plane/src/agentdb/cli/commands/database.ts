/**
 * Database command handlers for AgentDB CLI
 * Handles database statistics and management operations
 */
import { CLIContext, colors, log } from './types.js';

export async function dbStats(ctx: CLIContext): Promise<void> {
  log.header('\n📊 Database Statistics');

  const tables = [
    'causal_edges',
    'causal_experiments',
    'causal_observations',
    'certificates',
    'provenance_lineage',
    'episodes',
  ];

  console.log('\n' + '═'.repeat(80));
  tables.forEach((table) => {
    try {
      const count = ctx.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
        count: number;
      };
      console.log(
        `${colors.bright}${table}:${colors.reset} ${colors.cyan}${count.count}${colors.reset} records`
      );
    } catch (e) {
      console.log(`${colors.bright}${table}:${colors.reset} ${colors.yellow}N/A${colors.reset}`);
    }
  });
  console.log('═'.repeat(80));
}

export async function handleDbCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'stats') {
    await dbStats(ctx);
  } else {
    log.error(`Unknown db subcommand: ${subcommand}`);
    throw new Error(`Unknown db subcommand: ${subcommand}`);
  }
}
