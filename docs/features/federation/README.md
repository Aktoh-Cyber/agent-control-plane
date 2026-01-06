# Federation - Distributed Agent Coordination

> Ephemeral agent coordination across distributed systems

## 📚 Documentation

- [Federated AgentDB Ephemeral Agents](FEDERATED-AGENTDB-EPHEMERAL-AGENTS.md)
- [Federation CLI Integration](FEDERATION-CLI-INTEGRATION.md)
- [Federation Implementation Summary](FEDERATION-IMPLEMENTATION-SUMMARY.md)
- [Federation Test Report](FEDERATION-TEST-REPORT.md)

## 🚀 Quick Start

### Basic Usage

```bash
# Initialize federation
npx gendev federation init

# Join federation
npx gendev federation join --peer ws://peer:8080

# List peers
npx gendev federation peers
```

## 🎯 Key Features

- **Ephemeral Agents** - Short-lived agents for specific tasks
- **Distributed Coordination** - Multi-node agent orchestration
- **AgentDB Integration** - Federated vector database
- **Fault Tolerance** - Automatic peer discovery and recovery

---

**Back to**: [Features](../README.md) | [Main Documentation](../../README.md)
