# Medical MCP Server

Comprehensive Medical Context Protocol (MCP) server with anti-hallucination features, dual transport support (SSE/STDIO), and AgentDB integration for pattern learning.

## Features

### 🏥 Medical Analysis Tools

1. **medical_analyze** - Analyze symptoms with confidence scoring
2. **medical_verify** - Verify analysis quality and accuracy
3. **provider_notify** - Notify healthcare providers
4. **confidence_score** - Calculate confidence metrics
5. **citation_verify** - Verify medical citations
6. **knowledge_search** - Search medical knowledge bases

### 🛡️ Anti-Hallucination Features

- **Real-time Confidence Monitoring** - Continuous quality assessment
- **Citation Validation** - Verify against trusted medical sources
- **Provider Approval Workflows** - Require expert review for critical cases
- **Emergency Escalation** - Automatic alerts for urgent conditions

### 🚀 Transport Options

- **SSE (Server-Sent Events)** - HTTP streaming for web applications
- **STDIO** - Command-line integration for Claude Desktop

### 🧠 AgentDB Integration

- **Pattern Learning** - Learn from provider feedback
- **Experience Tracking** - Build knowledge base over time
- **Similar Case Search** - Find relevant historical analyses

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Usage

### SSE Transport (HTTP Streaming)

```bash
# Start SSE server
node dist/src/mcp/transports/sse.js

# Or with custom port
MCP_PORT=3000 node dist/src/mcp/transports/sse.js
```

Server endpoints:

- `http://localhost:8080/mcp` - MCP protocol endpoint
- `http://localhost:8080/sse` - SSE streaming endpoint
- `http://localhost:8080/health` - Health check

### STDIO Transport (Command Line)

```bash
# Start STDIO server
node dist/src/mcp/transports/stdio.js
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "medical-mcp": {
      "command": "node",
      "args": ["/path/to/agent-control-plane/dist/src/mcp/transports/stdio.js"]
    }
  }
}
```

## Tool Examples

### Medical Analysis

```javascript
{
  "name": "medical_analyze",
  "arguments": {
    "symptoms": ["chest pain", "shortness of breath", "sweating"],
    "vitalSigns": {
      "heartRate": 105,
      "systolicBP": 145,
      "oxygenSaturation": 96
    },
    "includeRecommendations": true
  }
}
```

### Verification

```javascript
{
  "name": "medical_verify",
  "arguments": {
    "analysisId": "analysis-123",
    "analysis": { /* analysis object */ },
    "strictMode": true
  }
}
```

### Provider Notification

```javascript
{
  "name": "provider_notify",
  "arguments": {
    "analysisId": "analysis-123",
    "urgency": "high",
    "channel": "sms",
    "recipient": "+1-555-DOCTOR"
  }
}
```

### Confidence Scoring

```javascript
{
  "name": "confidence_score",
  "arguments": {
    "analysis": { /* analysis object */ },
    "detailedBreakdown": true
  }
}
```

### Citation Verification

```javascript
{
  "name": "citation_verify",
  "arguments": {
    "citations": [
      {
        "source": "PubMed",
        "title": "Clinical Guidelines...",
        "year": 2024
      }
    ],
    "strictMode": true
  }
}
```

### Knowledge Search

```javascript
{
  "name": "knowledge_search",
  "arguments": {
    "query": "treatment protocols for acute myocardial infarction",
    "filters": {
      "sourceTypes": ["clinical_guideline", "research_paper"],
      "minRelevance": 0.8
    },
    "maxResults": 10
  }
}
```

## Architecture

```
src/mcp/
├── types.ts                      # TypeScript type definitions
├── index.ts                      # Main entry point
├── agentdb-integration.ts        # AgentDB pattern learning
├── transports/
│   ├── sse.ts                    # SSE (HTTP streaming) transport
│   └── stdio.ts                  # STDIO (CLI) transport
├── tools/
│   ├── medical-analyze.ts        # Medical analysis tool
│   ├── medical-verify.ts         # Verification tool
│   ├── provider-notify.ts        # Provider notification
│   ├── confidence-score.ts       # Confidence scoring
│   ├── citation-verify.ts        # Citation verification
│   └── knowledge-search.ts       # Knowledge base search
└── anti-hallucination/
    ├── confidence-monitor.ts     # Real-time confidence monitoring
    ├── citation-validator.ts     # Citation validation
    ├── provider-workflow.ts      # Provider approval workflows
    └── emergency-escalation.ts   # Emergency escalation
```

## Anti-Hallucination Safeguards

### Confidence Monitoring

- Continuous assessment of analysis quality
- Component-level scoring (diagnosis, treatment, prognosis)
- Data quality evaluation
- Uncertainty factor identification

### Citation Validation

- Verify against trusted medical sources
- Check publication dates and relevance
- Validate source reliability
- Cross-reference multiple sources

### Provider Workflows

- Automatic review flagging for:
  - Emergency/urgent cases
  - Low confidence analyses
  - Critical severity conditions
  - Unverified citations
- Multi-channel notifications (email, SMS, pager, app)

### Emergency Escalation

- Automatic detection of emergency conditions
- Immediate notification to on-call providers
- Action plan generation
- Response tracking

## Integration with AgentDB

The medical MCP server integrates with AgentDB for pattern learning:

```javascript
import { AgentDBIntegration } from './agentdb-integration';

const agentdb = new AgentDBIntegration();

// Store analysis for learning
await agentdb.storeAnalysisPattern(analysis);

// Record provider feedback
await agentdb.recordFeedback(analysisId, accuracy, feedback);

// Find similar cases
const similar = await agentdb.findSimilarPatterns(symptoms);

// Get learning metrics
const metrics = await agentdb.getLearningMetrics();
```

## Security & Compliance

- **HIPAA Compliance Ready**: Designed with healthcare privacy in mind
- **Input Validation**: All inputs sanitized and validated
- **Citation Verification**: Only trusted medical sources
- **Provider Oversight**: Critical decisions require expert review
- **Audit Trail**: All analyses and decisions logged

## Development

```bash
# Run in development
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT

## Support

For issues and questions:

- GitHub Issues: https://github.com/Aktoh-Cyber/agent-control-plane/issues
- Documentation: https://github.com/Aktoh-Cyber/agent-control-plane

---

**⚠️ Medical Disclaimer**: This system is for educational and research purposes. All analyses must be reviewed by qualified healthcare professionals before clinical use. This system does not replace professional medical judgment.
