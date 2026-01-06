# ReasoningBank Self-Learning System Guide

## 🧠 Overview

ReasoningBank is a self-aware learning system that uses SAFLA (Self-Aware Feedback Loop Algorithm) to learn from patterns, improve over time, and provide intelligent recommendations based on semantic understanding.

## 🎯 Key Capabilities

### 1. **Semantic Understanding** 🔍

- Finds relevant patterns without exact keyword matches
- Understands context and relationships between concepts
- Query: "security" → Finds SQL injection, error logging, authentication patterns

### 2. **Usage Tracking** 📊

- Tracks how often each pattern is accessed
- Higher usage = more reliable/useful pattern
- System learns which patterns are most valuable

### 3. **Confidence Scoring** 💯

- Each pattern has a confidence score (0-100%)
- Improves over time with more usage
- Current demo: 80% confidence (new patterns)

### 4. **Cross-Domain Learning** 🌐

- Connects related concepts across different domains
- Understands that "prevent attacks" relates to SQL injection AND error logging
- Builds knowledge graph of relationships

### 5. **Match Scoring** 🎯

- Shows relevance of each result (0-100%)
- Higher match score = more relevant to your query
- Example: 31.7% match for "prevent attacks" → SQL injection

---

## 🚀 Quick Start

### Store a Learning Pattern

```bash
npx gendev@alpha memory store my_pattern \
  "Your best practice or pattern here" \
  --namespace learning \
  --reasoningbank
```

### Query for Patterns

```bash
npx gendev@alpha memory query "your question" \
  --namespace learning \
  --reasoningbank
```

### Check System Status

```bash
npx gendev@alpha memory status --reasoningbank
```

---

## 📚 Practical Examples

### Example 1: Security Learning

**Store patterns:**

```bash
npx gendev@alpha memory store auth_pattern \
  "Use bcrypt with 10+ rounds for password hashing" \
  --namespace security --reasoningbank

npx gendev@alpha memory store sql_pattern \
  "Always use parameterized queries to prevent SQL injection" \
  --namespace security --reasoningbank

npx gendev@alpha memory store jwt_pattern \
  "Store JWT tokens in httpOnly cookies, not localStorage" \
  --namespace security --reasoningbank
```

**Query semantically:**

```bash
# Query: "how to secure user passwords"
# ✅ Returns: auth_pattern (bcrypt)

# Query: "database security"
# ✅ Returns: sql_pattern (parameterized queries)

# Query: "token storage best practices"
# ✅ Returns: jwt_pattern (httpOnly cookies)
```

---

### Example 2: Performance Optimization Learning

**Store patterns:**

```bash
npx gendev@alpha memory store n_plus_one \
  "Avoid N+1 queries: use JOIN or batch loading" \
  --namespace performance --reasoningbank

npx gendev@alpha memory store caching \
  "Cache with TTL and versioning for consistency" \
  --namespace performance --reasoningbank

npx gendev@alpha memory store lazy_loading \
  "Lazy load images and routes to reduce initial bundle" \
  --namespace performance --reasoningbank
```

**Query semantically:**

```bash
# Query: "slow database queries"
# ✅ Returns: n_plus_one, caching

# Query: "improve page load time"
# ✅ Returns: lazy_loading, caching
```

---

### Example 3: API Design Learning

**Store patterns:**

```bash
npx gendev@alpha memory store rest_versioning \
  "Version APIs in URL path /api/v1/ not query params" \
  --namespace api --reasoningbank

npx gendev@alpha memory store error_responses \
  "Return consistent error format: {error, message, code}" \
  --namespace api --reasoningbank

npx gendev@alpha memory store pagination \
  "Use cursor-based pagination for large datasets" \
  --namespace api --reasoningbank
```

**Query semantically:**

```bash
# Query: "API breaking changes"
# ✅ Returns: rest_versioning

# Query: "error handling in REST"
# ✅ Returns: error_responses

# Query: "large result sets"
# ✅ Returns: pagination
```

---

## 🎓 Advanced Features

### 1. Multi-Domain Learning

Store patterns across different domains and query cross-domain:

```bash
# Store in different namespaces
memory store ... --namespace frontend --reasoningbank
memory store ... --namespace backend --reasoningbank
memory store ... --namespace devops --reasoningbank

# Query across namespaces (omit --namespace)
memory query "deployment strategies" --reasoningbank
# ✅ Returns patterns from devops AND backend namespaces
```

---

### 2. Learning from Failures

Store anti-patterns and lessons learned:

```bash
npx gendev@alpha memory store antipattern_callback_hell \
  "AVOID: Nested callbacks lead to unmaintainable code. Use async/await" \
  --namespace lessons --reasoningbank

npx gendev@alpha memory store failure_no_error_handling \
  "LESSON: Always wrap async operations in try-catch. Crashed production 3 times" \
  --namespace lessons --reasoningbank
```

---

### 3. Team Knowledge Sharing

Export and share learnings:

```bash
# Export your learnings
npx gendev@alpha memory export team-knowledge.json

# Share with team (commit to git)
git add team-knowledge.json
git commit -m "Add learned patterns from sprint"

# Team members import
npx gendev@alpha memory import team-knowledge.json
```

---

### 4. Context-Aware Queries

The system understands context:

```bash
# Vague query
$ memory query "make it faster" --namespace performance --reasoningbank

# ✅ Smart results:
# - Caching patterns
# - N+1 query solutions
# - Lazy loading techniques
# - Bundle optimization tips

# Specific query
$ memory query "React rendering performance" --namespace performance --reasoningbank

# ✅ Focused results:
# - React.memo usage
# - useMemo/useCallback patterns
# - Virtual list rendering
```

---

## 📊 Understanding the Output

### Query Result Format

```
✅ Found 3 results (semantic search):

📌 pattern_name
   Namespace: learning           ← Organization category
   Value: The actual pattern...  ← Knowledge content
   Confidence: 80.0%             ← Quality score (higher = better)
   Usage: 0 times                ← How often accessed (higher = more trusted)
   Match Score: 31.3%            ← Relevance to query (higher = more relevant)
   Stored: 10/13/2025, 9:59 PM   ← When learned
```

### Interpreting Scores

**Confidence (Pattern Quality)**:

- **80-100%**: High confidence, proven patterns
- **60-79%**: Good confidence, generally reliable
- **40-59%**: Medium confidence, use with caution
- **<40%**: Low confidence, verify before using

**Usage Count (Pattern Reliability)**:

- **High usage (20+)**: Battle-tested, trusted pattern
- **Medium usage (5-19)**: Somewhat validated
- **Low usage (0-4)**: New pattern, less proven

**Match Score (Query Relevance)**:

- **>40%**: Highly relevant to your query
- **30-40%**: Good relevance
- **20-30%**: Moderate relevance
- **<20%**: Low relevance (might be noise)

---

## 🔧 Best Practices

### 1. Organize with Namespaces

```bash
--namespace security      # Security patterns
--namespace performance   # Performance tips
--namespace architecture  # Design patterns
--namespace lessons       # Lessons learned
--namespace team          # Team conventions
```

### 2. Write Clear, Actionable Patterns

```bash
# ✅ Good: Actionable, specific
"Use Redis with 5-minute TTL for API response caching"

# ❌ Bad: Vague, not actionable
"Caching is good for performance"
```

### 3. Include Context

```bash
# ✅ Good: Includes reasoning
"Use bcrypt with 10+ rounds for passwords - balances security vs performance"

# ❌ Bad: No context
"Use bcrypt"
```

### 4. Update Patterns Over Time

```bash
# Store improved version with same key (upserts automatically)
npx gendev@alpha memory store api_caching \
  "Use Redis with 10-min TTL and cache invalidation tags" \
  --namespace performance --reasoningbank
```

---

## 💡 Use Cases

### 1. Code Review Assistant

```bash
# During code review, query for relevant patterns
$ memory query "authentication security" --reasoningbank
# ✅ Returns: bcrypt, JWT, session management patterns
```

### 2. Onboarding New Developers

```bash
# Export team knowledge
$ memory export onboarding-guide.json

# New dev imports and queries
$ memory import onboarding-guide.json
$ memory query "how we handle errors" --reasoningbank
```

### 3. Architecture Decision Records (ADR)

```bash
# Store decisions with reasoning
$ memory store adr_microservices \
  "Decision: Use microservices for user/order services. Reason: Independent scaling" \
  --namespace architecture --reasoningbank
```

### 4. Incident Post-Mortems

```bash
# Store learnings from incidents
$ memory store incident_2024_10_13 \
  "Root cause: Missing index on users.email. Fix: Added index, 95% latency drop" \
  --namespace incidents --reasoningbank

# Query during similar issues
$ memory query "slow database queries" --namespace incidents --reasoningbank
```

---

## 🎯 Advanced Workflows

### Continuous Learning Pipeline

```bash
#!/bin/bash
# learn.sh - Continuous learning script

# 1. Analyze code changes
git diff main...HEAD > changes.txt

# 2. Extract patterns (with AI)
# ... analyze changes.txt with AI ...

# 3. Store new patterns
npx gendev@alpha memory store new_pattern "..." --reasoningbank

# 4. Export for CI/CD
npx gendev@alpha memory export learned-patterns.json

# 5. Use in automated code review
npx gendev@alpha memory query "security issues" --reasoningbank
```

### Team Learning Dashboard

```bash
# Get statistics
$ memory status --reasoningbank

✅ 📊 ReasoningBank Status:
   Total memories: 71
   Average confidence: 73.2%
   Embeddings: 71

# Export for visualization
$ memory export dashboard-data.json
# ... visualize in web dashboard ...
```

---

## 🚀 Performance Tips

### 1. Query Speed

- **Semantic search**: 2-3ms average
- **Storage**: 3-5s (includes embedding generation)
- **Tip**: Batch store operations when possible

### 2. Memory Management

```bash
# Check database size
ls -lh .swarm/memory.db

# Export and clear old namespaces
memory export backup.json
memory clear --namespace old_project
```

### 3. Optimal Pattern Count

- **Sweet spot**: 50-500 patterns per namespace
- **Too few (<20)**: Limited learning capability
- **Too many (>1000)**: Slower queries, less relevant results

---

## 🔍 Troubleshooting

### Issue: "No results found"

```bash
# Check namespace
$ memory list --namespace your_namespace

# Try broader query
$ memory query "general term" --reasoningbank

# Check database
$ memory status --reasoningbank
```

### Issue: Slow queries

```bash
# Check database size
$ ls -lh .swarm/memory.db

# Export and reimport (rebuilds indexes)
$ memory export backup.json
$ memory import backup.json
```

### Issue: Low confidence scores

```bash
# Add more related patterns
# Query patterns more often (increases usage)
# Wait for confidence to build over time
```

---

## 📖 Further Reading

- **SAFLA Algorithm**: Self-Aware Feedback Loop Algorithm
- **4-Tier Memory**: Vector, Episodic, Semantic, Working
- **Performance**: 172,000+ ops/sec with WASM optimization
- **Compression**: 60% memory reduction with full recall

---

## 🎉 Summary

ReasoningBank provides:

- ✅ **Semantic learning** - Understands meaning, not just keywords
- ✅ **Usage tracking** - Learns what's most valuable
- ✅ **Confidence scoring** - Quality metrics for patterns
- ✅ **Cross-domain** - Connects related concepts
- ✅ **Fast queries** - 2-3ms semantic search
- ✅ **Persistent** - Learns across sessions

**Start learning today!**

```bash
npx gendev@alpha memory store my_first_pattern \
  "Your best practice here" \
  --namespace learning \
  --reasoningbank
```
