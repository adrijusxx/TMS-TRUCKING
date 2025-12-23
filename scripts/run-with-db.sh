#!/bin/bash
# Helper script to load DATABASE_URL from AWS Secrets Manager and run a command
# Usage: ./scripts/run-with-db.sh <command>
# Example: ./scripts/run-with-db.sh npx prisma migrate deploy

set -e

REGION=us-east-1
export AWS_REGION=us-east-1

get_secret() {
    aws secretsmanager get-secret-value \
        --secret-id "$1" \
        --region "$REGION" \
        --query SecretString \
        --output text 2>/dev/null || echo ""
}

# Get RDS secret and build DATABASE_URL
RDS_SECRET_NAME='rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16'
RDS_SECRET_JSON=$(get_secret "$RDS_SECRET_NAME")

if [ -n "$RDS_SECRET_JSON" ]; then
    DATABASE_URL=$(node -e "
        const secret = JSON.parse(process.argv[1]);
        const encoded = encodeURIComponent(secret.password);
        console.log('postgresql://' + secret.username + ':' + encoded + '@tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com:5432/tms_database?sslmode=require');
    " "$RDS_SECRET_JSON")
    
    export DATABASE_URL
    export DATABASE_URL_MIGRATE="$DATABASE_URL"
    
    echo "✅ DATABASE_URL loaded from secrets"
    
    # Run the command passed as arguments
    exec "$@"
else
    echo "❌ Failed to load RDS secret"
    exit 1
fi

