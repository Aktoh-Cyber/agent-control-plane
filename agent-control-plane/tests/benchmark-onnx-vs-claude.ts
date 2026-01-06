/**
 * ONNX vs Claude Quality Benchmark
 * Generates code with both providers and validates functionality
 */

import { exec } from 'child_process';
import { unlinkSync, writeFileSync } from 'fs';
import { promisify } from 'util';
import { AnthropicProvider } from '../src/router/providers/anthropic.js';
import { ONNXLocalProvider } from '../src/router/providers/onnx-local.js';
import type { Message } from '../src/router/types.js';

const execAsync = promisify(exec);

interface BenchmarkResult {
  provider: string;
  task: string;
  code: string;
  latency: number;
  tokensPerSecond: number;
  functionalityTest: 'PASS' | 'FAIL' | 'SKIP';
  errorMessage?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

class QualityBenchmark {
  private onnxProvider: ONNXLocalProvider | null = null;
  private claudeProvider: AnthropicProvider | null = null;

  async initialize() {
    console.log('🔧 Initializing providers...\n');

    // Initialize ONNX if model is downloaded
    try {
      this.onnxProvider = new ONNXLocalProvider({
        executionProviders: ['cpu'],
        maxTokens: 150,
        temperature: 0.7,
      });
      console.log('✅ ONNX provider initialized');
    } catch (error) {
      console.log('⚠️  ONNX provider not available:', error);
    }

    // Initialize Claude if API key exists
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.claudeProvider = new AnthropicProvider({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-5-sonnet-20241022',
          maxTokens: 150,
        });
        console.log('✅ Claude provider initialized');
      } catch (error) {
        console.log('⚠️  Claude provider not available:', error);
      }
    } else {
      console.log('⚠️  ANTHROPIC_API_KEY not set - Claude tests will be skipped');
    }

    console.log('');
  }

  async testCodeGeneration(
    provider: ONNXLocalProvider | AnthropicProvider,
    providerName: string,
    task: string,
    messages: Message[]
  ): Promise<BenchmarkResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing ${providerName}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();

    try {
      const response = await provider.chat({
        messages,
        maxTokens: 150,
        temperature: 0.7,
      });

      const latency = Date.now() - startTime;
      const code = response.content[0].type === 'text' ? response.content[0].text : '';
      const tokensPerSecond = response.usage.outputTokens / (latency / 1000);

      console.log(`⏱️  Latency: ${latency}ms`);
      console.log(`📊 Tokens/sec: ${tokensPerSecond.toFixed(2)}`);
      console.log(`📝 Input tokens: ${response.usage.inputTokens}`);
      console.log(`📝 Output tokens: ${response.usage.outputTokens}`);
      console.log(`💰 Cost: $${response.metadata?.cost?.toFixed(4) || '0.0000'}`);
      console.log(`\n📄 Generated Code:\n`);
      console.log('```python');
      console.log(code);
      console.log('```\n');

      // Test functionality
      const functionalityResult = await this.testFunctionality(code, task);

      return {
        provider: providerName,
        task,
        code,
        latency,
        tokensPerSecond,
        functionalityTest: functionalityResult.passed ? 'PASS' : 'FAIL',
        errorMessage: functionalityResult.error,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cost: response.metadata?.cost || 0,
      };
    } catch (error) {
      console.error(`❌ Generation failed:`, error);
      return {
        provider: providerName,
        task,
        code: '',
        latency: Date.now() - startTime,
        tokensPerSecond: 0,
        functionalityTest: 'FAIL',
        errorMessage: error instanceof Error ? error.message : String(error),
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      };
    }
  }

  async testFunctionality(
    code: string,
    task: string
  ): Promise<{ passed: boolean; error?: string }> {
    // Extract Python code from markdown if present
    const codeMatch =
      code.match(/```python\n([\s\S]*?)\n```/) || code.match(/```\n([\s\S]*?)\n```/);
    const cleanCode = codeMatch ? codeMatch[1] : code;

    // Create test file
    const testFile = '/tmp/test_generated.py';
    const testCode = `
${cleanCode}

# Test the function
import sys
try:
    # Test prime number function
    assert is_prime(2) == True, "2 should be prime"
    assert is_prime(3) == True, "3 should be prime"
    assert is_prime(4) == False, "4 should not be prime"
    assert is_prime(17) == True, "17 should be prime"
    assert is_prime(1) == False, "1 should not be prime"
    assert is_prime(0) == False, "0 should not be prime"
    assert is_prime(-5) == False, "Negative numbers should not be prime"
    print("✅ All tests passed!")
    sys.exit(0)
except AssertionError as e:
    print(f"❌ Test failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Runtime error: {e}")
    sys.exit(2)
`;

    try {
      writeFileSync(testFile, testCode);
      const { stdout, stderr } = await execAsync(`python3 ${testFile}`);

      console.log(`🧪 Functionality Test: ${stdout.includes('passed') ? '✅ PASS' : '❌ FAIL'}`);
      if (stderr) console.log(`   stderr: ${stderr}`);

      unlinkSync(testFile);
      return { passed: stdout.includes('passed') };
    } catch (error: any) {
      const errorMsg = error.stdout || error.stderr || error.message;
      console.log(`🧪 Functionality Test: ❌ FAIL`);
      console.log(`   Error: ${errorMsg}`);

      try {
        unlinkSync(testFile);
      } catch {}

      return { passed: false, error: errorMsg };
    }
  }

  async runBenchmark() {
    await this.initialize();

    const task = 'Write a Python function called is_prime that checks if a number is prime';
    const messages: Message[] = [
      {
        role: 'user',
        content: `${task}. Return ONLY the Python code, no explanation.`,
      },
    ];

    const results: BenchmarkResult[] = [];

    // Test ONNX
    if (this.onnxProvider) {
      const result = await this.testCodeGeneration(
        this.onnxProvider,
        'ONNX Phi-4-mini',
        task,
        messages
      );
      results.push(result);
    }

    // Test Claude
    if (this.claudeProvider) {
      const result = await this.testCodeGeneration(
        this.claudeProvider,
        'Claude 3.5 Sonnet',
        task,
        messages
      );
      results.push(result);
    }

    // Print comparison table
    this.printComparison(results);

    // Cleanup
    if (this.onnxProvider) await this.onnxProvider.dispose();

    return results;
  }

  printComparison(results: BenchmarkResult[]) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 BENCHMARK RESULTS: ONNX vs Claude`);
    console.log(`${'='.repeat(80)}\n`);

    if (results.length === 0) {
      console.log('❌ No results to compare');
      return;
    }

    console.log('Task: "Write a prime number checker function"\n');

    // Comparison table
    console.log('┌─────────────────────┬──────────────────┬──────────────────┐');
    console.log('│ Metric              │ ONNX Phi-4-mini  │ Claude 3.5       │');
    console.log('├─────────────────────┼──────────────────┼──────────────────┤');

    const metrics = [
      { label: 'Latency', key: 'latency', format: (v: number) => `${v.toFixed(0)}ms` },
      { label: 'Tokens/sec', key: 'tokensPerSecond', format: (v: number) => `${v.toFixed(2)}` },
      { label: 'Output Tokens', key: 'outputTokens', format: (v: number) => `${v}` },
      { label: 'Cost', key: 'cost', format: (v: number) => `$${v.toFixed(4)}` },
      { label: 'Functionality', key: 'functionalityTest', format: (v: string) => v },
    ];

    metrics.forEach(({ label, key, format }) => {
      const onnxVal = results.find((r) => r.provider.includes('ONNX'))?.[
        key as keyof BenchmarkResult
      ];
      const claudeVal = results.find((r) => r.provider.includes('Claude'))?.[
        key as keyof BenchmarkResult
      ];

      const onnxStr = onnxVal !== undefined ? format(onnxVal as any) : 'N/A';
      const claudeStr = claudeVal !== undefined ? format(claudeVal as any) : 'N/A';

      console.log(`│ ${label.padEnd(19)} │ ${onnxStr.padEnd(16)} │ ${claudeStr.padEnd(16)} │`);
    });

    console.log('└─────────────────────┴──────────────────┴──────────────────┘\n');

    // Quality assessment
    const onnxResult = results.find((r) => r.provider.includes('ONNX'));
    const claudeResult = results.find((r) => r.provider.includes('Claude'));

    console.log('📋 Quality Assessment:\n');

    if (onnxResult) {
      console.log(`ONNX Phi-4-mini:`);
      console.log(
        `  • Functionality: ${onnxResult.functionalityTest === 'PASS' ? '✅ Working' : '❌ Failed'}`
      );
      console.log(`  • Speed: ${onnxResult.tokensPerSecond.toFixed(2)} tokens/sec`);
      console.log(`  • Cost: $${onnxResult.cost.toFixed(4)} (FREE)`);
      if (onnxResult.errorMessage) console.log(`  • Error: ${onnxResult.errorMessage}`);
      console.log('');
    }

    if (claudeResult) {
      console.log(`Claude 3.5 Sonnet:`);
      console.log(
        `  • Functionality: ${claudeResult.functionalityTest === 'PASS' ? '✅ Working' : '❌ Failed'}`
      );
      console.log(`  • Speed: ${claudeResult.tokensPerSecond.toFixed(2)} tokens/sec`);
      console.log(`  • Cost: $${claudeResult.cost.toFixed(4)}`);
      if (claudeResult.errorMessage) console.log(`  • Error: ${claudeResult.errorMessage}`);
      console.log('');
    }

    // Value analysis
    if (
      onnxResult &&
      claudeResult &&
      onnxResult.functionalityTest === 'PASS' &&
      claudeResult.functionalityTest === 'PASS'
    ) {
      const costSavings = (1 - onnxResult.cost / claudeResult.cost) * 100;
      const speedRatio = claudeResult.tokensPerSecond / onnxResult.tokensPerSecond;

      console.log('💡 Value Analysis:\n');
      console.log(`  • Both providers generated WORKING code ✅`);
      console.log(
        `  • ONNX is ${costSavings.toFixed(0)}% cheaper (FREE vs $${claudeResult.cost.toFixed(4)})`
      );
      console.log(`  • Claude is ${speedRatio.toFixed(1)}x faster`);
      console.log(`\n  📌 Recommendation: For simple functions like this, ONNX provides`);
      console.log(`     excellent value - working code at zero cost.`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }
}

// Run benchmark
const benchmark = new QualityBenchmark();
benchmark
  .runBenchmark()
  .then(() => {
    console.log('✅ Benchmark complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
