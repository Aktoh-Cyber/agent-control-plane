# Research Swarm - Local SQLite Implementation

## 🎯 Overview

A fully local, SQLite-based research agent system with **NO Supabase dependencies**. Features long-horizon recursive research framework, advanced anti-hallucination controls, citation verification, and multi-hour execution support.

## ✨ Key Features

- ✅ **100% Local** - SQLite database, no cloud services required
- ✅ **Long-Horizon Research** - Multi-hour execution with recursive framework
- ✅ **Advanced Parameters** - Depth, focus, time budget, anti-hallucination controls
- ✅ **Citation Verification** - Automatic source verification and quality scoring
- ✅ **Progress Tracking** - Real-time progress monitoring in SQLite database
- ✅ **ED2551 Mode** - Enhanced research with temporal trend analysis
- ✅ **Comprehensive Logging** - Full execution logs stored in database
- ✅ **Multiple Output Formats** - Markdown, JSON reports

## 📦 Installation

```bash
cd /workspaces/agent-control-plane/examples/research-swarm

# Install dependencies
npm install

# Initialize database
npm run init-db
```

## 🚀 Quick Start

### Basic Usage

```bash
# Run a research task
node run-researcher-local.js researcher "Analyze quantum computing trends"

# View all jobs
npm run list-jobs

# View specific job details
npm run view-job <job-id>
```

### Advanced Usage with Environment Variables

Create or edit `/workspaces/agent-control-plane/.env`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Research Control Parameters (Optional)
RESEARCH_DEPTH=7                    # 1-10 scale (default: 5)
RESEARCH_TIME_BUDGET=180            # Minutes (default: 120)
RESEARCH_FOCUS=broad                # narrow|balanced|broad
ANTI_HALLUCINATION_LEVEL=high       # low|medium|high
CITATION_REQUIRED=true              # Require citations
ED2551_MODE=true                    # Enhanced mode
MAX_RESEARCH_ITERATIONS=15          # Max recursive iterations
VERIFICATION_THRESHOLD=0.95         # Quality threshold (0-1)
```

## 🔧 Configuration

### Research Depth (1-10)

- **1-3**: Quick surveys, basic information gathering
- **4-6**: Balanced research with good depth
- **7-9**: Deep analysis with extensive verification
- **10**: Maximum depth, exhaustive research

### Research Focus

- **narrow**: Deep dive into specific aspects, ignore tangential topics
- **balanced**: Mix of depth and breadth, practical + theoretical
- **broad**: Survey multiple perspectives, cross-disciplinary connections

### Anti-Hallucination Levels

- **low**: Basic verification
- **medium**: Cross-reference major claims
- **high**: Strict verification protocol, multi-source verification

### ED2551 Enhanced Mode

When enabled, provides:

- Multi-layered verification cascade
- Temporal trend analysis
- Cross-domain pattern recognition
- Predictive insight generation
- Automated quality scoring
- Recursive depth optimization

## 📊 Database Schema

SQLite database at `./data/research-jobs.db` with the following structure:

```sql
CREATE TABLE research_jobs (
  id TEXT PRIMARY KEY,                      -- UUID
  agent TEXT NOT NULL,                      -- Agent name
  task TEXT NOT NULL,                       -- Research task
  location TEXT,                            -- Task location/context
  status TEXT,                              -- pending|running|completed|failed
  progress INTEGER,                         -- 0-100%
  current_message TEXT,                     -- Status message
  current_tool TEXT,                        -- Current tool being used
  tool_count INTEGER,                       -- Number of tools used
  exit_code INTEGER,                        -- Process exit code
  execution_log TEXT,                       -- Full execution logs
  report_content TEXT,                      -- Generated report
  report_format TEXT,                       -- markdown|json|html
  report_path TEXT,                         -- File system path
  error_message TEXT,                       -- Error details if failed
  retry_count INTEGER,                      -- Number of retries
  duration_seconds INTEGER,                 -- Execution duration
  tokens_used INTEGER,                      -- LLM tokens consumed
  grounding_score REAL,                     -- Quality score
  created_at TEXT,                          -- Job creation timestamp
  started_at TEXT,                          -- Execution start
  completed_at TEXT,                        -- Execution completion
  last_update TEXT,                         -- Last update timestamp
  metadata TEXT                             -- JSON metadata
);
```

## 📝 Scripts

### Initialize Database

```bash
npm run init-db
# or
node scripts/init-database.js
```

### List Jobs

```bash
npm run list-jobs
# or
node scripts/list-jobs.js
```

### View Job Details

```bash
npm run view-job <job-id>
# or
node scripts/view-job.js <job-id>
```

## 📁 Directory Structure

```
research-swarm/
├── data/                          # SQLite database
│   └── research-jobs.db
├── lib/                           # Utility modules
│   └── db-utils.js               # Database operations
├── schema/                        # Database schema
│   └── research-jobs.sql         # SQLite table definitions
├── scripts/                       # Utility scripts
│   ├── init-database.js         # Initialize DB
│   ├── list-jobs.js             # List all jobs
│   └── view-job.js              # View job details
├── output/                        # Generated reports
│   ├── reports/
│   │   ├── markdown/            # Markdown reports
│   │   └── json/                # JSON reports
│   ├── logs/                    # Execution logs
│   └── databases/               # Database exports
├── docs/                          # Documentation
│   └── README.md
├── run-researcher-local.js       # Main runner script
└── package.json                  # Dependencies
```

## 🎓 Examples

### Example 1: Quick Research (Low Depth)

```bash
RESEARCH_DEPTH=3 \
RESEARCH_TIME_BUDGET=30 \
RESEARCH_FOCUS=narrow \
node run-researcher-local.js researcher "What are webhooks?"
```

### Example 2: Deep Analysis (High Depth)

```bash
RESEARCH_DEPTH=8 \
RESEARCH_TIME_BUDGET=240 \
RESEARCH_FOCUS=broad \
ANTI_HALLUCINATION_LEVEL=high \
CITATION_REQUIRED=true \
ED2551_MODE=true \
node run-researcher-local.js researcher "Comprehensive analysis of AI safety research"
```

### Example 3: Balanced Research

```bash
# Uses defaults from .env
node run-researcher-local.js researcher "Analyze benefits of renewable energy"
```

## 🔍 Output Files

After execution, you'll find:

1. **Markdown Report**: `output/reports/markdown/<agent>_<job-id>.md`
2. **JSON Report**: `output/reports/json/<agent>_<job-id>.json`
3. **Database Record**: Query with `npm run view-job <job-id>`

## ⚙️ Recursive Research Framework

The system implements a multi-phase recursive research approach:

### Phase 1: Initial Exploration

- Duration: ~15% of time budget
- Depth: Up to level 3
- Purpose: Broad survey and topic mapping

### Phase 2: Deep Analysis

- Duration: ~40% of time budget
- Depth: Full configured depth
- Purpose: Detailed investigation of core topics

### Phase 3: Verification & Validation

- Duration: ~20% of time budget
- Depth: Depth - 1
- Purpose: Cross-reference and verify findings

### Phase 4: Citation Verification (if enabled)

- Duration: ~15% of time budget
- Depth: Level 2
- Purpose: Verify all citations and sources

### Phase 5: Synthesis & Reporting

- Duration: ~10% of time budget
- Depth: Level 1
- Purpose: Compile and format final report

## 🛡️ Anti-Hallucination Protocol

When `ANTI_HALLUCINATION_LEVEL=high`:

1. ✅ ONLY cite verified sources
2. ✅ ALWAYS provide URLs
3. ✅ Flag uncertain information with confidence scores
4. ✅ Cross-reference claims
5. ✅ Use attribution format
6. ❌ NEVER generate speculative data
7. ❌ NEVER create fake citations
8. ✓ Include verification metadata

## 🐛 Troubleshooting

### API Key Not Found

```bash
# Make sure .env exists in project root
ls /workspaces/agent-control-plane/.env

# Check it contains ANTHROPIC_API_KEY
grep ANTHROPIC_API_KEY /workspaces/agent-control-plane/.env
```

### Agent Not Found

```bash
# List available agents
npx agent-control-plane --list

# Use exact agent name (e.g., 'researcher', not 'test-researcher')
```

### Database Locked

```bash
# Close any open database connections
# Delete database and reinitialize
rm data/research-jobs.db
npm run init-db
```

## 📊 Performance Tips

1. **For Quick Research**: Set `RESEARCH_DEPTH=3` and `RESEARCH_TIME_BUDGET=30`
2. **For Quality**: Use `ANTI_HALLUCINATION_LEVEL=high` and `CITATION_REQUIRED=true`
3. **For Speed**: Use `RESEARCH_FOCUS=narrow` and disable `ED2551_MODE`
4. **For Comprehensive**: Use `RESEARCH_DEPTH=8-10` with `RESEARCH_FOCUS=broad`

## 🔗 Integration

This system can be integrated with other tools:

```javascript
import { createJob, updateProgress, markComplete, getJobStatus } from './lib/db-utils.js';

// Create a job
createJob({
  id: 'my-job-123',
  agent: 'researcher',
  task: 'My research task',
  status: 'pending',
});

// Update progress
updateProgress('my-job-123', 50, 'Halfway through research');

// Get status
const job = getJobStatus('my-job-123');
console.log(job.progress); // 50
```

## 📜 License

ISC

## 🤝 Contributing

This is a local implementation replacing Supabase dependencies. All contributions should maintain the local-first, no-cloud-services architecture.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the database schema and utility scripts
3. Examine execution logs in the database
4. Verify environment variables in `.env`

---

**Note**: This implementation uses the ANTHROPIC_API_KEY from the root `.env` file and stores all data locally in SQLite. No external services or cloud databases are required.
