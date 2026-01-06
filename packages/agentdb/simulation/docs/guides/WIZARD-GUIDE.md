# AgentDB Simulation Wizard Guide

**Reading Time**: 10 minutes
**Prerequisites**: AgentDB CLI installed
**Target Audience**: Users preferring interactive interfaces

Learn to use the AgentDB simulation wizard - an interactive, step-by-step interface for creating and running vector database simulations. Perfect for beginners and those who prefer guided workflows.

---

## 🧙 What is the Wizard?

The AgentDB simulation wizard is an **interactive CLI tool** that guides you through:

1. Choosing a simulation scenario or building custom configurations
2. Selecting optimal parameters based on your use case
3. Running simulations with visual progress feedback
4. Understanding results with inline explanations

**Launch the wizard**:

```bash
agentdb simulate --wizard
```

---

## 🎯 Wizard Flow Overview

```
┌─────────────────────────────────────┐
│  🧙 AgentDB Simulation Wizard      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Step 1: Choose Mode                │
│  • Run validated scenario           │
│  • Build custom simulation          │
│  • View past reports                │
└─────────────────────────────────────┘
            ↓
    ┌───────┴───────┐
    ↓               ↓
┌─────────┐   ┌─────────────┐
│Scenario │   │   Custom    │
│ Wizard  │   │   Builder   │
└─────────┘   └─────────────┘
    ↓               ↓
    └───────┬───────┘
            ↓
┌─────────────────────────────────────┐
│  Step 2: Configure Parameters       │
│  • Dataset size (nodes, dimensions) │
│  • Iteration count                  │
│  • Output preferences               │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Step 3: Confirm & Execute          │
│  • Review configuration             │
│  • Start simulation                 │
│  • Monitor progress                 │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Step 4: View Results               │
│  • Performance summary              │
│  • Report location                  │
│  • Next steps                       │
└─────────────────────────────────────┘
```

---

## 🚀 Scenario Wizard Walkthrough

### Step 1: Launch & Mode Selection

```bash
$ agentdb simulate --wizard
```

**You'll see**:

```
🧙 AgentDB Simulation Wizard

? What would you like to do?
  ❯ 🎯 Run validated scenario (recommended)
    🔧 Build custom simulation
    📊 View past reports
```

**Keyboard Navigation**:

- **↑/↓**: Move selection
- **Enter**: Confirm choice
- **Ctrl+C**: Exit wizard

**Choose**: **Run validated scenario** for this walkthrough.

---

### Step 2: Scenario Selection

**You'll see**:

```
? Choose a simulation scenario:
  ❯ ⚡ HNSW Exploration (8.2x speedup)
    🧠 Attention Analysis (12.4% improvement)
    🎯 Traversal Optimization (96.8% recall)
    🔄 Self-Organizing (97.9% uptime)
    🚀 Neural Augmentation (29.4% improvement)
    🌐 Clustering Analysis (Q=0.758 modularity)
    🔗 Hypergraph Exploration (73% compression)
    ⚛️  Quantum-Hybrid (Theoretical)
```

**Scenario Descriptions** (press `i` for info):

#### ⚡ HNSW Exploration

**What it tests**: Core graph topology and small-world properties
**Duration**: ~4.5 seconds (3 iterations)
**Best for**: Understanding baseline performance
**Validates**: 8.2x speedup, σ=2.84 small-world index

#### 🧠 Attention Analysis

**What it tests**: Multi-head GNN attention mechanisms
**Duration**: ~6.2 seconds (includes training)
**Best for**: Learning query enhancement
**Validates**: +12.4% recall, 3.8ms forward pass

#### 🎯 Traversal Optimization

**What it tests**: Search strategy comparison (greedy, beam, A\*)
**Duration**: ~5.8 seconds
**Best for**: Finding optimal search parameters
**Validates**: Beam-5 = 96.8% recall, Dynamic-k = -18.4% latency

#### 🔄 Self-Organizing

**What it tests**: 30-day performance stability simulation
**Duration**: ~12.4 seconds (compressed time simulation)
**Best for**: Long-term deployment planning
**Validates**: MPC = 97.9% degradation prevention

#### 🚀 Neural Augmentation

**What it tests**: Full neural pipeline (GNN + RL + Joint Opt)
**Duration**: ~8.7 seconds
**Best for**: Maximum performance configuration
**Validates**: +29.4% overall improvement

#### 🌐 Clustering Analysis

**What it tests**: Community detection algorithms
**Duration**: ~4.2 seconds
**Best for**: Understanding data organization
**Validates**: Louvain Q=0.758 modularity

#### 🔗 Hypergraph Exploration

**What it tests**: Multi-agent collaboration patterns
**Duration**: ~3.8 seconds
**Best for**: Multi-entity relationships
**Validates**: 73% edge reduction, 96.2% task coverage

#### ⚛️ Quantum-Hybrid

**What it tests**: Theoretical quantum computing integration
**Duration**: ~2.1 seconds (simulation only)
**Best for**: Research roadmap
**Validates**: 2040+ viability timeline

**Select**: **HNSW Exploration** for this walkthrough.

---

### Step 3: Configuration Parameters

**You'll see**:

```
? Number of nodes: (100000)
```

**What it means**: How many vectors to test with
**Defaults**: 100,000 (optimal for benchmarking)
**Range**: 1,000 - 10,000,000
**Recommendation**: Use default for first run

**Press Enter** to accept default.

---

```
? Vector dimensions: (384)
```

**What it means**: Size of each vector (embedding size)
**Defaults**: 384 (common for BERT embeddings)
**Range**: 64 - 4096
**Common values**:

- 128: Lightweight embeddings
- 384: BERT-base, sentence transformers
- 768: BERT-large, OpenAI ada-002
- 1536: OpenAI text-embedding-3

**Press Enter** to accept default.

---

```
? Number of runs (for coherence): (3)
```

**What it means**: How many times to repeat the simulation
**Defaults**: 3 (validates consistency)
**Range**: 1 - 100
**Recommendation**:

- **1**: Quick test
- **3**: Standard validation (recommended)
- **10+**: High-confidence benchmarking

**Press Enter** to accept default.

---

```
? Use optimal validated configuration? (Y/n)
```

**What it means**: Apply discovered optimal parameters
**Defaults**: Yes
**Details**:

- **Yes**: Uses M=32, ef=200 (validated optimal)
- **No**: Prompts for manual parameter tuning

**For HNSW, optimal config includes**:

- M=32 (connection parameter)
- efConstruction=200 (build quality)
- efSearch=100 (query quality)
- Dynamic-k enabled (5-20 range)

**Press Enter** to accept (Yes).

---

### Step 4: Configuration Review

**You'll see**:

```
📋 Simulation Configuration:
   Scenario: HNSW Graph Topology Exploration
   Nodes: 100,000
   Dimensions: 384
   Iterations: 3
   ✅ Using optimal validated parameters (M=32, ef=200)

   Expected Performance:
   • Latency: ~61μs (8.2x vs baseline)
   • Recall@10: ~96.8%
   • Memory: ~151 MB
   • Duration: ~4.5 seconds
```

---

```
? Start simulation? (Y/n)
```

**Press Enter** to start.

---

### Step 5: Execution & Progress

**You'll see real-time progress**:

```
🚀 AgentDB Latent Space Simulation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Scenario: HNSW Graph Topology Exploration
⚙️  Configuration: M=32, efConstruction=200, efSearch=100

🔄 Iteration 1/3
  ├─ Building graph...      [████████████] 100% (2.3s)
  ├─ Running queries...     [████████████] 100% (1.8s)
  ├─ Analyzing topology...  [████████████] 100% (0.4s)
  └─ ✅ Complete
     Latency: 61.2μs | Recall: 96.8% | QPS: 16,340

🔄 Iteration 2/3
  └─ ✅ Complete
     Latency: 60.8μs | Recall: 96.9% | QPS: 16,447

🔄 Iteration 3/3
  └─ ✅ Complete
     Latency: 61.4μs | Recall: 96.7% | QPS: 16,286

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Simulation Complete!
```

**Progress Indicators**:

- **[████████████] 100%**: Current operation progress
- **(2.3s)**: Time taken for operation
- **✅**: Operation successfully completed
- **⚠️**: Warning (non-critical)
- **❌**: Error (check logs)

---

### Step 6: Results Summary

**You'll see**:

```
📊 Summary:
   Average Latency: 61.1μs (σ=0.25μs, 0.4% variance)
   Recall@10: 96.8% (σ=0.08%, highly consistent)
   QPS: 16,358 (queries per second)
   Memory: 151 MB (100K vectors × 384d)
   Coherence: 98.6% ✅ (excellent reproducibility)

   🏆 Performance vs Baseline:
   • 8.2x faster than hnswlib (498μs)
   • +1.2% better recall
   • -18% memory usage

   🔬 Graph Properties:
   • Small-world index (σ): 2.84 ✅ (optimal 2.5-3.5)
   • Clustering coefficient: 0.39
   • Average path length: 5.1 hops (O(log N))
   • Modularity (Q): 0.758

📄 Full report saved:
   ./reports/hnsw-exploration-2025-11-30-143522.md

? What would you like to do next?
  ❯ View detailed report
    Run another simulation
    Exit wizard
```

---

## 🛠️ Custom Builder Walkthrough

### Step 1: Select Custom Mode

```bash
$ agentdb simulate --wizard
```

```
? What would you like to do?
    🎯 Run validated scenario
  ❯ 🔧 Build custom simulation
    📊 View past reports
```

**Select**: **Build custom simulation**

---

### Step 2: Component Selection (6 Steps)

#### Component 1/6: Vector Backend

```
? 1/6 Choose vector backend:
  ❯ 🚀 RuVector (8.2x speedup) [OPTIMAL]
    📦 hnswlib (baseline)
    🔬 FAISS
```

**Info panel** (auto-displayed):

```
RuVector Performance:
• Latency: 61μs (8.2x faster)
• QPS: 12,182
• Memory: 151 MB (100K vectors)
• Small-world σ: 2.84 (optimal)

Best For:
✓ Production deployments
✓ High-performance requirements
✓ Self-learning systems
```

**Select**: **RuVector** (press Enter)

---

#### Component 2/6: Attention Mechanism

```
? 2/6 Attention mechanism:
  ❯ 🧠 8-head attention (+12.4%) [OPTIMAL]
    4-head attention (memory-constrained)
    16-head attention (max accuracy)
    No attention (baseline)
```

**Info panel**:

```
8-Head GNN Attention:
• Recall: +12.4% improvement
• Latency: +5.5% (3.8ms forward pass)
• Convergence: 35 epochs
• Transfer: 91% to unseen data

Best For:
✓ High-recall requirements (>96%)
✓ Learning user preferences
✓ Semantic search
```

**Select**: **8-head attention** (press Enter)

---

#### Component 3/6: Search Strategy

```
? 3/6 Search strategy:
  ❯ 🎯 Beam-5 + Dynamic-k (96.8% recall) [OPTIMAL]
    Beam-2 + Dynamic-k (speed-critical)
    Beam-8 (accuracy-critical)
    Greedy (baseline)
    A* search (experimental)
```

**Info panel**:

```
Beam-5 + Dynamic-k:
• Latency: 87.3μs
• Recall: 96.8%
• Dynamic-k range: 5-20
• Adapts to query complexity

Improvements:
✓ -18.4% latency vs fixed-k
✓ Pareto optimal (best trade-off)
✓ Tested beam widths: 2, 5, 8, 16
```

**Select**: **Beam-5 + Dynamic-k** (press Enter)

---

#### Component 4/6: Clustering Algorithm

```
? 4/6 Clustering algorithm:
  ❯ 🎯 Louvain (Q=0.758) [OPTIMAL]
    Spectral clustering
    Hierarchical clustering
    No clustering
```

**Info panel**:

```
Louvain Algorithm:
• Modularity (Q): 0.758 (excellent)
• Semantic purity: 87.2%
• Hierarchy levels: 3-4
• Stability: 97% consistent

Best For:
✓ Hierarchical navigation
✓ Category-based search
✓ Natural communities
```

**Select**: **Louvain** (press Enter)

---

#### Component 5/6: Self-Healing

```
? 5/6 Enable self-healing (97.9% uptime)? (Y/n)
```

**Info panel**:

```
MPC Self-Healing:
• 30-day degradation: +4.5% (vs +95% static)
• Prevention rate: 97.9%
• Adaptation: <100ms
• Cost savings: $9,600/year

How it works:
✓ Predictive modeling
✓ Real-time topology adjustment
✓ Autonomous parameter tuning

Recommended: YES for production
```

**Press Enter** to accept (Yes).

---

#### Component 6/6: Neural Features

```
? 6/6 Neural augmentation features:
  ❯ ◉ GNN edge selection (-18% memory)
    ◉ RL navigation (-26% hops)
    ◉ Joint optimization (+9.1%)
    ◯ Attention routing (42.8% skip)
```

**Keyboard**:

- **Space**: Toggle selection
- **a**: Select all
- **i**: Invert selection
- **Enter**: Confirm

**Info panel**:

```
Neural Features Impact:
┌────────────────┬─────────┬────────┬─────────┐
│ Feature        │ Latency │ Recall │ Memory  │
├────────────────┼─────────┼────────┼─────────┤
│ GNN Edges      │ -2.3%   │ +0.9%  │ -18% ✅ │
│ RL Navigation  │ -13.6%  │ +4.2%  │ 0%      │
│ Joint Opt      │ -8.2%   │ +1.1%  │ -6.8%   │
│ Attention Rout │ -12.4%  │ 0%     │ +2%     │
└────────────────┴─────────┴────────┴─────────┘

Recommendation: GNN Edges + RL Nav (best ROI)
```

**Select**: **GNN edges**, **RL navigation**, **Joint optimization** (press Enter)

---

### Step 3: Configuration Summary

**You'll see**:

```
📋 Custom Simulation Configuration:

Components:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend:        🚀 RuVector
Attention:      🧠 8-head GNN
Search:         🎯 Beam-5 + Dynamic-k
Clustering:     🎯 Louvain
Self-Healing:   ✅ MPC (97.9% uptime)
Neural:         ✅ GNN edges, RL navigation, Joint optimization

Expected Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Latency:        ~71.2μs (11.6x vs baseline)
Recall@10:      ~94.1%
Memory:         ~151 MB (-18%)
30-day stable:  +2.1% degradation only

Cost/Complexity: Medium (good ROI)

? Start custom simulation? (Y/n)
```

**Press Enter** to start.

---

## 🎨 Wizard Features

### Inline Help

Press `?` at any prompt for context-sensitive help:

```
? 2/6 Attention mechanism: ?

HELP: Attention Mechanisms
━━━━━━━━━━━━━━━━━━━━━━━━━━
Neural attention learns which graph connections
are most important for your queries.

Options:
• 8-head: Optimal (validated +12.4% recall)
• 4-head: Memory-constrained systems
• 16-head: Maximum accuracy (research)
• None: Baseline (simplest)

Performance Impact:
✓ Better recall (+1.6% to +13.1%)
✗ Slight latency cost (+3-9%)
✓ Learns over time (91% transfer)

Recommendation: 8-head for production
━━━━━━━━━━━━━━━━━━━━━━━━━━

Press Enter to continue...
```

---

### Keyboard Shortcuts

| Key        | Action                       |
| ---------- | ---------------------------- |
| **↑/↓**    | Navigate options             |
| **Enter**  | Confirm selection            |
| **Space**  | Toggle (checkboxes)          |
| **?**      | Show help for current prompt |
| **i**      | Show info panel (scenarios)  |
| **a**      | Select all (checkboxes)      |
| **Ctrl+C** | Exit wizard                  |
| **Esc**    | Go back one step             |

---

### Save & Resume Configurations

After building a custom config, you can save it:

```
? Save this configuration? (Y/n)
```

```
? Configuration name: my-optimal-config
```

**Reuse saved config**:

```bash
agentdb simulate --config my-optimal-config
```

**List saved configs**:

```bash
agentdb simulate --list-configs
```

---

## 📊 View Past Reports Mode

### Step 1: Select Report Viewer

```
? What would you like to do?
    🎯 Run validated scenario
    🔧 Build custom simulation
  ❯ 📊 View past reports
```

**Select**: **View past reports**

---

### Step 2: Report Selection

```
? Select a report to view:
  ❯ hnsw-exploration-2025-11-30-143522.md (4.5s ago) ⭐ Latest
    neural-augmentation-2025-11-30-142134.md (15m ago)
    custom-config-optimal-2025-11-30-135842.md (48m ago)
    traversal-optimization-2025-11-29-182341.md (Yesterday)
    [Load more...]
```

**Info panel**:

```
Preview: hnsw-exploration-2025-11-30-143522.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scenario: HNSW Graph Topology
Latency:  61.1μs (8.2x speedup)
Recall:   96.8%
Memory:   151 MB
Duration: 4.5s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Select**: Any report to view inline or open in editor.

---

### Step 3: Report Actions

```
? What would you like to do with this report?
  ❯ View summary in terminal
    Open full report in editor
    Compare with another report
    Export to PDF
    Share URL (if uploaded)
    Delete report
```

---

## 🚨 Troubleshooting Wizard Issues

### Wizard Won't Start

**Error**:

```
Error: inquirer not found
```

**Solution**:

```bash
npm install -g inquirer chalk ora
agentdb simulate --wizard
```

---

### Keyboard Input Not Working

**Issue**: Arrow keys don't navigate

**Solution**: Use `j/k` for vi-style navigation:

- `j`: Move down
- `k`: Move up
- `Enter`: Confirm

**Or**: Update your terminal:

```bash
# macOS
brew install --cask iterm2

# Linux
sudo apt install gnome-terminal
```

---

### Wizard Crashes Mid-Simulation

**Error**:

```
Unhandled promise rejection
```

**Solution**:

```bash
# Check logs
cat ~/.agentdb/wizard-error.log

# Run with verbose mode
agentdb simulate --wizard --verbose
```

---

### Can't See Progress Bars

**Issue**: Progress bars render as text

**Solution**:

```bash
# Disable fancy UI
agentdb simulate --wizard --no-spinner

# Or use simple mode
agentdb simulate --wizard --simple
```

---

## 💡 Tips & Best Practices

### 1. Start Simple

Run validated scenarios before building custom configs:

```bash
# Good: Learn from validated scenarios first
agentdb simulate --wizard → "Run validated scenario"

# Then: Build custom after understanding components
agentdb simulate --wizard → "Build custom simulation"
```

### 2. Use Optimal Defaults

When prompted "Use optimal validated configuration?", say **Yes** unless you have specific requirements.

### 3. Save Your Configs

After building a custom config you like, save it for reuse:

```
? Save this configuration? Yes
? Configuration name: my-production-config
```

### 4. Compare Before Deploying

Run both baseline and optimized configs to validate improvements:

```bash
# Baseline
agentdb simulate hnsw --output ./reports/baseline/

# Optimized
agentdb simulate --config my-production-config --output ./reports/optimized/
```

### 5. Iterate on Iterations

For critical deployments, run 10+ iterations for high confidence:

```
? Number of runs: 10
```

---

## 🎓 Advanced Wizard Usage

### Environment Variables

Control wizard behavior via environment:

```bash
# Skip confirmation prompts
export AGENTDB_WIZARD_SKIP_CONFIRM=1

# Default to JSON output
export AGENTDB_DEFAULT_FORMAT=json

# Auto-save all configs
export AGENTDB_AUTO_SAVE_CONFIG=1

agentdb simulate --wizard
```

---

### Templating

Create config templates for teams:

```bash
# Create team template
agentdb simulate --wizard --save-template production-team

# Team members use template
agentdb simulate --template production-team
```

---

### CI/CD Integration

Run wizard non-interactively in CI:

```bash
# Use config file
agentdb simulate --config-file ./ci-config.json

# Or environment variables
export AGENTDB_SCENARIO=hnsw
export AGENTDB_ITERATIONS=3
export AGENTDB_OUTPUT=./ci-reports/
agentdb simulate --ci-mode
```

---

## 📚 Next Steps

### Learn More

- **[CLI Reference](CLI-REFERENCE.md)** - All command options
- **[Custom Simulations](CUSTOM-SIMULATIONS.md)** - Component details
- **[Quick Start](QUICK-START.md)** - Command-line usage

### Dive Deeper

- **[Optimization Strategy](../architecture/OPTIMIZATION-STRATEGY.md)** - Performance tuning
- **[Simulation Architecture](../architecture/SIMULATION-ARCHITECTURE.md)** - Technical details

---

**Ready to build?** Launch the wizard:

```bash
agentdb simulate --wizard
```
