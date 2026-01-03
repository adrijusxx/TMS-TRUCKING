#!/bin/bash
# Migration script that uses direct connection (not pooler) for Neon
# This avoids advisory lock timeout issues

set -e

# Load environment variables from .env file if it exists
# This handles quoted values properly
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo "🔍 Checking for running migrations..."
if pgrep -f "prisma migrate" > /dev/null; then
    echo "⚠️  Another migration process detected. Please wait for it to finish."
    exit 1
fi

# Determine which connection to use
if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "✅ Using direct connection (DATABASE_URL_MIGRATE) for migrations..."
    echo "   This avoids timeout issues with connection poolers."
    MIGRATE_URL="$DATABASE_URL_MIGRATE"
    
    # Check if connection string looks correct (no -pooler)
    if echo "$MIGRATE_URL" | grep -q "pooler"; then
        echo "   ⚠️  WARNING: Connection string contains 'pooler'."
        echo "   This may cause timeout issues. Use direct connection instead."
    fi
elif [ -n "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL_MIGRATE not set. Using DATABASE_URL (may timeout if using pooler)."
    echo "💡 Tip: Add DATABASE_URL_MIGRATE to .env with direct connection string (no -pooler) to avoid timeouts."
    echo "   Get it from: Neon Dashboard → Connection Details → Direct connection"
    MIGRATE_URL="$DATABASE_URL"
else
    echo "❌ Neither DATABASE_URL nor DATABASE_URL_MIGRATE is set."
    echo "   Please check your .env file."
    exit 1
fi

echo "🔗 Testing database connection..."
# Test connection (skip if it fails, but warn)
# Use --url flag because prisma.config.ts skips env var loading
if npx prisma db execute --url "$MIGRATE_URL" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection test successful"
else
    echo "⚠️  Connection test failed, but continuing anyway..."
    echo "   The migration might still work if this is a temporary network issue."
fi

echo ""
echo "📦 Running migrations with connection:"
if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "   Using: DATABASE_URL_MIGRATE (direct connection)"
else
    echo "   Using: DATABASE_URL (pooler connection)"
fi
echo ""

# Run migration with the appropriate connection
if DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy; then
    echo ""
    echo "✅ Migrations completed successfully!"
else
    echo ""
    echo "❌ Migration failed!"
    if [ -z "$DATABASE_URL_MIGRATE" ]; then
        echo ""
        echo "💡 This might be due to using a connection pooler."
        echo "   Try adding DATABASE_URL_MIGRATE to .env with a direct connection string."
        echo "   Get it from Neon Dashboard → Connection Details → Direct connection"
    fi
    exit 1
fi

