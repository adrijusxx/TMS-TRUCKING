#!/bin/bash
# Test database connection script

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo "🔍 Testing database connections..."
echo ""

if [ -n "$DATABASE_URL" ]; then
    echo "📡 Testing DATABASE_URL (application connection)..."
    ERROR_OUTPUT=$(DATABASE_URL="$DATABASE_URL" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1)
    if [ $? -eq 0 ]; then
        echo "   ✅ DATABASE_URL connection successful"
    else
        echo "   ❌ DATABASE_URL connection failed"
        echo "   Error details:"
        echo "$ERROR_OUTPUT" | head -10 | sed 's/^/      /'
    fi
    echo ""
else
    echo "   ⚠️  DATABASE_URL not set"
    echo ""
fi

if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "📡 Testing DATABASE_URL_MIGRATE (migration connection)..."
    ERROR_OUTPUT=$(DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1)
    if [ $? -eq 0 ]; then
        echo "   ✅ DATABASE_URL_MIGRATE connection successful"
    else
        echo "   ❌ DATABASE_URL_MIGRATE connection failed"
        echo "   Error details:"
        echo "$ERROR_OUTPUT" | head -10 | sed 's/^/      /'
    fi
    echo ""
else
    echo "   ⚠️  DATABASE_URL_MIGRATE not set"
    echo ""
fi

echo "💡 Connection strings:"
if [ -n "$DATABASE_URL" ]; then
    echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
fi
if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "   DATABASE_URL_MIGRATE: ${DATABASE_URL_MIGRATE:0:50}..."
fi

