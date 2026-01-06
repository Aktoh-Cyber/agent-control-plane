/**
 * Skill library command handlers for AgentDB CLI
 * Handles skill creation, search, and consolidation
 */
import { CLIContext, colors, log } from './types.js';

export async function skillCreate(
  ctx: CLIContext,
  params: {
    name: string;
    description: string;
    code?: string;
    successRate?: number;
    episodeId?: number;
  }
): Promise<void> {
  log.header('\n🎯 Creating Skill');
  log.info(`Name: ${params.name}`);
  log.info(`Description: ${params.description}`);

  const skillId = await ctx.skills.createSkill({
    name: params.name,
    description: params.description,
    signature: { inputs: {}, outputs: {} },
    code: params.code,
    successRate: params.successRate || 0.0,
    uses: 0,
    avgReward: 0.0,
    avgLatencyMs: 0.0,
    createdFromEpisode: params.episodeId,
  });

  log.success(`Created skill #${skillId}`);
}

export async function skillSearch(
  ctx: CLIContext,
  params: {
    task: string;
    k?: number;
    minSuccessRate?: number;
  }
): Promise<void> {
  log.header('\n🔍 Searching Skills');
  log.info(`Task: "${params.task}"`);
  log.info(`Min Success Rate: ${params.minSuccessRate || 0.0}`);

  const skills = await ctx.skills.searchSkills({
    task: params.task,
    k: params.k || 10,
    minSuccessRate: params.minSuccessRate || 0.0,
  });

  if (skills.length === 0) {
    log.warning('No skills found');
    return;
  }

  console.log('\n' + '═'.repeat(80));
  skills.forEach((skill: any, i: number) => {
    console.log(`${colors.bright}#${i + 1}: ${skill.name}${colors.reset}`);
    console.log(`  Description: ${skill.description}`);
    console.log(
      `  Success Rate: ${colors.green}${(skill.successRate * 100).toFixed(1)}%${colors.reset}`
    );
    console.log(`  Uses: ${skill.uses}`);
    console.log(`  Avg Reward: ${skill.avgReward.toFixed(2)}`);
    console.log(`  Avg Latency: ${skill.avgLatencyMs.toFixed(0)}ms`);
    console.log('─'.repeat(80));
  });

  log.success(`Found ${skills.length} matching skills`);
}

export async function skillConsolidate(
  ctx: CLIContext,
  params: {
    minAttempts?: number;
    minReward?: number;
    timeWindowDays?: number;
  }
): Promise<void> {
  log.header('\n🔄 Consolidating Episodes into Skills');
  log.info(`Min Attempts: ${params.minAttempts || 3}`);
  log.info(`Min Reward: ${params.minReward || 0.7}`);
  log.info(`Time Window: ${params.timeWindowDays || 7} days`);

  const created = ctx.skills.consolidateEpisodesIntoSkills({
    minAttempts: params.minAttempts || 3,
    minReward: params.minReward || 0.7,
    timeWindowDays: params.timeWindowDays || 7,
  });

  log.success(`Created ${created} new skills from successful episodes`);
}

export async function skillPrune(
  ctx: CLIContext,
  params: {
    minUses?: number;
    minSuccessRate?: number;
    maxAgeDays?: number;
  }
): Promise<void> {
  log.header('\n🧹 Pruning Skills');

  const pruned = ctx.skills.pruneSkills({
    minUses: params.minUses || 3,
    minSuccessRate: params.minSuccessRate || 0.4,
    maxAgeDays: params.maxAgeDays || 60,
  });

  log.success(`Pruned ${pruned} underperforming skills`);
}

export async function handleSkillCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'create') {
    await skillCreate(ctx, {
      name: args[0],
      description: args[1],
      code: args[2],
    });
  } else if (subcommand === 'search') {
    await skillSearch(ctx, {
      task: args[0],
      k: args[1] ? parseInt(args[1]) : undefined,
    });
  } else if (subcommand === 'consolidate') {
    await skillConsolidate(ctx, {
      minAttempts: args[0] ? parseInt(args[0]) : undefined,
      minReward: args[1] ? parseFloat(args[1]) : undefined,
      timeWindowDays: args[2] ? parseInt(args[2]) : undefined,
    });
  } else if (subcommand === 'prune') {
    await skillPrune(ctx, {
      minUses: args[0] ? parseInt(args[0]) : undefined,
      minSuccessRate: args[1] ? parseFloat(args[1]) : undefined,
      maxAgeDays: args[2] ? parseInt(args[2]) : undefined,
    });
  } else {
    log.error(`Unknown skill subcommand: ${subcommand}`);
    throw new Error(`Unknown skill subcommand: ${subcommand}`);
  }
}
