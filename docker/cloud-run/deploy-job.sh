#!/bin/bash
# Deploy Agentic Flow as Cloud Run Job (auto-terminates after completion)
# Usage: ./deploy-job.sh [project-id] [region] [model-config]

set -e

# Configuration
PROJECT_ID="${1:-agent-control-plane}"
REGION="${2:-us-central1}"
MODEL_CONFIG="${3:-claude}"  # claude, llama, deepseek, or custom
JOB_NAME="agent-control-plane-${MODEL_CONFIG}-job"
IMAGE_NAME="gcr.io/${PROJECT_ID}/agent-control-plane-job"

echo "🚀 Deploying Agentic Flow Cloud Run Job"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project:      ${PROJECT_ID}"
echo "Region:       ${REGION}"
echo "Model:        ${MODEL_CONFIG}"
echo "Job Name:     ${JOB_NAME}"
echo ""

# Build and push Docker image
echo "📦 Building Docker image..."
cd ../..
docker build -f docker/cloud-run/Dockerfile.job -t ${IMAGE_NAME}:latest .

echo "⬆️  Pushing to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

# Create Cloud Run Job with secrets from Secret Manager
echo "🔧 Creating Cloud Run Job..."
gcloud run jobs create ${JOB_NAME} \
  --image=${IMAGE_NAME}:latest \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --max-retries=0 \
  --task-timeout=3600 \
  --memory=2Gi \
  --cpu=2 \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,OPENROUTER_API_KEY=openrouter-api-key:latest,E2B_API_KEY=e2b-api-key:latest" \
  --set-env-vars="MODEL_CONFIG=${MODEL_CONFIG},NODE_ENV=production,CLOUD_RUN_JOB=true" \
  --execute-now=false

echo ""
echo "✅ Cloud Run Job deployed successfully!"
echo ""
echo "📝 To execute the job:"
echo "  gcloud run jobs execute ${JOB_NAME} --region=${REGION}"
echo ""
echo "📝 With custom arguments:"
echo "  gcloud run jobs execute ${JOB_NAME} \\"
echo "    --region=${REGION} \\"
echo "    --args='--agent,coder,--task,Create Python hello world'"
echo ""
echo "📝 Monitor execution:"
echo "  gcloud run jobs executions list --job=${JOB_NAME} --region=${REGION}"
echo ""
echo "🗑️  Delete job when done:"
echo "  gcloud run jobs delete ${JOB_NAME} --region=${REGION}"
