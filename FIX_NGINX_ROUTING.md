# Fix Nginx Routing - Both /crm and /tms Opening CRM

## Problem
Both `http://34.121.40.233/crm` and `http://34.121.40.233/tms` are showing the CRM app.

## Root Cause
The nginx configuration likely has:
- `/tms` location proxying to wrong port (3000 instead of 3001)
- Or location blocks in wrong order
- Or missing `/tms` location block

## Solution

### Check Current Nginx Config

```bash
sudo cat /etc/nginx/sites-available/default
```

### Correct Nginx Configuration

Your nginx config should look like this:

```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRM App - http://34.121.40.233/crm
    location /crm {
        proxy_pass http://localhost:3000;  # <-- CRM on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # NO REWRITE - Let Next.js handle /crm prefix with basePath
    }

    # TMS App - http://34.121.40.233/tms
    location /tms {
        proxy_pass http://localhost:3001;  # <-- TMS on port 3001 (IMPORTANT!)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # NO REWRITE - Let Next.js handle /tms prefix with basePath
    }

    # Default - redirect to CRM
    location / {
        return 301 /crm;
    }
}
```

## Quick Fix Steps

### 1. Check Current Config
```bash
sudo grep -A 15 "location /tms" /etc/nginx/sites-available/default
```

**Look for:** `proxy_pass http://localhost:3001;` (should be 3001, not 3000)

### 2. Edit Nginx Config
```bash
sudo nano /etc/nginx/sites-available/default
```

### 3. Verify Port Numbers
- `/crm` location → `proxy_pass http://localhost:3000;` ✓
- `/tms` location → `proxy_pass http://localhost:3001;` ✓

### 4. Check PM2 Status
```bash
pm2 list
```

Should show:
```
│ 0  │ crm                │ online    │ port 3000
│ 1  │ tms                │ online    │ port 3001
```

### 5. Test Ports Directly
```bash
# Test CRM on port 3000
curl http://localhost:3000

# Test TMS on port 3001
curl http://localhost:3001
```

Both should return different content.

### 6. Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Common Issues

### Issue 1: Wrong Port in /tms Location
**Wrong:**
```nginx
location /tms {
    proxy_pass http://localhost:3000;  # ❌ Wrong port!
}
```

**Correct:**
```nginx
location /tms {
    proxy_pass http://localhost:3001;  # ✅ Correct port!
}
```

### Issue 2: Location Block Order
Make sure `/tms` comes AFTER `/crm` in the config, or use more specific matching.

### Issue 3: TMS Not Running
```bash
# Check if TMS is actually running
pm2 list
pm2 logs tms

# If not running, start it
cd ~/TMS-TRUCKING
pm2 start npm --name "tms" -- start -- -p 3001
pm2 save
```

## Verification

After fixing:
1. `http://34.121.40.233/crm` → Should show CRM
2. `http://34.121.40.233/tms` → Should show TMS login page
3. Both should work without redirect loops

