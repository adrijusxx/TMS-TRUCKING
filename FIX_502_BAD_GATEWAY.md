# Fix: 502 Bad Gateway Error

## Problem
Getting 502 Bad Gateway when accessing `http://34.121.40.233/tms`. This means nginx can't connect to the TMS app on port 3001.

## Quick Fix Steps

### Step 1: Check if TMS is Running

```bash
pm2 list
```

**If TMS is not running or shows "errored":**
```bash
# Check logs to see why it crashed
pm2 logs tms --lines 50

# Try to restart it
pm2 restart tms --update-env

# If restart fails, delete and start fresh
pm2 delete tms
cd ~/TMS-TRUCKING
pm2 start ecosystem.config.js
```

### Step 2: Check if Port 3001 is Listening

```bash
# Check if port 3001 is in use
netstat -tlnp | grep 3001
# or
lsof -i :3001
# or
ss -tlnp | grep 3001
```

**If port 3001 is not listening:**
- The app might have crashed during startup
- Check PM2 logs for errors
- Try starting the app manually to see errors

### Step 3: Test Direct Connection

```bash
# Test if Next.js app responds directly (bypassing nginx)
curl -I http://localhost:3001/tms
# Should return 200 or 302 (not connection refused)

# If connection refused, the app isn't running
```

### Step 4: Check Build Status

```bash
cd ~/TMS-TRUCKING

# Check if .next directory exists (build completed)
ls -la .next

# If .next doesn't exist or is empty, rebuild:
npm run build

# Check for build errors
npm run build 2>&1 | tail -20
```

### Step 5: Check Environment Variables

```bash
# Verify env vars are set
cd ~/TMS-TRUCKING
grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL|NEXTAUTH_SECRET" .env

# Check PM2 env vars
pm2 env 2 | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"
```

### Step 6: Check Nginx Error Logs

```bash
# Check nginx error logs for connection errors
sudo tail -f /var/log/nginx/error.log

# Look for errors like:
# "connect() failed (111: Connection refused)"
# This means nginx can't connect to localhost:3001
```

### Step 7: Manual Start to See Errors

```bash
cd ~/TMS-TRUCKING

# Stop PM2
pm2 stop tms

# Start manually to see errors
npm start -- -p 3001

# Or with explicit env vars:
NEXT_PUBLIC_BASE_PATH=/tms NEXTAUTH_URL=http://34.121.40.233/tms npm start -- -p 3001
```

**Look for:**
- Port already in use errors
- Missing environment variables
- Build errors
- Module not found errors

### Step 8: Nuclear Option - Full Restart

```bash
cd ~/TMS-TRUCKING

# Stop TMS
pm2 stop tms
pm2 delete tms

# Clean build
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build

# Check for build errors
if [ $? -ne 0 ]; then
    echo "Build failed! Check errors above"
    exit 1
fi

# Start fresh
pm2 start ecosystem.config.js

# Check status
pm2 list
pm2 logs tms --lines 30
```

### Step 9: Verify Nginx Config

```bash
# Check nginx config points to correct port
sudo cat /etc/nginx/sites-available/crm | grep -A 5 "location.*tms"

# Should show:
# location ~ ^/tms(/.*)?$ {
#     proxy_pass http://localhost:3001;
#     ...
# }

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Common Causes

1. **App crashed during startup** - Check PM2 logs
2. **Build failed** - Rebuild the app
3. **Port conflict** - Another app using port 3001
4. **Missing env vars** - Check .env file and PM2 env
5. **Node modules issue** - Try `npm install` again
6. **Memory issue** - Check `free -h` and `pm2 logs`

## Quick Diagnostic Script

```bash
#!/bin/bash
echo "=== TMS Diagnostic ==="
echo ""
echo "1. PM2 Status:"
pm2 list | grep tms
echo ""
echo "2. Port 3001:"
netstat -tlnp | grep 3001 || echo "Port 3001 not listening"
echo ""
echo "3. Direct connection test:"
curl -I http://localhost:3001/tms 2>&1 | head -5
echo ""
echo "4. Nginx connection test:"
curl -I http://localhost/tms 2>&1 | head -5
echo ""
echo "5. PM2 Logs (last 10 lines):"
pm2 logs tms --lines 10 --nostream
echo ""
echo "6. Build directory:"
ls -la ~/TMS-TRUCKING/.next 2>&1 | head -5
```

Save as `diagnose-tms.sh`, make executable (`chmod +x diagnose-tms.sh`), and run it.

