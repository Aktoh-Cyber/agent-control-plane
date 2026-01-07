#!/bin/bash
set -euo pipefail

# ============================================================
# Pulumi S3 Backend Setup Script
# ============================================================
# This script creates the S3 bucket for Pulumi state storage
# and configures Pulumi to use it as the backend.
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Pulumi CLI installed
# ============================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_REGION="us-west-2"
BUCKET_PREFIX="pulumi-state"
PROJECT_NAME="agent-control-plane"

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Pulumi S3 Backend Setup for Agent Control Plane${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ============================================================
# Step 1: Validate AWS Profile
# ============================================================
echo -e "${YELLOW}Step 1: Validating AWS credentials...${NC}"

# Check if AWS_PROFILE is set
if [ -n "${AWS_PROFILE:-}" ]; then
    echo -e "  Using AWS Profile: ${GREEN}${AWS_PROFILE}${NC}"
else
    echo -e "  ${YELLOW}AWS_PROFILE not set, using default credentials${NC}"
fi

# Get and display current AWS identity
echo -e "\n  Fetching AWS identity..."
AWS_IDENTITY=$(aws sts get-caller-identity --output json 2>&1) || {
    echo -e "${RED}ERROR: Failed to get AWS identity. Please check your AWS credentials.${NC}"
    echo -e "${RED}Run 'aws configure' or set AWS_PROFILE environment variable.${NC}"
    exit 1
}

AWS_ACCOUNT_ID=$(echo "$AWS_IDENTITY" | jq -r '.Account')
AWS_USER_ARN=$(echo "$AWS_IDENTITY" | jq -r '.Arn')
AWS_USER_ID=$(echo "$AWS_IDENTITY" | jq -r '.UserId')

echo -e "\n  ${GREEN}AWS Identity Validated:${NC}"
echo -e "    Account ID: ${BLUE}${AWS_ACCOUNT_ID}${NC}"
echo -e "    User ARN:   ${BLUE}${AWS_USER_ARN}${NC}"
echo -e "    User ID:    ${BLUE}${AWS_USER_ID}${NC}"

# ============================================================
# Step 2: Confirm before proceeding
# ============================================================
echo ""
echo -e "${YELLOW}Step 2: Confirmation${NC}"
echo -e "  ${RED}WARNING: This script will create AWS resources.${NC}"
echo ""
read -p "  Is this the correct AWS account? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Aborted. Please set the correct AWS profile and try again.${NC}"
    echo -e "  Example: export AWS_PROFILE=your-profile-name"
    exit 1
fi

# ============================================================
# Step 3: Get region
# ============================================================
echo ""
echo -e "${YELLOW}Step 3: Select AWS Region${NC}"
read -p "  Enter AWS region [${DEFAULT_REGION}]: " REGION
REGION=${REGION:-$DEFAULT_REGION}
echo -e "  Using region: ${GREEN}${REGION}${NC}"

# ============================================================
# Step 4: Create S3 bucket for Pulumi state
# ============================================================
echo ""
echo -e "${YELLOW}Step 4: Creating S3 bucket for Pulumi state...${NC}"

BUCKET_NAME="${BUCKET_PREFIX}-${PROJECT_NAME}-${AWS_ACCOUNT_ID}"
echo -e "  Bucket name: ${BLUE}${BUCKET_NAME}${NC}"

# Check if bucket exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "  ${GREEN}Bucket already exists${NC}"
else
    echo -e "  Creating bucket..."

    # Create bucket (different command for us-east-1)
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$REGION"
    else
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi

    echo -e "  ${GREEN}Bucket created successfully${NC}"
fi

# Enable versioning
echo -e "  Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Enable server-side encryption
echo -e "  Enabling server-side encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                },
                "BucketKeyEnabled": true
            }
        ]
    }'

# Block public access
echo -e "  Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }'

# Add tags
echo -e "  Adding tags..."
aws s3api put-bucket-tagging \
    --bucket "$BUCKET_NAME" \
    --tagging "TagSet=[{Key=Project,Value=${PROJECT_NAME}},{Key=ManagedBy,Value=pulumi},{Key=Purpose,Value=pulumi-state}]"

echo -e "  ${GREEN}S3 bucket configured successfully${NC}"

# ============================================================
# Step 5: Set up Pulumi passphrase
# ============================================================
echo ""
echo -e "${YELLOW}Step 5: Configure Pulumi Passphrase${NC}"
echo -e "  Pulumi uses a passphrase to encrypt secrets in state."
echo -e "  ${RED}IMPORTANT: Save this passphrase securely!${NC}"
echo ""

if [ -z "${PULUMI_CONFIG_PASSPHRASE:-}" ]; then
    read -sp "  Enter Pulumi passphrase: " PULUMI_PASSPHRASE
    echo ""
    read -sp "  Confirm passphrase: " PULUMI_PASSPHRASE_CONFIRM
    echo ""

    if [ "$PULUMI_PASSPHRASE" != "$PULUMI_PASSPHRASE_CONFIRM" ]; then
        echo -e "${RED}ERROR: Passphrases do not match${NC}"
        exit 1
    fi

    export PULUMI_CONFIG_PASSPHRASE="$PULUMI_PASSPHRASE"
else
    echo -e "  ${GREEN}Using existing PULUMI_CONFIG_PASSPHRASE from environment${NC}"
fi

# ============================================================
# Step 6: Configure Pulumi backend
# ============================================================
echo ""
echo -e "${YELLOW}Step 6: Configuring Pulumi backend...${NC}"

BACKEND_URL="s3://${BUCKET_NAME}"
echo -e "  Backend URL: ${BLUE}${BACKEND_URL}${NC}"

cd "$(dirname "$0")/../pulumi"

# Login to S3 backend
pulumi login "$BACKEND_URL"
echo -e "  ${GREEN}Pulumi backend configured successfully${NC}"

# ============================================================
# Step 7: Initialize stacks
# ============================================================
echo ""
echo -e "${YELLOW}Step 7: Initializing Pulumi stacks...${NC}"

# Install dependencies
echo -e "  Installing dependencies..."
npm install

# Initialize dev stack if it doesn't exist
if ! pulumi stack ls 2>/dev/null | grep -q "dev"; then
    echo -e "  Creating dev stack..."
    pulumi stack init dev
fi

# Initialize prod stack if it doesn't exist
if ! pulumi stack ls 2>/dev/null | grep -q "prod"; then
    echo -e "  Creating prod stack..."
    pulumi stack init prod
fi

echo -e "  ${GREEN}Stacks initialized successfully${NC}"

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  S3 Bucket:      ${BLUE}${BUCKET_NAME}${NC}"
echo -e "  Backend URL:    ${BLUE}${BACKEND_URL}${NC}"
echo -e "  Region:         ${BLUE}${REGION}${NC}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "    1. Save your Pulumi passphrase securely"
echo -e "    2. Add to your shell profile:"
echo -e "       ${BLUE}export PULUMI_CONFIG_PASSPHRASE='your-passphrase'${NC}"
echo -e "       ${BLUE}export AWS_PROFILE='your-aws-profile'${NC}"
echo -e ""
echo -e "    3. Deploy infrastructure:"
echo -e "       ${BLUE}cd infrastructure/pulumi${NC}"
echo -e "       ${BLUE}pulumi stack select dev${NC}"
echo -e "       ${BLUE}pulumi up${NC}"
echo ""
