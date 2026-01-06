# 🚀 Deployment Options: Complete Guide

**5 deployment strategies • Local to cloud scale • Production-ready**

---

## 📑 Quick Navigation

[← Back to Main README](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/README.md) | [MCP Tools ←](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/MCP-TOOLS.md) | [Agent Booster →](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/AGENT-BOOSTER.md)

---

## 🎯 Deployment Strategy Overview

Choose the right deployment based on your needs:

| Deployment              | Best For               | Setup Time | Cost          | Scale           |
| ----------------------- | ---------------------- | ---------- | ------------- | --------------- |
| **Local (npx)**         | Development, testing   | 30 seconds | Free          | 1-10 agents     |
| **Local (Global)**      | Personal projects      | 2 minutes  | Free          | 10-50 agents    |
| **Docker**              | CI/CD, production      | 10 minutes | Low           | 50-500 agents   |
| **Kubernetes**          | Enterprise scale       | 30 minutes | Medium        | 500-10K+ agents |
| **Agentic Cloud Cloud** | Instant scale, managed | 5 minutes  | Pay-as-you-go | Unlimited       |

---

## 1️⃣ Local Development (npx)

**Perfect for**: Quick experiments, one-off tasks, development

### Quick Start

```bash
# No installation needed - run directly
npx agent-control-plane --agent coder --task "Build a REST API"

# With specific model
npx agent-control-plane \
  --agent researcher \
  --task "Analyze microservices trends" \
  --model "claude-3-5-sonnet-20241022"

# With streaming output
npx agent-control-plane \
  --agent coder \
  --task "Create web scraper" \
  --stream
```

### Configuration

Set environment variables:

```bash
# API Keys
export ANTHROPIC_API_KEY=sk-ant-...
export OPENROUTER_API_KEY=sk-or-...
export GOOGLE_GEMINI_API_KEY=...

# Optional: Model preferences
export PROVIDER=anthropic  # anthropic, openrouter, gemini, onnx
export MODEL=claude-3-5-sonnet-20241022

# Optional: Cost optimization
export ROUTER_ENABLED=true
export ROUTER_PRIORITY=balanced  # cost, quality, speed, balanced
```

### Pros & Cons

**Pros:**

- ✅ Zero installation
- ✅ Perfect for quick tasks
- ✅ Always latest version
- ✅ No configuration needed

**Cons:**

- ❌ Slower startup (downloads on each run)
- ❌ No persistent configuration
- ❌ Limited to single agent tasks

---

## 2️⃣ Local Installation (Global)

**Perfect for**: Regular use, personal automation, local development

### Installation

```bash
# Install globally
npm install -g agent-control-plane

# Verify installation
agent-control-plane --version
agent-control-plane --help
```

### Configuration

Create `~/.agent-control-plane/config.json`:

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-3-5-sonnet-20241022",
  "router": {
    "enabled": true,
    "priority": "balanced",
    "maxCost": 1.0
  },
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "baseUrl": "https://api.anthropic.com"
    },
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}",
      "baseUrl": "https://openrouter.ai/api/v1"
    },
    "gemini": {
      "apiKey": "${GOOGLE_GEMINI_API_KEY}"
    }
  },
  "reasoningbank": {
    "enabled": true,
    "dbPath": "~/.agent-control-plane/memory.db"
  }
}
```

### Usage

```bash
# Run agents directly
agent-control-plane --agent coder --task "Build API"

# List available agents
agent-control-plane --list

# MCP server management
agent-control-plane mcp add weather 'npx @modelcontextprotocol/server-weather'
agent-control-plane mcp list
agent-control-plane mcp remove weather

# ReasoningBank commands
agent-control-plane reasoningbank init
agent-control-plane reasoningbank status
```

### Advanced Configuration

Create `~/.agent-control-plane/agents/custom-agent.md`:

```markdown
# Custom Developer Agent

## Role

Full-stack developer specializing in React and Node.js

## Capabilities

- Frontend: React, TypeScript, Tailwind
- Backend: Node.js, Express, PostgreSQL
- DevOps: Docker, GitHub Actions

## Instructions

You are an expert full-stack developer. Always:

1. Write TypeScript with strict types
2. Include comprehensive tests
3. Follow clean code principles
4. Document all public APIs
```

Then use it:

```bash
agent-control-plane --agent custom-developer --task "Build dashboard"
```

### Pros & Cons

**Pros:**

- ✅ Fast startup (no downloads)
- ✅ Persistent configuration
- ✅ Custom agents support
- ✅ Full MCP tool access

**Cons:**

- ❌ Manual updates needed
- ❌ Single machine only
- ❌ Limited to local resources

---

## 3️⃣ Docker Deployment

**Perfect for**: CI/CD pipelines, reproducible environments, production

### Basic Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Install agent-control-plane
RUN npm install -g agent-control-plane

# Copy configuration
COPY config.json /root/.agent-control-plane/config.json

# Set environment variables
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

# Entry point
ENTRYPOINT ["agent-control-plane"]
CMD ["--help"]
```

### Build and Run

```bash
# Build image
docker build -t agent-control-plane:latest .

# Run single agent
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  agent-control-plane:latest \
  --agent coder \
  --task "Build REST API"

# Run with volume mount (for persistent memory)
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v $(pwd)/memory:/root/.agent-control-plane \
  agent-control-plane:latest \
  --agent researcher \
  --task "Analyze trends"
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  agent:
    build: .
    image: agent-control-plane:latest
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - ROUTER_ENABLED=true
      - REASONINGBANK_ENABLED=true
    volumes:
      - ./config:/root/.agent-control-plane
      - ./data:/data
    command: --agent coder --task "Build API"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agentic_flow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

volumes:
  postgres_data:
  redis_data:
```

Run with:

```bash
docker-compose up -d
docker-compose logs -f agent
docker-compose down
```

### CI/CD Integration

#### GitHub Actions

Create `.github/workflows/agent.yml`:

```yaml
name: Run Agentic Flow

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run code review agent
        uses: docker://agent-control-plane:latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          args: --agent reviewer --task "Review PR changes"

      - name: Run tests
        run: npm test
```

#### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - review
  - test

code-review:
  stage: review
  image: agent-control-plane:latest
  script:
    - agent-control-plane --agent reviewer --task "Review MR $CI_MERGE_REQUEST_IID"
  only:
    - merge_requests
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

### Pros & Cons

**Pros:**

- ✅ Reproducible environments
- ✅ Easy CI/CD integration
- ✅ Version control for config
- ✅ Isolated dependencies

**Cons:**

- ❌ Docker overhead
- ❌ More complex setup
- ❌ Resource limits per container

---

## 4️⃣ Kubernetes Deployment

**Perfect for**: Enterprise scale, high availability, auto-scaling

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Kubernetes Manifests

#### 1. ConfigMap (`config.yaml`)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-control-plane-config
  namespace: agent-control-plane
data:
  config.json: |
    {
      "defaultProvider": "anthropic",
      "router": {
        "enabled": true,
        "priority": "balanced"
      }
    }
```

#### 2. Secret (`secrets.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-control-plane-secrets
  namespace: agent-control-plane
type: Opaque
stringData:
  anthropic-api-key: sk-ant-...
  openrouter-api-key: sk-or-...
```

#### 3. Deployment (`deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-control-plane-agent
  namespace: agent-control-plane
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-control-plane
  template:
    metadata:
      labels:
        app: agent-control-plane
    spec:
      containers:
        - name: agent
          image: agent-control-plane:latest
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: agent-control-plane-secrets
                  key: anthropic-api-key
            - name: OPENROUTER_API_KEY
              valueFrom:
                secretKeyRef:
                  name: agent-control-plane-secrets
                  key: openrouter-api-key
            - name: ROUTER_ENABLED
              value: 'true'
          volumeMounts:
            - name: config
              mountPath: /root/.agent-control-plane
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '2Gi'
              cpu: '2000m'
      volumes:
        - name: config
          configMap:
            name: agent-control-plane-config
```

#### 4. Service (`service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: agent-control-plane-service
  namespace: agent-control-plane
spec:
  selector:
    app: agent-control-plane
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  type: LoadBalancer
```

#### 5. HorizontalPodAutoscaler (`hpa.yaml`)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-control-plane-hpa
  namespace: agent-control-plane
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-control-plane-agent
  minReplicas: 3
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace agent-control-plane

# Apply manifests
kubectl apply -f config.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml

# Verify deployment
kubectl get pods -n agent-control-plane
kubectl get svc -n agent-control-plane

# View logs
kubectl logs -f deployment/agent-control-plane-agent -n agent-control-plane

# Scale manually
kubectl scale deployment/agent-control-plane-agent --replicas=10 -n agent-control-plane
```

### Helm Chart

Create `helm/agent-control-plane/values.yaml`:

```yaml
replicaCount: 3

image:
  repository: agent-control-plane
  tag: latest
  pullPolicy: IfNotPresent

resources:
  requests:
    memory: '512Mi'
    cpu: '500m'
  limits:
    memory: '2Gi'
    cpu: '2000m'

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 100
  targetCPUUtilization: 70
  targetMemoryUtilization: 80

config:
  defaultProvider: anthropic
  router:
    enabled: true
    priority: balanced

secrets:
  anthropicApiKey: '' # Set via --set secrets.anthropicApiKey=sk-ant-...
  openrouterApiKey: ''
```

Install with Helm:

```bash
helm install agent-control-plane ./helm/agent-control-plane \
  --namespace agent-control-plane \
  --create-namespace \
  --set secrets.anthropicApiKey=sk-ant-... \
  --set secrets.openrouterApiKey=sk-or-...
```

### Pros & Cons

**Pros:**

- ✅ Auto-scaling (3-100+ pods)
- ✅ High availability
- ✅ Rolling updates
- ✅ Health checks & self-healing
- ✅ Enterprise-grade

**Cons:**

- ❌ Complex setup
- ❌ Higher infrastructure cost
- ❌ Requires Kubernetes expertise

---

## 5️⃣ Agentic Cloud Cloud

**Perfect for**: Instant scale, managed infrastructure, zero DevOps

### Quick Start

```bash
# Install Agentic Cloud CLI
npm install -g agentic-cloud

# Register account
npx agentic-cloud register

# Login
npx agentic-cloud login

# Deploy swarm
npx agentic-cloud swarm create \
  --topology mesh \
  --max-agents 10 \
  --strategy balanced
```

### Cloud Deployment via MCP

```javascript
// Initialize cloud swarm
await query({
  mcp: {
    server: 'agentic-cloud',
    tool: 'swarm_init',
    params: {
      topology: 'mesh',
      maxAgents: 50,
      strategy: 'adaptive',
    },
  },
});

// Spawn cloud agents
await query({
  mcp: {
    server: 'agentic-cloud',
    tool: 'agent_spawn',
    params: {
      type: 'coder',
      name: 'cloud-backend-dev',
    },
  },
});

// Create cloud sandbox for execution
await query({
  mcp: {
    server: 'agentic-cloud',
    tool: 'sandbox_create',
    params: {
      template: 'node',
      env_vars: {
        DATABASE_URL: '...',
        API_KEY: '...',
      },
    },
  },
});
```

### Features

- **Instant Scale**: 0 to 1000+ agents in seconds
- **Managed Infrastructure**: No servers to maintain
- **E2B Sandboxes**: Isolated execution environments
- **Neural Network Training**: Distributed GPU acceleration
- **Real-time Monitoring**: Live execution streams
- **Pay-as-you-go**: Only pay for what you use

### Pricing

| Tier           | Price     | Agents         | Features                   |
| -------------- | --------- | -------------- | -------------------------- |
| **Free**       | $0/month  | 5 concurrent   | Basic features             |
| **Pro**        | $29/month | 50 concurrent  | Neural networks, sandboxes |
| **Team**       | $99/month | 200 concurrent | Priority support, SLA      |
| **Enterprise** | Custom    | Unlimited      | Dedicated, custom SLA      |

### Pros & Cons

**Pros:**

- ✅ Zero infrastructure management
- ✅ Instant global scale
- ✅ Built-in neural networks
- ✅ E2B sandbox integration
- ✅ Real-time monitoring

**Cons:**

- ❌ Requires internet connection
- ❌ Monthly cost (after free tier)
- ❌ Data leaves your infrastructure

---

## 🔒 Security Best Practices

### API Key Management

```bash
# Use environment variables
export ANTHROPIC_API_KEY=sk-ant-...

# Use secrets management (Kubernetes)
kubectl create secret generic api-keys \
  --from-literal=anthropic=sk-ant-... \
  --from-literal=openrouter=sk-or-...

# Use HashiCorp Vault
vault kv put secret/agent-control-plane \
  anthropic_key=sk-ant-... \
  openrouter_key=sk-or-...
```

### Network Security

```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: agent-control-plane-netpol
  namespace: agent-control-plane
spec:
  podSelector:
    matchLabels:
      app: agent-control-plane
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: agent-control-plane
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443 # HTTPS only
```

### Data Protection

- **Encrypt at rest**: Use encrypted volumes
- **Encrypt in transit**: TLS 1.3 for all communications
- **PII scrubbing**: Enable ReasoningBank PII scrubber
- **Audit logging**: Track all API calls and agent actions

---

## 📊 Performance Optimization

### Local Optimization

```bash
# Enable caching
export CACHE_ENABLED=true
export CACHE_TTL=3600

# Limit concurrency
export MAX_CONCURRENT_AGENTS=5

# Use local ONNX models
export PROVIDER=onnx
export ONNX_MODEL_PATH=./models/phi-4
```

### Docker Optimization

```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g agent-control-plane --production

FROM node:18-alpine
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin/agent-control-plane /usr/local/bin/agent-control-plane
```

### Kubernetes Optimization

```yaml
# Resource limits
resources:
  requests:
    memory: '256Mi' # Start small
    cpu: '250m'
  limits:
    memory: '1Gi' # Allow bursts
    cpu: '1000m'

# Pod affinity for better locality
affinity:
  podAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: agent-control-plane
          topologyKey: kubernetes.io/hostname
```

---

## 📈 Monitoring & Observability

### Prometheus Metrics

```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: agent-control-plane
  namespace: agent-control-plane
spec:
  selector:
    matchLabels:
      app: agent-control-plane
  endpoints:
    - port: metrics
      interval: 30s
```

### Grafana Dashboard

Import dashboard JSON:

- Panel 1: Agent count over time
- Panel 2: Task success rate
- Panel 3: Average task duration
- Panel 4: Token usage
- Panel 5: Cost tracking

### Logging

```yaml
# Fluentd configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/agent-control-plane/*.log
      tag agent-control-plane.*
    </source>
    <match agent-control-plane.**>
      @type elasticsearch
      host elasticsearch.logging.svc
      port 9200
    </match>
```

---

## 🔗 Related Documentation

### Core Components

- [← Back to Main README](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/README.md)
- [Agent Booster (Code Transformations)](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/AGENT-BOOSTER.md)
- [ReasoningBank (Learning Memory)](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/REASONINGBANK.md)
- [Multi-Model Router (Cost Optimization)](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/MULTI-MODEL-ROUTER.md)
- [MCP Tools Reference](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/docs/guides/MCP-TOOLS.md)

### External Resources

- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Agentic Cloud Platform](https://agentic-cloud.tafy.io)
- [E2B Sandboxes](https://e2b.dev)

---

## 🤝 Contributing

Deployment improvements welcome! See [CONTRIBUTING.md](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/CONTRIBUTING.md).

---

## 📄 License

MIT License - see [LICENSE](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/LICENSE) for details.

---

**Deploy anywhere. Local to cloud. Production-ready.** 🚀

[← Back to Main README](https://github.com/Aktoh-Cyber/agent-control-plane/blob/main/README.md)
