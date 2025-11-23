# Final Fix: Remove basePath from NextAuth Config

## Problem
Still getting `UnknownAction: Cannot parse action at /api/auth/session` even after setting `basePath: '/tms/api/auth'` in `authOptions`.

## Root Cause
**NextAuth v5 should NOT have `basePath` set in `authOptions` when using Next.js `basePath`.**

Here's why:
1. Next.js strips the `basePath` (`/tms`) before passing requests to route handlers
2. NextAuth route handler receives `/api/auth/session` (NOT `/tms/api/auth/session`)
3. Setting `basePath` in `authOptions` makes NextAuth expect the basePath in the path
4. This causes a mismatch and "UnknownAction" errors

## Solution

**Remove `basePath` from `authOptions`** - NextAuth v5 will auto-detect from `NEXTAUTH_URL`.

### The Fix

**Before (WRONG):**
```typescript
basePath: process.env.NEXT_PUBLIC_BASE_PATH 
  ? `${process.env.NEXT_PUBLIC_BASE_PATH}/api/auth`
  : '/tms/api/auth',
```

**After (CORRECT):**
```typescript
// DO NOT set basePath here - NextAuth v5 auto-detects from NEXTAUTH_URL
```

### Deployment Steps

```bash
# 1. Pull latest code
cd ~/TMS-TRUCKING
git pull

# 2. Verify NEXTAUTH_URL includes basePath (CRITICAL)
grep NEXTAUTH_URL .env
# Should show: NEXTAUTH_URL="http://34.121.40.233/tms"
# NOT: NEXTAUTH_URL="http://34.121.40.233"

# 3. Clean and rebuild (CRITICAL)
rm -rf .next
npm run build

# 4. Restart TMS
pm2 restart tms --update-env

# 5. Test
curl -v http://localhost:3001/tms/api/auth/session
# Should return JSON (200 or 401), NOT 400 Bad Request
```

## Why This Works

1. **Next.js strips basePath**: When request comes to `/tms/api/auth/session`, Next.js strips `/tms` and passes `/api/auth/session` to the route handler
2. **NextAuth receives clean path**: Route handler receives `/api/auth/session` (no basePath)
3. **NextAuth auto-detects basePath**: From `NEXTAUTH_URL` environment variable (which includes `/tms`)
4. **No mismatch**: NextAuth can parse actions correctly because it receives the path it expects

## Key Configuration

**Required:**
- ✅ `NEXTAUTH_URL="http://34.121.40.233/tms"` (includes basePath)
- ✅ `trustHost: true` in `authOptions`
- ✅ `basePath: '/tms'` in `next.config.js`
- ❌ **NO `basePath` in `authOptions`**

## Files Changed

- `lib/auth.ts` - Removed `basePath` from `authOptions`

