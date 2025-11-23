#!/bin/bash
# Migration script that uses direct connection (not pooler) for Neon
# This avoids advisory lock timeout issues

set -e

echo "🔍 Checking for running migrations..."
if pgrep -f "prisma migrate" > /dev/null; then
    echo "⚠️  Another migration process detected. Please wait for it to finish."
    exit 1
fi

echo "🔗 Checking database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database connection failed. Check DATABASE_URL."
    exit 1
fi

echo "📦 Running migrations..."

# Check if DATABASE_URL_MIGRATE is set (direct connection for migrations)
if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "✅ Using direct connection (DATABASE_URL_MIGRATE) for migrations..."
    DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma migrate deploy
else
    echo "⚠️  DATABASE_URL_MIGRATE not set."
    echo "⚠️  Using DATABASE_URL (may timeout if using pooler)."
    echo "💡 Tip: Set DATABASE_URL_MIGRATE to direct connection string to avoid timeouts."
    npx prisma migrate deploy
fi

echo "✅ Migrations completed successfully!"

