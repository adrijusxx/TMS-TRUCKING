#!/bin/bash
# Startup script that loads secrets from AWS Secrets Manager and starts Next.js
# This ensures DATABASE_URL is set before Prisma Client is initialized

set -e

cd "$(dirname "$0")/.."

# Force us-east-1 since that's where the secrets are located
REGION=us-east-1
export AWS_REGION=us-east-1

echo "[Startup] Loading secrets from AWS Secrets Manager (region: $REGION)..."

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
echo "[Startup] Loading DATABASE_URL from: $DATABASE_URL_SECRET_NAME"

if DATABASE_URL=$(get_secret "$DATABASE_URL_SECRET_NAME"); then
    if [ -n "$DATABASE_URL" ]; then
        export DATABASE_URL
        export DATABASE_URL_MIGRATE="$DATABASE_URL"
        echo "[Startup] DATABASE_URL loaded successfully"
    else
        echo "[Startup] ERROR: DATABASE_URL secret is empty"
        echo "[Startup] Please create secret '$DATABASE_URL_SECRET_NAME' in AWS Secrets Manager"
        echo "[Startup] Example value: postgresql://user:pass@host:5432/dbname?sslmode=require"
        exit 1
    fi
else
    echo "[Startup] ERROR: Failed to load DATABASE_URL secret"
    echo "[Startup] Please create secret '$DATABASE_URL_SECRET_NAME' in AWS Secrets Manager"
    exit 1
fi

# Load other secrets
load_secret() {
    local secret_name=$1
    local env_var=$2
    local value=$(get_secret "$secret_name")
    if [ -n "$value" ]; then
        export "$env_var=$value"
        echo "[Startup] $env_var loaded"
    else
        echo "[Startup] WARNING: Failed to load $secret_name"
    fi
}

load_secret "tms/nextauth/secret" "NEXTAUTH_SECRET"
load_secret "tms/nextauth/url" "NEXTAUTH_URL"
load_secret "tms/integrations/google/maps-api-key" "GOOGLE_MAPS_API_KEY"
load_secret "tms/integrations/google/maps-public-api-key" "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
load_secret "tms/integrations/openai/api-key" "OPENAI_API_KEY"
load_secret "tms/integrations/samsara/api-key" "SAMSARA_API_KEY"
load_secret "tms/integrations/samsara/webhook-secret" "SAMSARA_WEBHOOK_SECRET"

# New keys for Telegram, Google Places, and Samsara Stats
load_secret "tms/integrations/telegram/api-id" "TELEGRAM_API_ID"
load_secret "tms/integrations/telegram/api-hash" "TELEGRAM_API_HASH"
load_secret "tms/integrations/telegram/encryption-key" "TELEGRAM_SESSION_ENCRYPTION_KEY"
load_secret "tms/integrations/google/maps-places-api-key" "GOOGLE_PLACES_API_KEY"
load_secret "tms/integrations/samsara/stats-enabled" "SAMSARA_STATS_ENABLED"
load_secret "tms/integrations/samsara/camera-enabled" "SAMSARA_CAMERA_MEDIA_ENABLED"
load_secret "tms/integrations/samsara/trips-enabled" "SAMSARA_TRIPS_ENABLED"

# CRITICAL: Trust host header from ALB proxy - fixes CSRF errors with NextAuth v5
export AUTH_TRUST_HOST=true

# CRITICAL: For pre-built apps, we need to ensure NEXT_PUBLIC vars are available
# This is a workaround since the app was built without these variables
echo "[Startup] Ensuring NEXT_PUBLIC variables are available..."
export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"

echo "[Startup] All secrets loaded"
echo "[Startup] NEXTAUTH_URL=$NEXTAUTH_URL"
echo "[Startup] AUTH_TRUST_HOST=true"
echo "[Startup] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:0:20}..."
echo "[Startup] Starting Next.js on port 3001..."

# Start Next.js with all environment variables
exec npm start -- -p 3001

