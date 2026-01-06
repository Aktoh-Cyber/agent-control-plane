/**
 * Standalone proxy server handler
 */

export class StandaloneProxy {
  async run(args: string[]): Promise<void> {
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

    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Agentic Flow - Standalone Anthropic Proxy Server    ║
╚═══════════════════════════════════════════════════════╝
`);

    if (provider === 'gemini') {
      await this.startGeminiProxy(port, model);
    } else if (provider === 'openrouter') {
      await this.startOpenRouterProxy(port, model);
    } else {
      console.error(`❌ Error: Invalid provider "${provider}". Must be "gemini" or "openrouter"`);
      process.exit(1);
    }

    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down proxy server...');
      process.exit(0);
    });

    await new Promise(() => {});
  }

  private async startGeminiProxy(port: number, model?: string): Promise<void> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`❌ Error: GOOGLE_GEMINI_API_KEY environment variable required

Set it with:
  export GOOGLE_GEMINI_API_KEY=your-key-here
`);
      process.exit(1);
    }

    const finalModel = model || process.env.COMPLETION_MODEL || 'gemini-2.0-flash-exp';

    console.log(`🚀 Starting Gemini → Anthropic Proxy
📍 Port: ${port}
🤖 Model: ${finalModel}
🔗 Gemini API: https://generativelanguage.googleapis.com
`);

    const { AnthropicToGeminiProxy } = await import('../proxy/anthropic-to-gemini.js');
    const proxy = new AnthropicToGeminiProxy({
      geminiApiKey: apiKey,
      defaultModel: finalModel,
    });

    proxy.start(port);

    console.log(`✅ Proxy server running!

Configure Claude Code:
  export ANTHROPIC_BASE_URL=http://localhost:${port}
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude

Cost Savings: ~85% vs direct Anthropic API
`);
  }

  private async startOpenRouterProxy(port: number, model?: string): Promise<void> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error(`❌ Error: OPENROUTER_API_KEY environment variable required

Set it with:
  export OPENROUTER_API_KEY=sk-or-v1-your-key-here

Get your key at: https://openrouter.ai/keys
`);
      process.exit(1);
    }

    const finalModel = model || process.env.COMPLETION_MODEL || 'deepseek/deepseek-chat';

    console.log(`🚀 Starting OpenRouter → Anthropic Proxy
📍 Port: ${port}
🤖 Model: ${finalModel}
🔗 OpenRouter API: https://openrouter.ai/api/v1
`);

    const { AnthropicToOpenRouterProxy } = await import('../proxy/anthropic-to-openrouter.js');
    const proxy = new AnthropicToOpenRouterProxy({
      openrouterApiKey: apiKey,
      defaultModel: finalModel,
    });

    proxy.start(port);

    console.log(`✅ Proxy server running!

Configure Claude Code:
  export ANTHROPIC_BASE_URL=http://localhost:${port}
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude

Cost Savings: ~90% vs direct Anthropic API
Popular Models:
  - openai/gpt-4o-mini (fast, cheap)
  - anthropic/claude-3.5-sonnet (via OpenRouter)
  - meta-llama/llama-3.1-405b-instruct (OSS)
`);
  }
}
