#!/usr/bin/env node
/**
 * Agentic Flow - Standalone CLI with integrated OpenRouter proxy
 * Usage: npx agent-control-plane-proxy --agent coder --task "Create code" --openrouter
 *
 * REFACTORED: Main entry point now delegates to modular components
 */

import { readFileSync } from 'fs';
import { dirname, resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';
import { EnvLoader } from './cli/env-loader.js';
import { HelpGenerator } from './cli/help.js';
import { ModeHandler } from './cli/modes.js';
import { OptimizerManager } from './cli/optimizer.js';
import { CommandParser } from './cli/parser.js';
import { ProxyManager } from './cli/proxy-manager.js';
import { QuicHandler } from './cli/quic-handler.js';
import { ModelRouter } from './cli/router.js';
import { AgentSpawner } from './cli/spawner.js';
import { StandaloneProxy } from './cli/standalone-proxy.js';
import { parseArgs } from './utils/cli.js';
import { logger } from './utils/logger.js';

// Load environment variables
EnvLoader.loadRecursive();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(pathResolve(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

/**
 * Main CLI orchestrator
 * Coordinates between modules and handles high-level flow
 */
class AgenticFlowCLI {
  private helpGenerator: HelpGenerator;
  private parser: CommandParser;
  private router: ModelRouter;
  private proxyManager: ProxyManager;
  private spawner: AgentSpawner;
  private optimizer: OptimizerManager;
  private modeHandler: ModeHandler;

  constructor() {
    this.helpGenerator = new HelpGenerator(VERSION);
    this.parser = new CommandParser();
    this.router = new ModelRouter();
    this.proxyManager = new ProxyManager();
    this.spawner = new AgentSpawner();
    this.optimizer = new OptimizerManager();
    this.modeHandler = new ModeHandler();
  }

  async start() {
    const options = parseArgs();

    // Handle version flag
    if (options.version) {
      console.log(`agent-control-plane v${VERSION}`);
      process.exit(0);
    }

    // Determine mode from arguments
    const mode = this.parser.parseMode(process.argv);

    // Handle help
    if (this.parser.shouldShowHelp(options, mode)) {
      this.helpGenerator.printMainHelp();
      process.exit(0);
    }

    // Handle special modes
    if (await this.handleSpecialModes(mode, options)) {
      return;
    }

    // Apply model optimization if requested
    this.optimizer.applyOptimization(options);

    // Determine provider
    const providerSelection = this.router.determineProvider(options);
    this.router.printDebugInfo(options, providerSelection);

    try {
      // Start proxy if needed
      await this.startProxy(options, providerSelection);

      // Run agent
      await this.spawner.runAgent(
        options,
        providerSelection.useOpenRouter,
        providerSelection.useGemini,
        providerSelection.useONNX,
        providerSelection.useRequesty
      );

      logger.info('Execution completed successfully');
      process.exit(0);
    } catch (err: unknown) {
      logger.error('Execution failed', { error: err });
      console.error(err);
      process.exit(1);
    }
  }

  /**
   * Handle special modes that don't require agent execution
   */
  private async handleSpecialModes(mode: string | undefined, options: any): Promise<boolean> {
    if (!mode) return false;

    switch (mode) {
      case 'list':
        this.spawner.listAgents();
        process.exit(0);
        return true;

      case 'config':
        await this.modeHandler.handleConfigMode(process.argv);
        return true;

      case 'agent-manager':
        await this.modeHandler.handleAgentManagerMode(process.argv);
        return true;

      case 'mcp-manager':
        await this.modeHandler.handleMcpManagerMode(process.argv, __filename);
        return true;

      case 'proxy':
        await this.runStandaloneProxy();
        return true;

      case 'quic':
        await this.runQuicProxy();
        return true;

      case 'claude-code':
        await this.modeHandler.handleClaudeCodeMode(process.argv, __filename);
        return true;

      case 'mcp':
        await this.modeHandler.handleMcpMode(process.argv, __filename);
        return true;

      case 'reasoningbank':
        await this.modeHandler.handleReasoningBankMode(process.argv);
        return true;

      case 'federation':
        await this.modeHandler.handleFederationMode(process.argv);
        return true;

      default:
        return false;
    }
  }

  /**
   * Start appropriate proxy based on provider selection
   */
  private async startProxy(options: any, selection: any): Promise<void> {
    if (selection.useONNX) {
      console.log('🚀 Initializing ONNX local inference proxy...');
      await this.proxyManager.startONNXProxy(options.model);
    } else if (selection.useRequesty) {
      console.log('🚀 Initializing Requesty proxy...');
      await this.proxyManager.startRequestyProxy(options.model);
    } else if (selection.useOpenRouter) {
      console.log('🚀 Initializing OpenRouter proxy...');
      await this.proxyManager.startOpenRouterProxy(options.model);
    } else if (selection.useGemini) {
      console.log('🚀 Initializing Gemini proxy...');
      const geminiModel = options.model?.startsWith('claude') ? undefined : options.model;
      await this.proxyManager.startGeminiProxy(geminiModel);
    } else {
      console.log('🚀 Using direct Anthropic API...\n');
    }
  }

  /**
   * Run standalone proxy server
   */
  private async runStandaloneProxy(): Promise<void> {
    const args = process.argv.slice(3);

    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
      this.helpGenerator.printProxyHelp();
      process.exit(0);
    }

    const standaloneProxy = new StandaloneProxy();
    await standaloneProxy.run(args);
  }

  /**
   * Run QUIC transport proxy
   */
  private async runQuicProxy(): Promise<void> {
    const args = process.argv.slice(3);

    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
      this.helpGenerator.printQuicHelp();
      process.exit(0);
    }

    const quicHandler = new QuicHandler();
    await quicHandler.run(args, __filename);
  }
}

// Run CLI
const cli = new AgenticFlowCLI();
cli.start();
