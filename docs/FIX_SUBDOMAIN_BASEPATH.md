# Fix: Subdomain Deployment Still Using /tms Path

## Problem
When accessing `tms.vaidera.eu`, the URL becomes `tms.vaidera.eu/tms/` and shows 404 error.

## Root Cause
1. **Hardcoded `/tms` detection in code** - The app was detecting `/tms` from the URL path and using it as basePath
2. **Environment variable still set** - `NEXT_PUBLIC_BASE_PATH=/tms` might still be set on the VM
3. **Next.js build includes basePath** - If the app was built with `basePath=/tms`, it will always redirect to `/tms/`

## Solution

### Step 1: Remove basePath from .env.local on VM

SSH into your VM:
```bash
ssh adrianrepair123@telegram-userbot-vm
cd ~/TMS-TRUCKING
nano .env.local
```

**Update to:**
```bash
# For subdomain deployment (tms.vaidera.eu) - NO basePath
NEXT_PUBLIC_BASE_PATH=
NEXTAUTH_URL=http://tms.vaidera.eu

# OR completely remove the NEXT_PUBLIC_BASE_PATH line
```

### Step 2: Clean Build and Restart

```bash
cd ~/TMS-TRUCKING

# Remove old build (critical - contains old basePath)
rm -rf .next
rm -rf node_modules/.cache

# Rebuild with empty basePath
npm run build

# Restart PM2 with updated environment
pm2 restart tms --update-env
pm2 save

# Check logs
pm2 logs tms --lines 30
```

### Step 3: Verify Nginx Configuration

Make sure Nginx routes `tms.vaidera.eu` directly to the app (not `/tms`):

```bash
sudo cat /etc/nginx/sites-available/default | grep -A 10 "server_name.*tms"
```

**Should be:**
```nginx
server {
    listen 80;
    server_name tms.vaidera.eu;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**NOT:**
```nginx
# WRONG - Don't use /tms location for subdomain
location /tms {
    proxy_pass http://localhost:3001;
}
```

### Step 4: Verify PM2 Environment Variables

```bash
pm2 env tms | grep NEXT_PUBLIC_BASE_PATH
```

**Should show:** `NEXT_PUBLIC_BASE_PATH=` (empty) or not exist

If it shows `/tms`, restart PM2:
```bash
pm2 restart tms --update-env
pm2 save
```

### Step 5: Test

1. **Clear browser cache** (Ctrl + Shift + R or incognito mode)
2. **Go to:** `http://tms.vaidera.eu`
3. **Should load:** Landing page at root `/` (not `/tms/`)

## Code Changes Made

### Fixed Hardcoded /tms Detection

**Before:**
```typescript
// Detected /tms from URL path
const basePath = window.location.pathname.startsWith('/tms') ? '/tms' : '';
```

**After:**
```typescript
// Use environment variable only (not URL path)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
```

**Files Updated:**
1. `components/layout/DashboardLayout.tsx` - Removed URL-based basePath detection
2. `app/(auth)/login/page.tsx` - Removed URL-based basePath detection

## Why This Happened

When the app detects `/tms` in the URL path, it assumes basePath is needed and redirects to `/tms/`. But on a subdomain (`tms.vaidera.eu`), there should be NO path prefix - the app should serve directly at root `/`.

## Verification Checklist

- [ ] `NEXT_PUBLIC_BASE_PATH=` is empty or removed from `.env.local`
- [ ] `NEXTAUTH_URL=http://tms.vaidera.eu` (no `/tms` suffix)
- [ ] Nginx routes `tms.vaidera.eu` directly (not `/tms`)
- [ ] `.next` folder removed and rebuilt
- [ ] PM2 restarted with `--update-env` flag
- [ ] Browser cache cleared
- [ ] `tms.vaidera.eu` loads landing page (not `/tms/`)

## Troubleshooting

### Still seeing `/tms/` in URL?

1. **Check PM2 environment:**
   ```bash
   pm2 env tms
   ```

2. **Check Next.js build:**
   ```bash
   cat .next/routes-manifest.json | grep basePath
   ```
   Should show: `"basePath": ""` (empty)

3. **Check browser console:**
   - Open DevTools → Network tab
   - See if requests are going to `/tms/*`
   - Check if there's a redirect happening

4. **Test directly on port:**
   ```bash
   curl http://localhost:3001/
   ```
   Should return HTML, not redirect to `/tms/`

### Still getting 404?

1. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check PM2 logs:**
   ```bash
   pm2 logs tms --lines 50
   ```

3. **Verify Next.js is running:**
   ```bash
   pm2 list
   pm2 info tms
   ```

## Summary

The issue was hardcoded `/tms` detection that added the prefix even on subdomains. Now the app uses only the `NEXT_PUBLIC_BASE_PATH` environment variable, which should be empty for subdomain deployment.

After updating `.env.local`, rebuilding, and restarting PM2, `tms.vaidera.eu` should work without any `/tms/` prefix!

