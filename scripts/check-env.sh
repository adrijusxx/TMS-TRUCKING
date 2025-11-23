#!/bin/bash
# Check .env file for database URLs

echo "🔍 Checking .env file for database connection strings..."
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📄 Contents of .env (showing DATABASE-related lines):"
echo "=================================================="
grep -E "DATABASE_URL|DATABASE" .env | grep -v "^#" || echo "No DATABASE_URL found"
echo ""

echo "📊 Analysis:"
echo "============"

# Check DATABASE_URL
if grep -q "^DATABASE_URL=" .env; then
    DATABASE_URL_LINE=$(grep "^DATABASE_URL=" .env | head -1)
    echo "✅ DATABASE_URL found:"
    echo "   ${DATABASE_URL_LINE:0:80}..."
    if echo "$DATABASE_URL_LINE" | grep -q "pooler"; then
        echo "   ✅ Contains 'pooler' (correct for application)"
    else
        echo "   ⚠️  Does NOT contain 'pooler' (might be direct connection)"
    fi
else
    echo "❌ DATABASE_URL NOT found in .env"
fi

echo ""

# Check DATABASE_URL_MIGRATE
if grep -q "^DATABASE_URL_MIGRATE=" .env; then
    DATABASE_URL_MIGRATE_LINE=$(grep "^DATABASE_URL_MIGRATE=" .env | head -1)
    echo "✅ DATABASE_URL_MIGRATE found:"
    echo "   ${DATABASE_URL_MIGRATE_LINE:0:80}..."
    if echo "$DATABASE_URL_MIGRATE_LINE" | grep -q "pooler"; then
        echo "   ⚠️  Contains 'pooler' (should use direct connection for migrations)"
    else
        echo "   ✅ Does NOT contain 'pooler' (correct for migrations)"
    fi
else
    echo "⚠️  DATABASE_URL_MIGRATE NOT found (will use DATABASE_URL for migrations)"
fi

echo ""
echo "💡 Recommendations:"
echo "=================="

if ! grep -q "^DATABASE_URL=" .env; then
    echo "❌ Add DATABASE_URL to .env (for application connections)"
    echo "   Should have '-pooler' in hostname"
fi

if ! grep -q "^DATABASE_URL_MIGRATE=" .env; then
    echo "⚠️  Consider adding DATABASE_URL_MIGRATE (for migrations)"
    echo "   Should NOT have '-pooler' in hostname"
fi

echo ""
echo "📝 To see full .env file (be careful with sensitive data):"
echo "   cat .env | grep DATABASE"



