#!/bin/bash
# Migration script that loads secrets from AWS Secrets Manager and runs migrations
# This ensures DATABASE_URL is set before Prisma runs

set -e

cd "$(dirname "$0")/.."

# Force us-east-1 since that's where the RDS secret is located
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

# Load RDS secret and build DATABASE_URL
RDS_SECRET_NAME='rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16'
# echo "[Migration] Loading RDS secret: $RDS_SECRET_NAME"

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
        echo "[Migration] DATABASE_URL loaded"
    else
        echo "[Migration] ERROR: RDS secret is empty"
        exit 1
    fi
else
    echo "[Migration] ERROR: Failed to load RDS secret"
    exit 1
fi

echo "[Migration] Starting database migration..."

# Run the migration
exec npm run db:migrate:deploy
