/**
 * Model router - determines which provider to use
 * Handles provider selection logic and validation
 */

export interface ProviderSelection {
  useONNX: boolean;
  useOpenRouter: boolean;
  useGemini: boolean;
  useRequesty: boolean;
}

export class ModelRouter {
  determineProvider(options: any): ProviderSelection {
    const useONNX = this.shouldUseONNX(options);
    const useOpenRouter = this.shouldUseOpenRouter(options);
    const useGemini = this.shouldUseGemini(options);
    const useRequesty = this.shouldUseRequesty(options);

    return { useONNX, useOpenRouter, useGemini, useRequesty };
  }

  shouldUseONNX(options: any): boolean {
    if (options.provider === 'onnx' || process.env.PROVIDER === 'onnx') {
      return true;
    }
    if (process.env.USE_ONNX === 'true') {
      return true;
    }
    return false;
  }

  shouldUseGemini(options: any): boolean {
    if (options.provider === 'gemini' || process.env.PROVIDER === 'gemini') {
      return true;
    }
    if (process.env.USE_GEMINI === 'true') {
      return true;
    }
    // Don't auto-select Gemini if user explicitly specified a different provider
    if (options.provider && options.provider !== 'gemini') {
      return false;
    }
    if (
      process.env.GOOGLE_GEMINI_API_KEY &&
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.OPENROUTER_API_KEY &&
      options.provider !== 'onnx'
    ) {
      return true;
    }
    return false;
  }

  shouldUseRequesty(options: any): boolean {
    if (options.provider === 'requesty' || process.env.PROVIDER === 'requesty') {
      return true;
    }
    if (process.env.USE_REQUESTY === 'true') {
      return true;
    }
    return false;
  }

  shouldUseOpenRouter(options: any): boolean {
    // Don't use OpenRouter if ONNX, Gemini, or Requesty is explicitly requested
    if (
      options.provider === 'onnx' ||
      process.env.USE_ONNX === 'true' ||
      process.env.PROVIDER === 'onnx'
    ) {
      return false;
    }
    if (options.provider === 'gemini' || process.env.PROVIDER === 'gemini') {
      return false;
    }
    if (options.provider === 'requesty' || process.env.PROVIDER === 'requesty') {
      return false;
    }
    // Use OpenRouter if provider is explicitly set or model contains "/"
    if (options.provider === 'openrouter' || process.env.PROVIDER === 'openrouter') {
      return true;
    }
    if (options.model?.includes('/')) {
      return true;
    }
    if (process.env.USE_OPENROUTER === 'true') {
      return true;
    }
    if (
      process.env.OPENROUTER_API_KEY &&
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.GOOGLE_GEMINI_API_KEY
    ) {
      return true;
    }
    return false;
  }

  printDebugInfo(options: any, selection: ProviderSelection): void {
    if (options.verbose || process.env.VERBOSE === 'true') {
      console.log('\n🔍 Provider Selection Debug:');
      console.log(`  Provider flag: ${options.provider || 'not set'}`);
      console.log(`  Model: ${options.model || 'default'}`);
      console.log(`  Use ONNX: ${selection.useONNX}`);
      console.log(`  Use OpenRouter: ${selection.useOpenRouter}`);
      console.log(`  Use Gemini: ${selection.useGemini}`);
      console.log(`  Use Requesty: ${selection.useRequesty}`);
      console.log(
        `  OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ set' : '✗ not set'}`
      );
      console.log(
        `  GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? '✓ set' : '✗ not set'}`
      );
      console.log(`  REQUESTY_API_KEY: ${process.env.REQUESTY_API_KEY ? '✓ set' : '✗ not set'}`);
      console.log(
        `  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ not set'}\n`
      );
    }
  }
}
