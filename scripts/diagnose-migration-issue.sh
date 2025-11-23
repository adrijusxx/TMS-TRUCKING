#!/bin/bash
# Comprehensive migration issue diagnosis

set -e

echo "🔍 Diagnosing Migration Issue"
echo "=============================="
echo ""

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo "1️⃣ Checking environment variables..."
if [ -n "$DATABASE_URL" ]; then
    echo "   ✅ DATABASE_URL is set"
    echo "      Host: $(echo $DATABASE_URL | grep -oP '@[^/]+' | sed 's/@//')"
else
    echo "   ❌ DATABASE_URL is NOT set"
fi

if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "   ✅ DATABASE_URL_MIGRATE is set"
    echo "      Host: $(echo $DATABASE_URL_MIGRATE | grep -oP '@[^/]+' | sed 's/@//')"
else
    echo "   ⚠️  DATABASE_URL_MIGRATE is NOT set (will use DATABASE_URL)"
fi

echo ""
echo "2️⃣ Testing basic database connection..."
if [ -n "$DATABASE_URL" ]; then
    if npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ DATABASE_URL connection works"
        DB_CONNECTION_OK=true
    else
        echo "   ❌ DATABASE_URL connection FAILED"
        DB_CONNECTION_OK=false
    fi
else
    echo "   ⚠️  Cannot test - DATABASE_URL not set"
    DB_CONNECTION_OK=false
fi

echo ""
echo "3️⃣ Checking for running Prisma processes..."
PRISMA_PROCESSES=$(pgrep -f "prisma" | wc -l)
if [ "$PRISMA_PROCESSES" -gt 0 ]; then
    echo "   ⚠️  Found $PRISMA_PROCESSES Prisma process(es) running:"
    pgrep -f "prisma" | xargs ps -p
    echo "   This might cause lock conflicts"
else
    echo "   ✅ No Prisma processes running"
fi

echo ""
echo "4️⃣ Checking migration status..."
if [ "$DB_CONNECTION_OK" = true ]; then
    echo "   Checking migration status..."
    if DATABASE_URL="$DATABASE_URL" npx prisma migrate status > /tmp/migrate_status.txt 2>&1; then
        echo "   ✅ Migration status check successful"
        echo "   Status:"
        cat /tmp/migrate_status.txt | head -20
    else
        echo "   ⚠️  Migration status check had issues:"
        cat /tmp/migrate_status.txt | head -20
    fi
else
    echo "   ⚠️  Skipping - database connection not working"
fi

echo ""
echo "5️⃣ Checking Prisma configuration..."
if [ -f prisma.config.ts ]; then
    echo "   ✅ prisma.config.ts exists"
    if grep -q "DATABASE_URL_MIGRATE" prisma.config.ts; then
        echo "   ✅ Config uses DATABASE_URL_MIGRATE fallback"
    fi
else
    echo "   ⚠️  prisma.config.ts not found"
fi

echo ""
echo "6️⃣ Recommendations:"
echo ""

if [ "$DB_CONNECTION_OK" = false ]; then
    echo "   ❌ Database connection is not working"
    echo "      - Check your DATABASE_URL in .env"
    echo "      - Verify Neon project is active"
    echo "      - Check network connectivity"
fi

if [ "$PRISMA_PROCESSES" -gt 0 ]; then
    echo "   ⚠️  Prisma processes are running"
    echo "      - Wait for them to finish, or kill them:"
    echo "        pkill -f prisma"
fi

if [ -z "$DATABASE_URL_MIGRATE" ] && [ "$DB_CONNECTION_OK" = true ]; then
    echo "   💡 Try using pooler connection with increased timeout:"
    echo "      - The pooler might work if we increase timeout"
    echo "      - Or try running migration during low-traffic time"
fi

echo ""
echo "7️⃣ Try these solutions in order:"
echo ""
echo "   Option A: Use pooler with explicit timeout (if it worked before)"
echo "   ==============================================================="
echo "   DATABASE_URL=\"your-pooler-url\" npx prisma migrate deploy --skip-seed"
echo ""
echo "   Option B: Check for stale locks in database"
echo "   ============================================"
echo "   Connect to database and run:"
echo "   SELECT * FROM pg_locks WHERE locktype = 'advisory';"
echo ""
echo "   Option C: Try migration with different approach"
echo "   ================================================"
echo "   npx prisma migrate deploy --skip-generate"
echo ""

