/**
 * Proxy manager - handles proxy server initialization and configuration
 */

import { AnthropicToOpenRouterProxy } from '../proxy/anthropic-to-openrouter.js';
import { AnthropicToRequestyProxy } from '../proxy/anthropic-to-requesty.js';
import { logger } from '../utils/logger.js';
import { detectModelCapabilities } from '../utils/modelCapabilities.js';

export class ProxyManager {
  private proxyServer: any = null;
  private proxyPort: number = 3000;

  async startOpenRouterProxy(modelOverride?: string): Promise<void> {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      console.error('❌ Error: OPENROUTER_API_KEY required for OpenRouter models');
      console.error('Set it in .env or export OPENROUTER_API_KEY=sk-or-v1-xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated OpenRouter proxy');

    const defaultModel =
      modelOverride ||
      process.env.COMPLETION_MODEL ||
      process.env.REASONING_MODEL ||
      'deepseek/deepseek-chat';

    const capabilities = detectModelCapabilities(defaultModel);

    const proxy = new AnthropicToOpenRouterProxy({
      openrouterApiKey: openrouterKey,
      openrouterBaseUrl: process.env.ANTHROPIC_PROXY_BASE_URL,
      defaultModel,
      capabilities: capabilities,
    });

    proxy.start(this.proxyPort);
    this.proxyServer = proxy;

    process.env.ANTHROPIC_BASE_URL = `http://localhost:${this.proxyPort}`;
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy-key';
    }

    console.log(`🔗 Proxy Mode: OpenRouter`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}`);

    if (capabilities.requiresEmulation) {
      console.log(`\n⚙️  Detected: Model lacks native tool support`);
      console.log(`🔧 Using ${capabilities.emulationStrategy.toUpperCase()} emulation pattern`);
      console.log(
        `📊 Expected reliability: ${capabilities.emulationStrategy === 'react' ? '70-85%' : '50-70%'}`
      );
    }
    console.log('');

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  async startGeminiProxy(modelOverride?: string): Promise<void> {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiKey) {
      console.error('❌ Error: GOOGLE_GEMINI_API_KEY required for Gemini models');
      console.error('Set it in .env or export GOOGLE_GEMINI_API_KEY=xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated Gemini proxy');

    const defaultModel =
      modelOverride && !modelOverride.startsWith('claude') ? modelOverride : 'gemini-2.0-flash-exp';

    const { AnthropicToGeminiProxy } = await import('../proxy/anthropic-to-gemini.js');

    const proxy = new AnthropicToGeminiProxy({
      geminiApiKey: geminiKey,
      defaultModel,
    });

    proxy.start(this.proxyPort);
    this.proxyServer = proxy;

    process.env.ANTHROPIC_BASE_URL = `http://localhost:${this.proxyPort}`;
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy-key';
    }

    console.log(`🔗 Proxy Mode: Google Gemini`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}\n`);

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  async startRequestyProxy(modelOverride?: string): Promise<void> {
    const requestyKey = process.env.REQUESTY_API_KEY;

    if (!requestyKey) {
      console.error('❌ Error: REQUESTY_API_KEY required for Requesty models');
      console.error('Set it in .env or export REQUESTY_API_KEY=sk-xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated Requesty proxy');

    const defaultModel =
      modelOverride ||
      process.env.COMPLETION_MODEL ||
      process.env.REASONING_MODEL ||
      'deepseek/deepseek-chat';

    const capabilities = detectModelCapabilities(defaultModel);

    const proxy = new AnthropicToRequestyProxy({
      requestyApiKey: requestyKey,
      requestyBaseUrl: process.env.REQUESTY_BASE_URL,
      defaultModel,
      capabilities: capabilities,
    });

    proxy.start(this.proxyPort);
    this.proxyServer = proxy;

    process.env.ANTHROPIC_BASE_URL = `http://localhost:${this.proxyPort}`;
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy-key';
    }

    console.log(`🔗 Proxy Mode: Requesty`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}`);

    if (capabilities.requiresEmulation) {
      console.log(`\n⚙️  Detected: Model lacks native tool support`);
      console.log(`🔧 Using ${capabilities.emulationStrategy.toUpperCase()} emulation pattern`);
      console.log(
        `📊 Expected reliability: ${capabilities.emulationStrategy === 'react' ? '70-85%' : '50-70%'}`
      );
    }
    console.log('');

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  async startONNXProxy(modelOverride?: string): Promise<void> {
    logger.info('Starting integrated ONNX local inference proxy');

    console.log('🔧 Provider: ONNX Local (Phi-4-mini)');
    console.log('💾 Free local inference - no API costs\n');

    const { AnthropicToONNXProxy } = await import('../proxy/anthropic-to-onnx.js');

    const onnxProxyPort = parseInt(process.env.ONNX_PROXY_PORT || '3001');

    const proxy = new AnthropicToONNXProxy({
      port: onnxProxyPort,
      modelPath: process.env.ONNX_MODEL_PATH,
      executionProviders: process.env.ONNX_EXECUTION_PROVIDERS?.split(',') || ['cpu'],
    });

    await proxy.start();
    this.proxyServer = proxy;

    process.env.ANTHROPIC_BASE_URL = `http://localhost:${onnxProxyPort}`;
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-onnx-local-key';
    }

    console.log(`🔗 Proxy Mode: ONNX Local Inference`);
    console.log(`🔧 Proxy URL: http://localhost:${onnxProxyPort}`);
    console.log(`🤖 Model: Phi-4-mini-instruct (ONNX)\n`);

    console.log('⏳ Loading ONNX model... (this may take a moment)\n');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  getProxyServer(): any {
    return this.proxyServer;
  }
}
