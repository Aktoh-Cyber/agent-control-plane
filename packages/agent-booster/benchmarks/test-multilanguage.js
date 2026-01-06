#!/usr/bin/env node
/**
 * Multi-Language Support Test
 *
 * Tests Agent Booster with Python, Rust, Go, Java, C, and C++ code
 */

const AgentBooster = require('../dist/index.js').default;

console.log('\n🌐 Multi-Language Support Test\n');

const tests = [
  // Python
  {
    language: 'python',
    name: 'Python function',
    code: `def calculate(x, y):
    return x + y`,
    edit: `def calculate(x: int, y: int) -> int:
    """Add two numbers"""
    return x + y`,
  },

  // Rust
  {
    language: 'rust',
    name: 'Rust function',
    code: `fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
    edit: `pub fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
  },

  // Go
  {
    language: 'go',
    name: 'Go function',
    code: `func Add(a int, b int) int {
    return a + b
}`,
    edit: `func Add(a, b int) int {
    return a + b
}`,
  },

  // Java
  {
    language: 'java',
    name: 'Java method',
    code: `public int add(int a, int b) {
    return a + b;
}`,
    edit: `public static int add(int a, int b) {
    return a + b;
}`,
  },

  // C
  {
    language: 'c',
    name: 'C function',
    code: `int add(int a, int b) {
    return a + b;
}`,
    edit: `static int add(int a, int b) {
    return a + b;
}`,
  },

  // C++
  {
    language: 'cpp',
    name: 'C++ class',
    code: `class Calculator {
public:
    int add(int a, int b) {
        return a + b;
    }
};`,
    edit: `class Calculator {
private:
    int result;
public:
    int add(int a, int b) {
        return a + b;
    }
};`,
  },
];

async function runTests() {
  const booster = new AgentBooster({ confidenceThreshold: 0.5 });
  const results = [];

  console.log('┌───────────────────────────┬──────────┬────────────┬──────────────┐');
  console.log('│ Test                      │ Language │ Latency    │ Confidence   │');
  console.log('├───────────────────────────┼──────────┼────────────┼──────────────┤');

  for (const test of tests) {
    const startTime = Date.now();

    try {
      const result = await booster.apply({
        code: test.code,
        edit: test.edit,
        language: test.language,
      });

      const latency = Date.now() - startTime;

      console.log(
        `│ ${test.name.padEnd(25)} │ ${test.language.padEnd(8)} │ ${(latency + 'ms').padStart(10)} │ ${((result.confidence * 100).toFixed(1) + '%').padStart(12)} │`
      );

      results.push({
        name: test.name,
        language: test.language,
        success: result.success,
        confidence: result.confidence,
        latency: latency,
        strategy: result.strategy,
      });
    } catch (error) {
      console.log(
        `│ ${test.name.padEnd(25)} │ ${test.language.padEnd(8)} │ ${'ERROR'.padStart(10)} │ ${'0%'.padStart(12)} │`
      );

      results.push({
        name: test.name,
        language: test.language,
        success: false,
        confidence: 0,
        latency: 0,
        strategy: 'failed',
        error: error.message,
      });
    }
  }

  console.log('└───────────────────────────┴──────────┴────────────┴──────────────┘\n');

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  console.log('📊 Summary\n');
  console.log(`Total Tests:       ${results.length}`);
  console.log(
    `Successful:        ${successful} (${((successful / results.length) * 100).toFixed(0)}%)`
  );
  console.log(`Failed:            ${failed} (${((failed / results.length) * 100).toFixed(0)}%)`);
  console.log(`Average Latency:   ${avgLatency.toFixed(0)}ms`);
  console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%\n`);

  // Language breakdown
  console.log('📂 By Language\n');
  const byLanguage = {};
  results.forEach((r) => {
    if (!byLanguage[r.language]) {
      byLanguage[r.language] = { total: 0, success: 0 };
    }
    byLanguage[r.language].total++;
    if (r.success) byLanguage[r.language].success++;
  });

  console.log('┌──────────────┬───────┬─────────┬──────────────┐');
  console.log('│ Language     │ Tests │ Success │ Success Rate │');
  console.log('├──────────────┼───────┼─────────┼──────────────┤');

  Object.keys(byLanguage).forEach((lang) => {
    const data = byLanguage[lang];
    const rate = ((data.success / data.total) * 100).toFixed(0);
    console.log(
      `│ ${lang.padEnd(12)} │ ${data.total.toString().padStart(5)} │ ${data.success.toString().padStart(7)} │ ${(rate + '%').padStart(12)} │`
    );
  });

  console.log('└──────────────┴───────┴─────────┴──────────────┘\n');

  console.log('✅ Multi-language test complete!\n');

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, 'results/multilanguage-test-results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log(`📄 Results saved to: ${outputPath}\n`);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
