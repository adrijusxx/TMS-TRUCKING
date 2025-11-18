# Fix: NextAuth basePath Must Be Full API Path

## Problem
Getting `UnknownAction: Cannot parse action at /api/auth/session` even after setting `basePath` in `authOptions`.

## Root Cause
NextAuth v5 requires `basePath` to be the **full auth API path** (`/tms/api/auth`), NOT just the app basePath (`/tms`).

## Solution

### The Fix

**Before (WRONG):**
```typescript
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
```

**After (CORRECT):**
```typescript
basePath: process.env.NEXT_PUBLIC_BASE_PATH 
  ? `${process.env.NEXT_PUBLIC_BASE_PATH}/api/auth`
  : '/tms/api/auth',
```

### Deployment Steps

```bash
# 1. Pull latest code
cd ~/TMS-TRUCKING
git pull

# 2. Verify NEXT_PUBLIC_BASE_PATH is set
grep NEXT_PUBLIC_BASE_PATH .env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms

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

When Next.js has `basePath: '/tms'`:
- Routes are served at `/tms/*`
- API routes are at `/tms/api/*`
- NextAuth routes are at `/tms/api/auth/*`

NextAuth v5 needs to know the **full path to its API routes**, which is `/tms/api/auth`, not just `/tms`.

## Key Points

1. **Next.js `basePath`**: `/tms` (app basePath)
2. **NextAuth `basePath`**: `/tms/api/auth` (full auth API path)
3. These are **different** and both must be set correctly

## Files Changed

- `lib/auth.ts` - Changed `basePath` from `/tms` to `/tms/api/auth`

