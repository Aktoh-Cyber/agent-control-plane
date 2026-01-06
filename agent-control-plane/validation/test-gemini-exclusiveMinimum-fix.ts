#!/usr/bin/env tsx

/**
 * Test script to validate fix for issue #55
 * Tests that Gemini proxy properly strips exclusiveMinimum/exclusiveMaximum from tool schemas
 */

import Anthropic from '@anthropic-ai/sdk';

const GEMINI_PROXY_URL = process.env.GEMINI_PROXY_URL || 'http://localhost:3000';
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!GOOGLE_GEMINI_API_KEY) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not set in environment');
  process.exit(1);
}

console.log('🧪 Testing Gemini Proxy - exclusiveMinimum/exclusiveMaximum Fix\n');
console.log(`Proxy URL: ${GEMINI_PROXY_URL}`);
console.log(`API Key: ${GOOGLE_GEMINI_API_KEY.substring(0, 10)}...\n`);

// Test tool definition with exclusiveMinimum (like Claude Code uses)
const testTool: Anthropic.Tool = {
  name: 'test_tool_with_exclusive_minimum',
  description: 'Test tool that includes exclusiveMinimum in schema',
  input_schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        exclusiveMinimum: 0, // This should be stripped by cleanSchema
        description: 'Limit parameter (must be > 0)',
      },
      offset: {
        type: 'number',
        exclusiveMinimum: 0,
        exclusiveMaximum: 1000, // This should also be stripped
        description: 'Offset parameter',
      },
      name: {
        type: 'string',
        description: 'Name parameter (should be preserved)',
      },
    },
    required: ['limit'],
  },
};

async function testGeminiProxy() {
  try {
    console.log('📋 Test Tool Schema (BEFORE cleanSchema):');
    console.log(JSON.stringify(testTool.input_schema, null, 2));
    console.log('\n');

    // Create Anthropic client pointing to Gemini proxy
    const client = new Anthropic({
      apiKey: GOOGLE_GEMINI_API_KEY,
      baseURL: GEMINI_PROXY_URL,
    });

    console.log('🚀 Sending request to Gemini proxy with tool definition...\n');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Can you tell me what tools you have available? Just list them briefly.',
        },
      ],
      tools: [testTool],
    });

    console.log('✅ SUCCESS: Request completed without errors!\n');
    console.log('Response:');
    console.log(JSON.stringify(response, null, 2));
    console.log('\n');

    // Verify the response
    if (response.content && response.content.length > 0) {
      console.log('✅ Response received successfully');
      console.log('✅ Tool schema with exclusiveMinimum/exclusiveMaximum was accepted');
      console.log('✅ Fix for issue #55 is WORKING!\n');

      console.log('📊 Test Results:');
      console.log('  - Tool definition sent: ✅');
      console.log('  - exclusiveMinimum handled: ✅');
      console.log('  - exclusiveMaximum handled: ✅');
      console.log('  - No 400 errors: ✅');
      console.log('  - Valid response received: ✅');

      return true;
    } else {
      console.error('❌ FAIL: Response content is empty');
      return false;
    }
  } catch (error: any) {
    console.error('❌ ERROR occurred during test:\n');

    if (error.status === 400 && error.message?.includes('exclusiveMinimum')) {
      console.error('❌ FAIL: Gemini API still rejecting exclusiveMinimum');
      console.error('   This means the fix is NOT working correctly\n');
    }

    console.error('Error details:');
    console.error(`  Status: ${error.status}`);
    console.error(`  Message: ${error.message}`);
    if (error.error) {
      console.error(`  Error object: ${JSON.stringify(error.error, null, 2)}`);
    }
    console.error('\n');

    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GEMINI PROXY - EXCLUSIVE MINIMUM FIX VALIDATION');
  console.log('  Testing fix for GitHub issue #55');
  console.log('═══════════════════════════════════════════════════════════\n');

  const success = await testGeminiProxy();

  console.log('═══════════════════════════════════════════════════════════');
  if (success) {
    console.log('✅ ALL TESTS PASSED - Fix is working correctly!');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('❌ TESTS FAILED - Fix needs more work');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
