# Load Testing Suite

Comprehensive load and stress testing for agent-control-plane using K6.

## Quick Start

```bash
# Run baseline tests (7 minutes)
./scripts/run-load-tests.sh baseline

# Run all tests
./scripts/run-load-tests.sh all

# Interactive menu
./scripts/run-load-tests.sh
```

## Directory Structure

```
tests/load/
├── k6-config.js              # Main K6 configuration
├── scenarios/                # Test scenarios
│   ├── api-load.js          # API endpoint load tests
│   ├── swarm-load.js        # Swarm operations tests
│   ├── stress-test.js       # Stress and breaking point tests
│   ├── memory-leak.js       # Memory leak detection
│   └── baseline-performance.js  # Performance baselines
├── utils/                    # Utilities
│   ├── report-generator.js  # HTML report generation
│   └── hive-reporter.js     # Hive memory reporting
└── reports/                  # Test results (generated)
    ├── *.json               # Raw K6 results
    ├── *-summary.json       # Test summaries
    └── *.html               # Visual reports
```

## Test Scenarios

### 1. Baseline Performance (`baseline-performance.js`)

- **Duration**: 7 minutes
- **Purpose**: Establish performance baselines
- **Metrics**: Health checks, agent ops, task ops, swarm ops, memory ops, vector ops
- **Target**: All operations within SLA thresholds

### 2. API Load Tests (`api-load.js`)

- **Duration**: 29 minutes
- **Purpose**: Test REST API under progressive load
- **Stages**: Warm-up → Ramp-up → Sustained → Peak → Spike → Recovery → Cool-down
- **VUs**: 0 → 10 → 100 → 200 → 500 → 100 → 0
- **Endpoints**: Health, agents, tasks, swarms, metrics

### 3. Swarm Operations (`swarm-load.js`)

- **Duration**: 29 minutes
- **Purpose**: Test multi-agent coordination
- **Scenarios**:
  - Concurrent agent spawning (10 agents)
  - Parallel swarm execution (5 swarms)
  - High-density swarm (50 agents)
  - Hierarchical coordination (100+ workers)

### 4. Stress Tests (`stress-test.js`)

- **Duration**: 25 minutes
- **Purpose**: Find system breaking points
- **Load**: 100 → 1000 VUs progressively
- **Tests**:
  - Incremental load until failure
  - Agent spawning stress
  - Task execution stress
  - Memory stress (500 vectors)
  - Bottleneck detection
  - Network saturation

### 5. Memory Leak Detection (`memory-leak.js`)

- **Duration**: 70 minutes (1 hour soak)
- **Purpose**: Detect memory leaks and resource cleanup issues
- **Load**: 50 VUs sustained
- **Monitors**:
  - Memory growth over time
  - Heap usage patterns
  - Resource cleanup efficiency
  - Long-running task behavior

## Performance Targets (p95)

| Operation       | Target | Critical |
| --------------- | ------ | -------- |
| Health Check    | <100ms | <200ms   |
| Agent Spawn     | <3s    | <5s      |
| Task Creation   | <2s    | <3s      |
| Swarm Init      | <1s    | <2s      |
| Memory Store    | <100ms | <200ms   |
| Memory Retrieve | <50ms  | <100ms   |
| Vector Search   | <500ms | <1s      |
| Vector Insert   | <200ms | <500ms   |

## Running Tests

### Using the Script

```bash
# Interactive menu
./scripts/run-load-tests.sh

# Specific test
./scripts/run-load-tests.sh baseline
./scripts/run-load-tests.sh api
./scripts/run-load-tests.sh swarm
./scripts/run-load-tests.sh stress
./scripts/run-load-tests.sh memory-leak

# All tests (except memory leak)
./scripts/run-load-tests.sh all

# All tests (including memory leak)
./scripts/run-load-tests.sh full

# Custom URL
BASE_URL=http://production:3000 ./scripts/run-load-tests.sh baseline

# With authentication
API_TOKEN=your-token ./scripts/run-load-tests.sh api
```

### Using K6 Directly

```bash
# Run specific scenario
k6 run tests/load/scenarios/api-load.js

# Custom VUs and duration
k6 run --vus 100 --duration 30s tests/load/scenarios/baseline-performance.js

# With output
k6 run --out json=results.json tests/load/scenarios/swarm-load.js

# View results
k6 run --summary-export=summary.json tests/load/scenarios/api-load.js
```

### Using Docker

```bash
docker run --rm -i \
  -v $(pwd):/workspace \
  -e BASE_URL=http://host.docker.internal:3000 \
  grafana/k6:latest \
  run /workspace/tests/load/scenarios/baseline-performance.js
```

## Reports

### Automatic Reports

Tests generate several reports automatically:

1. **JSON Results** (`*-YYYYMMDD-HHMMSS.json`)
   - Complete K6 results
   - All metrics and data points

2. **Summary** (`*-summary.json`)
   - Aggregated metrics
   - Statistical analysis

3. **Markdown Summary** (`summary-YYYYMMDD-HHMMSS.md`)
   - Human-readable summary
   - Key metrics and findings

### Generate HTML Report

```bash
node tests/load/utils/report-generator.js \
  tests/load/reports/results.json \
  tests/load/reports/report.html
```

Open in browser:

```bash
open tests/load/reports/report.html
```

## Hive Memory Integration

Results are automatically stored in Hive Mind coordination memory.

### Report to Hive

```bash
# Report all results
node tests/load/utils/hive-reporter.js report

# Display hive data
node tests/load/utils/hive-reporter.js display

# Compare baselines
node tests/load/utils/hive-reporter.js compare
```

### Stored Keys

- `hive/testing/load/status` - Test execution status
- `hive/testing/load/baseline` - Performance baselines
- `hive/testing/load/bottlenecks` - Bottleneck analysis
- `hive/testing/load/memory-analysis` - Memory leak analysis

### Retrieve Data

```bash
# Get status
npx gendev@alpha hooks memory-retrieve \
  --key "hive/testing/load/status" \
  --namespace "coordination"

# Get baseline
npx gendev@alpha hooks memory-retrieve \
  --key "hive/testing/load/baseline" \
  --namespace "coordination"
```

## Interpreting Results

### Success Criteria

✅ **PASS**

- Error rate <1%
- All response times within targets
- No memory leaks detected
- Throughput meets requirements

⚠️ **WARNING**

- Error rate 1-5%
- Some response times exceed targets
- Memory growth 20-50%
- Throughput below target

❌ **FAIL**

- Error rate >5%
- Most response times exceed targets
- Memory leak detected (>50% growth)
- Throughput significantly below target

### Key Metrics

**Response Time** (`http_req_duration`)

- `avg`: Average response time
- `p(95)`: 95% of requests complete within this time
- `p(99)`: 99% of requests (critical threshold)
- `max`: Worst case

**Error Rate** (`http_req_failed`)

- Should be <1% under normal load
- Spike indicates system stress

**Throughput** (`http_reqs`)

- Requests per second
- Should scale linearly with VUs

**Custom Metrics**

- `agent_spawn_duration`: Agent spawning time
- `swarm_init_duration`: Swarm initialization time
- `task_execution_duration`: Task execution time
- `memory_leak_detected`: Memory leak flag
- `bottleneck_detected`: Bottleneck flag

## Troubleshooting

### API Not Accessible

```bash
# Check server
curl http://localhost:3000/health

# Use correct URL
BASE_URL=http://localhost:8080 ./scripts/run-load-tests.sh baseline
```

### High Error Rates

```bash
# Monitor during test
htop                          # CPU/Memory
tail -f logs/server.log       # Server logs
watch 'free -h'              # Memory usage
```

### Memory Leaks

If memory leak detected:

1. Generate heap snapshot
2. Use Chrome DevTools Memory Profiler
3. Check for:
   - Event listeners not removed
   - Timers not cleared
   - Closures holding references
   - Unbounded caches

### Bottlenecks

If bottlenecks detected:

1. Profile CPU usage
2. Check database queries
3. Review connection pools
4. Monitor network bandwidth

## Best Practices

1. **Baseline First** - Always establish baselines before optimization
2. **Progressive Load** - Start small, increase gradually
3. **Monitor During Tests** - Watch server metrics
4. **Reproducible Tests** - Use consistent test data
5. **Cleanup Between Tests** - Reset database and caches
6. **Track Over Time** - Store baselines in version control

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm start &
      - run: |
          sudo apt-get update
          sudo apt-get install k6
      - run: ./scripts/run-load-tests.sh baseline
      - uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: tests/load/reports/
```

## Documentation

For detailed documentation, see:

- [docs/LOAD_TESTING.md](/docs/LOAD_TESTING.md) - Complete guide
- [K6 Documentation](https://k6.io/docs/) - K6 reference

## Support

- GitHub Issues: https://github.com/tafyai/agent-control-plane/issues
- Documentation: https://github.com/tafyai/agent-control-plane/docs

---

**Last Updated**: 2025-12-08
