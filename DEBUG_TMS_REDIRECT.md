# Debug TMS Redirect to CRM Issue

## Problem
Accessing `http://34.121.40.233/tms` redirects to CRM instead of showing TMS.

## Debugging Steps

### 1. Verify TMS .env has basePath

```bash
cd ~/TMS-TRUCKING
grep NEXT_PUBLIC_BASE_PATH .env
```

**Should show:** `NEXT_PUBLIC_BASE_PATH=/tms`

### 2. Check if TMS was rebuilt after adding basePath

```bash
cd ~/TMS-TRUCKING
ls -la .next
```

If `.next` folder exists, you need to rebuild:
```bash
npm run build
pm2 restart tms --update-env
```

### 3. Check TMS logs for redirects

```bash
pm2 logs tms --lines 50
```

Look for any redirect messages or errors.

### 4. Test TMS directly with basePath

```bash
# Test if TMS responds correctly on port 3001
curl -v http://localhost:3001/tms/login 2>&1 | grep -E "HTTP|Location|title"
```

### 5. Check browser network tab

Open browser DevTools → Network tab → Access `http://34.121.40.233/tms`
- Check what status codes you see (301, 302, 307?)
- Check the `Location` header in redirects
- See what the final URL is

### 6. Verify nginx is not redirecting

```bash
# Test nginx response headers
curl -I http://localhost/tms
```

Should show `200 OK`, not `301` or `302`.

### 7. Check if there's a default location catching /tms

```bash
sudo cat /etc/nginx/sites-available/crm | grep -A 5 "location /"
```

The default location should come AFTER /crm and /tms blocks.

## Most Likely Issues

### Issue 1: TMS not rebuilt after adding basePath
**Fix:**
```bash
cd ~/TMS-TRUCKING
npm run build
pm2 restart tms --update-env
```

### Issue 2: NEXT_PUBLIC_BASE_PATH not in .env
**Fix:**
```bash
cd ~/TMS-TRUCKING
echo "NEXT_PUBLIC_BASE_PATH=/tms" >> .env
npm run build
pm2 restart tms --update-env
```

### Issue 3: Browser cache
**Fix:**
- Hard refresh: `Ctrl + Shift + R`
- Or use incognito window
- Or clear browser cache completely

### Issue 4: Nginx default location catching /tms
**Fix:** Make sure location blocks are in this order:
1. `/crm` location
2. `/tms` location  
3. `/` default location (last)

