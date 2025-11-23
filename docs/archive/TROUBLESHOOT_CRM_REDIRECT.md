# Troubleshooting CRM Redirect Loop

## Step-by-Step Debugging

### 1. Verify CRM's next.config.js has basePath

```bash
cd ~/crm-app
cat next.config.js | grep -A 2 basePath
```

**If it doesn't have basePath, add it:**

```bash
nano next.config.js
```

Add this to the config object:
```javascript
const nextConfig = {
  // ... existing config ...
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}
```

### 2. Verify .env has the variables

```bash
cd ~/crm-app
grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL" .env
```

Should show:
```
NEXT_PUBLIC_BASE_PATH=/crm
NEXTAUTH_URL=http://34.121.40.233/crm
```

### 3. Check nginx config - NO rewrite rule

```bash
sudo cat /etc/nginx/sites-available/default | grep -A 10 "location /crm"
```

**The rewrite line should be commented out or removed:**
```nginx
location /crm {
    proxy_pass http://localhost:3000;
    # ... other headers ...
    # rewrite ^/crm/?(.*)$ /$1 break;  <-- THIS SHOULD BE COMMENTED OUT
}
```

### 4. Check PM2 environment variables

```bash
pm2 env 0
```

Look for `NEXT_PUBLIC_BASE_PATH` - it should show `/crm`

### 5. Check PM2 logs for errors

```bash
pm2 logs crm --lines 50
```

Look for any errors or redirect issues.

### 6. Rebuild and restart

```bash
cd ~/crm-app

# Rebuild the app (important - basePath needs to be in build)
npm run build

# Restart with updated env
pm2 restart crm --update-env

# Check status
pm2 logs crm --lines 20
```

### 7. Test directly on port 3000

```bash
curl http://localhost:3000
```

If this works but /crm doesn't, it's an nginx issue.

### 8. Alternative: Check if CRM uses a different basePath setup

Some Next.js apps use `assetPrefix` differently. Check if there are any hardcoded redirects in:
- `middleware.ts`
- `app/page.tsx` 
- Any redirect() calls

### 9. Nuclear option - Full restart

```bash
# Stop CRM
pm2 stop crm

# Delete from PM2
pm2 delete crm

# Rebuild
cd ~/crm-app
npm run build

# Start fresh with env
pm2 start npm --name "crm" -- start -- -p 3000 --update-env
pm2 save
```

