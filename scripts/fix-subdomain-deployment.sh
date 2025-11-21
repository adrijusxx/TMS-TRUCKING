#!/bin/bash

# Fix TMS Subdomain Deployment Script
# This script ensures TMS works on tms.vaidera.eu without /tms prefix

set -e  # Exit on error

echo "🔧 Fixing TMS Subdomain Deployment..."
echo ""

# Navigate to TMS directory
cd ~/TMS-TRUCKING || { echo "❌ TMS-TRUCKING directory not found!"; exit 1; }

echo "📁 Current directory: $(pwd)"
echo ""

# Step 1: Update .env.local to remove basePath
echo "1️⃣  Updating .env.local to remove basePath..."
if [ -f .env.local ]; then
    # Remove NEXT_PUBLIC_BASE_PATH line or set it to empty
    sed -i 's/^NEXT_PUBLIC_BASE_PATH=.*/NEXT_PUBLIC_BASE_PATH=/' .env.local || true
    
    # If line doesn't exist, add it
    if ! grep -q "NEXT_PUBLIC_BASE_PATH" .env.local; then
        echo "NEXT_PUBLIC_BASE_PATH=" >> .env.local
    fi
    
    # Update NEXTAUTH_URL for subdomain
    sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://tms.vaidera.eu|' .env.local || true
    
    # If NEXTAUTH_URL doesn't exist, add it
    if ! grep -q "NEXTAUTH_URL" .env.local; then
        echo "NEXTAUTH_URL=http://tms.vaidera.eu" >> .env.local
    fi
    
    echo "✅ .env.local updated"
    echo "   NEXT_PUBLIC_BASE_PATH=$(grep NEXT_PUBLIC_BASE_PATH .env.local | cut -d'=' -f2)"
    echo "   NEXTAUTH_URL=$(grep NEXTAUTH_URL .env.local | cut -d'=' -f2)"
else
    echo "⚠️  .env.local not found, creating it..."
    cat > .env.local << EOF
NEXT_PUBLIC_BASE_PATH=
NEXTAUTH_URL=http://tms.vaidera.eu
EOF
    echo "✅ Created .env.local"
fi

echo ""

# Step 2: Clean old build completely
echo "2️⃣  Cleaning old build (removes cached basePath)..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "✅ Build cache cleaned"

echo ""

# Step 3: Verify next.config.js has empty basePath fallback
echo "3️⃣  Verifying next.config.js configuration..."
if grep -q "basePath: process.env.NEXT_PUBLIC_BASE_PATH || ''" next.config.js; then
    echo "✅ next.config.js correctly configured for subdomain"
else
    echo "⚠️  next.config.js might have hardcoded /tms - checking..."
    grep -A 2 "basePath:" next.config.js || echo "   (basePath not found in next.config.js)"
fi

echo ""

# Step 4: Rebuild with clean environment
echo "4️⃣  Rebuilding TMS with empty basePath..."
export NEXT_PUBLIC_BASE_PATH=
export NEXTAUTH_URL=http://tms.vaidera.eu
npm run build

echo ""

# Step 5: Verify build has empty basePath
echo "5️⃣  Verifying build configuration..."
if [ -f .next/routes-manifest.json ]; then
    BASEPATH_IN_BUILD=$(cat .next/routes-manifest.json | grep -o '"basePath":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$BASEPATH_IN_BUILD" ] || [ "$BASEPATH_IN_BUILD" = "" ]; then
        echo "✅ Build has empty basePath (correct for subdomain)"
    else
        echo "⚠️  Build still has basePath: $BASEPATH_IN_BUILD"
        echo "   This might cause issues - try rebuilding again"
    fi
else
    echo "⚠️  routes-manifest.json not found - build might have failed"
fi

echo ""

# Step 6: Restart PM2 with updated environment
echo "6️⃣  Restarting PM2 with updated environment..."
pm2 restart tms --update-env || pm2 restart tms-trucking --update-env || {
    echo "⚠️  PM2 process 'tms' or 'tms-trucking' not found"
    echo "   Available processes:"
    pm2 list
    echo ""
    echo "   Please restart your TMS process manually with:"
    echo "   pm2 restart <process-name> --update-env"
}
pm2 save

echo ""

# Step 7: Verify PM2 environment
echo "7️⃣  Verifying PM2 environment variables..."
PM2_ENV=$(pm2 env $(pm2 jlist | grep -o '"name":"[^"]*"' | grep -i tms | head -1 | cut -d'"' -f4) 2>/dev/null || pm2 env tms 2>/dev/null || echo "")
if [ -n "$PM2_ENV" ]; then
    PM2_BASEPATH=$(echo "$PM2_ENV" | grep NEXT_PUBLIC_BASE_PATH | cut -d'=' -f2 || echo "not found")
    echo "   PM2 NEXT_PUBLIC_BASE_PATH: ${PM2_BASEPATH:-empty (good for subdomain)}"
else
    echo "   Could not check PM2 environment (this is okay)"
fi

echo ""

# Step 8: Check Nginx configuration
echo "8️⃣  Checking Nginx configuration..."
if sudo test -f /etc/nginx/sites-available/default; then
    NGINX_CONFIG=$(sudo cat /etc/nginx/sites-available/default | grep -A 10 "server_name.*tms")
    if echo "$NGINX_CONFIG" | grep -q "location / {"; then
        echo "✅ Nginx routes tms.vaidera.eu to root / (correct)"
    elif echo "$NGINX_CONFIG" | grep -q "location /tms"; then
        echo "⚠️  Nginx still has /tms location (should be / for subdomain)"
        echo "   You need to update Nginx config to route tms.vaidera.eu directly"
    else
        echo "⚠️  Could not find tms.vaidera.eu server block in Nginx"
    fi
else
    echo "⚠️  Could not check Nginx config (requires sudo)"
fi

echo ""

# Step 9: Test local server
echo "9️⃣  Testing local server..."
sleep 2  # Give PM2 time to start
if curl -s http://localhost:3001/ | head -1 | grep -q "<!DOCTYPE html\|<!doctype html"; then
    echo "✅ Local server responding at http://localhost:3001/"
else
    echo "⚠️  Local server might not be responding correctly"
    echo "   Check logs with: pm2 logs tms --lines 50"
fi

echo ""

echo "✅ Deployment fix complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Clear browser cache (Ctrl+Shift+R or incognito mode)"
echo "   2. Test: http://tms.vaidera.eu"
echo "   3. Check logs: pm2 logs tms --lines 50"
echo "   4. If still shows /tms/, verify Nginx config routes tms.vaidera.eu to root"
echo ""

