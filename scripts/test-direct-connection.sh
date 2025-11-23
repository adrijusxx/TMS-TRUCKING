#!/bin/bash
# Test direct connection string for migrations

set -e

echo "🔍 Testing direct connection strings..."
echo ""

# Load .env if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Test connection string 1 (without .c-3)
CONN1="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "📡 Testing: ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech (no .c-3)"
if DATABASE_URL="$CONN1" npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! This connection works."
    echo ""
    echo "   Add this to your .env file:"
    echo "   DATABASE_URL_MIGRATE=\"$CONN1\""
    exit 0
else
    echo "   ❌ Failed"
fi

echo ""

# Test connection string 2 (with .c-3)
CONN2="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "📡 Testing: ep-gentle-waterfall-ah0lalud.c-3.us-east-1.aws.neon.tech (with .c-3)"
if DATABASE_URL="$CONN2" npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! This connection works."
    echo ""
    echo "   Add this to your .env file:"
    echo "   DATABASE_URL_MIGRATE=\"$CONN2\""
    exit 0
else
    echo "   ❌ Failed"
fi

echo ""
echo "❌ Neither connection string worked."
echo ""
echo "📋 You need to get the EXACT 'Direct connection' string from Neon Dashboard."
echo ""
echo "   Run this command for detailed instructions:"
echo "   npm run db:get-neon-connection"
echo ""
echo "   Or go directly to:"
echo "   https://console.neon.tech → Your Project → Connection Details → Direct connection"
echo ""
echo "   Copy the ENTIRE connection string and add it to .env as DATABASE_URL_MIGRATE"

