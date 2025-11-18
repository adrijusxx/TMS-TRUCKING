# Force Clean Rebuild to Fix UnknownAction Error

## Problem
Still getting `UnknownAction: Cannot parse action at /api/auth/session` even after code changes.

## Root Cause
The build cache still contains old compiled code with `basePath` in `authOptions`. We need to force a complete clean rebuild.

## Solution - Force Clean Rebuild

**Run these commands on your VM:**

```bash
cd ~/TMS-TRUCKING

# 1. Pull latest code (ensures you have the fix)
git pull

# 2. Stop TMS completely
pm2 stop tms
pm2 delete tms

# 3. Remove ALL build artifacts and caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo  # If using Turbopack
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# 4. Verify NEXTAUTH_URL is correct (CRITICAL)
echo "Checking NEXTAUTH_URL..."
grep NEXTAUTH_URL .env
# Should show: NEXTAUTH_URL="http://34.121.40.233/tms"
# If wrong, fix it:
# sed -i '/^NEXTAUTH_URL=/d' .env
# echo 'NEXTAUTH_URL="http://34.121.40.233/tms"' >> .env

# 5. Verify NEXT_PUBLIC_BASE_PATH is set
echo "Checking NEXT_PUBLIC_BASE_PATH..."
grep NEXT_PUBLIC_BASE_PATH .env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms
# If missing, add it:
# echo 'NEXT_PUBLIC_BASE_PATH=/tms' >> .env

# 6. Check for conflicting AUTH_URL variable
echo "Checking for AUTH_URL (should NOT exist)..."
grep "^AUTH_URL" .env && echo "⚠️  AUTH_URL found - remove it!" || echo "✅ No AUTH_URL found"

# 7. Rebuild from scratch
echo "Rebuilding..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above"
    exit 1
fi

# 8. Verify basePath in build
echo "Verifying basePath in build..."
grep -o '"basePath":"[^"]*"' .next/required-server-files.json
# Should show: "basePath":"/tms"

# 9. Verify authOptions doesn't have basePath (check source, not build)
echo "Verifying authOptions source code..."
grep -A 5 "export const authOptions" lib/auth.ts | grep -q "basePath:" && echo "❌ basePath found in authOptions!" || echo "✅ No basePath in authOptions"

# 10. Start TMS fresh
pm2 start ecosystem.config.js

# 11. Wait for startup
sleep 3

# 12. Check status
pm2 list
pm2 logs tms --lines 10

# 13. Test API
echo "Testing API endpoint..."
curl -v http://localhost:3001/tms/api/auth/session 2>&1 | head -20
# Should return JSON (200 or 401), NOT 400 Bad Request
```

## Quick One-Liner

```bash
cd ~/TMS-TRUCKING && git pull && pm2 stop tms && pm2 delete tms && rm -rf .next node_modules/.cache .turbo && npm run build && pm2 start ecosystem.config.js && sleep 3 && curl -v http://localhost:3001/tms/api/auth/session
```

## Verification Checklist

After rebuild, verify:

- [ ] `NEXTAUTH_URL="http://34.121.40.233/tms"` in `.env`
- [ ] `NEXT_PUBLIC_BASE_PATH=/tms` in `.env`
- [ ] No `AUTH_URL` in `.env`
- [ ] No `basePath` in `lib/auth.ts` (check source code)
- [ ] Build completed successfully
- [ ] `basePath` is `/tms` in `.next/required-server-files.json`
- [ ] TMS is running: `pm2 list | grep tms`
- [ ] API returns 200 or 401 (not 400): `curl http://localhost:3001/tms/api/auth/session`

## If Still Failing

1. **Check PM2 environment variables:**
   ```bash
   pm2 env 2 | grep -E "NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH"
   ```
   Should show both variables with correct values.

2. **Check NextAuth version:**
   ```bash
   npm list next-auth
   ```
   Should be v5.x

3. **Check if route handler exists:**
   ```bash
   ls -la app/api/auth/\[...nextauth\]/route.ts
   ```
   Should exist and export GET and POST handlers.

4. **Check build output:**
   ```bash
   ls -la .next/server/app/api/auth/
   ```
   Should show compiled route handlers.

5. **Try manual start to see errors:**
   ```bash
   pm2 stop tms
   cd ~/TMS-TRUCKING
   NEXTAUTH_URL="http://34.121.40.233/tms" NEXT_PUBLIC_BASE_PATH=/tms npm start -- -p 3001
   ```
   Look for any startup errors.

