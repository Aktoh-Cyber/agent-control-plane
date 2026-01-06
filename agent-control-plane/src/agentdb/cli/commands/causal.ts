/**
 * Causal command handlers for AgentDB CLI
 * Handles causal memory graph operations including edges and experiments
 */
import { CLIContext, colors, log } from './types.js';

export async function causalAddEdge(
  ctx: CLIContext,
  params: {
    cause: string;
    effect: string;
    uplift: number;
    confidence?: number;
    sampleSize?: number;
  }
): Promise<void> {
  log.header('\n📊 Adding Causal Edge');
  log.info(`Cause: ${params.cause}`);
  log.info(`Effect: ${params.effect}`);
  log.info(`Uplift: ${params.uplift}`);

  const edgeId = ctx.causalGraph.addEdge({
    cause: params.cause,
    effect: params.effect,
    uplift: params.uplift,
    confidence: params.confidence || 0.95,
    sampleSize: params.sampleSize || 0,
    evidenceIds: [],
  });

  log.success(`Added causal edge #${edgeId}`);
}

export async function causalExperimentCreate(
  ctx: CLIContext,
  params: {
    name: string;
    cause: string;
    effect: string;
  }
): Promise<void> {
  log.header('\n🧪 Creating A/B Experiment');
  log.info(`Name: ${params.name}`);
  log.info(`Cause: ${params.cause}`);
  log.info(`Effect: ${params.effect}`);

  const expId = ctx.causalGraph.createExperiment({
    name: params.name,
    cause: params.cause,
    effect: params.effect,
  });

  log.success(`Created experiment #${expId}`);
  log.info('Use `agentdb causal experiment add-observation` to record data');
}

export async function causalExperimentAddObservation(
  ctx: CLIContext,
  params: {
    experimentId: number;
    isTreatment: boolean;
    outcome: number;
    context?: string;
  }
): Promise<void> {
  ctx.causalGraph.recordObservation({
    experimentId: params.experimentId,
    isTreatment: params.isTreatment,
    outcome: params.outcome,
    context: params.context || '{}',
  });

  log.success(
    `Recorded ${params.isTreatment ? 'treatment' : 'control'} observation: ${params.outcome}`
  );
}

export async function causalExperimentCalculate(
  ctx: CLIContext,
  experimentId: number
): Promise<void> {
  log.header('\n📈 Calculating Uplift');

  const result = ctx.causalGraph.calculateUplift(experimentId);

  log.info(`Treatment Mean: ${result.treatmentMean.toFixed(3)}`);
  log.info(`Control Mean: ${result.controlMean.toFixed(3)}`);
  log.success(`Uplift: ${result.uplift.toFixed(3)}`);
  log.info(`95% CI: [${result.confidenceLower.toFixed(3)}, ${result.confidenceUpper.toFixed(3)}]`);
  log.info(`p-value: ${result.pValue.toFixed(4)}`);
  log.info(`Sample Sizes: ${result.treatmentN} treatment, ${result.controlN} control`);

  if (result.pValue < 0.05) {
    log.success('Result is statistically significant (p < 0.05)');
  } else {
    log.warning('Result is not statistically significant');
  }
}

export async function causalQuery(
  ctx: CLIContext,
  params: {
    cause?: string;
    effect?: string;
    minConfidence?: number;
    minUplift?: number;
    limit?: number;
  }
): Promise<void> {
  log.header('\n🔍 Querying Causal Edges');

  const edges = ctx.causalGraph.getCausalEffects({
    cause: params.cause,
    effect: params.effect,
    minConfidence: params.minConfidence || 0.7,
    minUplift: params.minUplift || 0.1,
  });

  if (edges.length === 0) {
    log.warning('No causal edges found');
    return;
  }

  console.log('\n' + '═'.repeat(80));
  edges.slice(0, params.limit || 10).forEach((edge, i) => {
    console.log(`${colors.bright}#${i + 1}: ${edge.cause} → ${edge.effect}${colors.reset}`);
    console.log(`  Uplift: ${colors.green}${edge.uplift.toFixed(3)}${colors.reset}`);
    console.log(`  Confidence: ${edge.confidence.toFixed(2)} (n=${edge.sampleSize})`);
    console.log('─'.repeat(80));
  });

  log.success(`Found ${edges.length} causal edges`);
}

export async function handleCausalCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'add-edge') {
    await causalAddEdge(ctx, {
      cause: args[0],
      effect: args[1],
      uplift: parseFloat(args[2]),
      confidence: args[3] ? parseFloat(args[3]) : undefined,
      sampleSize: args[4] ? parseInt(args[4]) : undefined,
    });
  } else if (subcommand === 'experiment' && args[0] === 'create') {
    await causalExperimentCreate(ctx, {
      name: args[1],
      cause: args[2],
      effect: args[3],
    });
  } else if (subcommand === 'experiment' && args[0] === 'add-observation') {
    await causalExperimentAddObservation(ctx, {
      experimentId: parseInt(args[1]),
      isTreatment: args[2] === 'true',
      outcome: parseFloat(args[3]),
      context: args[4],
    });
  } else if (subcommand === 'experiment' && args[0] === 'calculate') {
    await causalExperimentCalculate(ctx, parseInt(args[1]));
  } else if (subcommand === 'query') {
    await causalQuery(ctx, {
      cause: args[0],
      effect: args[1],
      minConfidence: args[2] ? parseFloat(args[2]) : undefined,
      minUplift: args[3] ? parseFloat(args[3]) : undefined,
      limit: args[4] ? parseInt(args[4]) : undefined,
    });
  } else {
    log.error(`Unknown causal subcommand: ${subcommand}`);
    throw new Error(`Unknown causal subcommand: ${subcommand}`);
  }
}
