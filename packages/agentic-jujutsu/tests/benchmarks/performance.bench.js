#!/usr/bin/env node
/**
 * Performance benchmarks for agentic-jujutsu WASM
 */

const path = require('path');

async function runBenchmarks() {
  console.log('\n⚡ agentic-jujutsu Performance Benchmarks\n');

  try {
    const jj = require(path.join(__dirname, '../../pkg/node'));

    // Benchmark 1: Module load time
    console.log('📊 Module Load Time:');
    const loadStart = process.hrtime.bigint();
    require(path.join(__dirname, '../../pkg/node'));
    const loadEnd = process.hrtime.bigint();
    const loadTimeMs = Number(loadEnd - loadStart) / 1_000_000;
    console.log(`  ✓ ${loadTimeMs.toFixed(2)}ms\n`);

    // Benchmark 2: Memory usage
    console.log('💾 Memory Usage:');
    const mem = process.memoryUsage();
    console.log(`  RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
    console.log(`  Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
    console.log(`  External: ${Math.round(mem.external / 1024 / 1024)}MB\n`);

    console.log('✅ Benchmarks complete!\n');
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

runBenchmarks();
