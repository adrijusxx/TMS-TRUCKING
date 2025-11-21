#!/bin/bash

# Verify TMS Subdomain Deployment Script
# Checks if TMS is correctly configured for subdomain deployment

echo "🔍 Verifying TMS Subdomain Deployment Configuration..."
echo ""

cd ~/TMS-TRUCKING || { echo "❌ TMS-TRUCKING directory not found!"; exit 1; }

# Check 1: .env.local
echo "1️⃣  Checking .env.local..."
if [ -f .env.local ]; then
    BASEPATH_ENV=$(grep "^NEXT_PUBLIC_BASE_PATH=" .env.local | cut -d'=' -f2 || echo "")
    NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" .env.local | cut -d'=' -f2 || echo "")
    
    if [ -z "$BASEPATH_ENV" ] || [ "$BASEPATH_ENV" = "" ]; then
        echo "   ✅ NEXT_PUBLIC_BASE_PATH is empty (correct)"
    else
        echo "   ❌ NEXT_PUBLIC_BASE_PATH=$BASEPATH_ENV (should be empty for subdomain)"
    fi
    
    if echo "$NEXTAUTH_URL" | grep -q "tms.vaidera.eu"; then
        echo "   ✅ NEXTAUTH_URL=$NEXTAUTH_URL (correct)"
    else
        echo "   ⚠️  NEXTAUTH_URL=$NEXTAUTH_URL (should be http://tms.vaidera.eu)"
    fi
else
    echo "   ❌ .env.local not found!"
fi

echo ""

# Check 2: next.config.js
echo "2️⃣  Checking next.config.js..."
if grep -q "basePath: process.env.NEXT_PUBLIC_BASE_PATH || ''" next.config.js; then
    echo "   ✅ basePath defaults to empty string (correct)"
else
    echo "   ⚠️  basePath might not be configured correctly"
    grep -A 1 "basePath:" next.config.js || echo "   (basePath not found)"
fi

echo ""

# Check 3: Build manifest
echo "3️⃣  Checking build manifest..."
if [ -f .next/routes-manifest.json ]; then
    BASEPATH_BUILD=$(cat .next/routes-manifest.json | grep -o '"basePath":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [ -z "$BASEPATH_BUILD" ] || [ "$BASEPATH_BUILD" = "" ]; then
        echo "   ✅ Build has empty basePath (correct)"
    else
        echo "   ❌ Build has basePath: $BASEPATH_BUILD (should be empty)"
        echo "   → Rebuild required: rm -rf .next && npm run build"
    fi
else
    echo "   ⚠️  .next/routes-manifest.json not found (build might not exist)"
fi

echo ""

# Check 4: PM2 environment
echo "4️⃣  Checking PM2 environment..."
PM2_PROCESS=$(pm2 jlist | grep -o '"name":"[^"]*"' | grep -i tms | head -1 | cut -d'"' -f4 || echo "tms")
if pm2 describe "$PM2_PROCESS" &>/dev/null; then
    PM2_STATUS=$(pm2 jlist | grep -A 10 "\"name\":\"$PM2_PROCESS\"" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Process: $PM2_PROCESS (status: $PM2_STATUS)"
    
    # Try to get environment (this might not work without sudo)
    echo "   (PM2 env check requires process restart with --update-env)"
else
    echo "   ❌ PM2 process '$PM2_PROCESS' not found"
    echo "   Available processes:"
    pm2 jlist | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/     - /'
fi

echo ""

# Check 5: Local server test
echo "5️⃣  Testing local server..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q "200"; then
    echo "   ✅ Local server responding at http://localhost:3001/"
    
    # Check if response has /tms in any links
    RESPONSE=$(curl -s http://localhost:3001/ | head -20)
    if echo "$RESPONSE" | grep -q 'href="/tms' || echo "$RESPONSE" | grep -q 'src="/tms'; then
        echo "   ⚠️  Response contains /tms in links (might indicate basePath issue)"
    else
        echo "   ✅ Response doesn't contain /tms prefix (correct)"
    fi
else
    echo "   ❌ Local server not responding or returning error"
fi

echo ""

# Check 6: Nginx config (if accessible)
echo "6️⃣  Checking Nginx configuration..."
if sudo test -f /etc/nginx/sites-available/default; then
    if sudo grep -q "server_name.*tms.vaidera.eu" /etc/nginx/sites-available/default; then
        NGINX_BLOCK=$(sudo grep -A 15 "server_name.*tms.vaidera.eu" /etc/nginx/sites-available/default)
        if echo "$NGINX_BLOCK" | grep -q "location / {"; then
            echo "   ✅ Nginx routes tms.vaidera.eu to root / (correct)"
        else
            echo "   ⚠️  Nginx might be routing to /tms (should route to /)"
        fi
    else
        echo "   ⚠️  No server block for tms.vaidera.eu found in Nginx"
    fi
else
    echo "   ⚠️  Cannot check Nginx config (requires sudo)"
fi

echo ""

# Check 7: Static assets path
echo "7️⃣  Checking static assets..."
if [ -d .next/static ]; then
    echo "   ✅ .next/static directory exists"
    # Check if _next/static is being referenced correctly
    if [ -f .next/routes-manifest.json ]; then
        ASSET_PREFIX=$(cat .next/routes-manifest.json | grep -o '"assetPrefix":"[^"]*"' | cut -d'"' -f4 || echo "")
        if [ -z "$ASSET_PREFIX" ] || [ "$ASSET_PREFIX" = "" ]; then
            echo "   ✅ assetPrefix is empty (correct for subdomain)"
        else
            echo "   ⚠️  assetPrefix=$ASSET_PREFIX (should be empty for subdomain)"
        fi
    fi
else
    echo "   ⚠️  .next/static directory not found (build might be incomplete)"
fi

echo ""

echo "✅ Verification complete!"
echo ""
echo "📋 Summary:"
echo "   If any checks show ❌ or ⚠️, review the recommendations above"
echo "   Run ./scripts/fix-subdomain-deployment.sh to fix issues"
echo ""

