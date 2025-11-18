# Fix 404 Errors for Next.js Static Assets

## Problem
Getting 404 errors for Next.js static chunks like:
- `/tms/_next/static/chunks/01a23bfe2c3218a7.js`
- `/tms/_next/static/chunks/21ca62cdad5bceaa.js`

## Root Cause
When using `basePath` in Next.js, static assets are generated with the basePath prefix. Nginx needs to properly proxy these requests to Next.js.

## Solution

### Step 1: Update Nginx Configuration

The Nginx config needs to handle `/_next/static` paths BEFORE the general location blocks. Use the updated config in `nginx-fixed-static-assets.conf`.

**On your VM, run:**
```bash
# Backup current config
sudo cp /etc/nginx/sites-available/crm /etc/nginx/sites-available/crm.backup

# Copy the new config
sudo nano /etc/nginx/sites-available/crm
# Paste the contents from nginx-fixed-static-assets.conf

# Test the config
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 2: Ensure Clean Build

The build must be done with `basePath` set. On your VM:

```bash
cd ~/TMS-TRUCKING

# Verify .env has basePath
grep NEXT_PUBLIC_BASE_PATH .env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms

# Clean build (removes old chunks)
rm -rf .next

# Rebuild with basePath
npm run build

# Restart PM2 with updated env
pm2 restart tms --update-env

# Check logs
pm2 logs tms --lines 20
```

### Step 3: Verify Static Assets

Test if static assets are accessible:

```bash
# Test directly on Next.js port
curl -I http://localhost:3001/tms/_next/static/chunks/webpack.js

# Test through Nginx
curl -I http://34.121.40.233/tms/_next/static/chunks/webpack.js
```

Both should return 200 OK.

### Step 4: Clear Browser Cache

The browser might have cached old chunk references. Clear cache or use incognito mode.

## Alternative: Check if Build Directory Exists

If static assets still fail, verify the build output:

```bash
cd ~/TMS-TRUCKING
ls -la .next/static/chunks/ | head -10
```

If the directory is empty or missing, the build didn't complete successfully.

## Troubleshooting

### If 404 persists after Nginx update:

1. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check if Next.js is serving the files:**
   ```bash
   curl http://localhost:3001/tms/_next/static/chunks/webpack.js
   ```
   If this fails, Next.js isn't configured correctly.

3. **Verify basePath in build:**
   ```bash
   cd ~/TMS-TRUCKING
   cat .next/routes-manifest.json | grep basePath
   ```
   Should show `"basePath": "/tms"`

4. **Check PM2 environment:**
   ```bash
   pm2 env tms | grep NEXT_PUBLIC_BASE_PATH
   ```
   Should show `/tms`

