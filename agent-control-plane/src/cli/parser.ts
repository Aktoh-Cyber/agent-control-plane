/**
 * Command parser for Agentic Flow CLI
 * Handles argument parsing and command routing
 */

export interface ParsedOptions {
  version?: boolean;
  help?: boolean;
  mode?: string;
  agent?: string;
  task?: string;
  model?: string;
  provider?: string;
  stream?: boolean;
  verbose?: boolean;
  optimize?: boolean;
  optimizePriority?: string;
  maxCost?: number;
  agentBooster?: boolean;
  boosterThreshold?: number;
  [key: string]: any;
}

export class CommandParser {
  parseMode(argv: string[]): string | undefined {
    // Check for specific modes
    const modeCommands = [
      'config',
      'agent-manager',
      'mcp-manager',
      'proxy',
      'quic',
      'claude-code',
      'mcp',
      'reasoningbank',
      'federation',
      'list',
    ];

    for (const cmd of modeCommands) {
      if (argv.includes(cmd)) {
        return cmd;
      }
    }

    // Check for --list flag
    if (argv.includes('--list') || argv.includes('-l')) {
      return 'list';
    }

    return undefined;
  }

  parseProxyArgs(args: string[]): {
    provider: string;
    port: number;
    model?: string;
  } {
    let provider = 'gemini';
    let port = 3000;
    let model: string | undefined;

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--provider' || args[i] === '-p') && args[i + 1]) {
        provider = args[++i];
      } else if ((args[i] === '--port' || args[i] === '-P') && args[i + 1]) {
        port = parseInt(args[++i]);
      } else if ((args[i] === '--model' || args[i] === '-m') && args[i + 1]) {
        model = args[++i];
      }
    }

    return { provider, port, model };
  }

  parseQuicArgs(args: string[]): {
    port: number;
    certPath?: string;
    keyPath?: string;
  } {
    let port = parseInt(process.env.QUIC_PORT || '4433');
    let certPath = process.env.QUIC_CERT_PATH;
    let keyPath = process.env.QUIC_KEY_PATH;

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--port' || args[i] === '-P') && args[i + 1]) {
        port = parseInt(args[++i]);
      } else if ((args[i] === '--cert' || args[i] === '-c') && args[i + 1]) {
        certPath = args[++i];
      } else if ((args[i] === '--key' || args[i] === '-k') && args[i + 1]) {
        keyPath = args[++i];
      }
    }

    return { port, certPath, keyPath };
  }

  shouldShowHelp(options: ParsedOptions, mode?: string): boolean {
    if (options.help) return true;
    if (!options.agent && mode !== 'list' && !this.isSpecialMode(mode)) {
      return true;
    }
    return false;
  }

  private isSpecialMode(mode?: string): boolean {
    const specialModes = [
      'config',
      'agent-manager',
      'mcp-manager',
      'proxy',
      'quic',
      'claude-code',
      'mcp',
      'reasoningbank',
      'federation',
    ];
    return mode ? specialModes.includes(mode) : false;
  }
}
