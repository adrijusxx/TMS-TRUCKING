# FINAL FIX: Nginx API Routes Configuration

## Problem
When logging in, NextAuth redirects to `/api/auth/error` (without `/tms` prefix), and nginx returns 404 because it doesn't know which app to route to.

## Root Cause
Nginx doesn't have a catch-all for `/api/*` routes. When NextAuth generates `/api/auth/error`, nginx doesn't match it to either `/tms` or `/crm` location blocks, so it falls through to the default location (CRM) or returns 404.

## Solution: Add API Route Handling to Nginx

**Update your nginx config at `/etc/nginx/sites-available/crm` (or `default`):**

```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRM App - http://34.121.40.233/crm
    location ~ ^/crm(/.*)?$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # TMS App - http://34.121.40.233/tms
    location ~ ^/tms(/.*)?$ {
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

    # Handle /api/auth/* routes - route based on referer or cookie
    # If request comes from /tms, route to TMS; if from /crm, route to CRM
    location ~ ^/api/auth(/.*)?$ {
        # Check if request has referer or cookie indicating TMS
        set $backend "http://localhost:3000"; # Default to CRM
        
        # Check referer header
        if ($http_referer ~* "/tms") {
            set $backend "http://localhost:3001";
        }
        
        # Check if path has /tms in it (shouldn't happen but just in case)
        if ($request_uri ~* "^/tms") {
            set $backend "http://localhost:3001";
        }
        
        proxy_pass $backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Default - redirect to CRM
    location / {
        return 301 /crm;
    }
}
```

## Better Solution: Use Cookie-Based Routing

Since referer can be unreliable, use a cookie to track which app the user is in:

```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRM App
    location ~ ^/crm(/.*)?$ {
        # Set cookie to track this is CRM
        add_header Set-Cookie "app_context=crm; Path=/; Max-Age=3600" always;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # TMS App
    location ~ ^/tms(/.*)?$ {
        # Set cookie to track this is TMS
        add_header Set-Cookie "app_context=tms; Path=/; Max-Age=3600" always;
        
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

    # API routes - route based on app_context cookie
    location ~ ^/api/auth(/.*)?$ {
        set $backend "http://localhost:3000"; # Default to CRM
        
        if ($cookie_app_context = "tms") {
            set $backend "http://localhost:3001";
        }
        
        proxy_pass $backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Default
    location / {
        return 301 /crm;
    }
}
```

## Quick Fix: Route /api/auth/* to TMS by Default

If you want a quick fix, just route all `/api/auth/*` to TMS:

```nginx
# Add this BEFORE the default location block
location ~ ^/api/auth(/.*)?$ {
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
```

## Steps to Apply

1. **Backup current config:**
   ```bash
   sudo cp /etc/nginx/sites-available/crm /etc/nginx/sites-available/crm.backup
   ```

2. **Edit nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/crm
   ```

3. **Add the API route handling** (use one of the solutions above)

4. **Test nginx config:**
   ```bash
   sudo nginx -t
   ```

5. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

6. **Test:**
   ```bash
   curl -I http://localhost/api/auth/session
   ```

## Why This Happens

NextAuth generates error URLs like `/api/auth/error` without the basePath. When this URL is accessed:
- Nginx doesn't match `/tms` or `/crm` location blocks
- Falls through to default location (CRM) or returns 404
- The error route we created at `/tms/api/auth/error` never gets hit

By adding explicit handling for `/api/auth/*` routes, nginx can route them to the correct app.

