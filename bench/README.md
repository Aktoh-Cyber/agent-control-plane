# ReasoningBank Benchmark Suite

Comprehensive benchmarking system to evaluate ReasoningBank's closed-loop learning capabilities against a baseline system without memory.

## 📊 Benchmark Overview

This suite measures the impact of ReasoningBank's 4-phase learning loop (RETRIEVE → JUDGE → DISTILL → CONSOLIDATE) on agent performance across multiple dimensions.

### Key Metrics

1. **Success Rate**: Task completion success over time (0% → 100% transformation)
2. **Learning Velocity**: Speed of improvement (tasks until first success)
3. **Memory Efficiency**: Storage and retrieval performance
4. **Token Efficiency**: Reduction in token usage via memory
5. **Latency Impact**: Overhead from memory operations
6. **Accuracy**: Quality of learned patterns
7. **Generalization**: Transfer learning across domains

## 📁 Directory Structure

```
bench/
├── scenarios/        # Test scenarios (coding, debugging, API design, etc.)
├── agents/          # Baseline vs ReasoningBank agents
├── metrics/         # Metrics collection and analysis
├── results/         # Raw benchmark results
├── reports/         # Generated reports and visualizations
├── lib/             # Shared utilities
├── benchmark.ts     # Main orchestrator
└── README.md        # This file
```

## 🚀 Quick Start

```bash
# Run all benchmarks
npm run bench

# Run specific scenario
npm run bench -- --scenario coding-tasks

# Run with different configurations
npm run bench -- --iterations 100 --agents 5

# Generate report only
npm run bench:report
```

## 📋 Benchmark Scenarios

### 1. Coding Tasks (10 scenarios)

- Implement functions from specifications
- Fix bugs in existing code
- Refactor code for best practices
- Add error handling
- Write unit tests

### 2. Debugging Tasks (10 scenarios)

- Identify and fix runtime errors
- Resolve type errors
- Fix logical errors
- Handle edge cases
- Debug async issues

### 3. API Design Tasks (10 scenarios)

- Design REST endpoints
- Create authentication systems
- Implement rate limiting
- Design database schemas
- Build validation logic

### 4. Problem Solving Tasks (10 scenarios)

- Algorithm challenges
- Data structure problems
- System design questions
- Optimization problems
- Pattern recognition

### 5. Continuous Learning (Progressive)

- Same task repeated with variations
- Measures learning curve
- Tests memory consolidation
- Validates pattern generalization

## 📈 Expected Results

Based on the ReasoningBank paper (https://arxiv.org/html/2509.25140v1):

- **Success Rate**: 0% → 100% over 20-30 iterations
- **Token Reduction**: ~32.3% via memory injection
- **Latency Overhead**: <500ms for retrieval
- **Memory Efficiency**: 95%+ deduplication rate
- **Learning Velocity**: 2.8-4.4x faster than baseline

## 🔬 Benchmark Types

### 1. Cold Start (No Prior Memory)

- Both agents start from scratch
- Measures raw learning capability
- Tests distillation quality

### 2. Warm Start (Pre-populated Memory)

- ReasoningBank has domain memories
- Tests retrieval effectiveness
- Measures transfer learning

### 3. Incremental Learning

- Sequential task variations
- Tests consolidation
- Measures adaptation speed

### 4. Stress Test

- High memory load (1000+ patterns)
- Concurrent operations
- Edge cases and failures

## 📊 Output Formats

### Console Progress

```
🧪 Running Benchmark: coding-tasks (1/50)
  ├─ Baseline:      [=====>    ] 50% (5/10 success)
  └─ ReasoningBank: [==========>] 100% (10/10 success)
```

### JSON Results

```json
{
  "scenario": "coding-tasks",
  "baseline": {
    "successRate": 0.5,
    "avgTokens": 15230,
    "avgLatency": 2341
  },
  "reasoningbank": {
    "successRate": 1.0,
    "avgTokens": 10311,
    "avgLatency": 2756,
    "memoriesUsed": 12,
    "memoriesCreated": 8
  },
  "improvement": {
    "successRate": "+100%",
    "tokenEfficiency": "+32.3%",
    "latencyOverhead": "+17.7%"
  }
}
```

### Markdown Report

- Executive summary
- Detailed metrics tables
- Comparison charts
- Learning curves
- Recommendations

## 🛠️ Configuration

Edit `bench/config.json`:

```json
{
  "iterations": 50,
  "parallelAgents": 5,
  "scenarios": ["coding", "debugging", "api-design"],
  "enableWarmStart": false,
  "memorySize": 1000,
  "outputFormats": ["json", "markdown", "csv"]
}
```

## 📖 Interpretation Guide

### Success Rate Delta

- `> +50%`: ReasoningBank significantly improves learning
- `20-50%`: Moderate improvement, memory helps
- `< 20%`: Minimal impact, task may not benefit from memory

### Token Efficiency

- `> +30%`: Excellent memory utilization
- `15-30%`: Good reduction via context injection
- `< 15%`: Limited memory reuse

### Latency Overhead

- `< 500ms`: Acceptable for production
- `500-1000ms`: Noticeable but manageable
- `> 1000ms`: Optimization needed

## 🔧 Extending Benchmarks

Add new scenarios in `bench/scenarios/`:

```typescript
export const myScenario: BenchmarkScenario = {
  name: 'my-scenario',
  description: 'Custom benchmark scenario',
  tasks: [/* tasks */],
  successCriteria: (result) => /* validation */,
  metrics: ['success', 'tokens', 'latency']
};
```

## 📚 References

- ReasoningBank Paper: https://arxiv.org/html/2509.25140v1
- 4-Factor Scoring Formula: α·sim + β·rec + γ·rel + δ·div
- MaTTS (Memory-aware Test-Time Scaling)
- MMR (Maximal Marginal Relevance) for diversity

## 🤝 Contributing

To add benchmarks:

1. Create scenario in `scenarios/`
2. Add to `benchmark.ts` orchestrator
3. Update metrics collection
4. Run and validate results
5. Document in this README
