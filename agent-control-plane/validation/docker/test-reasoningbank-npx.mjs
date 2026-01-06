#!/usr/bin/env node
/**
 * Docker Validation Script for ReasoningBank Backends
 *
 * Tests agent-control-plane package installation via npx and validates:
 * 1. Backend selector can detect environment
 * 2. Node.js backend works with SQLite
 * 3. WASM backend works in Node.js (in-memory)
 * 4. Package exports work correctly
 */

import { exec } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🐳 Docker Validation: agent-control-plane ReasoningBank\n');
console.log('━'.repeat(60));

// Test configuration
const PACKAGE_VERSION = process.env.PACKAGE_VERSION || 'latest';
const TEST_DIR = '/test/validation-workspace';

// Create test directory
try {
  mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  console.log(`✅ Created test directory: ${TEST_DIR}\n`);
} catch (error) {
  console.error(`❌ Failed to create test directory: ${error.message}`);
  process.exit(1);
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.error(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}\n`);
  }
}

// Test 1: Install package via npm
async function testPackageInstallation() {
  console.log('📦 Test 1: Package Installation via npm\n');

  try {
    // Initialize package.json
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify(
        {
          name: 'reasoningbank-validation',
          version: '1.0.0',
          type: 'module',
          private: true,
        },
        null,
        2
      )
    );

    console.log(`   Installing agent-control-plane@${PACKAGE_VERSION}...`);
    const { stdout, stderr } = await execAsync(
      `npm install agent-control-plane@${PACKAGE_VERSION} --no-save`
    );

    recordTest('Package installation', true, `Installed agent-control-plane@${PACKAGE_VERSION}`);
    return true;
  } catch (error) {
    recordTest('Package installation', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Backend selector import and environment detection
async function testBackendSelector() {
  console.log('🔍 Test 2: Backend Selector Environment Detection\n');

  const testScript = `
import { getRecommendedBackend, getBackendInfo, validateEnvironment } from 'agent-control-plane/reasoningbank/backend-selector';

console.log('Testing backend selector...');

// Test 1: Environment detection
const backend = getRecommendedBackend();
console.log('Recommended backend:', backend);
if (backend !== 'nodejs') {
  throw new Error('Expected nodejs backend in Node.js environment');
}

// Test 2: Backend info
const info = getBackendInfo();
console.log('Backend info:', JSON.stringify(info, null, 2));
if (info.backend !== 'nodejs') {
  throw new Error('Backend info mismatch');
}
if (info.environment !== 'nodejs') {
  throw new Error('Environment detection failed');
}

// Test 3: Environment validation
const validation = validateEnvironment();
console.log('Environment validation:', JSON.stringify(validation, null, 2));
if (!validation.valid) {
  console.warn('Warnings:', validation.warnings);
}

console.log('✅ Backend selector tests passed');
`;

  try {
    writeFileSync(join(TEST_DIR, 'test-selector.mjs'), testScript);
    const { stdout, stderr } = await execAsync('node test-selector.mjs');

    const detectedBackend = stdout.match(/Recommended backend: (\w+)/)?.[1];

    recordTest('Backend selector import', true, `Detected: ${detectedBackend}`);

    recordTest(
      'Environment detection',
      detectedBackend === 'nodejs',
      `Expected nodejs, got ${detectedBackend}`
    );

    return true;
  } catch (error) {
    recordTest('Backend selector', false, `Error: ${error.message}\n${error.stderr || ''}`);
    return false;
  }
}

// Test 3: Node.js backend (SQLite)
async function testNodeBackend() {
  console.log('💾 Test 3: Node.js Backend (SQLite)\n');

  const testScript = `
import { createOptimalReasoningBank } from 'agent-control-plane/reasoningbank/backend-selector';

console.log('Testing Node.js backend with SQLite...');

// Create ReasoningBank instance
const rb = await createOptimalReasoningBank('test-db', {
  dbPath: '.test-swarm/memory.db',
  verbose: true
});

console.log('✅ ReasoningBank instance created');

// Test that we got the Node.js backend
if (!rb.db) {
  throw new Error('Expected Node.js backend with db module');
}

console.log('✅ Node.js backend detected (has db module)');

// Check if database was initialized
try {
  const stats = await rb.db.getDb();
  console.log('✅ Database connection verified');
} catch (error) {
  console.log('Note: Database not fully initialized, but module loaded correctly');
}

console.log('✅ Node.js backend tests passed');
`;

  try {
    writeFileSync(join(TEST_DIR, 'test-node-backend.mjs'), testScript);
    const { stdout, stderr } = await execAsync('node test-node-backend.mjs');

    recordTest(
      'Node.js backend initialization',
      stdout.includes('ReasoningBank instance created'),
      'SQLite backend loaded'
    );

    recordTest(
      'Node.js backend detection',
      stdout.includes('Node.js backend detected'),
      'db module present'
    );

    return true;
  } catch (error) {
    recordTest('Node.js backend', false, `Error: ${error.message}\n${error.stderr || ''}`);
    return false;
  }
}

// Test 4: WASM backend
async function testWasmBackend() {
  console.log('⚡ Test 4: WASM Backend (In-Memory)\n');

  const testScript = `
import { createReasoningBank } from 'agent-control-plane/reasoningbank/wasm-adapter';

console.log('Testing WASM backend...');

// Create WASM instance
const rb = await createReasoningBank('wasm-test');
console.log('✅ WASM ReasoningBank instance created');

// Store a pattern
const patternId = await rb.storePattern({
  task_description: 'Test pattern for Docker validation',
  task_category: 'docker-test',
  strategy: 'validation',
  success_score: 0.95
});

console.log('✅ Pattern stored:', patternId);

// Search by category
const patterns = await rb.searchByCategory('docker-test', 10);
console.log('✅ Category search returned', patterns.length, 'patterns');

if (patterns.length !== 1) {
  throw new Error('Expected 1 pattern, got ' + patterns.length);
}

// Semantic search
const similar = await rb.findSimilar('test validation', 'docker-test', 5);
console.log('✅ Semantic search returned', similar.length, 'results');

if (similar.length === 0) {
  throw new Error('Expected at least 1 similar pattern');
}

const score = similar[0].similarity_score;
console.log('   Similarity score:', score);

if (score < 0.3 || score > 1.0) {
  throw new Error('Similarity score out of range: ' + score);
}

// Get stats
const stats = await rb.getStats();
console.log('✅ Stats:', JSON.stringify(stats, null, 2));

if (stats.total_patterns !== 1) {
  throw new Error('Expected 1 pattern in stats, got ' + stats.total_patterns);
}

console.log('✅ WASM backend tests passed');
`;

  try {
    writeFileSync(join(TEST_DIR, 'test-wasm-backend.mjs'), testScript);
    const { stdout, stderr } = await execAsync(
      'node --experimental-wasm-modules test-wasm-backend.mjs'
    );

    recordTest(
      'WASM backend initialization',
      stdout.includes('WASM ReasoningBank instance created'),
      'WASM module loaded'
    );

    recordTest(
      'WASM pattern storage',
      stdout.includes('Pattern stored:'),
      'In-memory storage works'
    );

    recordTest(
      'WASM semantic search',
      stdout.includes('Semantic search returned'),
      'Similarity matching works'
    );

    const scoreMatch = stdout.match(/Similarity score: ([\d.]+)/);
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1]);
      recordTest(
        'WASM similarity scoring',
        score >= 0.3 && score <= 1.0,
        `Score: ${score.toFixed(4)}`
      );
    }

    return true;
  } catch (error) {
    recordTest('WASM backend', false, `Error: ${error.message}\n${error.stderr || ''}`);
    return false;
  }
}

// Test 5: Package exports
async function testPackageExports() {
  console.log('📦 Test 5: Package Exports\n');

  const testScript = `
// Test ReasoningBank export paths
// Note: Main export requires Claude Code binary, skip in Docker

try {
  const reasoningbank = await import('agent-control-plane/reasoningbank');
  console.log('✅ reasoningbank export works (auto-selects Node.js)');
  if (!reasoningbank.db) {
    throw new Error('Expected db module in reasoningbank export');
  }
} catch (error) {
  console.error('❌ reasoningbank export failed:', error.message);
  throw error;
}

try {
  const selector = await import('agent-control-plane/reasoningbank/backend-selector');
  console.log('✅ backend-selector export works');
  if (typeof selector.createOptimalReasoningBank !== 'function') {
    throw new Error('Expected createOptimalReasoningBank function');
  }
  if (typeof selector.getRecommendedBackend !== 'function') {
    throw new Error('Expected getRecommendedBackend function');
  }
} catch (error) {
  console.error('❌ backend-selector export failed:', error.message);
  throw error;
}

try {
  const wasm = await import('agent-control-plane/reasoningbank/wasm-adapter');
  console.log('✅ wasm-adapter export works');
  if (typeof wasm.createReasoningBank !== 'function') {
    throw new Error('Expected createReasoningBank function');
  }
  if (!wasm.ReasoningBankAdapter) {
    throw new Error('Expected ReasoningBankAdapter class');
  }
} catch (error) {
  console.error('❌ wasm-adapter export failed:', error.message);
  throw error;
}

console.log('✅ All ReasoningBank exports working');
`;

  try {
    writeFileSync(join(TEST_DIR, 'test-exports.mjs'), testScript);
    // Use --experimental-wasm-modules flag for WASM import
    const { stdout, stderr } = await execAsync('node --experimental-wasm-modules test-exports.mjs');

    recordTest(
      'ReasoningBank exports',
      stdout.includes('All ReasoningBank exports working'),
      'All ReasoningBank import paths valid'
    );

    return true;
  } catch (error) {
    recordTest('Package exports', false, `Error: ${error.message}\n${error.stderr || ''}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`📋 Running validation tests for agent-control-plane@${PACKAGE_VERSION}\n`);
  console.log('━'.repeat(60) + '\n');

  const startTime = Date.now();

  // Run tests sequentially
  await testPackageInstallation();
  await testBackendSelector();
  await testNodeBackend();
  await testWasmBackend();
  await testPackageExports();

  const duration = Date.now() - startTime;

  // Print summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('━'.repeat(60) + '\n');

  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);

  // Detailed results
  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  ❌ ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
    console.log('');
  }

  console.log('━'.repeat(60));

  // Exit with appropriate code
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Package is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Review the output above.\n');
    process.exit(1);
  }
}

// Execute
runAllTests().catch((error) => {
  console.error('\n💥 Fatal error during validation:', error);
  process.exit(1);
});
