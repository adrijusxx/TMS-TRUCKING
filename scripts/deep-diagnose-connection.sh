#!/bin/bash
# Deep diagnosis of connection issues

set -e

echo "🔍 DEEP CONNECTION DIAGNOSIS"
echo "============================"
echo ""

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo "1️⃣ Checking environment variables..."
echo "===================================="
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"
    echo "   Length: ${#DATABASE_URL} characters"
    echo "   Starts with: ${DATABASE_URL:0:30}..."
    echo "   Contains pooler: $(echo $DATABASE_URL | grep -q 'pooler' && echo 'YES' || echo 'NO')"
else
    echo "❌ DATABASE_URL is NOT set"
fi

if [ -n "$DATABASE_URL_MIGRATE" ]; then
    echo "✅ DATABASE_URL_MIGRATE is set"
    echo "   Length: ${#DATABASE_URL_MIGRATE} characters"
    echo "   Starts with: ${DATABASE_URL_MIGRATE:0:30}..."
    echo "   Contains pooler: $(echo $DATABASE_URL_MIGRATE | grep -q 'pooler' && echo 'YES' || echo 'NO')"
else
    echo "⚠️  DATABASE_URL_MIGRATE is NOT set"
fi

echo ""
echo "2️⃣ Testing network connectivity..."
echo "=================================="

# Extract hostname from DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    HOST=$(echo $DATABASE_URL | grep -oP '@[^:/]+' | sed 's/@//')
    echo "Testing connectivity to: $HOST"
    
    # Try ping (might not work but worth trying)
    if command -v ping > /dev/null 2>&1; then
        if ping -c 1 -W 2 "$HOST" > /dev/null 2>&1; then
            echo "   ✅ Host is reachable (ping)"
        else
            echo "   ⚠️  Host ping failed (might be normal - Neon blocks ICMP)"
        fi
    fi
    
    # Try telnet/nc to port 5432
    if command -v nc > /dev/null 2>&1; then
        if timeout 3 nc -z "$HOST" 5432 > /dev/null 2>&1; then
            echo "   ✅ Port 5432 is open"
        else
            echo "   ❌ Port 5432 is NOT reachable"
        fi
    elif command -v timeout > /dev/null 2>&1 && command -v bash > /dev/null 2>&1; then
        if timeout 3 bash -c "echo > /dev/tcp/$HOST/5432" 2>/dev/null; then
            echo "   ✅ Port 5432 is open"
        else
            echo "   ❌ Port 5432 is NOT reachable"
        fi
    fi
fi

echo ""
echo "3️⃣ Testing Prisma connection with verbose output..."
echo "==================================================="

if [ -n "$DATABASE_URL" ]; then
    echo "Testing DATABASE_URL..."
    echo "Command: DATABASE_URL=\"...\" npx prisma db execute --stdin <<< \"SELECT 1;\""
    
    # Try with full error output
    if DATABASE_URL="$DATABASE_URL" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1; then
        echo "   ✅ Connection successful!"
    else
        echo "   ❌ Connection failed"
        echo ""
        echo "   Full error output:"
        DATABASE_URL="$DATABASE_URL" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | head -20 || true
    fi
fi

echo ""
echo "4️⃣ Checking Prisma version and configuration..."
echo "==============================================="
echo "Prisma version:"
npx prisma --version 2>&1 || echo "   ⚠️  Could not get Prisma version"

echo ""
echo "Prisma config:"
if [ -f prisma.config.ts ]; then
    echo "   ✅ prisma.config.ts exists"
    cat prisma.config.ts | head -15
else
    echo "   ⚠️  prisma.config.ts not found"
fi

echo ""
echo "5️⃣ Testing with curl (if available)..."
echo "======================================"
if command -v curl > /dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
    HOST=$(echo $DATABASE_URL | grep -oP '@[^:/]+' | sed 's/@//')
    echo "Testing HTTPS connection to $HOST..."
    if curl -s --connect-timeout 5 "https://$HOST" > /dev/null 2>&1; then
        echo "   ✅ HTTPS connection works"
    else
        echo "   ⚠️  HTTPS connection test failed (might be normal)"
    fi
fi

echo ""
echo "6️⃣ Checking for common issues..."
echo "================================="

# Check if DATABASE_URL has special characters that might need escaping
if [ -n "$DATABASE_URL" ]; then
    if echo "$DATABASE_URL" | grep -q '[;&|`$]'; then
        echo "   ⚠️  DATABASE_URL contains special characters that might need escaping"
    fi
    
    # Check if password has special characters
    PASSWORD=$(echo $DATABASE_URL | grep -oP '://[^:]+:\K[^@]+' || echo "")
    if echo "$PASSWORD" | grep -q '[;&|`$#!]'; then
        echo "   ⚠️  Password contains special characters - might need URL encoding"
    fi
fi

echo ""
echo "7️⃣ Recommendations..."
echo "===================="
echo ""
echo "If connections are failing, try:"
echo ""
echo "1. Check Neon Dashboard:"
echo "   https://console.neon.tech"
echo "   - Is your project active (not paused)?"
echo "   - Are there any service alerts?"
echo "   - Check connection limits"
echo ""
echo "2. Verify connection string format:"
echo "   - Should start with: postgresql://"
echo "   - Should have: user:password@host/database"
echo "   - Should include: ?sslmode=require"
echo ""
echo "3. Test from Neon Dashboard:"
echo "   - Copy connection string directly from Neon"
echo "   - Use 'Test connection' button if available"
echo ""
echo "4. Check network/firewall:"
echo "   - Is VM able to reach external databases?"
echo "   - Any firewall rules blocking port 5432?"
echo ""
echo "5. Try regenerating connection string:"
echo "   - Go to Neon Dashboard"
echo "   - Regenerate connection string"
echo "   - Update .env with new string"
echo ""

