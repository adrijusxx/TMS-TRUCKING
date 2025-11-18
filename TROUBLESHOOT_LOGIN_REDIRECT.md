# Troubleshoot Login Redirect to CRM Issue

## Problem
After logging into TMS at `/tms`, it redirects to CRM instead of staying in TMS.

## Step-by-Step Troubleshooting

### 1. Verify Code Changes Were Pulled and Built

```bash
cd ~/TMS-TRUCKING

# Check if you have the latest code
git log --oneline -5

# Should see: "Fix login redirect to respect basePath for TMS/CRM subdirectories"

# If not, pull:
git pull

# Rebuild (CRITICAL - basePath is baked into the build)
npm run build

# Restart with updated env
pm2 restart tms --update-env
```

### 2. Check Environment Variables

```bash
cd ~/TMS-TRUCKING

# Check .env file
cat .env | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"

# Should show:
# NEXT_PUBLIC_BASE_PATH=/tms
# NEXTAUTH_URL="http://34.121.40.233/tms"

# Check PM2 environment (what the app actually sees)
pm2 env 1 | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"
```

### 3. Test Direct Port Access

```bash
# Test TMS directly on port 3001
curl -s http://localhost:3001/tms/login | grep -o "<title>.*</title>"

# Should show: <title>TMS Login</title>

# Test after login simulation (check redirect)
curl -I http://localhost:3001/tms/dashboard
```

### 4. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for:
   - Any JavaScript errors
   - What URL it's redirecting to
   - Check `window.location.href` value

### 5. Add Debug Logging (Temporary)

Add this to the login page to see what's happening:

```typescript
if (result?.ok) {
  const params = new URLSearchParams(window.location.search);
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  console.log('DEBUG:', {
    callbackUrl,
    basePath,
    currentUrl: window.location.href,
    envBasePath: process.env.NEXT_PUBLIC_BASE_PATH
  });
  
  const fullPath = callbackUrl.startsWith(basePath) 
    ? callbackUrl 
    : `${basePath}${callbackUrl}`;
  
  console.log('DEBUG: Redirecting to:', fullPath);
  window.location.href = fullPath;
}
```

### 6. Check NextAuth Configuration

The issue might be in NextAuth's `baseUrl`. Check if `NEXTAUTH_URL` is being used correctly:

```bash
# Verify NEXTAUTH_URL in .env
grep NEXTAUTH_URL ~/TMS-TRUCKING/.env
```

### 7. Check Nginx Logs

```bash
# Check nginx access logs for redirects
sudo tail -f /var/log/nginx/access.log | grep -E "/tms|/crm"

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 8. Test Cookie Domain

The session cookie might be shared between CRM and TMS. Check:

```bash
# In browser DevTools > Application > Cookies
# Check if cookies are set for the correct domain/path
```

### 9. Verify Next.js basePath in Build

```bash
cd ~/TMS-TRUCKING

# Check if basePath is in the build
grep -r "basePath" .next/static/chunks/ | head -5

# Or check the build output
npm run build 2>&1 | grep -i basepath
```

### 10. Nuclear Option - Full Rebuild

```bash
cd ~/TMS-TRUCKING

# Stop TMS
pm2 stop tms

# Clean build
rm -rf .next
rm -rf node_modules/.cache

# Reinstall (if needed)
# npm install

# Rebuild
npm run build

# Start with fresh env
pm2 restart tms --update-env

# Check logs
pm2 logs tms --lines 50
```

## Common Issues

### Issue 1: basePath Not in Build
**Symptom:** `process.env.NEXT_PUBLIC_BASE_PATH` is empty in browser
**Fix:** Rebuild after adding to .env

### Issue 2: Wrong NEXTAUTH_URL
**Symptom:** NextAuth redirects to wrong domain
**Fix:** Ensure `NEXTAUTH_URL=http://34.121.40.233/tms` (with /tms)

### Issue 3: Cookie Path Conflict
**Symptom:** Session cookie from CRM interfering
**Fix:** Clear browser cookies for the domain

### Issue 4: Cached Build
**Symptom:** Old build still running
**Fix:** Delete `.next` folder and rebuild

## Quick Test Script

Run this to verify everything:

```bash
#!/bin/bash
cd ~/TMS-TRUCKING

echo "=== Checking Environment ==="
grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL" .env

echo -e "\n=== Checking PM2 Env ==="
pm2 env 1 | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"

echo -e "\n=== Testing Direct Port ==="
curl -s http://localhost:3001/tms/login | grep -o "<title>.*</title>"

echo -e "\n=== Testing Through Nginx ==="
curl -s http://localhost/tms/login | grep -o "<title>.*</title>"

echo -e "\n=== PM2 Status ==="
pm2 list
```

