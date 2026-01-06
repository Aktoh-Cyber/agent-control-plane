/**
 * Reflexion command handlers for AgentDB CLI
 * Handles reflexion memory operations for self-critique and learning
 */
import { Episode } from '../../controllers/ReflexionMemory.js';
import { CLIContext, colors, log } from './types.js';

export async function reflexionStoreEpisode(
  ctx: CLIContext,
  params: {
    sessionId: string;
    task: string;
    input?: string;
    output?: string;
    critique?: string;
    reward: number;
    success: boolean;
    latencyMs?: number;
    tokensUsed?: number;
  }
): Promise<void> {
  log.header('\n💭 Storing Episode');
  log.info(`Task: ${params.task}`);
  log.info(`Success: ${params.success ? 'Yes' : 'No'}`);
  log.info(`Reward: ${params.reward.toFixed(2)}`);

  const episodeId = await ctx.reflexion.storeEpisode(params as Episode);

  log.success(`Stored episode #${episodeId}`);
  if (params.critique) {
    log.info(`Critique: "${params.critique}"`);
  }
}

export async function reflexionRetrieve(
  ctx: CLIContext,
  params: {
    task: string;
    k?: number;
    onlyFailures?: boolean;
    onlySuccesses?: boolean;
    minReward?: number;
  }
): Promise<void> {
  log.header('\n🔍 Retrieving Past Episodes');
  log.info(`Task: "${params.task}"`);
  log.info(`k: ${params.k || 5}`);
  if (params.onlyFailures) log.info('Filter: Failures only');
  if (params.onlySuccesses) log.info('Filter: Successes only');

  const episodes = await ctx.reflexion.retrieveRelevant({
    task: params.task,
    k: params.k || 5,
    onlyFailures: params.onlyFailures,
    onlySuccesses: params.onlySuccesses,
    minReward: params.minReward,
  });

  if (episodes.length === 0) {
    log.warning('No episodes found');
    return;
  }

  console.log('\n' + '═'.repeat(80));
  episodes.forEach((ep, i) => {
    console.log(`${colors.bright}#${i + 1}: Episode ${ep.id}${colors.reset}`);
    console.log(`  Task: ${ep.task}`);
    console.log(`  Reward: ${colors.green}${ep.reward.toFixed(2)}${colors.reset}`);
    console.log(
      `  Success: ${ep.success ? colors.green + 'Yes' : colors.red + 'No'}${colors.reset}`
    );
    console.log(`  Similarity: ${colors.cyan}${ep.similarity?.toFixed(3) || 'N/A'}${colors.reset}`);
    if (ep.critique) {
      console.log(`  Critique: "${ep.critique}"`);
    }
    console.log('─'.repeat(80));
  });

  log.success(`Retrieved ${episodes.length} relevant episodes`);
}

export async function reflexionGetCritiqueSummary(
  ctx: CLIContext,
  params: {
    task: string;
    k?: number;
  }
): Promise<void> {
  log.header('\n📋 Critique Summary');
  log.info(`Task: "${params.task}"`);

  const summary = await ctx.reflexion.getCritiqueSummary({
    task: params.task,
    k: params.k || 5,
  });

  console.log('\n' + '═'.repeat(80));
  console.log(colors.bright + 'Past Lessons:' + colors.reset);
  console.log(summary);
  console.log('═'.repeat(80));
}

export async function reflexionPrune(
  ctx: CLIContext,
  params: {
    minReward?: number;
    maxAgeDays?: number;
    keepMinPerTask?: number;
  }
): Promise<void> {
  log.header('\n🧹 Pruning Episodes');

  const pruned = await ctx.reflexion.pruneEpisodes({
    minReward: params.minReward || 0.3,
    maxAgeDays: params.maxAgeDays || 30,
    keepMinPerTask: params.keepMinPerTask || 5,
  });

  log.success(`Pruned ${pruned} low-quality episodes`);
}

export async function handleReflexionCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'store') {
    await reflexionStoreEpisode(ctx, {
      sessionId: args[0],
      task: args[1],
      reward: parseFloat(args[2]),
      success: args[3] === 'true',
      critique: args[4],
      input: args[5],
      output: args[6],
      latencyMs: args[7] ? parseInt(args[7]) : undefined,
      tokensUsed: args[8] ? parseInt(args[8]) : undefined,
    });
  } else if (subcommand === 'retrieve') {
    await reflexionRetrieve(ctx, {
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
      minReward: args[2] ? parseFloat(args[2]) : undefined,
      onlyFailures: args[3] === 'true' ? true : undefined,
      onlySuccesses: args[4] === 'true' ? true : undefined,
    });
  } else if (subcommand === 'critique-summary') {
    await reflexionGetCritiqueSummary(ctx, {
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
    });
  } else if (subcommand === 'prune') {
    await reflexionPrune(ctx, {
      minReward: args[0] ? parseFloat(args[0]) : undefined,
      maxAgeDays: args[1] ? parseInt(args[1]) : undefined,
      keepMinPerTask: args[2] ? parseInt(args[2]) : undefined,
    });
  } else {
    log.error(`Unknown reflexion subcommand: ${subcommand}`);
    throw new Error(`Unknown reflexion subcommand: ${subcommand}`);
  }
}
