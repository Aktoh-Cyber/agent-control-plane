/**
 * Learning system tool handlers (Reinforcement Learning)
 * Handles: learning_start_session, learning_end_session, learning_predict, learning_feedback, learning_train,
 *          learning_metrics, learning_transfer, learning_explain, experience_record, reward_signal
 */
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';

export const learningTools: ToolDefinition[] = [
  {
    name: 'learning_start_session',
    description:
      'Start a new reinforcement learning session with specified algorithm and configuration. Supports 9 RL algorithms: q-learning, sarsa, dqn, policy-gradient, actor-critic, ppo, decision-transformer, mcts, model-based.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User identifier for the learning session' },
        session_type: {
          type: 'string',
          description: 'RL algorithm type',
          enum: [
            'q-learning',
            'sarsa',
            'dqn',
            'policy-gradient',
            'actor-critic',
            'ppo',
            'decision-transformer',
            'mcts',
            'model-based',
          ],
        },
        config: {
          type: 'object',
          description: 'Learning configuration parameters',
          properties: {
            learning_rate: { type: 'number', description: 'Learning rate (0-1)', default: 0.01 },
            discount_factor: {
              type: 'number',
              description: 'Discount factor gamma (0-1)',
              default: 0.99,
            },
            exploration_rate: {
              type: 'number',
              description: 'Epsilon for epsilon-greedy exploration (0-1)',
              default: 0.1,
            },
            batch_size: { type: 'number', description: 'Batch size for training', default: 32 },
            target_update_frequency: {
              type: 'number',
              description: 'Update frequency for target network',
              default: 100,
            },
          },
          required: ['learning_rate', 'discount_factor'],
        },
      },
      required: ['user_id', 'session_type', 'config'],
    },
  },
  {
    name: 'learning_end_session',
    description:
      'End an active learning session and save the final trained policy to the database.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session ID to end' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'learning_predict',
    description:
      'Get AI-recommended action for a given state with confidence scores and alternative actions.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Learning session ID' },
        state: { type: 'string', description: 'Current state description' },
      },
      required: ['session_id', 'state'],
    },
  },
  {
    name: 'learning_feedback',
    description:
      'Submit feedback on action quality to train the RL policy. Feedback includes reward signal and outcome state.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Learning session ID' },
        state: { type: 'string', description: 'State where action was taken' },
        action: { type: 'string', description: 'Action that was executed' },
        reward: { type: 'number', description: 'Reward received (higher is better)' },
        next_state: { type: 'string', description: 'Resulting state after action (optional)' },
        success: { type: 'boolean', description: 'Whether the action was successful' },
      },
      required: ['session_id', 'state', 'action', 'reward', 'success'],
    },
  },
  {
    name: 'learning_train',
    description:
      'Train the RL policy using batch learning with collected experiences. Returns training metrics including loss, average reward, and convergence rate.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Learning session ID to train' },
        epochs: { type: 'number', description: 'Number of training epochs', default: 50 },
        batch_size: { type: 'number', description: 'Batch size for training', default: 32 },
        learning_rate: {
          type: 'number',
          description: 'Learning rate for this training run',
          default: 0.01,
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'learning_metrics',
    description:
      'Get learning performance metrics including success rates, rewards, and policy improvement',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Optional session ID to filter metrics' },
        time_window_days: {
          type: 'number',
          description: 'Time window in days for metrics (default: 7)',
          default: 7,
        },
        include_trends: {
          type: 'boolean',
          description: 'Include trend analysis over time',
          default: true,
        },
        group_by: {
          type: 'string',
          description: 'Group metrics by task/session/skill',
          enum: ['task', 'session', 'skill'],
          default: 'task',
        },
      },
    },
  },
  {
    name: 'learning_transfer',
    description:
      'Transfer learning between sessions or tasks, enabling knowledge reuse across different contexts',
    inputSchema: {
      type: 'object',
      properties: {
        source_session: { type: 'string', description: 'Source session ID to transfer from' },
        target_session: { type: 'string', description: 'Target session ID to transfer to' },
        source_task: { type: 'string', description: 'Source task pattern to transfer from' },
        target_task: { type: 'string', description: 'Target task pattern to transfer to' },
        min_similarity: {
          type: 'number',
          description: 'Minimum similarity threshold (0-1)',
          default: 0.7,
          minimum: 0,
          maximum: 1,
        },
        transfer_type: {
          type: 'string',
          description: 'Type of transfer',
          enum: ['episodes', 'skills', 'causal_edges', 'all'],
          default: 'all',
        },
        max_transfers: {
          type: 'number',
          description: 'Maximum number of items to transfer',
          default: 10,
        },
      },
    },
  },
  {
    name: 'learning_explain',
    description:
      'Explain action recommendations with confidence scores and supporting evidence from past experiences',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query or task description to get recommendations for',
        },
        k: { type: 'number', description: 'Number of recommendations to return', default: 5 },
        explain_depth: {
          type: 'string',
          description: 'Explanation detail level',
          enum: ['summary', 'detailed', 'full'],
          default: 'detailed',
        },
        include_confidence: {
          type: 'boolean',
          description: 'Include confidence scores',
          default: true,
        },
        include_evidence: {
          type: 'boolean',
          description: 'Include supporting evidence from past episodes',
          default: true,
        },
        include_causal: {
          type: 'boolean',
          description: 'Include causal reasoning chains',
          default: true,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'experience_record',
    description:
      'Record tool execution as experience for reinforcement learning and experience replay',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session identifier' },
        tool_name: { type: 'string', description: 'Name of the tool executed' },
        action: { type: 'string', description: 'Action taken or tool parameters' },
        state_before: { type: 'object', description: 'System state before action (JSON)' },
        state_after: { type: 'object', description: 'System state after action (JSON)' },
        outcome: { type: 'string', description: 'Outcome description' },
        reward: { type: 'number', description: 'Reward signal (0-1)', minimum: 0, maximum: 1 },
        success: { type: 'boolean', description: 'Whether the action succeeded' },
        latency_ms: { type: 'number', description: 'Execution latency in milliseconds' },
        metadata: { type: 'object', description: 'Additional metadata (JSON)' },
      },
      required: ['session_id', 'tool_name', 'action', 'outcome', 'reward', 'success'],
    },
  },
  {
    name: 'reward_signal',
    description:
      'Calculate reward signal for outcomes based on success, efficiency, and causal impact',
    inputSchema: {
      type: 'object',
      properties: {
        episode_id: { type: 'number', description: 'Episode ID to calculate reward for' },
        success: { type: 'boolean', description: 'Whether the outcome was successful' },
        target_achieved: {
          type: 'boolean',
          description: 'Whether the target was achieved',
          default: true,
        },
        efficiency_score: {
          type: 'number',
          description: 'Efficiency score (0-1)',
          default: 0.5,
          minimum: 0,
          maximum: 1,
        },
        quality_score: {
          type: 'number',
          description: 'Quality score (0-1)',
          default: 0.5,
          minimum: 0,
          maximum: 1,
        },
        time_taken_ms: { type: 'number', description: 'Time taken in milliseconds' },
        expected_time_ms: { type: 'number', description: 'Expected time in milliseconds' },
        include_causal: {
          type: 'boolean',
          description: 'Include causal impact in reward',
          default: true,
        },
        reward_function: {
          type: 'string',
          description: 'Reward function to use',
          enum: ['standard', 'sparse', 'dense', 'shaped'],
          default: 'standard',
        },
      },
      required: ['success'],
    },
  },
];

// Handler implementations
export async function handleLearningStartSession(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const userId = args?.user_id as string;
  const sessionType = args?.session_type as any;
  const config = args?.config as any;

  const sessionId = await context.learningSystem.startSession(userId, sessionType, {
    learningRate: config.learning_rate,
    discountFactor: config.discount_factor,
    explorationRate: config.exploration_rate,
    batchSize: config.batch_size,
    targetUpdateFrequency: config.target_update_frequency,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Learning session started!\n\n` +
          `🆔 Session ID: ${sessionId}\n` +
          `👤 User: ${userId}\n` +
          `🧠 Algorithm: ${sessionType}\n` +
          `⚙️  Config:\n` +
          `   • Learning Rate: ${config.learning_rate}\n` +
          `   • Discount Factor: ${config.discount_factor}\n` +
          `   • Exploration Rate: ${config.exploration_rate || 0.1}\n` +
          `   • Batch Size: ${config.batch_size || 32}\n\n` +
          `📝 Use this session ID for predictions and feedback.`,
      },
    ],
  };
}

export async function handleLearningEndSession(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string;
  await context.learningSystem.endSession(sessionId);

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Learning session ended!\n\n` +
          `🆔 Session ID: ${sessionId}\n` +
          `💾 Final policy saved to database\n` +
          `📊 Session marked as completed`,
      },
    ],
  };
}

export async function handleLearningPredict(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string;
  const state = args?.state as string;

  const prediction = await context.learningSystem.predict(sessionId, state);

  return {
    content: [
      {
        type: 'text',
        text:
          `🎯 AI Recommendation:\n\n` +
          `📍 State: ${state}\n` +
          `✨ Recommended Action: ${prediction.action}\n` +
          `💯 Confidence: ${(prediction.confidence * 100).toFixed(1)}%\n` +
          `📊 Q-Value: ${prediction.qValue?.toFixed(3) || 'N/A'}\n\n` +
          `🔄 Alternative Actions:\n` +
          prediction.alternatives
            .map(
              (alt, i) =>
                `   ${i + 1}. ${alt.action} (${(alt.confidence * 100).toFixed(1)}% confidence)`
            )
            .join('\n'),
      },
    ],
  };
}

export async function handleLearningFeedback(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string;
  const state = args?.state as string;
  const action = args?.action as string;
  const reward = args?.reward as number;
  const nextState = args?.next_state as string | undefined;
  const success = args?.success as boolean;

  await context.learningSystem.submitFeedback({
    sessionId,
    state,
    action,
    reward,
    nextState,
    success,
    timestamp: Date.now(),
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Feedback recorded!\n\n` +
          `🆔 Session: ${sessionId}\n` +
          `📍 State: ${state}\n` +
          `🎬 Action: ${action}\n` +
          `🏆 Reward: ${reward.toFixed(2)}\n` +
          `${success ? '✅' : '❌'} Success: ${success}\n` +
          `${nextState ? `➡️  Next State: ${nextState}\n` : ''}` +
          `🧠 Policy updated incrementally`,
      },
    ],
  };
}

export async function handleLearningTrain(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string;
  const epochs = (args?.epochs as number) || 50;
  const batchSize = (args?.batch_size as number) || 32;
  const learningRate = (args?.learning_rate as number) || 0.01;

  const result = await context.learningSystem.train(sessionId, epochs, batchSize, learningRate);

  return {
    content: [
      {
        type: 'text',
        text:
          `🎓 Training completed!\n\n` +
          `📊 Training Results:\n` +
          `   • Epochs: ${result.epochsCompleted}\n` +
          `   • Final Loss: ${result.finalLoss.toFixed(4)}\n` +
          `   • Avg Reward: ${result.avgReward.toFixed(3)}\n` +
          `   • Convergence Rate: ${(result.convergenceRate * 100).toFixed(1)}%\n` +
          `   • Training Time: ${result.trainingTimeMs}ms\n\n` +
          `💾 Trained policy saved to database\n` +
          `✨ Ready for improved predictions!`,
      },
    ],
  };
}

export async function handleLearningMetrics(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string | undefined;
  const timeWindowDays = (args?.time_window_days as number) || 7;
  const includeTrends = (args?.include_trends as boolean) !== false;
  const groupBy = (args?.group_by as 'task' | 'session' | 'skill') || 'task';

  // Check cache first (120s TTL for expensive computations)
  const cacheKey = `metrics:${sessionId || 'all'}:${timeWindowDays}:${groupBy}:${includeTrends}`;
  const cached = context.caches.metrics.get(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: 'text',
          text: `${cached}\n\n⚡ (cached)`,
        },
      ],
    };
  }

  const metrics = await context.learningSystem.getMetrics({
    sessionId,
    timeWindowDays,
    includeTrends,
    groupBy,
  });

  const output =
    `📊 Learning Performance Metrics\n\n` +
    `⏱️  Time Window: ${timeWindowDays} days\n\n` +
    `📈 Overall Performance:\n` +
    `   • Total Episodes: ${metrics.overall.totalEpisodes}\n` +
    `   • Success Rate: ${(metrics.overall.successRate * 100).toFixed(1)}%\n` +
    `   • Avg Reward: ${metrics.overall.avgReward.toFixed(3)}\n` +
    `   • Reward Range: [${metrics.overall.minReward.toFixed(2)}, ${metrics.overall.maxReward.toFixed(2)}]\n` +
    `   • Avg Latency: ${metrics.overall.avgLatencyMs.toFixed(0)}ms\n\n` +
    `🎯 Top ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}s:\n` +
    metrics.groupedMetrics
      .slice(0, 5)
      .map(
        (g, i) =>
          `   ${i + 1}. ${g.key.substring(0, 40)}${g.key.length > 40 ? '...' : ''}\n` +
          `      Count: ${g.count}, Success: ${(g.successRate * 100).toFixed(1)}%, Reward: ${g.avgReward.toFixed(2)}`
      )
      .join('\n') +
    (metrics.groupedMetrics.length === 0 ? '   No data available' : '') +
    (includeTrends && metrics.trends.length > 0
      ? `\n\n📉 Recent Trends (last ${Math.min(7, metrics.trends.length)} days):\n` +
        metrics.trends
          .slice(-7)
          .map(
            (t) => `   ${t.date}: ${t.count} episodes, ${(t.successRate * 100).toFixed(1)}% success`
          )
          .join('\n')
      : '') +
    (metrics.policyImprovement.versions > 0
      ? `\n\n🧠 Policy Improvement:\n` +
        `   • Versions: ${metrics.policyImprovement.versions}\n` +
        `   • Q-Value Improvement: ${metrics.policyImprovement.qValueImprovement >= 0 ? '+' : ''}${metrics.policyImprovement.qValueImprovement.toFixed(3)}`
      : '');

  // Cache the result (120s TTL)
  context.caches.metrics.set(cacheKey, output);

  return {
    content: [
      {
        type: 'text',
        text: output,
      },
    ],
  };
}

export async function handleLearningTransfer(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sourceSession = args?.source_session as string | undefined;
  const targetSession = args?.target_session as string | undefined;
  const sourceTask = args?.source_task as string | undefined;
  const targetTask = args?.target_task as string | undefined;
  const minSimilarity = (args?.min_similarity as number) || 0.7;
  const transferType = (args?.transfer_type as any) || 'all';
  const maxTransfers = (args?.max_transfers as number) || 10;

  const result = await context.learningSystem.transferLearning({
    sourceSession,
    targetSession,
    sourceTask,
    targetTask,
    minSimilarity,
    transferType,
    maxTransfers,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `🔄 Learning Transfer Completed!\n\n` +
          `📤 Source: ${sourceSession ? `Session ${sourceSession}` : `Task "${sourceTask}"`}\n` +
          `📥 Target: ${targetSession ? `Session ${targetSession}` : `Task "${targetTask}"`}\n` +
          `🎯 Transfer Type: ${transferType}\n` +
          `📊 Min Similarity: ${(minSimilarity * 100).toFixed(0)}%\n\n` +
          `✅ Transferred:\n` +
          `   • Episodes: ${result.transferred.episodes}\n` +
          `   • Skills/Q-Values: ${result.transferred.skills}\n` +
          `   • Causal Edges: ${result.transferred.causalEdges}\n` +
          (result.transferred.details.length > 0
            ? `\n📝 Transfer Details:\n` +
              result.transferred.details
                .slice(0, 5)
                .map(
                  (d: any, i: number) =>
                    `   ${i + 1}. ${d.type} #${d.id} (similarity: ${(d.similarity * 100).toFixed(1)}%)`
                )
                .join('\n')
            : '') +
          `\n\n💡 Knowledge successfully transferred for reuse!`,
      },
    ],
  };
}

export async function handleLearningExplain(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const query = args?.query as string;
  const k = (args?.k as number) || 5;
  const explainDepth = (args?.explain_depth as any) || 'detailed';
  const includeConfidence = (args?.include_confidence as boolean) !== false;
  const includeEvidence = (args?.include_evidence as boolean) !== false;
  const includeCausal = (args?.include_causal as boolean) !== false;

  const explanation = await context.learningSystem.explainAction({
    query,
    k,
    explainDepth,
    includeConfidence,
    includeEvidence,
    includeCausal,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 AI Action Recommendations (Explainable)\n\n` +
          `🎯 Query: ${query}\n\n` +
          `💡 Recommended Actions:\n` +
          explanation.recommendations
            .map(
              (rec: any, i: number) =>
                `${i + 1}. ${rec.action}\n` +
                `   • Confidence: ${(rec.confidence * 100).toFixed(1)}%\n` +
                `   • Success Rate: ${(rec.successRate * 100).toFixed(1)}%\n` +
                `   • Avg Reward: ${rec.avgReward.toFixed(3)}\n` +
                `   • Supporting Examples: ${rec.supportingExamples}\n` +
                (includeEvidence && rec.evidence
                  ? `   • Evidence:\n` +
                    rec.evidence
                      .map(
                        (e: any) =>
                          `     - Episode ${e.episodeId}: reward=${e.reward.toFixed(2)}, similarity=${(e.similarity * 100).toFixed(1)}%`
                      )
                      .join('\n')
                  : '')
            )
            .join('\n\n') +
          (explainDepth !== 'summary' && explanation.reasoning
            ? `\n\n🧠 Reasoning:\n` +
              `   • Similar Experiences Found: ${explanation.reasoning.similarExperiencesFound}\n` +
              `   • Avg Similarity: ${(explanation.reasoning.avgSimilarity * 100).toFixed(1)}%\n` +
              `   • Unique Actions Considered: ${explanation.reasoning.uniqueActions}`
            : '') +
          (includeCausal && explanation.causalChains && explanation.causalChains.length > 0
            ? `\n\n🔗 Causal Reasoning Chains:\n` +
              explanation.causalChains
                .slice(0, 3)
                .map(
                  (chain: any, i: number) =>
                    `   ${i + 1}. ${chain.fromMemoryType} → ${chain.toMemoryType} (uplift: ${(chain.uplift || 0).toFixed(3)})`
                )
                .join('\n')
            : ''),
      },
    ],
  };
}

export async function handleExperienceRecord(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const sessionId = args?.session_id as string;
  const toolName = args?.tool_name as string;
  const action = args?.action as string;
  const stateBefore = args?.state_before as any;
  const stateAfter = args?.state_after as any;
  const outcome = args?.outcome as string;
  const reward = args?.reward as number;
  const success = args?.success as boolean;
  const latencyMs = args?.latency_ms as number | undefined;
  const metadata = args?.metadata as any;

  const experienceId = await context.learningSystem.recordExperience({
    sessionId,
    toolName,
    action,
    stateBefore,
    stateAfter,
    outcome,
    reward,
    success,
    latencyMs,
    metadata,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `✅ Experience recorded successfully!\n\n` +
          `🆔 Experience ID: ${experienceId}\n` +
          `📋 Session: ${sessionId}\n` +
          `🔧 Tool: ${toolName}\n` +
          `🎬 Action: ${action}\n` +
          `📊 Outcome: ${outcome}\n` +
          `🏆 Reward: ${reward.toFixed(3)}\n` +
          `${success ? '✅' : '❌'} Success: ${success}\n` +
          (latencyMs ? `⏱️  Latency: ${latencyMs}ms\n` : '') +
          `\n💾 Experience stored for offline learning and future recommendations`,
      },
    ],
  };
}

export async function handleRewardSignal(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const episodeId = args?.episode_id as number | undefined;
  const success = args?.success as boolean;
  const targetAchieved = (args?.target_achieved as boolean) !== false;
  const efficiencyScore = (args?.efficiency_score as number) || 0.5;
  const qualityScore = (args?.quality_score as number) || 0.5;
  const timeTakenMs = args?.time_taken_ms as number | undefined;
  const expectedTimeMs = args?.expected_time_ms as number | undefined;
  const includeCausal = (args?.include_causal as boolean) !== false;
  const rewardFunction = (args?.reward_function as any) || 'standard';

  const reward = context.learningSystem.calculateReward({
    episodeId,
    success,
    targetAchieved,
    efficiencyScore,
    qualityScore,
    timeTakenMs,
    expectedTimeMs,
    includeCausal,
    rewardFunction,
  });

  return {
    content: [
      {
        type: 'text',
        text:
          `🎯 Reward Signal Calculated\n\n` +
          `📊 Final Reward: ${reward.toFixed(3)}\n` +
          `🔧 Reward Function: ${rewardFunction}\n\n` +
          `📈 Input Factors:\n` +
          `   • Success: ${success ? '✅' : '❌'}\n` +
          `   • Target Achieved: ${targetAchieved ? '✅' : '❌'}\n` +
          `   • Efficiency Score: ${(efficiencyScore * 100).toFixed(1)}%\n` +
          `   • Quality Score: ${(qualityScore * 100).toFixed(1)}%\n` +
          (timeTakenMs && expectedTimeMs
            ? `   • Time Efficiency: ${((expectedTimeMs / timeTakenMs) * 100).toFixed(1)}%\n`
            : '') +
          (includeCausal ? `   • Causal Impact: Included\n` : '') +
          `\n💡 Use this reward signal for learning feedback`,
      },
    ],
  };
}
