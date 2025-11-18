# Fix: 404 Error on /api/auth/session

## Problem
NextAuth client is calling `/api/auth/session` (without basePath), getting 404 HTML response instead of JSON, causing "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" error.

## Root Cause
1. NextAuth client-side calls `/api/auth/session` without `/tms` prefix
2. Nginx routes it to TMS, but Next.js expects `/tms/api/auth/session` because of basePath
3. Route doesn't match, returns 404 HTML page instead of JSON

## Solution

### Step 1: Update Nginx Config

**On your VM, edit nginx config:**
```bash
sudo nano /etc/nginx/sites-available/crm
```

**Add this location block AFTER /tms and /crm blocks, BEFORE the default location:**

```nginx
# CRITICAL: Handle /api/auth/* routes that NextAuth generates without basePath
location ~ ^/api/auth(/.*)?$ {
    # Rewrite /api/auth/* to /tms/api/auth/* so Next.js basePath works
    rewrite ^/api/auth(/.*)?$ /tms/api/auth$1 break;
    
    # Proxy to TMS - the rewritten URI will be used
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-Prefix /tms;
}
```

**Or copy the complete config:**
```bash
cd ~/TMS-TRUCKING
git pull
sudo cp ~/TMS-TRUCKING/nginx-complete-config.conf /etc/nginx/sites-available/crm
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 2: Rebuild TMS with Latest Code

```bash
cd ~/TMS-TRUCKING
git pull
npm run build
pm2 restart tms --update-env
```

### Step 3: Verify

**Test the API route directly:**
```bash
curl -I http://localhost/api/auth/session
# Should return 200 or 401 (not 404)

curl http://localhost/api/auth/session
# Should return JSON (not HTML)
```

**Test in browser:**
1. Open `http://34.121.40.233/tms/login`
2. Open DevTools > Network tab
3. Try to login
4. Check `/api/auth/session` request - should return JSON, not 404

## How It Works

1. **NextAuth client calls** `/api/auth/session` (no basePath)
2. **Nginx catches** `/api/auth/*` and rewrites to `/tms/api/auth/session`
3. **Nginx proxies** to `http://localhost:3001/tms/api/auth/session`
4. **Next.js receives** `/tms/api/auth/session` which matches the `[...nextauth]` route
5. **NextAuth handler** processes the request and returns JSON

## Alternative: Configure NextAuth Client-Side

If the nginx rewrite doesn't work, we've also updated `SessionProvider` to explicitly set basePath:

```typescript
<NextAuthSessionProvider basePath={process.env.NEXT_PUBLIC_BASE_PATH || '/tms'}>
```

This makes NextAuth client-side call `/tms/api/auth/session` directly, avoiding the need for nginx rewrite.

## Troubleshooting

### Still getting 404?
1. **Check nginx config:**
   ```bash
   sudo nginx -t
   sudo cat /etc/nginx/sites-available/crm | grep -A 10 "api/auth"
   ```

2. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log | grep "api/auth"
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Test direct connection:**
   ```bash
   curl -v http://localhost:3001/tms/api/auth/session
   # Should return JSON from Next.js directly
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs tms --lines 50
   ```

5. **Verify basePath in build:**
   ```bash
   grep -o '"basePath":"[^"]*"' ~/TMS-TRUCKING/.next/required-server-files.json
   # Should show: "basePath":"/tms"
   ```

### Still getting HTML instead of JSON?
- The route isn't matching - check that the rewrite is working
- Check that Next.js route handler exists at `app/api/auth/[...nextauth]/route.ts`
- Verify basePath is set correctly in `next.config.js`

## Files Changed

- `nginx-complete-config.conf` - Added rewrite rule for `/api/auth/*` routes
- `components/providers/SessionProvider.tsx` - Added explicit basePath prop

