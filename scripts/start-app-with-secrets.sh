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

# Load RDS secret and build DATABASE_URL
RDS_SECRET_NAME='rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16'
echo "[Startup] Loading RDS secret: $RDS_SECRET_NAME"

if RDS_SECRET_JSON=$(get_secret "$RDS_SECRET_NAME"); then
    if [ -n "$RDS_SECRET_JSON" ]; then
        # RDS endpoint configuration
        RDS_ENDPOINT="tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com"
        RDS_PORT="5432"
        RDS_DBNAME="tms_database"
        
        # Use Node.js to parse JSON and build connection string
        DATABASE_URL=$(node -e "
            const secret = JSON.parse(process.argv[1]);
            const endpoint = process.argv[2];
            const port = process.argv[3] || '5432';
            const dbname = process.argv[4] || 'tms_database';
            const encoded = encodeURIComponent(secret.password);
            console.log('postgresql://' + secret.username + ':' + encoded + '@' + endpoint + ':' + port + '/' + dbname + '?sslmode=require');
        " "$RDS_SECRET_JSON" "$RDS_ENDPOINT" "$RDS_PORT" "$RDS_DBNAME")
        
        export DATABASE_URL
        export DATABASE_URL_MIGRATE="$DATABASE_URL"
        echo "[Startup] DATABASE_URL loaded successfully"
    else
        echo "[Startup] ERROR: RDS secret is empty"
        exit 1
    fi
else
    echo "[Startup] ERROR: Failed to load RDS secret"
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

if [ "$1" ]; then
  exec "$@"
else
  exec npm start -- -p 3001
fi

