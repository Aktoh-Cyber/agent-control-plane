# Environment Configuration Guide

## Quick Setup

### 1. Generate Encryption Keys

```bash
# Run the key generation script
node scripts/generate-hipaa-keys.js

# Or manually generate keys
node -e "console.log('HIPAA_MASTER_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('HIPAA_KEK=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment

#### Development (.env.development)

```bash
# HIPAA Encryption Keys (Development ONLY - DO NOT use in production)
HIPAA_MASTER_KEY=your_generated_master_key_here
HIPAA_KEK=your_generated_kek_here

# Key storage location
KEY_STORAGE_PATH=./.keys

# Rotation policy (milliseconds)
KEY_MAX_AGE=7776000000  # 90 days
KEY_GRACE_PERIOD=604800000  # 7 days
KEY_AUTO_ROTATE=false
```

#### Production (.env.production - use secrets manager instead)

```bash
# DO NOT store production keys in .env files
# Use AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault

# For secrets manager configuration:
SECRETS_MANAGER=aws  # or 'vault', 'azure'
SECRETS_REGION=us-east-1
SECRETS_KEY_ID=hipaa-master-key
SECRETS_KEK_ID=hipaa-kek
```

### 3. Add to .gitignore

Ensure your `.gitignore` includes:

```
# Environment files
.env
.env.*
!.env.example

# Key storage
.keys/
*.key
*.pem

# Security sensitive
secrets/
credentials/
```

## Environment Variable Reference

### Required Variables

| Variable           | Description                         | Example     | Required |
| ------------------ | ----------------------------------- | ----------- | -------- |
| `HIPAA_MASTER_KEY` | Master encryption key (256-bit hex) | `a1b2c3...` | Yes      |
| `HIPAA_KEK`        | Key Encryption Key for key storage  | `d4e5f6...` | Yes\*    |

\* Required if using key storage features

### Optional Variables

| Variable           | Description                         | Default                | Example                 |
| ------------------ | ----------------------------------- | ---------------------- | ----------------------- |
| `KEY_STORAGE_PATH` | Directory for encrypted key storage | `./.keys`              | `/var/keys`             |
| `KEY_MAX_AGE`      | Maximum key age in milliseconds     | `7776000000` (90 days) | `2592000000` (30 days)  |
| `KEY_GRACE_PERIOD` | Grace period for old keys (ms)      | `604800000` (7 days)   | `86400000` (1 day)      |
| `KEY_AUTO_ROTATE`  | Enable automatic key rotation       | `false`                | `true`                  |
| `SECRETS_MANAGER`  | Secrets manager type                | -                      | `aws`, `vault`, `azure` |
| `SECRETS_REGION`   | Secrets manager region              | -                      | `us-east-1`             |
| `SECRETS_KEY_ID`   | Secret ID for master key            | -                      | `prod/hipaa/master`     |
| `SECRETS_KEK_ID`   | Secret ID for KEK                   | -                      | `prod/hipaa/kek`        |

## Secrets Manager Integration

### AWS Secrets Manager

```typescript
// config/secrets/aws.ts
import { SecretsManager } from 'aws-sdk';

export async function loadKeys() {
  const client = new SecretsManager({
    region: process.env.SECRETS_REGION || 'us-east-1',
  });

  const masterKeySecret = await client
    .getSecretValue({
      SecretId: process.env.SECRETS_KEY_ID || 'hipaa-master-key',
    })
    .promise();

  const kekSecret = await client
    .getSecretValue({
      SecretId: process.env.SECRETS_KEK_ID || 'hipaa-kek',
    })
    .promise();

  return {
    masterKey: JSON.parse(masterKeySecret.SecretString!).key,
    kek: JSON.parse(kekSecret.SecretString!).key,
  };
}
```

**Setup AWS Secrets:**

```bash
# Create master key secret
aws secretsmanager create-secret \
  --name hipaa-master-key \
  --description "HIPAA encryption master key" \
  --secret-string '{"key":"'$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")'"}'

# Create KEK secret
aws secretsmanager create-secret \
  --name hipaa-kek \
  --description "HIPAA key encryption key" \
  --secret-string '{"key":"'$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")'"}'

# Enable automatic rotation (90 days)
aws secretsmanager rotate-secret \
  --secret-id hipaa-master-key \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation-function \
  --rotation-rules AutomaticallyAfterDays=90
```

### HashiCorp Vault

```typescript
// config/secrets/vault.ts
import vault from 'node-vault';

export async function loadKeys() {
  const client = vault({
    endpoint: process.env.VAULT_ADDR || 'https://vault.example.com',
    token: process.env.VAULT_TOKEN,
  });

  const masterKeyPath = process.env.SECRETS_KEY_ID || 'secret/hipaa/master-key';
  const kekPath = process.env.SECRETS_KEK_ID || 'secret/hipaa/kek';

  const masterKeySecret = await client.read(masterKeyPath);
  const kekSecret = await client.read(kekPath);

  return {
    masterKey: masterKeySecret.data.data.key,
    kek: kekSecret.data.data.key,
  };
}
```

**Setup Vault Secrets:**

```bash
# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Store master key
vault kv put secret/hipaa/master-key \
  key=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Store KEK
vault kv put secret/hipaa/kek \
  key=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create policy
vault policy write hipaa-encryption - <<EOF
path "secret/data/hipaa/*" {
  capabilities = ["read"]
}
EOF

# Create token with policy
vault token create -policy=hipaa-encryption
```

### Azure Key Vault

```typescript
// config/secrets/azure.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export async function loadKeys() {
  const vaultUrl = process.env.AZURE_VAULT_URL || 'https://your-vault.vault.azure.net';
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  const masterKeyName = process.env.SECRETS_KEY_ID || 'hipaa-master-key';
  const kekName = process.env.SECRETS_KEK_ID || 'hipaa-kek';

  const masterKeySecret = await client.getSecret(masterKeyName);
  const kekSecret = await client.getSecret(kekName);

  return {
    masterKey: masterKeySecret.value!,
    kek: kekSecret.value!,
  };
}
```

**Setup Azure Key Vault:**

```bash
# Create Key Vault
az keyvault create \
  --name your-hipaa-vault \
  --resource-group your-resource-group \
  --location eastus

# Store master key
az keyvault secret set \
  --vault-name your-hipaa-vault \
  --name hipaa-master-key \
  --value $(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Store KEK
az keyvault secret set \
  --vault-name your-hipaa-vault \
  --name hipaa-kek \
  --value $(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set access policy
az keyvault set-policy \
  --name your-hipaa-vault \
  --object-id <your-app-object-id> \
  --secret-permissions get list
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Don't include .env files in image
# Keys will be provided via environment variables or secrets

# Create key storage directory
RUN mkdir -p .keys && chmod 700 .keys

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - HIPAA_MASTER_KEY=${HIPAA_MASTER_KEY}
      - HIPAA_KEK=${HIPAA_KEK}
    volumes:
      - ./.keys:/app/.keys
    env_file:
      - .env.development
```

### Docker Compose (Production with Secrets)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - SECRETS_MANAGER=aws
      - SECRETS_REGION=us-east-1
      - SECRETS_KEY_ID=hipaa-master-key
      - SECRETS_KEK_ID=hipaa-kek
    secrets:
      - aws_credentials
    volumes:
      - key_storage:/app/.keys

secrets:
  aws_credentials:
    external: true

volumes:
  key_storage:
    driver: local
```

## Kubernetes Configuration

### Secret Creation

```bash
# Generate keys
MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
KEK=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create Kubernetes secret
kubectl create secret generic hipaa-keys \
  --from-literal=master-key=$MASTER_KEY \
  --from-literal=kek=$KEK \
  --namespace production

# Or from file
kubectl create secret generic hipaa-keys \
  --from-file=master-key=./master-key.txt \
  --from-file=kek=./kek.txt \
  --namespace production
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hipaa-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hipaa-app
  template:
    metadata:
      labels:
        app: hipaa-app
    spec:
      containers:
        - name: app
          image: your-registry/hipaa-app:latest
          env:
            - name: HIPAA_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  name: hipaa-keys
                  key: master-key
            - name: HIPAA_KEK
              valueFrom:
                secretKeyRef:
                  name: hipaa-keys
                  key: kek
            - name: NODE_ENV
              value: production
          volumeMounts:
            - name: key-storage
              mountPath: /app/.keys
      volumes:
        - name: key-storage
          persistentVolumeClaim:
            claimName: key-storage-pvc
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy
        env:
          SECRETS_MANAGER: aws
          SECRETS_REGION: us-east-1
          SECRETS_KEY_ID: hipaa-master-key
          SECRETS_KEK_ID: hipaa-kek
        run: |
          npm install
          npm run build
          npm run deploy
```

## Validation

### Test Environment Configuration

```bash
# Run environment validation script
node scripts/validate-env.js

# Or manually test
node -e "
  const { HIPAAEncryption } = require('./dist/security/hipaa-encryption');
  try {
    const enc = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
    const test = enc.encrypt('test');
    const result = enc.decrypt(test);
    console.log(result === 'test' ? '✅ Configuration valid' : '❌ Configuration invalid');
    enc.destroy();
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
  }
"
```

## Troubleshooting

### "HIPAA_MASTER_KEY environment variable not set"

```bash
# Check if variable is set
echo $HIPAA_MASTER_KEY

# Set temporarily
export HIPAA_MASTER_KEY=<your-key>

# Set permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export HIPAA_MASTER_KEY=<your-key>' >> ~/.bashrc
```

### "Master key must be 32 bytes"

```bash
# Regenerate key with correct length
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verify key length
node -e "console.log(Buffer.from(process.env.HIPAA_MASTER_KEY, 'hex').length)"
# Should output: 32
```

### "KEK (Key Encryption Key) not found"

```bash
# Set KEK environment variable
export HIPAA_KEK=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

## Security Best Practices

1. **Never commit keys to version control**
   - Add `.env*` to `.gitignore`
   - Use secrets managers in production
   - Scan commits for leaked secrets

2. **Rotate keys regularly**
   - Set up automatic rotation (90 days)
   - Test rotation procedure
   - Keep old keys during grace period

3. **Separate environments**
   - Use different keys for dev/staging/prod
   - Never use production keys in development
   - Restrict access to production keys

4. **Audit access**
   - Log all key access
   - Monitor for anomalies
   - Review access regularly

5. **Backup keys securely**
   - Encrypt backups
   - Store offline
   - Test recovery procedure

## Next Steps

1. Generate keys: `node scripts/generate-hipaa-keys.js`
2. Configure environment: Copy keys to `.env` or secrets manager
3. Validate setup: `node scripts/validate-env.js`
4. Run tests: `npm test tests/security/`
5. Review security audit: See `SECURITY_AUDIT.md`
