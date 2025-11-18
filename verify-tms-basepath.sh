#!/bin/bash
# Verification script for TMS basePath configuration
# Run this after rebuilding to verify basePath is correctly set

cd ~/TMS-TRUCKING || exit 1

echo "=== TMS BasePath Verification ==="
echo ""

echo "1. Checking next.config.js..."
if grep -q "basePath:.*'/tms'" next.config.js; then
    echo "   ✅ basePath fallback is set to '/tms'"
else
    echo "   ❌ basePath fallback is NOT set to '/tms'"
    echo "   Expected: basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms'"
fi

echo ""
echo "2. Checking .env file..."
if grep -q "NEXT_PUBLIC_BASE_PATH=/tms" .env; then
    echo "   ✅ NEXT_PUBLIC_BASE_PATH=/tms found in .env"
else
    echo "   ⚠️  NEXT_PUBLIC_BASE_PATH not found in .env (will use fallback)"
fi

if grep -q "NEXTAUTH_URL.*tms" .env; then
    echo "   ✅ NEXTAUTH_URL includes /tms"
else
    echo "   ⚠️  NEXTAUTH_URL might not include /tms"
fi

echo ""
echo "3. Checking build output..."
if [ -f ".next/required-server-files.json" ]; then
    BASEPATH_IN_BUILD=$(grep -o '"basePath":"[^"]*"' .next/required-server-files.json | head -1)
    if echo "$BASEPATH_IN_BUILD" | grep -q '"/tms"'; then
        echo "   ✅ Build has basePath set to '/tms': $BASEPATH_IN_BUILD"
    elif echo "$BASEPATH_IN_BUILD" | grep -q '""'; then
        echo "   ❌ Build has empty basePath: $BASEPATH_IN_BUILD"
        echo "   ⚠️  You need to rebuild: npm run build"
    else
        echo "   ⚠️  Build has basePath: $BASEPATH_IN_BUILD"
    fi
else
    echo "   ⚠️  Build not found. Run: npm run build"
fi

echo ""
echo "4. Checking PM2 environment..."
PM2_ENV=$(pm2 env 2 2>/dev/null | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL" || echo "")
if [ -n "$PM2_ENV" ]; then
    echo "   PM2 environment variables:"
    echo "$PM2_ENV" | sed 's/^/      /'
else
    echo "   ⚠️  PM2 environment variables not found"
    echo "   Make sure PM2 is using ecosystem.config.js"
fi

echo ""
echo "5. Testing direct port access..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/tms 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ TMS responds on port 3001/tms (HTTP $HTTP_CODE)"
else
    echo "   ❌ TMS not responding correctly (HTTP $HTTP_CODE)"
fi

echo ""
echo "6. Testing through Nginx..."
HTTP_CODE_NGINX=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/tms 2>/dev/null)
if [ "$HTTP_CODE_NGINX" = "200" ] || [ "$HTTP_CODE_NGINX" = "307" ] || [ "$HTTP_CODE_NGINX" = "301" ]; then
    echo "   ✅ TMS responds through Nginx (HTTP $HTTP_CODE_NGINX)"
else
    echo "   ❌ TMS not responding through Nginx (HTTP $HTTP_CODE_NGINX)"
fi

echo ""
echo "=== Summary ==="
echo "If basePath is not '/tms' in the build, you MUST:"
echo "  1. Ensure next.config.js has: basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms'"
echo "  2. Run: npm run build"
echo "  3. Run: pm2 restart tms"
echo ""

