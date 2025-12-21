#!/bin/bash
# Setup both DATABASE_URL and DATABASE_URL_MIGRATE

set -e

echo "🔧 Setting up database connection strings..."
echo ""

# Your working pooler connection
# ⚠️ SECURITY: Replace [YOUR_DATABASE_PASSWORD] with actual password from Neon console
POOLER_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Direct connection options (for migrations)
# ⚠️ SECURITY: Replace [YOUR_DATABASE_PASSWORD] with actual password from Neon console
DIRECT_URL1="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL2="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "📝 Current .env setup:"
echo "===================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check current DATABASE_URL
if grep -q "^DATABASE_URL=" .env; then
    echo "✅ DATABASE_URL is set"
    CURRENT_DB=$(grep "^DATABASE_URL=" .env | head -1)
    echo "   Current: ${CURRENT_DB:0:80}..."
else
    echo "❌ DATABASE_URL is NOT set"
    echo "   Will add: $POOLER_URL"
fi

# Check current DATABASE_URL_MIGRATE
if grep -q "^DATABASE_URL_MIGRATE=" .env; then
    echo "✅ DATABASE_URL_MIGRATE is set"
    CURRENT_MIGRATE=$(grep "^DATABASE_URL_MIGRATE=" .env | head -1)
    echo "   Current: ${CURRENT_MIGRATE:0:80}..."
else
    echo "⚠️  DATABASE_URL_MIGRATE is NOT set"
fi

echo ""
echo "🧪 Testing direct connection options..."
echo "======================================"

# Test direct connection 1
echo "Testing: ep-gentle-waterfall-ah0lalud.c-3.us-east-1.aws.neon.tech"
if npx prisma db execute --url "$DIRECT_URL1" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! This direct connection works."
    WORKING_DIRECT="$DIRECT_URL1"
else
    echo "   ❌ Failed"
fi

# Test direct connection 2
if [ -z "$WORKING_DIRECT" ]; then
    echo "Testing: ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech"
    if npx prisma db execute --url "$DIRECT_URL2" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ SUCCESS! This direct connection works."
        WORKING_DIRECT="$DIRECT_URL2"
    else
        echo "   ❌ Failed"
    fi
fi

echo ""
echo "📋 Recommended .env configuration:"
echo "================================="
echo ""
echo "DATABASE_URL=\"$POOLER_URL\""
echo ""

if [ -n "$WORKING_DIRECT" ]; then
    echo "DATABASE_URL_MIGRATE=\"$WORKING_DIRECT\""
    echo ""
    echo "✅ Found working direct connection!"
    echo "   Copy the DATABASE_URL_MIGRATE line above to your .env file"
else
    echo "DATABASE_URL_MIGRATE=\"<get-from-neon-dashboard>\""
    echo ""
    echo "⚠️  Neither direct connection option worked."
    echo "   You need to get the exact direct connection string from Neon Dashboard:"
    echo "   https://console.neon.tech → Your Project → Connection Details → Direct connection"
fi

echo ""
echo "💡 To update .env:"
echo "   1. nano .env"
echo "   2. Make sure DATABASE_URL is set (with pooler)"
echo "   3. Add DATABASE_URL_MIGRATE (direct connection, no pooler)"
echo "   4. Save: Ctrl+X, Y, Enter"
echo "   5. Test: npm run db:test-connection"
echo "   6. Migrate: npm run db:migrate:deploy"

