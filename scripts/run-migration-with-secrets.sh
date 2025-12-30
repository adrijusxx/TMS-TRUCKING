#!/bin/bash
# Migration script that loads secrets from AWS Secrets Manager and runs migrations
# This ensures DATABASE_URL is set before Prisma runs

set -e

cd "$(dirname "$0")/.."

# Force us-east-1 since that's where the secrets are located
REGION=us-east-1
export AWS_REGION=us-east-1

echo "[Migration] Loading secrets from AWS Secrets Manager (region: $REGION)..."

# Function to get secret value
get_secret() {
    aws secretsmanager get-secret-value \
        --secret-id "$1" \
        --region "$REGION" \
        --query SecretString \
        --output text 2>/dev/null || echo ""
}

# Load DATABASE_URL directly from secret
DATABASE_URL_SECRET_NAME='tms/database/url'
echo "[Migration] Loading DATABASE_URL from: $DATABASE_URL_SECRET_NAME"

if DATABASE_URL=$(get_secret "$DATABASE_URL_SECRET_NAME"); then
    if [ -n "$DATABASE_URL" ]; then
        export DATABASE_URL
        export DATABASE_URL_MIGRATE="$DATABASE_URL"
        echo "[Migration] DATABASE_URL loaded successfully"
    else
        echo "[Migration] ERROR: DATABASE_URL secret is empty"
        echo "[Migration] Please create secret '$DATABASE_URL_SECRET_NAME' in AWS Secrets Manager"
        echo "[Migration] Example value: postgresql://user:pass@host:5432/dbname?sslmode=require"
        exit 1
    fi
else
    echo "[Migration] ERROR: Failed to load DATABASE_URL secret"
    echo "[Migration] Please create secret '$DATABASE_URL_SECRET_NAME' in AWS Secrets Manager"
    exit 1
fi

echo "[Migration] Starting database migration..."

# Run the migration
exec npm run db:migrate:deploy
