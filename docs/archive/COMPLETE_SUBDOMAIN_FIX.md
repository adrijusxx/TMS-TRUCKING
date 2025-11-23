# Complete Fix: Subdomain Deployment Issue

## Problem
When accessing `tms.vaidera.eu`, the URL becomes `tms.vaidera.eu/tms/` and shows 404 error. Also, CSS/styling may not be loading correctly.

## Root Causes

1. **Hardcoded `/tms` detection in code** - Multiple places were detecting `/tms` from URL path
2. **Environment variable still set** - `NEXT_PUBLIC_BASE_PATH=/tms` on VM
3. **Build contains old basePath** - `.next` folder was built with `/tms` prefix
4. **Static assets (CSS) can't load** - If basePath is wrong, `/_next/static/...` assets fail

## Complete Fix

### Step 1: Run the Fix Script on Your VM

The fix script will:
- Update `.env.local` to remove basePath
- Clean old build completely
- Rebuild with empty basePath
- Restart PM2 with updated environment

```bash
ssh adrianrepair123@telegram-userbot-vm
cd ~/TMS-TRUCKING
chmod +x scripts/fix-subdomain-deployment.sh
./scripts/fix-subdomain-deployment.sh
```

Or run manually:

```bash
cd ~/TMS-TRUCKING

# 1. Update .env.local
sed -i 's/^NEXT_PUBLIC_BASE_PATH=.*/NEXT_PUBLIC_BASE_PATH=/' .env.local
sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://tms.vaidera.eu|' .env.local

# 2. Clean build completely
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# 3. Rebuild
npm run build

# 4. Restart PM2
pm2 restart tms --update-env
pm2 save
```

### Step 2: Verify Configuration

Run the verification script:

```bash
./scripts/verify-deployment.sh
```

Or check manually:

```bash
# Check .env.local
grep NEXT_PUBLIC_BASE_PATH .env.local
# Should show: NEXT_PUBLIC_BASE_PATH= (empty)

# Check build
cat .next/routes-manifest.json | grep basePath
# Should show: "basePath": "" (empty)

# Check PM2
pm2 env tms | grep NEXT_PUBLIC_BASE_PATH
# Should show: NEXT_PUBLIC_BASE_PATH= (empty)
```

### Step 3: Verify Nginx Configuration

Make sure Nginx routes `tms.vaidera.eu` directly (not `/tms`):

```bash
sudo cat /etc/nginx/sites-available/default | grep -A 15 "server_name.*tms"
```

Should be:
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
location /tms {  # WRONG for subdomain
    proxy_pass http://localhost:3001;
}
```

### Step 4: Test

1. **Clear browser cache** (Ctrl + Shift + R) or use incognito mode
2. **Go to:** `http://tms.vaidera.eu`
3. **Should load:** Landing page at root `/` (not `/tms/`)
4. **Check browser console:** Should NOT have CSS 404 errors

## Code Changes Made

### Fixed Hardcoded `/tms` Detection

**Files Updated:**
1. `components/providers/SessionProvider.tsx` - Removed URL-based detection
2. `lib/utils/index.ts` - Removed URL-based detection
3. `components/layout/DashboardLayout.tsx` - Removed URL-based detection
4. `app/(auth)/login/page.tsx` - Removed URL-based detection

**Before:**
```typescript
// Detected /tms from URL path
const pathname = window.location.pathname;
if (pathname.startsWith('/tms')) return '/tms';
```

**After:**
```typescript
// Use environment variable only
return process.env.NEXT_PUBLIC_BASE_PATH || '';
```

## CSS/Static Assets Issue

If CSS is not loading, it's because:
1. BasePath is wrong → static assets can't load from `/_next/static/...`
2. Build was done with `/tms` → assets try to load from `/tms/_next/static/...`
3. Nginx not routing static assets correctly

**Fix:**
1. Remove basePath (already done in code)
2. Clean rebuild (removes old asset paths)
3. Verify static assets work: `curl http://localhost:3001/_next/static/...`

## Why It Was Adding `/tms/`

The app had multiple places detecting `/tms` from the URL:
1. When you visited `tms.vaidera.eu`, somehow the URL became `tms.vaidera.eu/tms/`
2. The code detected `/tms` in the path and used it as basePath
3. This caused all links and redirects to include `/tms/` prefix
4. CSS tried to load from `/tms/_next/static/...` which doesn't exist on subdomain

Now the app only uses the environment variable, which should be empty for subdomain deployment.

## Troubleshooting

### Still seeing `/tms/` in URL?

1. **Clear browser cache** completely (or use incognito)
2. **Check build:** `cat .next/routes-manifest.json | grep basePath`
3. **Check PM2:** `pm2 env tms | grep NEXT_PUBLIC_BASE_PATH`
4. **Restart PM2:** `pm2 restart tms --update-env`

### CSS still not loading?

1. **Check browser console** for 404 errors on `/_next/static/...`
2. **Test local server:** `curl http://localhost:3001/_next/static/...`
3. **Verify build exists:** `ls -la .next/static/`
4. **Check Nginx** routing for static assets

### Still getting 404?

1. **Check Nginx logs:** `sudo tail -f /var/log/nginx/error.log`
2. **Check PM2 logs:** `pm2 logs tms --lines 50`
3. **Test directly:** `curl http://localhost:3001/`
4. **Verify DNS:** `nslookup tms.vaidera.eu` (should return server IP)

## Summary

The issue was hardcoded `/tms` detection that added the prefix even on subdomains. All code now uses only the `NEXT_PUBLIC_BASE_PATH` environment variable, which should be empty for subdomain deployment.

After updating `.env.local`, rebuilding, and restarting PM2 on your VM, `tms.vaidera.eu` should work without any `/tms/` prefix, and CSS should load correctly!

