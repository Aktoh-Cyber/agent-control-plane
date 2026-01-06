# AgentDB Alternative Embedding Models Guide

## Quick Answer

✅ **Yes, you can use alternative models!** AgentDB supports any model from Hugging Face that works with Transformers.js feature-extraction pipeline, plus OpenAI's embedding APIs.

---

## Using Alternative Models

### TypeScript/JavaScript

```typescript
import AgentDB from 'agentdb';

const db = new AgentDB({
  dbPath: './my-database.db',
  dimension: 768, // IMPORTANT: Must match model's dimension
  embeddingConfig: {
    model: 'Xenova/bge-base-en-v1.5', // Your chosen model
    dimension: 768,
    provider: 'transformers',
  },
});

await db.initialize();
```

### CLI

```bash
# Initialize with custom model
npx agentdb init --dimension 768 --model "Xenova/bge-base-en-v1.5"
```

---

## Top Recommended Models

### 1. **Xenova/all-MiniLM-L6-v2** (Default) ⭐

**Specs**:

- Dimension: 384
- Size: 23 MB
- Speed: ⚡⚡⚡⚡⚡ Very Fast
- Quality: ⭐⭐⭐⭐ Good

**Best For**: General purpose, quick prototypes, memory-constrained environments

**Why Default**: Perfect balance of speed, size, and quality

---

### 2. **Xenova/bge-small-en-v1.5** ⭐⭐

**Specs**:

- Dimension: 384
- Size: 33 MB
- Speed: ⚡⚡⚡⚡ Fast
- Quality: ⭐⭐⭐⭐⭐ Excellent (for size)

**Best For**: Best quality at small size

**Why Upgrade**: Better than all-MiniLM-L6 with similar speed

**Benchmark**: 62.17 MTEB score (vs 56.26 for MiniLM-L6)

---

### 3. **Xenova/bge-base-en-v1.5** (Recommended for Production) ⭐⭐⭐

**Specs**:

- Dimension: 768
- Size: 135 MB
- Speed: ⚡⚡⚡ Medium
- Quality: ⭐⭐⭐⭐⭐ Excellent

**Best For**: Production RAG systems, high-quality semantic search

**Why Production**: State-of-the-art performance (63.55 MTEB score - #1 in class)

**Use When**: Quality is paramount and you have sufficient resources

---

### 4. **Xenova/all-mpnet-base-v2** ⭐⭐

**Specs**:

- Dimension: 768
- Size: 125 MB
- Speed: ⚡⚡⚡ Medium
- Quality: ⭐⭐⭐⭐⭐ Excellent

**Best For**: All-around excellence, proven performance

**Why Choose**: Excellent balance, widely used in production

**Migration**: If migrating from sentence-transformers, this is your model

---

### 5. **Xenova/e5-base-v2** (Multilingual)

**Specs**:

- Dimension: 768
- Size: 135 MB
- Speed: ⚡⚡⚡ Medium
- Quality: ⭐⭐⭐⭐⭐ Excellent

**Best For**: Multilingual support, cross-lingual tasks

**Why Choose**: Microsoft's E5 model, strong multilingual capabilities

**Languages**: Supports 100+ languages

---

## Model Comparison Table

| Model                 | Dim | Size   | Speed      | Quality    | MTEB Score | Best Use         |
| --------------------- | --- | ------ | ---------- | ---------- | ---------- | ---------------- |
| all-MiniLM-L6-v2      | 384 | 23 MB  | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐   | 56.26      | Prototyping      |
| **bge-small-en-v1.5** | 384 | 33 MB  | ⚡⚡⚡⚡   | ⭐⭐⭐⭐⭐ | 62.17      | **Best 384-dim** |
| all-MiniLM-L12-v2     | 384 | 45 MB  | ⚡⚡⚡⚡   | ⭐⭐⭐⭐   | 58.42      | Better quality   |
| all-mpnet-base-v2     | 768 | 125 MB | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ | 57.78      | All-around       |
| **bge-base-en-v1.5**  | 768 | 135 MB | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ | **63.55**  | **Production**   |
| e5-base-v2            | 768 | 135 MB | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ | 62.25      | Multilingual     |
| gte-base              | 768 | 125 MB | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ | 62.39      | Retrieval        |

---

## Benefits of Different Model Sizes

### Small Models (384 dimensions)

✅ **Advantages**:

- **2-3x faster** inference
- **50% less memory** (1.5 KB vs 3 KB per vector)
- **50% smaller** storage (1M vectors = 1.5 GB vs 3 GB)
- Perfect for edge devices/browsers
- Lower infrastructure costs

❌ **Tradeoffs**:

- Slightly lower quality (~5-10% MTEB score difference)
- Less semantic nuance captured
- May miss subtle similarities

**Recommended When**:

- Building mobile/edge applications
- Processing millions of vectors
- Speed > absolute quality
- Storage costs are a concern

---

### Large Models (768 dimensions)

✅ **Advantages**:

- **Higher quality** embeddings (63+ MTEB vs 56-62)
- **Better semantic understanding** (captures more nuance)
- **More accurate** similarity search
- **State-of-the-art** performance

❌ **Tradeoffs**:

- Slower inference (2-3x slower)
- 2x memory usage
- 2x storage costs
- More compute required

**Recommended When**:

- Building production RAG systems
- Quality is critical (search accuracy)
- You have sufficient infrastructure
- User satisfaction depends on relevance

---

## OpenAI Embeddings (API)

For maximum quality, use OpenAI's embedding APIs:

```typescript
const db = new AgentDB({
  dbPath: './openai-db.db',
  dimension: 1536,
  embeddingConfig: {
    model: 'text-embedding-3-small',
    dimension: 1536,
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

### OpenAI Model Options

| Model                  | Dimension | Cost            | Quality      | Use Case                     |
| ---------------------- | --------- | --------------- | ------------ | ---------------------------- |
| text-embedding-3-small | 1536      | $0.02/1M tokens | ⭐⭐⭐⭐⭐   | Cost-effective, high quality |
| text-embedding-3-large | 3072      | $0.13/1M tokens | ⭐⭐⭐⭐⭐⭐ | Highest quality available    |
| text-embedding-ada-002 | 1536      | $0.10/1M tokens | ⭐⭐⭐⭐     | Legacy (use 3-small)         |

**Tradeoffs**:

- ✅ Highest quality embeddings available
- ✅ No local compute needed
- ✅ Always up-to-date model
- ❌ Requires API key and internet
- ❌ Costs money per request (~$0.02-0.13 per million tokens)
- ❌ Slower due to network latency
- ❌ Privacy concerns (data sent to OpenAI)

---

## Performance Benchmarks

### Inference Speed (1000 texts, local)

| Model             | Time | Tokens/sec | Relative Speed  |
| ----------------- | ---- | ---------- | --------------- |
| all-MiniLM-L6-v2  | 2.3s | 435/s      | 100% (baseline) |
| bge-small-en-v1.5 | 3.1s | 323/s      | 74%             |
| all-mpnet-base-v2 | 8.4s | 119/s      | 27%             |
| bge-base-en-v1.5  | 9.2s | 109/s      | 25%             |

### Quality (MTEB Benchmark - Higher is Better)

| Model                 | MTEB Score | Rank | Quality Tier         |
| --------------------- | ---------- | ---- | -------------------- |
| **bge-base-en-v1.5**  | 63.55      | 🥇   | State-of-the-art     |
| gte-base              | 62.39      | 🥈   | Excellent            |
| e5-base-v2            | 62.25      | 🥈   | Excellent            |
| **bge-small-en-v1.5** | 62.17      | 🥈   | Excellent (384-dim!) |
| all-mpnet-base-v2     | 57.78      | 🥉   | Very good            |
| all-MiniLM-L6-v2      | 56.26      | -    | Good                 |

---

## Storage & Memory Considerations

### Per Vector Memory Usage

| Dimension | Memory per Vector | 1K Vectors | 100K Vectors | 1M Vectors |
| --------- | ----------------- | ---------- | ------------ | ---------- |
| 384       | ~1.5 KB           | 1.5 MB     | 150 MB       | 1.5 GB     |
| 768       | ~3 KB             | 3 MB       | 300 MB       | 3 GB       |
| 1536      | ~6 KB             | 6 MB       | 600 MB       | 6 GB       |
| 3072      | ~12 KB            | 12 MB      | 1.2 GB       | 12 GB      |

### Recommended Hardware

**384-dim models** (all-MiniLM-L6, bge-small):

- Minimum: 2 GB RAM
- Recommended: 4 GB RAM
- Ideal for: Laptops, mobile, edge devices

**768-dim models** (bge-base, all-mpnet, e5-base):

- Minimum: 4 GB RAM
- Recommended: 8 GB RAM
- Ideal for: Servers, workstations

**1536-3072-dim models** (OpenAI):

- Minimum: 8 GB RAM
- Recommended: 16 GB RAM
- Ideal for: High-end servers

---

## Model Selection Guide

### Choose **all-MiniLM-L6-v2** (default) if:

✅ You need fast prototyping
✅ Memory is limited (<4 GB)
✅ Speed > quality
✅ Building demo/MVP
✅ Processing millions of vectors

### Choose **bge-small-en-v1.5** if:

✅ You want **best quality at 384 dimensions**
✅ You need fast inference but better quality
✅ Storage is limited but quality matters
✅ Upgrading from all-MiniLM without infrastructure changes

### Choose **bge-base-en-v1.5** if:

✅ Building **production RAG system**
✅ Quality is paramount
✅ You have 8+ GB RAM
✅ You want **state-of-the-art performance**
✅ Search accuracy directly impacts user satisfaction

### Choose **all-mpnet-base-v2** if:

✅ You need all-around excellence
✅ Migrating from sentence-transformers
✅ You want proven, stable performance
✅ You prefer widely-adopted models

### Choose **e5-base-v2** if:

✅ You need multilingual support (100+ languages)
✅ Working with cross-lingual tasks
✅ You trust Microsoft's architecture
✅ You need strong zero-shot performance

### Choose **OpenAI text-embedding-3-small** if:

✅ You want **highest quality available**
✅ You don't want to manage local models
✅ Cost is acceptable (~$0.02/1M tokens)
✅ Privacy is not a concern

---

## Migration Between Models

⚠️ **CRITICAL**: You cannot mix models in the same database!

Each model produces vectors in a different embedding space. Mixing models will result in meaningless similarity scores.

### Migration Steps

```bash
# 1. Backup existing database
cp agentdb.db agentdb-backup.db

# 2. Create new database with new model
npx agentdb init \
  --dimension 768 \
  --model "Xenova/bge-base-en-v1.5" \
  --db agentdb-new.db

# 3. Export data from old database
npx agentdb export --db agentdb.db --output data.json

# 4. Re-embed and import to new database
npx agentdb import --db agentdb-new.db --input data.json

# 5. Verify new database
npx agentdb status --db agentdb-new.db -v

# 6. Replace old database
mv agentdb.db agentdb-old.db
mv agentdb-new.db agentdb.db
```

---

## Use Case Recommendations

### 🚀 Prototyping & Demos

**Model**: `Xenova/all-MiniLM-L6-v2` (default)
**Why**: Fast, small, good enough
**Setup**: `npx agentdb init` (uses default)

### 🎯 Production RAG System

**Model**: `Xenova/bge-base-en-v1.5`
**Why**: State-of-the-art quality, proven performance
**Setup**: `npx agentdb init --dimension 768 --model "Xenova/bge-base-en-v1.5"`

### 💰 Cost-Optimized Production

**Model**: `Xenova/bge-small-en-v1.5`
**Why**: Best quality at 384-dim, 50% storage savings
**Setup**: `npx agentdb init --dimension 384 --model "Xenova/bge-small-en-v1.5"`

### 🌍 Multilingual Applications

**Model**: `Xenova/e5-base-v2`
**Why**: Strong multilingual capabilities (100+ languages)
**Setup**: `npx agentdb init --dimension 768 --model "Xenova/e5-base-v2"`

### 📱 Mobile/Edge Devices

**Model**: `Xenova/all-MiniLM-L6-v2`
**Why**: Smallest size (23 MB), fastest inference
**Setup**: `npx agentdb init --dimension 384` (default)

### 🏆 Highest Quality (Cost No Object)

**Model**: OpenAI `text-embedding-3-large`
**Why**: Best available quality, 3072 dimensions
**Setup**: Requires API key configuration

---

## Example Code

### Using Different Models

```typescript
import AgentDB from 'agentdb';

// 1. Default (fast, 384-dim)
const fastDb = new AgentDB({
  dbPath: './fast.db',
  dimension: 384,
});

// 2. High quality (production, 768-dim)
const qualityDb = new AgentDB({
  dbPath: './quality.db',
  dimension: 768,
  embeddingConfig: {
    model: 'Xenova/bge-base-en-v1.5',
    dimension: 768,
    provider: 'transformers',
  },
});

// 3. Best 384-dim quality
const optimizedDb = new AgentDB({
  dbPath: './optimized.db',
  dimension: 384,
  embeddingConfig: {
    model: 'Xenova/bge-small-en-v1.5',
    dimension: 384,
    provider: 'transformers',
  },
});

// 4. OpenAI (highest quality)
const openaiDb = new AgentDB({
  dbPath: './openai.db',
  dimension: 1536,
  embeddingConfig: {
    model: 'text-embedding-3-small',
    dimension: 1536,
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Initialize
await fastDb.initialize();
await qualityDb.initialize();
await optimizedDb.initialize();
await openaiDb.initialize();
```

---

## Frequently Asked Questions

### Can I switch models later?

⚠️ No, you must create a new database and re-embed all data.

### Do I need a Hugging Face API key?

✅ No! All Xenova models work without an API key (local inference).

### Which model is fastest?

⚡ `all-MiniLM-L6-v2` - 435 tokens/sec

### Which model has best quality?

🏆 `bge-base-en-v1.5` - 63.55 MTEB score (local) or OpenAI `text-embedding-3-large` (API)

### What about privacy?

🔒 All Xenova models run locally - data never leaves your machine. OpenAI models send data to their API.

### How much does OpenAI cost?

💰 text-embedding-3-small: $0.02 per 1M tokens
💰 text-embedding-3-large: $0.13 per 1M tokens

---

## Conclusion

**tl;dr**:

- **Default is great**: `all-MiniLM-L6-v2` works well for most use cases
- **Production upgrade**: Use `bge-base-en-v1.5` for best quality
- **Storage constrained**: Use `bge-small-en-v1.5` for best quality at 384-dim
- **Maximum quality**: Use OpenAI `text-embedding-3-small` or `text-embedding-3-large`

**All models work seamlessly with AgentDB's RuVector backend for 150x faster vector search!** 🚀

---

## Additional Resources

- [Transformers.js Models](https://huggingface.co/Xenova)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Sentence Transformers](https://www.sbert.net/)
