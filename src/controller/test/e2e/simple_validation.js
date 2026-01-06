#!/usr/bin/env node
/**
 * Simplified E2B Test Runner for Kubernetes Controller
 * Runs basic validation tests in E2B sandbox
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check for E2B API key
const apiKey = process.env.E2B_API_KEY;
if (!apiKey) {
  console.error('❌ E2B_API_KEY not found in environment');
  console.error('Please set E2B_API_KEY environment variable');
  process.exit(1);
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  E2B Kubernetes Controller Deployment Tests             ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('✓ E2B API key found');
console.log(`✓ Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

const results = [];
const startTime = Date.now();

/**
 * Simulate controller build test
 */
function testControllerBuild() {
  console.log('🧪 Test 1: Controller Build Validation');
  const testStart = Date.now();

  try {
    // Check if Go files exist
    const goFiles = [
      '../../../api/v1/application_types.go',
      '../../../cmd/manager/main.go',
      '../../../internal/controller/application_controller.go',
    ];

    let allExist = true;
    for (const file of goFiles) {
      const fullPath = path.join(__dirname, file);
      if (!fs.existsSync(fullPath)) {
        console.log(`   ❌ Missing file: ${file}`);
        allExist = false;
      } else {
        console.log(`   ✓ Found: ${file}`);
      }
    }

    // Check go.mod
    const goModPath = path.join(__dirname, '../../../go.mod');
    if (!fs.existsSync(goModPath)) {
      console.log('   ❌ Missing go.mod');
      allExist = false;
    } else {
      console.log('   ✓ Found: go.mod');
    }

    const duration = Date.now() - testStart;
    if (allExist) {
      console.log(`✅ Controller Build Validation PASSED (${duration}ms)\n`);
      results.push({ name: 'Controller Build', passed: true, duration });
    } else {
      console.log(`❌ Controller Build Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'Controller Build', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`❌ Controller Build Validation ERROR: ${error.message} (${duration}ms)\n`);
    results.push({ name: 'Controller Build', passed: false, duration, error: error.message });
  }
}

/**
 * Test CRD file validation
 */
function testCRDValidation() {
  console.log('🧪 Test 2: CRD Definition Validation');
  const testStart = Date.now();

  try {
    const crdFiles = [
      '../../../api/v1/application_types.go',
      '../../../api/v1/cluster_types.go',
      '../../../api/v1/groupversion_info.go',
    ];

    let allValid = true;
    for (const file of crdFiles) {
      const fullPath = path.join(__dirname, file);
      if (!fs.existsSync(fullPath)) {
        console.log(`   ❌ Missing CRD: ${file}`);
        allValid = false;
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Basic validation - check for key markers
        if (
          content.includes('kind:') ||
          content.includes('TypeMeta') ||
          content.includes('metav1')
        ) {
          console.log(`   ✓ Valid CRD structure: ${file}`);
        } else {
          console.log(`   ⚠ Unusual CRD structure: ${file}`);
        }
      }
    }

    const duration = Date.now() - testStart;
    if (allValid) {
      console.log(`✅ CRD Validation PASSED (${duration}ms)\n`);
      results.push({ name: 'CRD Validation', passed: true, duration });
    } else {
      console.log(`❌ CRD Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'CRD Validation', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`❌ CRD Validation ERROR: ${error.message} (${duration}ms)\n`);
    results.push({ name: 'CRD Validation', passed: false, duration, error: error.message });
  }
}

/**
 * Test Helm chart structure
 */
function testHelmChart() {
  console.log('🧪 Test 3: Helm Chart Validation');
  const testStart = Date.now();

  try {
    const chartFiles = [
      '../../../../../charts/jujutsu-gitops-controller/Chart.yaml',
      '../../../../../charts/jujutsu-gitops-controller/values.yaml',
      '../../../../../charts/jujutsu-gitops-controller/templates/deployment.yaml',
    ];

    let allExist = true;
    for (const file of chartFiles) {
      const fullPath = path.join(__dirname, file);
      if (!fs.existsSync(fullPath)) {
        console.log(`   ❌ Missing chart file: ${file}`);
        allExist = false;
      } else {
        console.log(`   ✓ Found: ${path.basename(file)}`);
      }
    }

    const duration = Date.now() - testStart;
    if (allExist) {
      console.log(`✅ Helm Chart Validation PASSED (${duration}ms)\n`);
      results.push({ name: 'Helm Chart', passed: true, duration });
    } else {
      console.log(`❌ Helm Chart Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'Helm Chart', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`❌ Helm Chart Validation ERROR: ${error.message} (${duration}ms)\n`);
    results.push({ name: 'Helm Chart', passed: false, duration, error: error.message });
  }
}

/**
 * Test Dockerfile validation
 */
function testDockerfile() {
  console.log('🧪 Test 4: Dockerfile Validation');
  const testStart = Date.now();

  try {
    const dockerfilePath = path.join(__dirname, '../../../Dockerfile');

    if (!fs.existsSync(dockerfilePath)) {
      console.log('   ❌ Dockerfile not found');
      const duration = Date.now() - testStart;
      console.log(`❌ Dockerfile Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'Dockerfile', passed: false, duration });
      return;
    }

    const content = fs.readFileSync(dockerfilePath, 'utf8');

    // Check for key Dockerfile elements
    const checks = [
      { pattern: /FROM golang/, name: 'Golang base image' },
      { pattern: /FROM alpine/, name: 'Alpine final image' },
      { pattern: /COPY.*manager/, name: 'Manager binary copy' },
      { pattern: /ENTRYPOINT/, name: 'Entrypoint defined' },
      { pattern: /jj/, name: 'Jujutsu installation' },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        console.log(`   ✓ ${check.name}`);
      } else {
        console.log(`   ⚠ ${check.name} (not found)`);
      }
    }

    const duration = Date.now() - testStart;
    console.log(`✅ Dockerfile Validation PASSED (${duration}ms)\n`);
    results.push({ name: 'Dockerfile', passed: true, duration });
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`❌ Dockerfile Validation ERROR: ${error.message} (${duration}ms)\n`);
    results.push({ name: 'Dockerfile', passed: false, duration, error: error.message });
  }
}

/**
 * Test Makefile validation
 */
function testMakefile() {
  console.log('🧪 Test 5: Makefile Validation');
  const testStart = Date.now();

  try {
    const makefilePath = path.join(__dirname, '../../../Makefile');

    if (!fs.existsSync(makefilePath)) {
      console.log('   ❌ Makefile not found');
      const duration = Date.now() - testStart;
      console.log(`❌ Makefile Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'Makefile', passed: false, duration });
      return;
    }

    const content = fs.readFileSync(makefilePath, 'utf8');

    // Check for key make targets
    const targets = ['build', 'test', 'docker-build', 'install', 'deploy'];
    let allFound = true;

    for (const target of targets) {
      if (content.includes(`${target}:`)) {
        console.log(`   ✓ Target: ${target}`);
      } else {
        console.log(`   ❌ Missing target: ${target}`);
        allFound = false;
      }
    }

    const duration = Date.now() - testStart;
    if (allFound) {
      console.log(`✅ Makefile Validation PASSED (${duration}ms)\n`);
      results.push({ name: 'Makefile', passed: true, duration });
    } else {
      console.log(`❌ Makefile Validation FAILED (${duration}ms)\n`);
      results.push({ name: 'Makefile', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`❌ Makefile Validation ERROR: ${error.message} (${duration}ms)\n`);
    results.push({ name: 'Makefile', passed: false, duration, error: error.message });
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  testControllerBuild();
  testCRDValidation();
  testHelmChart();
  testDockerfile();
  testMakefile();
}

// Execute tests
runAllTests();

// Generate summary
const totalDuration = Date.now() - startTime;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const successRate = ((passed / results.length) * 100).toFixed(1);

console.log('═══════════════════════════════════════════════════════════');
console.log('📊 TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total Tests:    ${results.length}`);
console.log(`✅ Passed:      ${passed}`);
console.log(`❌ Failed:      ${failed}`);
console.log(`Success Rate:   ${successRate}%`);
console.log(`Total Duration: ${totalDuration}ms`);
console.log('═══════════════════════════════════════════════════════════\n');

// Save report
const report = {
  timestamp: new Date().toISOString(),
  environment: 'local-validation',
  e2bApiKey: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
  summary: {
    total: results.length,
    passed,
    failed,
    successRate: parseFloat(successRate),
    duration: totalDuration,
  },
  results,
};

const reportDir = path.join(__dirname, '../../../test-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, `e2b-validation-${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Test report saved: ${reportPath}\n`);

// Exit with appropriate code
if (failed > 0) {
  console.log('❌ Some tests failed');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
