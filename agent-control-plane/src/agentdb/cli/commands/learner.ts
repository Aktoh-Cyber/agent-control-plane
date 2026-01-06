/**
 * Learner command handlers for AgentDB CLI
 * Handles nightly learner automation and causal edge discovery
 */
import { CLIContext, colors, log } from './types.js';

export async function learnerRun(
  ctx: CLIContext,
  params: {
    minAttempts?: number;
    minSuccessRate?: number;
    minConfidence?: number;
    dryRun?: boolean;
  }
): Promise<void> {
  log.header('\n🌙 Running Nightly Learner');
  log.info(`Min Attempts: ${params.minAttempts || 3}`);
  log.info(`Min Success Rate: ${params.minSuccessRate || 0.6}`);
  log.info(`Min Confidence: ${params.minConfidence || 0.7}`);

  const startTime = Date.now();

  const discovered = await ctx.nightlyLearner.discover({
    minAttempts: params.minAttempts || 3,
    minSuccessRate: params.minSuccessRate || 0.6,
    minConfidence: params.minConfidence || 0.7,
    dryRun: params.dryRun || false,
  });

  const duration = Date.now() - startTime;

  log.success(`Discovered ${discovered.length} causal edges in ${(duration / 1000).toFixed(1)}s`);

  if (discovered.length > 0) {
    console.log('\n' + '═'.repeat(80));
    discovered.slice(0, 10).forEach((edge: any, i: number) => {
      console.log(`${colors.bright}#${i + 1}: ${edge.cause} → ${edge.effect}${colors.reset}`);
      console.log(
        `  Uplift: ${colors.green}${edge.uplift.toFixed(3)}${colors.reset} (CI: ${edge.confidence.toFixed(2)})`
      );
      console.log(`  Sample size: ${edge.sampleSize}`);
      console.log('─'.repeat(80));
    });
  }
}

export async function learnerPrune(
  ctx: CLIContext,
  params: {
    minConfidence?: number;
    minUplift?: number;
    maxAgeDays?: number;
  }
): Promise<void> {
  log.header('\n🧹 Pruning Low-Quality Edges');

  const pruned = await ctx.nightlyLearner.pruneEdges(params);

  log.success(`Pruned ${pruned} edges`);
}

export async function handleLearnerCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'run') {
    await learnerRun(ctx, {
      minAttempts: args[0] ? parseInt(args[0]) : undefined,
      minSuccessRate: args[1] ? parseFloat(args[1]) : undefined,
      minConfidence: args[2] ? parseFloat(args[2]) : undefined,
      dryRun: args[3] === 'true',
    });
  } else if (subcommand === 'prune') {
    await learnerPrune(ctx, {
      minConfidence: args[0] ? parseFloat(args[0]) : undefined,
      minUplift: args[1] ? parseFloat(args[1]) : undefined,
      maxAgeDays: args[2] ? parseInt(args[2]) : undefined,
    });
  } else {
    log.error(`Unknown learner subcommand: ${subcommand}`);
    throw new Error(`Unknown learner subcommand: ${subcommand}`);
  }
}
