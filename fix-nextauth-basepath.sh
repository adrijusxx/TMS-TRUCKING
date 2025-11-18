#!/bin/bash

# Fix NextAuth basePath Configuration
# This script ensures all configuration is correct and rebuilds the app

set -e

echo "🔧 Fixing NextAuth basePath Configuration"
echo ""

cd ~/TMS-TRUCKING || exit 1

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull

# 2. Verify NEXTAUTH_URL includes /tms
echo ""
echo "🔍 Checking NEXTAUTH_URL..."
if grep -q 'NEXTAUTH_URL.*tms' .env; then
    echo "   ✅ NEXTAUTH_URL includes /tms"
    grep NEXTAUTH_URL .env
else
    echo "   ⚠️  NEXTAUTH_URL might not include /tms"
    echo "   Current value:"
    grep NEXTAUTH_URL .env || echo "   NEXTAUTH_URL not found in .env"
    echo ""
    echo "   Fixing NEXTAUTH_URL..."
    # Remove old NEXTAUTH_URL if exists
    sed -i '/^NEXTAUTH_URL=/d' .env
    # Add correct one
    echo 'NEXTAUTH_URL="http://34.121.40.233/tms"' >> .env
    echo "   ✅ Added NEXTAUTH_URL=\"http://34.121.40.233/tms\" to .env"
fi

# 3. Verify NEXT_PUBLIC_BASE_PATH
echo ""
echo "🔍 Checking NEXT_PUBLIC_BASE_PATH..."
if grep -q 'NEXT_PUBLIC_BASE_PATH=/tms' .env; then
    echo "   ✅ NEXT_PUBLIC_BASE_PATH is set to /tms"
else
    echo "   ⚠️  NEXT_PUBLIC_BASE_PATH might not be set correctly"
    grep NEXT_PUBLIC_BASE_PATH .env || echo "   NEXT_PUBLIC_BASE_PATH not found in .env"
    echo ""
    echo "   Fixing NEXT_PUBLIC_BASE_PATH..."
    sed -i '/^NEXT_PUBLIC_BASE_PATH=/d' .env
    echo 'NEXT_PUBLIC_BASE_PATH=/tms' >> .env
    echo "   ✅ Added NEXT_PUBLIC_BASE_PATH=/tms to .env"
fi

# 4. Clean build
echo ""
echo "🧹 Cleaning build..."
rm -rf .next
rm -rf node_modules/.cache
echo "   ✅ Cleaned .next and cache"

# 5. Rebuild
echo ""
echo "🔨 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
    echo "   ❌ Build failed!"
    exit 1
fi

echo "   ✅ Build successful"

# 6. Verify basePath in build
echo ""
echo "🔍 Verifying basePath in build..."
if grep -q '"basePath":"/tms"' .next/required-server-files.json 2>/dev/null; then
    echo "   ✅ basePath is correctly set in build"
else
    echo "   ⚠️  basePath might not be in build"
fi

# 7. Restart PM2
echo ""
echo "🔄 Restarting TMS..."
pm2 restart tms --update-env

# 8. Wait a moment for startup
sleep 2

# 9. Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list | grep tms

# 10. Test API endpoint
echo ""
echo "🧪 Testing API endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/tms/api/auth/session || echo "000")

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo "   ✅ API endpoint responding correctly (HTTP $RESPONSE)"
else
    echo "   ⚠️  API endpoint returned HTTP $RESPONSE"
    echo "   Check logs: pm2 logs tms --lines 30"
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: pm2 logs tms --lines 30"
echo "2. Test in browser: http://34.121.40.233/tms/login"
echo "3. If still having issues, check:"
echo "   - NEXTAUTH_SECRET is set: grep NEXTAUTH_SECRET .env"
echo "   - PM2 env vars: pm2 env 2 | grep -E 'NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH'"

