/**
 * Agent spawner - handles agent execution and task management
 */

import { claudeAgentDirect } from '../agents/claudeAgentDirect.js';
import { AgentBoosterPreprocessor } from '../utils/agentBoosterPreprocessor.js';
import { getAgent, listAgents } from '../utils/agentLoader.js';
import { logger } from '../utils/logger.js';
import { detectModelCapabilities } from '../utils/modelCapabilities.js';

export class AgentSpawner {
  async runAgent(
    options: any,
    useOpenRouter: boolean,
    useGemini: boolean,
    useONNX: boolean = false,
    useRequesty: boolean = false
  ): Promise<void> {
    const agentName = options.agent || process.env.AGENT || '';
    const task = options.task || process.env.TASK || '';

    if (!agentName) {
      console.error('❌ Error: --agent required');
      process.exit(1);
    }

    if (!task) {
      console.error('❌ Error: --task required');
      process.exit(1);
    }

    // Set PROVIDER environment variable if --provider flag is used
    if (options.provider) {
      process.env.PROVIDER = options.provider;
    }

    // Validate API keys
    this.validateApiKeys(options, useOpenRouter, useGemini, useONNX, useRequesty);

    const agent = getAgent(agentName);
    if (!agent) {
      this.showAgentNotFound(agentName);
      process.exit(1);
    }

    console.log(`\n🤖 Agent: ${agent.name}`);
    console.log(`📝 Description: ${agent.description}\n`);
    console.log(`🎯 Task: ${task}\n`);

    this.printProviderInfo(options, useOpenRouter, useGemini, useONNX);

    console.log('⏳ Running...\n');

    // Try Agent Booster pre-processing if enabled
    if (options.agentBooster || process.env.AGENTIC_FLOW_AGENT_BOOSTER === 'true') {
      const boosterResult = await this.tryAgentBooster(options, agentName, task);
      if (boosterResult) return;
    }

    const streamHandler = options.stream
      ? (chunk: string) => process.stdout.write(chunk)
      : undefined;

    // Filter model for non-Anthropic providers
    const modelForAgent =
      useGemini || useOpenRouter || useONNX || useRequesty
        ? options.model?.startsWith('claude')
          ? undefined
          : options.model
        : options.model;

    const result = await claudeAgentDirect(agent, task, streamHandler, modelForAgent);

    if (!options.stream) {
      console.log('\n✅ Completed!\n');
      console.log('═══════════════════════════════════════\n');
      console.log(result.output);
      console.log('\n═══════════════════════════════════════\n');
    }

    logger.info('Agent completed', {
      agent: agentName,
      outputLength: result.output.length,
      provider: useOpenRouter ? 'openrouter' : useGemini ? 'gemini' : 'anthropic',
    });
  }

  private validateApiKeys(
    options: any,
    useOpenRouter: boolean,
    useGemini: boolean,
    useONNX: boolean,
    useRequesty: boolean
  ): void {
    const isOnnx =
      options.provider === 'onnx' ||
      process.env.USE_ONNX === 'true' ||
      process.env.PROVIDER === 'onnx';

    if (!isOnnx && !useOpenRouter && !useGemini && !useRequesty && !process.env.ANTHROPIC_API_KEY) {
      console.error('\n❌ Error: ANTHROPIC_API_KEY is required\n');
      console.error('Please set your API key:');
      console.error('  export ANTHROPIC_API_KEY=sk-ant-xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider openrouter  (requires OPENROUTER_API_KEY)');
      console.error('  --provider gemini      (requires GOOGLE_GEMINI_API_KEY)');
      console.error('  --provider onnx        (free local inference)\n');
      process.exit(1);
    }

    if (!isOnnx && useOpenRouter && !process.env.OPENROUTER_API_KEY) {
      console.error('\n❌ Error: OPENROUTER_API_KEY is required for OpenRouter\n');
      console.error('Please set your API key:');
      console.error('  export OPENROUTER_API_KEY=sk-or-v1-xxxxx\n');
      process.exit(1);
    }

    if (!isOnnx && useGemini && !process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('\n❌ Error: GOOGLE_GEMINI_API_KEY is required for Gemini\n');
      console.error('Please set your API key:');
      console.error('  export GOOGLE_GEMINI_API_KEY=xxxxx\n');
      process.exit(1);
    }
  }

  private showAgentNotFound(agentName: string): void {
    const available = listAgents();
    console.error(`\n❌ Agent '${agentName}' not found.\n`);
    console.error('Available agents:');
    available.slice(0, 20).forEach((a) => {
      console.error(`  • ${a.name}: ${a.description.substring(0, 80)}...`);
    });
    if (available.length > 20) {
      console.error(`  ... and ${available.length - 20} more (use --list to see all)`);
    }
  }

  private printProviderInfo(
    options: any,
    useOpenRouter: boolean,
    useGemini: boolean,
    useONNX: boolean
  ): void {
    if (useOpenRouter) {
      const model = options.model || process.env.COMPLETION_MODEL || 'deepseek/deepseek-chat';
      console.log(`🔧 Provider: OpenRouter (via proxy)`);
      console.log(`🔧 Model: ${model}`);

      const capabilities = detectModelCapabilities(model);
      if (capabilities.requiresEmulation) {
        console.log(`⚙️  Tool Emulation: ${capabilities.emulationStrategy.toUpperCase()} pattern`);
        console.log(`📊 Note: This model uses prompt-based tool emulation`);
      }
      console.log('');
    } else if (useGemini) {
      const model = options.model || 'gemini-2.0-flash-exp';
      console.log(`🔧 Provider: Google Gemini`);
      console.log(`🔧 Model: ${model}\n`);
    } else if (
      options.provider === 'onnx' ||
      process.env.USE_ONNX === 'true' ||
      process.env.PROVIDER === 'onnx'
    ) {
      console.log(`🔧 Provider: ONNX Local (Phi-4-mini)`);
      console.log(`💾 Free local inference - no API costs`);
      if (process.env.ONNX_OPTIMIZED === 'true') {
        console.log(`⚡ Optimizations: Context pruning, prompt optimization`);
      }
      console.log('');
    }
  }

  private async tryAgentBooster(options: any, agentName: string, task: string): Promise<boolean> {
    const preprocessor = new AgentBoosterPreprocessor({
      confidenceThreshold:
        options.boosterThreshold || parseFloat(process.env.AGENTIC_FLOW_BOOSTER_THRESHOLD || '0.7'),
    });

    console.log('⚡ Agent Booster: Analyzing task for pattern matching opportunities...\n');

    const intent = preprocessor.detectIntent(task);

    if (intent) {
      console.log(`🎯 Detected intent: ${intent.type}`);
      if (intent.filePath) {
        console.log(`📄 Target file: ${intent.filePath}`);
      }
      console.log('🔧 Attempting Agent Booster pre-processing...\n');

      const result = await preprocessor.tryApply(intent);

      if (result.success) {
        console.log(`✅ Agent Booster Success!\n`);
        console.log(`⚡ Method: ${result.method}`);
        console.log(`⏱️  Latency: ${result.latency}ms`);
        console.log(`🎯 Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`);
        console.log(`📊 Strategy: ${result.strategy}`);
        console.log(`\n✅ File updated successfully!\n`);
        console.log('═══════════════════════════════════════\n');
        console.log(result.output || 'Edit applied');
        console.log('\n═══════════════════════════════════════\n');

        logger.info('Agent Booster completed', {
          agent: agentName,
          latency: result.latency,
          confidence: result.confidence,
          strategy: result.strategy,
        });

        return true;
      } else {
        console.log(`⚠️  Agent Booster: ${result.reason || 'Low confidence'}`);
        console.log(`🔄 Falling back to LLM agent...\n`);
      }
    } else {
      console.log('ℹ️  No code editing pattern detected, using LLM agent...\n');
    }

    return false;
  }

  listAgents(): void {
    const agents = listAgents();
    console.log(`\n📦 Available Agents (${agents.length} total)\n`);

    const grouped = new Map<string, typeof agents>();
    agents.forEach((agent) => {
      const parts = agent.filePath.split('/');
      const category = parts[parts.length - 2] || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(agent);
    });

    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, categoryAgents]) => {
        console.log(`\n${category.toUpperCase()}:`);
        categoryAgents.forEach((agent) => {
          console.log(`  ${agent.name.padEnd(30)} ${agent.description.substring(0, 80)}`);
        });
      });

    console.log(`\nUsage:`);
    console.log(`  npx agent-control-plane --agent <name> --task "Your task"\n`);
  }
}
