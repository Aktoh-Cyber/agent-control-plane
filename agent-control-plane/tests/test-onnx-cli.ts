/**
 * Test ONNX CLI Integration
 * Verifies automatic Phi-4-mini model download and inference
 */

import { ONNXLocalProvider } from '../src/router/providers/onnx-local.js';
import type { Message } from '../src/router/types.js';

async function testONNXIntegration() {
  console.log('🧪 Testing ONNX CLI Integration\n');
  console.log('================================================\n');

  try {
    // Initialize ONNX provider (this will trigger auto-download if needed)
    console.log('1️⃣ Initializing ONNX provider...');
    const provider = new ONNXLocalProvider({
      executionProviders: ['cpu'], // Start with CPU for testing
      maxTokens: 50, // Keep it short for testing
      temperature: 0.7,
    });

    console.log('✅ ONNX provider created\n');

    // Test chat completion with simple task
    console.log('2️⃣ Testing chat completion with "Hello, world!" prompt...');

    const messages: Message[] = [
      {
        role: 'user',
        content: 'Say "Hello, world!" and nothing else.',
      },
    ];

    const startTime = Date.now();
    const response = await provider.chat({
      messages,
      maxTokens: 50,
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;

    console.log('\n3️⃣ Response received!\n');
    console.log('═══════════════════════════════════════');
    console.log(
      'Response:',
      response.content[0].type === 'text' ? response.content[0].text : 'Non-text response'
    );
    console.log('═══════════════════════════════════════\n');

    console.log('📊 Metrics:');
    console.log(`   • Input tokens: ${response.usage.inputTokens}`);
    console.log(`   • Output tokens: ${response.usage.outputTokens}`);
    console.log(`   • Duration: ${duration}ms`);
    console.log(`   • Tokens/sec: ${response.metadata?.tokensPerSecond?.toFixed(2) || 'N/A'}`);
    console.log(`   • Cost: $${response.metadata?.cost || 0.0} (FREE!)`);
    console.log(`   • Provider: ${response.metadata?.provider}`);
    console.log(`   • Model: ${response.metadata?.model}\n`);

    // Cleanup
    await provider.dispose();

    console.log('✅ ONNX integration test PASSED!\n');
    console.log('================================================\n');
    console.log('✨ ONNX is ready to use with agent-control-plane CLI:\n');
    console.log(
      '   npx agent-control-plane --agent coder --task "Create hello world" --provider onnx\n'
    );

    return true;
  } catch (error) {
    console.error('\n❌ Test FAILED:', error);
    console.error('\nError details:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('Download failed')) {
      console.error('\n💡 Tip: Check your internet connection and try again.');
      console.error('   The Phi-4-mini model is ~4.9GB and downloads from HuggingFace.');
    }

    return false;
  }
}

// Run test
testONNXIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
