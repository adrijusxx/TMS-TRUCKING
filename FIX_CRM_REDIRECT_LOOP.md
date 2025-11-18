# Fix CRM Redirect Loop Issue

## Problem
CRM at `http://34.121.40.233/crm` keeps refreshing/redirecting constantly.

## Solution
The CRM needs the same fix as TMS - it needs to know about the `/crm` base path.

## Steps to Fix CRM

### Option 1: Add basePath to CRM's Next.js Config (Recommended)

**1. SSH into your VM and navigate to CRM directory:**
```bash
cd ~/path-to-your-crm-app
# (or wherever your CRM app is located)
```

**2. Check if CRM has a `next.config.js` file:**
```bash
ls -la next.config.js
```

**3. Edit the `next.config.js` file:**
```bash
nano next.config.js
```

**4. Add basePath configuration (similar to what we did for TMS):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your existing config ...
  
  // Add this for /crm subdirectory
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig
```

**5. Update CRM's `.env` file:**
```bash
nano .env
```

Add this line:
```env
NEXT_PUBLIC_BASE_PATH=/crm
NEXTAUTH_URL=http://34.121.40.233/crm
```

**6. Update nginx config - Remove rewrite for CRM:**
```bash
sudo nano /etc/nginx/sites-available/default
```

Find the `/crm` location block and **comment out or remove** the rewrite line:
```nginx
location /crm {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # COMMENT OUT THIS LINE:
    # rewrite ^/crm/?(.*)$ /$1 break;
}
```

**7. Restart services:**
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart CRM with PM2 (update with your CRM's PM2 name)
pm2 restart crm --update-env
# OR if it's named differently:
pm2 list  # Check the name
pm2 restart <crm-process-name> --update-env
```

### Option 2: Alternative Nginx Config (If you can't modify CRM)

If you can't modify the CRM's Next.js config, you can use this nginx config instead:

```nginx
location /crm/ {
    proxy_pass http://localhost:3000/;
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

**Note:** This uses trailing slashes which helps with path handling.

## Verify Fix

1. Clear browser cache
2. Access `http://34.121.40.233/crm`
3. The page should load without constant refreshing
4. Navigation should work correctly

## Complete Nginx Config (Both Apps Fixed)

Here's how your complete nginx config should look:

```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRM App - http://34.121.40.233/crm
    location /crm {
        proxy_pass http://localhost:3000;
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
        proxy_pass http://localhost:3001;
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

