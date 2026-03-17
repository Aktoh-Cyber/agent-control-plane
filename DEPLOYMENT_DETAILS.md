# Agent Control Plane - AWS EKS Deployment Details

## Environment: Development (dev)

### Connection Information

| Component | URL/Value |
|-----------|-----------|
| **ALB Endpoint** | http://k8s-agentcon-federati-64a0573bb0-937159901.us-west-2.elb.amazonaws.com |
| **Health Check** | http://k8s-agentcon-federati-64a0573bb0-937159901.us-west-2.elb.amazonaws.com/health |
| **WebSocket URL** | ws://k8s-agentcon-federati-64a0573bb0-937159901.us-west-2.elb.amazonaws.com |
| **AWS Region** | us-west-2 |
| **EKS Cluster** | acp-dev |
| **Kubernetes Namespace** | agent-control-plane |

### Quick Test Commands

```bash
# Health check
curl http://k8s-agentcon-federati-64a0573bb0-937159901.us-west-2.elb.amazonaws.com/health

# Expected response:
# {"status":"healthy","connectedAgents":0,"totalEpisodes":0,"tenants":0,"uptime":123.45,"timestamp":1234567890}
```

### WebSocket Connection

Connect agents to the Federation Hub using WebSocket:

```javascript
const ws = new WebSocket('ws://k8s-agentcon-federati-64a0573bb0-937159901.us-west-2.elb.amazonaws.com');

ws.onopen = () => {
  console.log('Connected to Federation Hub');
  // Register agent
  ws.send(JSON.stringify({
    type: 'register',
    agentId: 'my-agent-001',
    tenantId: 'my-tenant'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Infrastructure Details

| Resource | Value |
|----------|-------|
| **AWS Account** | 047857295772 |
| **VPC CIDR** | 10.0.0.0/16 |
| **Node Instance Type** | t3.medium |
| **Node Count** | 2 (min: 1, max: 5) |
| **EKS Version** | 1.29 |
| **AMI Type** | AL2023_x86_64_STANDARD |

### ECR Repositories

| Repository | URL |
|------------|-----|
| **federation-hub** | 047857295772.dkr.ecr.us-west-2.amazonaws.com/acp-dev/federation-hub |
| **agent** | 047857295772.dkr.ecr.us-west-2.amazonaws.com/acp-dev/agent |

### Kubernetes Resources

```bash
# View all resources
kubectl get all -n agent-control-plane

# View pods
kubectl get pods -n agent-control-plane

# View logs
kubectl logs -f deployment/federation-hub -n agent-control-plane

# View ingress
kubectl get ingress -n agent-control-plane

# Scale deployment
kubectl scale deployment federation-hub -n agent-control-plane --replicas=3
```

### Ports

| Port | Service | Protocol |
|------|---------|----------|
| 80 | ALB External | HTTP |
| 8443 | Federation Hub WebSocket | WebSocket |
| 8444 | Health Check / Stats | HTTP |

### Pulumi Management

```bash
cd infrastructure/pulumi

# Load environment
source .env

# View stack
pulumi stack

# View outputs
pulumi stack output

# Update infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

### Monitoring

```bash
# Watch pod status
kubectl get pods -n agent-control-plane -w

# View resource usage
kubectl top pods -n agent-control-plane

# View events
kubectl get events -n agent-control-plane --sort-by='.lastTimestamp'

# Port-forward for local access to stats
kubectl port-forward svc/federation-hub 8444:8444 -n agent-control-plane
# Then: curl http://localhost:8444/stats
```

### Updating the Application

```bash
# 1. Build the project
npm run build

# 2. Build Docker image
docker build --platform linux/amd64 \
  -f infrastructure/pulumi/Dockerfile.federation-hub \
  -t 047857295772.dkr.ecr.us-west-2.amazonaws.com/acp-dev/federation-hub:latest .

# 3. Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin 047857295772.dkr.ecr.us-west-2.amazonaws.com

# 4. Push to ECR
docker push 047857295772.dkr.ecr.us-west-2.amazonaws.com/acp-dev/federation-hub:latest

# 5. Restart deployment
kubectl rollout restart deployment federation-hub -n agent-control-plane
```

### EventBridge Cross-Region Integration

The Federation Hub publishes audit events to EventBridge in us-east-1 (Horsemen production) via IRSA (IAM Roles for Service Accounts).

| Component | Value |
|-----------|-------|
| **IRSA Role** | `arn:aws:iam::047857295772:role/federation-hub-eventbridge-role` |
| **K8s ServiceAccount** | `federation-hub` (namespace: agent-control-plane) |
| **Target EventBridge Bus** | `horsemen-production-horsemen-events` (us-east-1) |
| **IAM Permission** | `events:PutEvents` on the target bus |

Environment variables (via ConfigMap `federation-hub-config`):

| Variable | Value |
|----------|-------|
| `EVENTBRIDGE_ENABLED` | `true` |
| `EVENT_BUS_NAME` | `horsemen-production-horsemen-events` |
| `AWS_REGION` | `us-east-1` |

The publisher is initialized at startup in `standalone-hub.js` via `initEventBridgePublisher()` from the audit module. It's non-blocking — publish failures are logged but don't affect hub operation.

```bash
# Verify EventBridge publisher is active
kubectl logs -l app=federation-hub -n agent-control-plane | grep EventBridge

# Expected: [EventBridge] Publisher initialized, bus: horsemen-production-horsemen-events
```

### Troubleshooting

```bash
# Check pod status
kubectl describe pod -l app=federation-hub -n agent-control-plane

# Check pod logs
kubectl logs -l app=federation-hub -n agent-control-plane --tail=100

# Check ingress status
kubectl describe ingress federation-hub-ingress -n agent-control-plane

# Check service endpoints
kubectl get endpoints federation-hub -n agent-control-plane

# Verify IRSA role is attached
kubectl get sa federation-hub -n agent-control-plane -o jsonpath='{.metadata.annotations}'
```

---
*Last updated: 2026-03-17*
*Environment: dev*
*Cluster: acp-dev*
