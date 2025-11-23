# Fix: "No response from authentication server"

## Problem
Getting "No response from authentication server" error when trying to log in. This means `signIn()` is returning `null` or `undefined`.

## Root Causes

1. **NextAuth API route not responding** - `/tms/api/auth/[...nextauth]` route handler not working
2. **Missing NEXTAUTH_SECRET** - Required for NextAuth to work
3. **NextAuth route handler error** - Server-side error in auth handler
4. **Network/CORS issue** - Client can't reach NextAuth API

## Quick Diagnostic Steps

### Step 1: Test NextAuth API Route

```bash
# Test session endpoint directly
curl -v http://localhost:3001/tms/api/auth/session
# Should return JSON (200 or 401), not 404 or 500

# Test through nginx
curl -v http://localhost/tms/api/auth/session
# Should return JSON (200 or 401), not 404 or 500

# Test credentials endpoint (POST)
curl -X POST http://localhost:3001/tms/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Should return JSON response
```

### Step 2: Check NEXTAUTH_SECRET

```bash
cd ~/TMS-TRUCKING

# Check if NEXTAUTH_SECRET is set in .env
grep NEXTAUTH_SECRET .env
# Should show: NEXTAUTH_SECRET=some-secret-value

# Check PM2 env vars
pm2 env 2 | grep NEXTAUTH_SECRET
# Should show the secret value

# If missing, generate one:
openssl rand -base64 32
# Add to .env: NEXTAUTH_SECRET=<generated-value>
```

### Step 3: Check PM2 Logs for Errors

```bash
pm2 logs tms --lines 50

# Look for:
# - "NEXTAUTH_SECRET is missing"
# - Route handler errors
# - Database connection errors
# - Any stack traces
```

### Step 4: Verify NextAuth Route Handler

```bash
# Check if route file exists
ls -la ~/TMS-TRUCKING/app/api/auth/\[...nextauth\]/route.ts

# Should exist and export GET and POST handlers
```

### Step 5: Check Browser Console

Open browser DevTools > Console and look for:
- Network errors when calling `/api/auth/session`
- CORS errors
- 404/500 errors on NextAuth endpoints

## Solutions

### Solution 1: Ensure NEXTAUTH_SECRET is Set

```bash
cd ~/TMS-TRUCKING

# Generate secret if missing
if ! grep -q "NEXTAUTH_SECRET" .env; then
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
    echo "✅ Added NEXTAUTH_SECRET to .env"
fi

# Verify it's set
grep NEXTAUTH_SECRET .env

# Restart PM2 to load new env var
pm2 restart tms --update-env
```

### Solution 2: Rebuild and Restart

```bash
cd ~/TMS-TRUCKING

# Pull latest code (includes improved error handling)
git pull

# Rebuild
npm run build

# Restart
pm2 restart tms --update-env

# Check logs
pm2 logs tms --lines 30
```

### Solution 3: Test NextAuth Route Handler

```bash
# Test the route handler directly
curl -X GET http://localhost:3001/tms/api/auth/providers
# Should return JSON with providers list

curl -X GET http://localhost:3001/tms/api/auth/session
# Should return JSON with session (or null if not logged in)
```

### Solution 4: Check Nginx Config for API Routes

```bash
# Verify nginx routes /api/auth/* correctly
sudo cat /etc/nginx/sites-available/crm | grep -A 10 "api/auth"

# Should have:
# location ~ ^/api/auth(/.*)?$ {
#     rewrite ^/api/auth(/.*)?$ /tms/api/auth$1 break;
#     proxy_pass http://localhost:3001;
#     ...
# }
```

### Solution 5: Verify Environment Variables

```bash
cd ~/TMS-TRUCKING

# Check all required env vars
cat .env | grep -E "NEXTAUTH_SECRET|NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH"

# Should show:
# NEXTAUTH_SECRET=<some-secret>
# NEXTAUTH_URL=http://34.121.40.233/tms
# NEXT_PUBLIC_BASE_PATH=/tms

# Check PM2 has them
pm2 env 2 | grep -E "NEXTAUTH_SECRET|NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH"
```

## Common Issues

### Issue 1: NEXTAUTH_SECRET Missing
**Symptom:** NextAuth returns null, logs show "NEXTAUTH_SECRET is missing"
**Fix:** Generate and add to .env, restart PM2

### Issue 2: Route Handler Not Exported
**Symptom:** 404 on `/api/auth/*` routes
**Fix:** Check `app/api/auth/[...nextauth]/route.ts` exports GET and POST

### Issue 3: Database Connection Error
**Symptom:** NextAuth can't verify credentials, returns null
**Fix:** Check database connection, verify Prisma client is working

### Issue 4: Nginx Not Routing API Calls
**Symptom:** 404 on `/api/auth/*` through nginx
**Fix:** Add nginx location block for `/api/auth/*` routes

## Testing After Fix

1. **Test API endpoint:**
   ```bash
   curl http://localhost:3001/tms/api/auth/session
   # Should return JSON
   ```

2. **Test login in browser:**
   - Open `http://34.121.40.233/tms/login`
   - Open DevTools > Network tab
   - Try to login
   - Check `/api/auth/callback/credentials` request
   - Should return 200 with redirect

3. **Check browser console:**
   - Should not see "No response from authentication server"
   - Should see successful login or specific error message

## Files Changed

- `app/(auth)/login/page.tsx` - Added NextAuth API connectivity check before sign in
- Improved error messages to help diagnose the issue

