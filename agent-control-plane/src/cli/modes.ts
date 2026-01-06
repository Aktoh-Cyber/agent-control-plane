/**
 * Mode handlers - executes various CLI modes
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';

export class ModeHandler {
  async handleConfigMode(args: string[]): Promise<void> {
    const { handleConfigCommand } = await import('./config-wizard.js');
    const configArgs = args.slice(3);
    await handleConfigCommand(configArgs);
    process.exit(0);
  }

  async handleAgentManagerMode(args: string[]): Promise<void> {
    const { handleAgentCommand } = await import('./agent-manager.js');
    const agentArgs = args.slice(3);
    await handleAgentCommand(agentArgs);
    process.exit(0);
  }

  async handleMcpManagerMode(args: string[], currentFilePath: string): Promise<void> {
    const __dirname = dirname(currentFilePath);
    const mcpManagerPath = resolve(__dirname, './cli/mcp-manager.js');
    const mcpArgs = args.slice(3);

    const proc = spawn('node', [mcpManagerPath, ...mcpArgs], {
      stdio: 'inherit',
    });

    proc.on('exit', (code) => {
      process.exit(code || 0);
    });

    process.on('SIGINT', () => proc.kill('SIGINT'));
    process.on('SIGTERM', () => proc.kill('SIGTERM'));
  }

  async handleClaudeCodeMode(args: string[], currentFilePath: string): Promise<void> {
    const __dirname = dirname(currentFilePath);
    const claudeCodePath = resolve(__dirname, './cli/claude-code-wrapper.js');

    const proc = spawn('node', [claudeCodePath, ...args.slice(3)], {
      stdio: 'inherit',
      env: process.env as NodeJS.ProcessEnv,
    });

    proc.on('exit', (code) => {
      process.exit(code || 0);
    });

    process.on('SIGINT', () => proc.kill('SIGINT'));
    process.on('SIGTERM', () => proc.kill('SIGTERM'));
  }

  async handleMcpMode(args: string[], currentFilePath: string): Promise<void> {
    const __dirname = dirname(currentFilePath);
    const serverPath = resolve(__dirname, './mcp/standalone-stdio.js');

    const proc = spawn('node', [serverPath], {
      stdio: 'inherit',
    });

    proc.on('exit', (code) => {
      process.exit(code || 0);
    });

    process.on('SIGINT', () => proc.kill('SIGINT'));
    process.on('SIGTERM', () => proc.kill('SIGTERM'));
  }

  async handleReasoningBankMode(args: string[]): Promise<void> {
    const { handleReasoningBankCommand } = await import('../utils/reasoningbankCommands.js');
    const subcommand = args[3] || 'help';
    await handleReasoningBankCommand(subcommand);
    process.exit(0);
  }

  async handleFederationMode(args: string[]): Promise<void> {
    const { handleFederationCommand } = await import('./federation-cli.js');
    const federationArgs = args.slice(3);
    await handleFederationCommand(federationArgs);
    process.exit(0);
  }
}
