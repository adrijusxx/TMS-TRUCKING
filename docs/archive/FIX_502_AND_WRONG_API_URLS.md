# Fix: 502 Bad Gateway and Wrong API URLs (/tms/session instead of /tms/api/auth/session)

## Problem
1. NextAuth is calling `/tms/session` and `/tms/error` instead of `/tms/api/auth/session` and `/tms/api/auth/error`
2. Getting 502 Bad Gateway error (app may have crashed)

## Root Cause
The `basePath` prop was added to `SessionProvider`, which caused NextAuth v5 to incorrectly construct API URLs. NextAuth v5 should **auto-detect** the basePath from Next.js config, not have it manually set.

## Solution

### Step 1: Pull Latest Code and Rebuild

```bash
cd ~/TMS-TRUCKING
git pull
npm run build
pm2 restart tms --update-env
```

### Step 2: Check PM2 Status and Logs

```bash
# Check if TMS is running
pm2 list

# If it's not running or crashed, check logs
pm2 logs tms --lines 50

# If it crashed, restart it
pm2 restart tms --update-env

# Check if port 3001 is in use
netstat -tlnp | grep 3001
# or
lsof -i :3001
```

### Step 3: Verify Nginx Config

Make sure nginx is correctly routing `/tms` to `http://localhost:3001`:

```bash
sudo cat /etc/nginx/sites-available/crm | grep -A 10 "location.*tms"
```

Should show:
```nginx
location ~ ^/tms(/.*)?$ {
    proxy_pass http://localhost:3001;
    # ... proxy headers ...
}
```

### Step 4: Test Direct Connection

```bash
# Test if Next.js app is responding
curl -I http://localhost:3001/tms/api/auth/session
# Should return 200 or 401 (not 502)

# Test through nginx
curl -I http://localhost/tms/api/auth/session
# Should return 200 or 401 (not 502)
```

### Step 5: Check Environment Variables

```bash
# Verify NEXTAUTH_URL includes /tms
grep NEXTAUTH_URL ~/TMS-TRUCKING/.env
# Should show: NEXTAUTH_URL="http://34.121.40.233/tms"

# Verify NEXT_PUBLIC_BASE_PATH is set
grep NEXT_PUBLIC_BASE_PATH ~/TMS-TRUCKING/.env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms

# Check PM2 env vars
pm2 env 2 | grep -E "NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH"
```

## What Changed

**Before (WRONG):**
```typescript
<NextAuthSessionProvider basePath="/tms">
  {children}
</NextAuthSessionProvider>
```

This caused NextAuth to call:
- `/tms/session` ❌ (wrong - missing `/api/auth`)
- `/tms/error` ❌ (wrong - missing `/api/auth`)

**After (CORRECT):**
```typescript
<NextAuthSessionProvider>
  {children}
</NextAuthSessionProvider>
```

NextAuth now auto-detects basePath and calls:
- `/tms/api/auth/session` ✅ (correct)
- `/tms/api/auth/error` ✅ (correct)

## Why This Works

NextAuth v5 (Auth.js) automatically detects the basePath from:
1. **Next.js config** (`next.config.js` has `basePath: '/tms'`)
2. **NEXTAUTH_URL** environment variable (should be `http://34.121.40.233/tms`)

By removing the manual `basePath` prop, NextAuth correctly constructs URLs with the `/api/auth` prefix.

## Troubleshooting 502 Bad Gateway

If you still get 502:

1. **Check if TMS app is running:**
   ```bash
   pm2 list
   pm2 logs tms --lines 50
   ```

2. **Check if port 3001 is listening:**
   ```bash
   netstat -tlnp | grep 3001
   ```

3. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Restart everything:**
   ```bash
   pm2 restart tms --update-env
   sudo systemctl reload nginx
   ```

5. **Check if build succeeded:**
   ```bash
   cd ~/TMS-TRUCKING
   ls -la .next
   # Should show build files
   ```

## Files Changed

- `components/providers/SessionProvider.tsx` - Removed `basePath` prop to let NextAuth auto-detect

