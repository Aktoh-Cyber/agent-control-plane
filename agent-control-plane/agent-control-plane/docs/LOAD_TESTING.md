# Load Testing Guide

Comprehensive load and stress testing for agent-control-plane using K6.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Test Scenarios](#test-scenarios)
- [Running Tests](#running-tests)
- [Performance Baselines](#performance-baselines)
- [Interpreting Results](#interpreting-results)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The load testing suite provides comprehensive performance testing for the agent-control-plane system, including:

- **API Load Tests**: REST endpoint performance under various load conditions
- **Swarm Operations**: Multi-agent coordination and scaling tests
- **Stress Tests**: System breaking point detection
- **Memory Leak Detection**: Long-running soak tests for resource leak detection
- **Performance Baselines**: Establish and track performance SLAs

### Test Framework

We use **K6** for load testing due to its:

- High performance (written in Go)
- JavaScript test scripting
- Comprehensive metrics
- Cloud integration options
- Excellent CLI experience

## Installation

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows

```bash
choco install k6
```

### Docker

```bash
docker pull grafana/k6:latest
```

### Verify Installation

```bash
k6 version
```

## Quick Start

### 1. Start Your Server

Ensure your agent-control-plane server is running:

```bash
npm start
# or
npm run dev
```

### 2. Run Quick Baseline Test

```bash
./scripts/run-load-tests.sh baseline
```

This runs a 7-minute baseline test to establish performance metrics.

### 3. View Results

Results are saved to `tests/load/reports/`:

```bash
ls -lh tests/load/reports/
```

## Test Scenarios

### 1. Baseline Performance Tests

**Duration**: ~7 minutes
**File**: `tests/load/scenarios/baseline-performance.js`

Establishes performance baselines for all operations:

- Health checks
- Agent spawning
- Task creation
- Swarm initialization
- Memory operations
- Vector database operations

**Performance Targets (p95)**:

- Health check: <100ms
- Agent spawn: <3s
- Task creation: <2s
- Swarm init: <1s
- Memory store: <100ms
- Memory retrieve: <50ms
- Vector search: <500ms
- Vector insert: <200ms

**Run**:

```bash
./scripts/run-load-tests.sh baseline
```

### 2. API Load Tests

**Duration**: ~29 minutes
**File**: `tests/load/scenarios/api-load.js`

Tests REST API endpoints under progressive load:

**Load Stages**:

1. Warm-up: 0 → 10 users (2 min)
2. Ramp-up: 10 → 100 users (5 min)
3. Sustained: 100 users (10 min)
4. Peak: 200 users (3 min)
5. Spike: 500 users (2 min)
6. Recovery: 100 users (2 min)
7. Cool-down: 100 → 0 users (2 min)

**Tested Endpoints**:

- `/health`
- `/api/agents` (CRUD)
- `/api/tasks` (CRUD)
- `/api/swarms` (list)
- `/api/metrics`

**Run**:

```bash
./scripts/run-load-tests.sh api
```

### 3. Swarm Operations Load Tests

**Duration**: ~29 minutes
**File**: `tests/load/scenarios/swarm-load.js`

Tests multi-agent coordination under load:

**Scenarios**:

- Concurrent agent spawning (10 agents)
- Parallel swarm execution (5 swarms)
- High-density swarm (50 agents)
- Hierarchical coordination (100+ workers)

**Run**:

```bash
./scripts/run-load-tests.sh swarm
```

### 4. Stress Tests

**Duration**: ~25 minutes
**File**: `tests/load/scenarios/stress-test.js`

Pushes system to breaking point:

**Test Types**:

- Incremental load until failure
- Agent spawning stress
- Concurrent task execution stress
- Memory stress (500 vectors)
- Bottleneck detection
- Network saturation (large payloads)

**Load Progression**:

- 100 → 1000 VUs in 200ms increments
- Hold at 1000 VUs for 5 minutes

**Run**:

```bash
./scripts/run-load-tests.sh stress
```

### 5. Memory Leak Detection

**Duration**: ~70 minutes
**File**: `tests/load/scenarios/memory-leak.js`

Long-running soak test for memory leaks:

**Test Duration**: 1 hour at 50 VUs

**Monitors**:

- Memory usage growth over time
- Heap usage patterns
- Resource cleanup efficiency
- Long-running task behavior

**Detection Criteria**:

- Memory growth >50% = potential leak
- Failed resource cleanup
- Heap size increase over time

**Run**:

```bash
./scripts/run-load-tests.sh memory-leak
```

## Running Tests

### Interactive Menu

```bash
./scripts/run-load-tests.sh
```

### Command Line

```bash
# Individual tests
./scripts/run-load-tests.sh baseline
./scripts/run-load-tests.sh api
./scripts/run-load-tests.sh swarm
./scripts/run-load-tests.sh stress
./scripts/run-load-tests.sh memory-leak

# All tests (except memory leak)
./scripts/run-load-tests.sh all

# All tests (including memory leak)
./scripts/run-load-tests.sh full
```

### Custom Configuration

```bash
# Custom API URL
BASE_URL=http://production.example.com:3000 ./scripts/run-load-tests.sh baseline

# With authentication
API_TOKEN=your-token-here ./scripts/run-load-tests.sh api
```

### Using K6 Directly

```bash
# Run specific scenario
k6 run tests/load/scenarios/api-load.js

# Run with custom VUs
k6 run --vus 100 --duration 30s tests/load/scenarios/baseline-performance.js

# Run with output
k6 run --out json=results.json tests/load/scenarios/swarm-load.js
```

### Docker

```bash
docker run --rm -i \
  -v $(pwd):/workspace \
  -e BASE_URL=http://host.docker.internal:3000 \
  grafana/k6:latest \
  run /workspace/tests/load/scenarios/baseline-performance.js
```

## Performance Baselines

### Established SLAs

| Operation       | Target (p95) | Critical (p99) |
| --------------- | ------------ | -------------- |
| Health Check    | <100ms       | <200ms         |
| Agent Spawn     | <3s          | <5s            |
| Task Creation   | <2s          | <3s            |
| Swarm Init      | <1s          | <2s            |
| Memory Store    | <100ms       | <200ms         |
| Memory Retrieve | <50ms        | <100ms         |
| Vector Search   | <500ms       | <1s            |
| Vector Insert   | <200ms       | <500ms         |
| API List        | <300ms       | <500ms         |

### Error Rate Thresholds

- **Normal Load**: <1% error rate
- **Peak Load**: <5% error rate
- **Stress Test**: <10% error rate (until break point)

### Throughput Targets

- **API Requests**: >100 RPS
- **Agent Spawns**: >10 agents/second
- **Vector Searches**: >50 searches/second

## Interpreting Results

### K6 Output

K6 provides real-time output during tests:

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 30m30s max duration

✓ health check status 200
✓ response time < 200ms

checks.........................: 100.00% ✓ 5432      ✗ 0
data_received..................: 1.2 MB  41 kB/s
data_sent......................: 487 kB  16 kB/s
http_req_duration..............: avg=145ms   min=45ms   med=132ms   max=892ms  p(90)=189ms p(95)=234ms
http_req_failed................: 0.00%   ✓ 0         ✗ 5432
http_reqs......................: 5432    181.06/s
```

### Key Metrics

#### Response Time (http_req_duration)

- **avg**: Average response time - should be low
- **p(95)**: 95th percentile - 95% of requests complete within this time
- **p(99)**: 99th percentile - critical threshold
- **max**: Maximum response time - watch for outliers

#### Error Rate (http_req_failed)

- Should be <1% under normal load
- Spike indicates system stress
- Track which endpoints fail first

#### Throughput (http_reqs)

- Requests per second
- Should increase linearly with VUs (up to capacity)
- Plateau indicates bottleneck

### Custom Metrics

Our tests track additional metrics:

- `agent_spawn_duration`: Time to spawn new agents
- `swarm_init_duration`: Swarm initialization time
- `task_execution_duration`: Task execution time
- `memory_operation_duration`: Memory store/retrieve time
- `vector_search_duration`: Vector database search time
- `bottleneck_detected`: Bottleneck detection flag
- `memory_leak_detected`: Memory leak detection flag

### Report Files

Tests generate several output files:

#### JSON Results

```
tests/load/reports/baseline-performance-YYYYMMDD-HHMMSS.json
```

Complete test results in JSON format.

#### Summary

```
tests/load/reports/baseline-performance-summary.json
```

Aggregated metrics and statistics.

#### HTML Report

```
tests/load/reports/baseline-performance-report.html
```

Visual report with charts (generated by report-generator.js).

### Generating HTML Reports

```bash
node tests/load/utils/report-generator.js \
  tests/load/reports/results.json \
  tests/load/reports/report.html
```

## Troubleshooting

### API Not Accessible

**Symptom**: "API is not accessible" error

**Solutions**:

```bash
# Check server is running
curl http://localhost:3000/health

# Check correct URL
BASE_URL=http://localhost:8080 ./scripts/run-load-tests.sh baseline

# Check firewall/network
telnet localhost 3000
```

### High Error Rates

**Symptom**: >5% error rate during tests

**Possible Causes**:

1. Server not handling load (increase resources)
2. Database connection pool exhausted (increase pool size)
3. Rate limiting triggered (adjust limits or test load)
4. Memory exhaustion (check server memory)

**Debug**:

```bash
# Monitor server during test
htop

# Check server logs
tail -f logs/server.log

# Monitor memory
watch -n 1 'free -h'
```

### Memory Leak Detection

**Symptom**: Memory growth >50% during soak test

**Investigation**:

```bash
# Generate heap snapshot
node --inspect server.js

# Use Chrome DevTools Memory Profiler
# Connect to chrome://inspect

# Check for common leaks:
# - Event listeners not removed
# - Timers not cleared
# - Closures holding references
# - Cache not bounded
```

### Bottleneck Identification

**Symptoms**:

- Response times increase non-linearly with load
- Throughput plateaus
- CPU or memory maxed out

**Investigation**:

```bash
# CPU profiling
node --prof server.js
node --prof-process isolate-*.log > profile.txt

# Find slow operations
grep -r "slow query" logs/

# Check database
# - Indexes missing?
# - N+1 queries?
# - Connection pool size?

# Check network
# - Bandwidth saturated?
# - DNS resolution slow?
```

### Tests Timing Out

**Symptom**: K6 tests timeout or hang

**Solutions**:

```bash
# Increase timeout in test config
# Edit k6-config.js:
export const options = {
  ...
  timeout: '60s',  // Increase from default
};

# Reduce VUs
k6 run --vus 10 test.js

# Check server isn't crashed
ps aux | grep node
```

## Best Practices

### 1. Baseline First

Always establish baselines before optimization:

```bash
# Run baseline before changes
./scripts/run-load-tests.sh baseline
mv tests/load/reports/baseline-performance-summary.json baseline-before.json

# Make changes

# Run baseline after changes
./scripts/run-load-tests.sh baseline
mv tests/load/reports/baseline-performance-summary.json baseline-after.json

# Compare
diff baseline-before.json baseline-after.json
```

### 2. Progressive Load Testing

Don't jump straight to stress tests:

1. **Baseline** (10 VUs) - Establish normal performance
2. **Moderate Load** (50-100 VUs) - Expected production load
3. **Peak Load** (200-500 VUs) - Maximum expected load
4. **Stress Test** (500+ VUs) - Find breaking point

### 3. Monitor During Tests

Keep an eye on server metrics:

```bash
# Terminal 1: Run test
./scripts/run-load-tests.sh api

# Terminal 2: Monitor server
htop

# Terminal 3: Monitor logs
tail -f logs/server.log

# Terminal 4: Monitor metrics
watch -n 1 'curl -s http://localhost:3000/api/metrics | jq'
```

### 4. Reproducible Tests

Use consistent test data:

```javascript
// Use seed for deterministic random data
const seed = 12345;
function random() {
  // Seeded random implementation
}
```

### 5. Cleanup Between Tests

```bash
# Reset database
npm run db:reset

# Clear caches
redis-cli FLUSHALL

# Restart server
npm restart
```

### 6. CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start server
        run: npm start &
      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run baseline tests
        run: ./scripts/run-load-tests.sh baseline
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: tests/load/reports/
```

### 7. Track Metrics Over Time

Store baseline results in version control:

```bash
# After each release, store baseline
./scripts/run-load-tests.sh baseline
cp tests/load/reports/baseline-performance-summary.json \
   baselines/v1.2.0-baseline.json
git add baselines/v1.2.0-baseline.json
git commit -m "chore: add v1.2.0 performance baseline"
```

## Hive Memory Coordination

Test results are automatically stored in the Hive Mind coordination memory:

```bash
# Results stored at:
# - hive/testing/load/status
# - hive/testing/load/baseline
# - hive/testing/load/bottlenecks

# Retrieve status
npx gendev@alpha hooks memory-retrieve \
  --key "hive/testing/load/status" \
  --namespace "coordination"

# Retrieve baseline
npx gendev@alpha hooks memory-retrieve \
  --key "hive/testing/load/baseline" \
  --namespace "coordination"

# Retrieve bottlenecks
npx gendev@alpha hooks memory-retrieve \
  --key "hive/testing/load/bottlenecks" \
  --namespace "coordination"
```

## Advanced Usage

### Custom Scenarios

Create custom test scenarios:

```javascript
// tests/load/scenarios/custom-scenario.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders } from '../k6-config.js';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  // Your custom test logic
  const res = http.get(`${BASE_URL}/api/custom-endpoint`, {
    headers: getHeaders(),
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

Run it:

```bash
k6 run tests/load/scenarios/custom-scenario.js
```

### Cloud Execution

Use K6 Cloud for distributed load testing:

```bash
# Login to K6 Cloud
k6 login cloud

# Run test in cloud
k6 cloud tests/load/scenarios/api-load.js

# Stream results
k6 cloud tests/load/scenarios/api-load.js --show-logs
```

### Grafana Integration

Visualize metrics in real-time:

```bash
# Install InfluxDB
docker run -d --name influxdb -p 8086:8086 influxdb:1.8

# Run test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 tests/load/scenarios/api-load.js

# Setup Grafana
docker run -d --name grafana -p 3001:3000 grafana/grafana

# Import K6 dashboard
# Dashboard ID: 2587
```

## Support

For issues or questions:

- GitHub Issues: https://github.com/tafyai/agent-control-plane/issues
- Documentation: https://github.com/tafyai/agent-control-plane/docs

---

**Last Updated**: 2025-12-08
**Version**: 1.0.0
