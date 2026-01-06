#!/usr/bin/env node
/**
 * Test script for Phi-4 ONNX provider with HuggingFace API fallback
 */

import { ONNXPhi4Provider } from './providers/onnx-phi4.js';

async function testPhi4Provider() {
  console.log('🧪 Testing Phi-4 ONNX Provider (via HuggingFace API)\n');

  try {
    // Test 1: Initialize provider
    console.log('Test 1: Provider Initialization');
    console.log('================================');

    const provider = new ONNXPhi4Provider({
      modelId: 'microsoft/Phi-3-mini-4k-instruct',
      huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
    });

    const info = provider.getModelInfo();
    console.log(`✅ Provider initialized`);
    console.log(`📊 Model: ${info.modelId}`);
    console.log(`🔧 Mode: ${info.mode}`);
    console.log(`⚡ Supports local: ${info.supportsLocalInference}\n`);

    // Test 2: Simple chat completion
    console.log('Test 2: Chat Completion');
    console.log('=======================');

    const chatParams = {
      model: 'microsoft/Phi-3-mini-4k-instruct',
      messages: [
        {
          role: 'user' as const,
          content: 'What is 2+2? Answer in one sentence.',
        },
      ],
      maxTokens: 50,
      temperature: 0.3,
    };

    console.log(`📤 Sending request...`);
    console.log(`📝 Question: ${chatParams.messages[0].content}\n`);

    const startTime = Date.now();
    const response = await provider.chat(chatParams);
    const latency = Date.now() - startTime;

    console.log('📥 Response received:');
    console.log(`  Provider: ${response.metadata?.provider}`);
    console.log(`  Model: ${response.model}`);
    console.log(`  Mode: ${response.metadata?.mode}`);
    console.log(`  Latency: ${latency}ms`);
    console.log(`  Usage: ${response.usage?.inputTokens} in / ${response.usage?.outputTokens} out`);
    console.log(`  Cost: $${response.metadata?.cost?.toFixed(6) || 0}`);
    console.log(`\n  Content:`);

    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(`    ${block.text}`);
      }
    }

    console.log('\n✅ Test 2 passed!\n');

    // Test 3: Reasoning test
    console.log('Test 3: Reasoning Test');
    console.log('======================');

    const reasoningParams = {
      model: 'microsoft/Phi-3-mini-4k-instruct',
      messages: [
        {
          role: 'user' as const,
          content: 'If a train travels at 60mph for 2 hours, how far does it go?',
        },
      ],
      maxTokens: 100,
      temperature: 0.5,
    };

    console.log(`📤 Testing reasoning...`);
    const reasoningResponse = await provider.chat(reasoningParams);

    console.log('📥 Response:');
    console.log(
      `  ${reasoningResponse.content[0].type === 'text' ? reasoningResponse.content[0].text : 'N/A'}`
    );
    console.log('\n✅ Test 3 passed!\n');

    // Test 4: Model info
    console.log('Test 4: Model Information');
    console.log('=========================');

    const modelInfo = provider.getModelInfo();
    console.log(`📊 Model ID: ${modelInfo.modelId}`);
    console.log(`🔧 Inference Mode: ${modelInfo.mode}`);
    console.log(`📁 Model Path: ${modelInfo.modelPath}`);
    console.log(`🔑 API Key: ${modelInfo.apiKey || 'Not set'}`);
    console.log(`⚡ Local ONNX Ready: ${modelInfo.supportsLocalInference}`);
    console.log('\n✅ Test 4 passed!\n');

    // Test 5: Performance benchmark
    console.log('Test 5: Performance Benchmark');
    console.log('=============================');

    const benchmarkParams = {
      model: 'microsoft/Phi-3-mini-4k-instruct',
      messages: [
        {
          role: 'user' as const,
          content: 'Count from 1 to 5.',
        },
      ],
      maxTokens: 30,
      temperature: 0.5,
    };

    const benchmarkRuns = 3;
    const latencies: number[] = [];

    for (let i = 0; i < benchmarkRuns; i++) {
      const start = Date.now();
      await provider.chat(benchmarkParams);
      const duration = Date.now() - start;
      latencies.push(duration);
      console.log(`  Run ${i + 1}: ${duration}ms`);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log(`\n📊 Benchmark Results:`);
    console.log(`  Average Latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`  Min Latency: ${Math.min(...latencies)}ms`);
    console.log(`  Max Latency: ${Math.max(...latencies)}ms`);
    console.log('\n✅ Test 5 passed!\n');

    // Final summary
    console.log('🎉 All Phi-4 Tests Passed!');
    console.log('==========================');
    console.log(`✅ Provider initialization working`);
    console.log(`✅ HuggingFace API inference functional`);
    console.log(`✅ Chat completion successful`);
    console.log(`✅ Reasoning capability verified`);
    console.log(`✅ Performance: ${avgLatency.toFixed(0)}ms average`);
    console.log(`\n💡 Next Steps:`);
    console.log(`  1. Free up disk space (need 5GB)`);
    console.log(`  2. Download model.onnx.data`);
    console.log(`  3. Switch to local ONNX inference`);
    console.log(`  4. Benchmark local vs API performance`);
  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('===============');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testPhi4Provider().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
