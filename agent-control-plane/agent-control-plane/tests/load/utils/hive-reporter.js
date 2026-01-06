/**
 * Hive Memory Reporter
 * Reports load test results to Hive Mind coordination memory
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class HiveMemoryReporter {
  constructor(reportsDir = 'tests/load/reports') {
    this.reportsDir = reportsDir;
  }

  /**
   * Store data in hive memory
   */
  storeMemory(key, value, namespace = 'coordination') {
    try {
      const command = `npx gendev@alpha hooks memory-store --key "${key}" --value '${JSON.stringify(value)}' --namespace "${namespace}"`;
      execSync(command, { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.warn(`Warning: Could not store to hive memory: ${error.message}`);
      return false;
    }
  }

  /**
   * Retrieve data from hive memory
   */
  retrieveMemory(key, namespace = 'coordination') {
    try {
      const command = `npx gendev@alpha hooks memory-retrieve --key "${key}" --namespace "${namespace}"`;
      const result = execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
      return JSON.parse(result);
    } catch (error) {
      console.warn(`Warning: Could not retrieve from hive memory: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse baseline results
   */
  parseBaseline(summaryPath) {
    try {
      const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

      const baseline = {
        timestamp: new Date().toISOString(),
        metrics: {},
      };

      // Extract key performance metrics
      if (data.metrics) {
        Object.entries(data.metrics).forEach(([name, metric]) => {
          if (name.startsWith('baseline_')) {
            baseline.metrics[name] = {
              avg: metric.values?.avg,
              p95: metric.values?.['p(95)'],
              p99: metric.values?.['p(99)'],
              min: metric.values?.min,
              max: metric.values?.max,
            };
          }
        });
      }

      return baseline;
    } catch (error) {
      console.error('Error parsing baseline:', error.message);
      return null;
    }
  }

  /**
   * Parse stress test results for bottlenecks
   */
  parseBottlenecks(summaryPath) {
    try {
      const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

      const bottlenecks = [];

      if (data.metrics) {
        // Check for high error rates
        if (data.metrics.error_rate?.values?.rate > 0.05) {
          bottlenecks.push({
            type: 'high_error_rate',
            severity: 'critical',
            value: data.metrics.error_rate.values.rate,
            description: 'Error rate exceeds 5% threshold',
          });
        }

        // Check for bottleneck detection
        if (data.metrics.bottleneck_detected?.values?.rate > 0) {
          bottlenecks.push({
            type: 'bottleneck_detected',
            severity: 'warning',
            value: data.metrics.bottleneck_detected.values.rate,
            description: 'System bottlenecks detected during stress test',
          });
        }

        // Check for break point
        if (data.metrics.system_break_point_vus?.values?.value > 0) {
          bottlenecks.push({
            type: 'system_break_point',
            severity: 'info',
            value: data.metrics.system_break_point_vus.values.value,
            description: `System break point reached at ${data.metrics.system_break_point_vus.values.value} VUs`,
          });
        }

        // Check for slow response times
        if (data.metrics.response_time_ms?.values?.['p(95)'] > 2000) {
          bottlenecks.push({
            type: 'slow_response_time',
            severity: 'warning',
            value: data.metrics.response_time_ms.values['p(95)'],
            description: 'P95 response time exceeds 2 seconds',
          });
        }
      }

      return {
        timestamp: new Date().toISOString(),
        bottlenecks,
        totalFound: bottlenecks.length,
      };
    } catch (error) {
      console.error('Error parsing bottlenecks:', error.message);
      return null;
    }
  }

  /**
   * Parse memory leak test results
   */
  parseMemoryLeaks(summaryPath) {
    try {
      const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

      const memoryAnalysis = {
        timestamp: new Date().toISOString(),
        leaksDetected: false,
        metrics: {},
      };

      if (data.metrics) {
        // Memory growth rate
        if (data.metrics.memory_growth_rate) {
          memoryAnalysis.metrics.growthRate = {
            avg: data.metrics.memory_growth_rate.values?.avg,
            max: data.metrics.memory_growth_rate.values?.max,
          };

          if (data.metrics.memory_growth_rate.values?.avg > 50) {
            memoryAnalysis.leaksDetected = true;
          }
        }

        // Memory leak detection
        if (data.metrics.memory_leak_detected?.values?.rate > 0) {
          memoryAnalysis.leaksDetected = true;
          memoryAnalysis.leakRate = data.metrics.memory_leak_detected.values.rate;
        }

        // Resource cleanup success
        if (data.metrics.resource_cleanup_success) {
          memoryAnalysis.metrics.cleanupSuccess =
            data.metrics.resource_cleanup_success.values?.rate;
        }

        // Memory usage
        if (data.metrics.memory_usage_mb) {
          memoryAnalysis.metrics.memoryUsage = {
            value: data.metrics.memory_usage_mb.values?.value,
          };
        }
      }

      return memoryAnalysis;
    } catch (error) {
      console.error('Error parsing memory leaks:', error.message);
      return null;
    }
  }

  /**
   * Generate test status summary
   */
  generateStatus() {
    const files = fs.readdirSync(this.reportsDir);
    const summaryFiles = files.filter((f) => f.endsWith('-summary.json'));

    const status = {
      timestamp: new Date().toISOString(),
      testsRun: summaryFiles.length,
      tests: [],
    };

    summaryFiles.forEach((file) => {
      const testName = file.replace('-summary.json', '');
      const filePath = path.join(this.reportsDir, file);

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Extract basic metrics
        const testInfo = {
          name: testName,
          timestamp: fs.statSync(filePath).mtime.toISOString(),
          metrics: {},
        };

        if (data.metrics) {
          // Success rate
          if (data.metrics.http_req_failed) {
            testInfo.metrics.successRate = 1 - (data.metrics.http_req_failed.values?.rate || 0);
          }

          // Average response time
          if (data.metrics.http_req_duration) {
            testInfo.metrics.avgResponseTime = data.metrics.http_req_duration.values?.avg;
          }

          // Total requests
          if (data.metrics.http_reqs) {
            testInfo.metrics.totalRequests = data.metrics.http_reqs.values?.count;
          }

          // RPS
          if (data.metrics.http_reqs) {
            testInfo.metrics.rps = data.metrics.http_reqs.values?.rate;
          }
        }

        status.tests.push(testInfo);
      } catch (error) {
        console.warn(`Could not parse ${file}:`, error.message);
      }
    });

    return status;
  }

  /**
   * Report all results to hive memory
   */
  reportToHive() {
    console.log('\n=== Reporting to Hive Memory ===\n');

    let successCount = 0;
    let failCount = 0;

    // 1. Store overall status
    const status = this.generateStatus();
    if (this.storeMemory('hive/testing/load/status', status)) {
      console.log('✓ Stored test status');
      successCount++;
    } else {
      console.log('✗ Failed to store test status');
      failCount++;
    }

    // 2. Store baseline results
    const baselinePath = path.join(this.reportsDir, 'baseline-performance-summary.json');
    if (fs.existsSync(baselinePath)) {
      const baseline = this.parseBaseline(baselinePath);
      if (baseline && this.storeMemory('hive/testing/load/baseline', baseline)) {
        console.log('✓ Stored baseline results');
        successCount++;
      } else {
        console.log('✗ Failed to store baseline results');
        failCount++;
      }
    }

    // 3. Store bottlenecks
    const stressPath = path.join(this.reportsDir, 'stress-test-summary.json');
    if (fs.existsSync(stressPath)) {
      const bottlenecks = this.parseBottlenecks(stressPath);
      if (bottlenecks && this.storeMemory('hive/testing/load/bottlenecks', bottlenecks)) {
        console.log('✓ Stored bottleneck analysis');
        successCount++;
      } else {
        console.log('✗ Failed to store bottleneck analysis');
        failCount++;
      }
    }

    // 4. Store memory leak analysis
    const memoryPath = path.join(this.reportsDir, 'memory-leak-summary.json');
    if (fs.existsSync(memoryPath)) {
      const memoryAnalysis = this.parseMemoryLeaks(memoryPath);
      if (memoryAnalysis && this.storeMemory('hive/testing/load/memory-analysis', memoryAnalysis)) {
        console.log('✓ Stored memory leak analysis');
        successCount++;
      } else {
        console.log('✗ Failed to store memory leak analysis');
        failCount++;
      }
    }

    console.log(`\nReported ${successCount} items to hive memory (${failCount} failed)\n`);

    return {
      success: successCount,
      failed: failCount,
    };
  }

  /**
   * Retrieve and display hive memory data
   */
  displayHiveData() {
    console.log('\n=== Hive Memory Data ===\n');

    const keys = [
      'hive/testing/load/status',
      'hive/testing/load/baseline',
      'hive/testing/load/bottlenecks',
      'hive/testing/load/memory-analysis',
    ];

    keys.forEach((key) => {
      const data = this.retrieveMemory(key);
      if (data) {
        console.log(`\n${key}:`);
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`\n${key}: No data found`);
      }
    });
  }

  /**
   * Compare current baseline with historical
   */
  compareBaselines() {
    const currentBaseline = this.retrieveMemory('hive/testing/load/baseline');
    const historicalBaseline = this.retrieveMemory('hive/testing/load/baseline-historical');

    if (!currentBaseline || !historicalBaseline) {
      console.log('Cannot compare - missing baseline data');
      return null;
    }

    const comparison = {
      timestamp: new Date().toISOString(),
      improvements: [],
      regressions: [],
    };

    Object.entries(currentBaseline.metrics).forEach(([name, current]) => {
      const historical = historicalBaseline.metrics[name];

      if (historical && current.p95 && historical.p95) {
        const change = ((current.p95 - historical.p95) / historical.p95) * 100;

        if (change < -5) {
          comparison.improvements.push({
            metric: name,
            change: change.toFixed(2) + '%',
            current: current.p95,
            historical: historical.p95,
          });
        } else if (change > 5) {
          comparison.regressions.push({
            metric: name,
            change: '+' + change.toFixed(2) + '%',
            current: current.p95,
            historical: historical.p95,
          });
        }
      }
    });

    return comparison;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new HiveMemoryReporter();

  const command = process.argv[2] || 'report';

  switch (command) {
    case 'report':
      reporter.reportToHive();
      break;
    case 'display':
      reporter.displayHiveData();
      break;
    case 'compare':
      const comparison = reporter.compareBaselines();
      if (comparison) {
        console.log('\n=== Baseline Comparison ===\n');
        console.log(JSON.stringify(comparison, null, 2));
      }
      break;
    default:
      console.log('Usage: node hive-reporter.js [report|display|compare]');
      process.exit(1);
  }
}

export default HiveMemoryReporter;
