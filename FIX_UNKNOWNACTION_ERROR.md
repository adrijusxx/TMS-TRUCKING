# Fix: UnknownAction Error - Cannot parse action at /api/auth/session

## Problem
Getting `UnknownAction: Cannot parse action at /api/auth/session` error. NextAuth v5 can't parse the action from the URL path.

## Root Cause
NextAuth v5 needs explicit `basePath` configuration in `authOptions` when using Next.js `basePath`. Without it, NextAuth can't correctly parse the action from URLs like `/tms/api/auth/session`.

## Solution

### Step 1: Pull Latest Code

```bash
cd ~/TMS-TRUCKING
git pull
```

### Step 2: Verify Environment Variables

```bash
# Check NEXT_PUBLIC_BASE_PATH is set
grep NEXT_PUBLIC_BASE_PATH .env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms

# Check NEXTAUTH_URL includes basePath
grep NEXTAUTH_URL .env
# Should show: NEXTAUTH_URL="http://34.121.40.233/tms"
```

### Step 3: Rebuild (CRITICAL)

```bash
# Clean build
rm -rf .next

# Rebuild
npm run build

# Check for build errors
if [ $? -ne 0 ]; then
    echo "Build failed! Fix errors above"
    exit 1
fi
```

### Step 4: Restart TMS

```bash
pm2 restart tms --update-env

# Check logs
pm2 logs tms --lines 30
```

### Step 5: Test

```bash
# Test session endpoint
curl -v http://localhost:3001/tms/api/auth/session
# Should return JSON (200 or 401), not 400 Bad Request

# Test providers endpoint
curl -v http://localhost:3001/tms/api/auth/providers
# Should return JSON with providers list
```

## What Changed

**In `lib/auth.ts`:**
```typescript
export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms', // Added explicit basePath
  // ... rest of config
};
```

**In `app/api/auth/[...nextauth]/route.ts`:**
- Improved handler exports with proper Next.js 16 typing
- Ensures handlers receive requests correctly

## Why This Works

NextAuth v5 needs to know the `basePath` to correctly parse actions from URLs. When a request comes to `/tms/api/auth/session`:
1. Next.js strips `/tms` and passes `/api/auth/session` to the route handler
2. NextAuth needs to know the basePath to construct correct callback URLs
3. Explicit `basePath` in `authOptions` ensures NextAuth can parse actions correctly

## Troubleshooting

### Still getting UnknownAction?

1. **Check basePath is in build:**
   ```bash
   grep -o '"basePath":"[^"]*"' ~/TMS-TRUCKING/.next/required-server-files.json
   # Should show: "basePath":"/tms"
   ```

2. **Check PM2 env vars:**
   ```bash
   pm2 env 2 | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"
   ```

3. **Test without basePath (temporarily):**
   ```bash
   # In next.config.js, temporarily set basePath to ''
   # Rebuild and test
   # If it works, the issue is basePath configuration
   ```

4. **Check NextAuth version:**
   ```bash
   npm list next-auth
   # Should be v5.x
   ```

### Getting 400 Bad Request?

- This usually means NextAuth can't parse the action
- Ensure `basePath` is set in both `next.config.js` and `authOptions`
- Rebuild after changing `authOptions`

## Files Changed

- `lib/auth.ts` - Added explicit `basePath` to `authOptions`
- `app/api/auth/[...nextauth]/route.ts` - Improved handler exports

