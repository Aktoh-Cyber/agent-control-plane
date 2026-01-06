/**
 * Recall command handlers for AgentDB CLI
 * Handles explainable recall with certificates
 */
import { CLIContext, colors, log } from './types.js';

export async function recallWithCertificate(
  ctx: CLIContext,
  params: {
    query: string;
    k?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  }
): Promise<void> {
  log.header('\n🔍 Causal Recall with Certificate');
  log.info(`Query: "${params.query}"`);
  log.info(`k: ${params.k || 12}`);

  const startTime = Date.now();

  const result = await ctx.causalRecall.recall({
    qid: 'cli-' + Date.now(),
    query: params.query,
    k: params.k || 12,
    weights: {
      alpha: params.alpha || 0.7,
      beta: params.beta || 0.2,
      gamma: params.gamma || 0.1,
    },
  });

  const duration = Date.now() - startTime;

  console.log('\n' + '═'.repeat(80));
  console.log(`${colors.bright}Results (${result.results.length})${colors.reset}`);
  console.log('═'.repeat(80));

  result.results.slice(0, 5).forEach((r, i) => {
    console.log(`\n${colors.bright}#${i + 1}: Episode ${r.episode.id}${colors.reset}`);
    console.log(`  Task: ${r.episode.task}`);
    console.log(`  Similarity: ${colors.cyan}${r.similarity.toFixed(3)}${colors.reset}`);
    console.log(`  Uplift: ${colors.green}${r.uplift?.toFixed(3) || 'N/A'}${colors.reset}`);
    console.log(`  Utility: ${colors.yellow}${r.utility.toFixed(3)}${colors.reset}`);
    console.log(`  Reward: ${r.episode.reward.toFixed(2)}`);
  });

  console.log('\n' + '═'.repeat(80));
  log.info(`Certificate ID: ${result.certificate.id}`);
  log.info(`Query: ${result.certificate.queryText}`);
  log.info(`Completeness: ${result.certificate.completenessScore.toFixed(2)}`);
  log.success(`Completed in ${duration}ms`);
}

export async function handleRecallCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'with-certificate') {
    await recallWithCertificate(ctx, {
      query: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
      alpha: args[2] ? parseFloat(args[2]) : undefined,
      beta: args[3] ? parseFloat(args[3]) : undefined,
      gamma: args[4] ? parseFloat(args[4]) : undefined,
    });
  } else {
    log.error(`Unknown recall subcommand: ${subcommand}`);
    throw new Error(`Unknown recall subcommand: ${subcommand}`);
  }
}
