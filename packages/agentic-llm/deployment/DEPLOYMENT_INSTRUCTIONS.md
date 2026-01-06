# Cloud Run GPU Deployment - Quick Start

## ✅ Setup Complete

All code is ready for deployment with:

- ✅ Email notifications to ruv@ruv.net
- ✅ Automatic benchmarking (before/after)
- ✅ HuggingFace model upload capability
- ✅ GPU optimization with NVIDIA L4

## 🚀 Deploy Now

```bash
cd /workspaces/agent-control-plane/agentic-llm

# 1. Setup secrets (run once)
./cloudrun/setup-secrets.sh

# 2. Deploy to Cloud Run
./cloudrun/deploy.sh
```

## 📊 What Happens

The deployment will automatically:

1. **Build Container** (~20 min)
   - CUDA 12.1 + PyTorch 2.2
   - All dependencies installed

2. **Deploy to Cloud Run** (~3 min)
   - NVIDIA L4 GPU instance
   - 16GB RAM, 4 vCPUs

3. **Training Pipeline** (~5-7 hours)
   - Phase 1: Baseline benchmarks (15 min)
   - Phase 2: Fine-tuning (4-6 hours)
   - Phase 3: Validation (10 min)
   - Phase 4: Post-training benchmarks (10 min)
   - Phase 5: Email results to ruv@ruv.net

## 📧 Email Notification

You'll receive an email at **ruv@ruv.net** with:

- ✅ Training duration
- ✅ Tool accuracy metrics
- ✅ Before/after comparison
- ✅ Next steps (upload to HuggingFace, deploy)

## 💾 Saving the Model

After successful training (>95% accuracy):

```bash
# SSH into Cloud Run container
gcloud run services proxy phi4-finetuning-gpu --region us-central1

# Upload to HuggingFace
python3 /app/cloudrun/upload_to_huggingface.py \
    --repo-name phi4-mcp-tools-optimized
```

Your model will be available at:
`https://huggingface.co/YOUR_USERNAME/phi4-mcp-tools-optimized`

## 📈 Monitor Progress

```bash
# Check status
SERVICE_URL=$(gcloud run services describe phi4-finetuning-gpu \
    --region us-central1 --format 'value(status.url)')

curl ${SERVICE_URL}/status

# View logs
gcloud run logs tail phi4-finetuning-gpu --region us-central1
```

## 💰 Cost

- Container build: $0.06
- Training (~6 hours): $18
- **Total: ~$18-20**

## 🛑 Stop Training

```bash
gcloud run services delete phi4-finetuning-gpu --region us-central1
```

---

**Ready to deploy?** Run `./cloudrun/deploy.sh`
