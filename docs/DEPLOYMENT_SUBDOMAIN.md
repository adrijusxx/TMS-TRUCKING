# TMS Subdomain Deployment Guide

## Overview
This guide explains how to deploy TMS on a subdomain (e.g., `tms.vaidera.eu`) instead of a subdirectory (e.g., `domain.com/tms`).

## Configuration Changes

### 1. Update `next.config.js`

The `next.config.js` file has been updated to use an empty `basePath` by default, which is required for subdomain deployment.

**Current Configuration:**
```javascript
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
```

### 2. Update `.env.local` on Your VM

SSH into your VM and update the environment variables:

```bash
ssh adrianrepair123@telegram-userbot-vm
cd ~/TMS-TRUCKING
nano .env.local
```

**Remove or set to empty:**
```bash
# For subdomain deployment (tms.vaidera.eu)
NEXT_PUBLIC_BASE_PATH=
NEXTAUTH_URL=http://tms.vaidera.eu
```

**OR completely remove these lines** if you don't want basePath at all.

### 3. Update Nginx Configuration

Make sure your Nginx configuration routes `tms.vaidera.eu` directly to the TMS app without any path prefixes.

**Example Nginx Config:**
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

**IMPORTANT:** 
- NO `basePath` in Next.js config
- NO path rewriting in Nginx
- App is served directly at root `/`

### 4. Rebuild and Restart TMS

After updating the configuration:

```bash
cd ~/TMS-TRUCKING

# Verify basePath is empty or not set
grep NEXT_PUBLIC_BASE_PATH .env.local
# Should show: NEXT_PUBLIC_BASE_PATH= (empty) or not exist

# Clean build
rm -rf .next
npm run build

# Restart with updated environment
pm2 restart tms --update-env
pm2 save

# Check status
pm2 logs tms --lines 20
```

### 5. Verify DNS Configuration

Make sure your DNS has an A record pointing to your server IP:

```
tms.vaidera.eu → 34.121.40.233
```

Check DNS propagation:
```bash
nslookup tms.vaidera.eu
# Should return: 34.121.40.233
```

### 6. Test the Deployment

Once DNS propagates:

1. **Test DNS:**
   ```bash
   nslookup tms.vaidera.eu
   ```

2. **Test in browser:**
   - `http://tms.vaidera.eu` → Should load landing page
   - `http://tms.vaidera.eu/login` → Should load login page
   - `http://tms.vaidera.eu/dashboard` → Should redirect to login if not authenticated

3. **Check Nginx logs if issues:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs tms --lines 50
   ```

## Differences: Subdirectory vs Subdomain

### Subdirectory Deployment (`domain.com/tms`)
- `NEXT_PUBLIC_BASE_PATH=/tms`
- Nginx: `location /tms { proxy_pass http://localhost:3001; }`
- All routes: `/tms/login`, `/tms/dashboard`, etc.
- Next.js adds `/tms` prefix to all routes

### Subdomain Deployment (`tms.vaidera.eu`)
- `NEXT_PUBLIC_BASE_PATH=` (empty)
- Nginx: `location / { proxy_pass http://localhost:3001; }`
- All routes: `/login`, `/dashboard`, etc. (no prefix)
- Next.js serves routes at root

## Troubleshooting

### Issue: 404 Page Not Found

**Check:**
1. Verify `NEXT_PUBLIC_BASE_PATH` is empty or not set
2. Verify Nginx config routes directly to port (no path prefix)
3. Rebuild the app after changing basePath
4. Check PM2 environment variables: `pm2 env tms`

**Fix:**
```bash
# Remove basePath from .env.local
sed -i 's/NEXT_PUBLIC_BASE_PATH=.*/NEXT_PUBLIC_BASE_PATH=/' .env.local

# Rebuild
rm -rf .next
npm run build

# Restart
pm2 restart tms --update-env
```

### Issue: Static Assets 404

**Check:**
- `assetPrefix` in `next.config.js` matches `basePath` (both empty)
- Nginx properly proxies all requests (not just `/api`)

**Fix:**
```bash
# Verify next.config.js has:
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

# Rebuild
npm run build
```

### Issue: NextAuth Redirects Not Working

**Check:**
- `NEXTAUTH_URL` matches your subdomain: `http://tms.vaidera.eu`
- No basePath in NextAuth config (handled automatically)

**Fix:**
```bash
# Update .env.local
NEXTAUTH_URL=http://tms.vaidera.eu
NEXT_PUBLIC_BASE_PATH=

# Restart
pm2 restart tms --update-env
```

## Summary

For subdomain deployment:
1. ✅ Set `NEXT_PUBLIC_BASE_PATH=` (empty) or remove it
2. ✅ Update `NEXTAUTH_URL` to subdomain URL
3. ✅ Rebuild the app: `npm run build`
4. ✅ Restart PM2: `pm2 restart tms --update-env`
5. ✅ Verify Nginx routes root path to TMS port
6. ✅ Test DNS propagation: `nslookup tms.vaidera.eu`

The landing page and all routes will now work at `tms.vaidera.eu` without any path prefix!

