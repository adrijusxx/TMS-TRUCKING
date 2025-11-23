# Fix for Constant Refresh/Redirect Loop Issue

## Problem
When accessing the TMS app at `http://34.121.40.233/tms`, the website constantly refreshes due to a redirect loop.

## Root Cause
The nginx rewrite rule strips `/tms` from the path, but Next.js generates URLs without the prefix, causing redirect loops.

## Solution Options

### Option 1: Use basePath (Recommended)
This is the cleanest solution. Next.js will be aware of the `/tms` prefix.

**Step 1: Update your `.env` file on the VM:**
```bash
NEXT_PUBLIC_BASE_PATH=/tms
```

**Step 2: Update nginx config - REMOVE the rewrite rule:**
```nginx
# TMS App - http://34.121.40.233/tms
location /tms {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # REMOVE THIS LINE - Don't rewrite, let Next.js handle it
    # rewrite ^/tms/?(.*)$ /$1 break;
}
```

**Step 3: Restart services:**
```bash
# Restart Next.js app
pm2 restart tms-trucking

# Reload nginx
sudo nginx -t  # Test config first
sudo systemctl reload nginx
```

### Option 2: Keep rewrite, fix proxy_pass (Alternative)
If you prefer to keep the rewrite, use this nginx config:

```nginx
# TMS App - http://34.121.40.233/tms
location /tms/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Important:** Remove `NEXT_PUBLIC_BASE_PATH` from .env or set it to empty:
```bash
NEXT_PUBLIC_BASE_PATH=
```

## Quick Fix (Temporary)
If you need an immediate fix, comment out the rewrite rule in your nginx config:

```nginx
# rewrite ^/tms/?(.*)$ /$1 break;  # Commented out to fix redirect loop
```

Then restart nginx:
```bash
sudo systemctl reload nginx
```

## Verification
After applying the fix:
1. Clear your browser cache
2. Access `http://34.121.40.233/tms`
3. The page should load without constant refreshing
4. Navigation should work correctly

