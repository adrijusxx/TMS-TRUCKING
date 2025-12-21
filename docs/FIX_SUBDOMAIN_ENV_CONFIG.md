# Fix Subdomain Configuration for .env File

## Quick Fix for tms.vaidera.eu and alogix.info

Since you're using **subdomains** (not subdirectory), your `.env` file needs:

```env
# NO basePath for subdomain deployment
NEXT_PUBLIC_BASE_PATH=

# NEXTAUTH_URL should be your subdomain (no /tms path)
NEXTAUTH_URL="https://tms.vaidera.eu"

# Database connection
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth secret
NEXTAUTH_SECRET="your-secret-here"
```

---

## Step-by-Step Fix

### 1. SSH into VM

```bash
ssh adrianrepair123@130.211.211.214
cd ~/tms
```

### 2. Update .env File

```bash
nano .env
```

**Set these values:**

```env
# Remove or set to empty for subdomain
NEXT_PUBLIC_BASE_PATH=

# Use HTTPS subdomain (no /tms path)
NEXTAUTH_URL="https://tms.vaidera.eu"

# Your database connection
DATABASE_URL="postgresql://neondb_owner:YOUR_NEW_PASSWORD@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Your NextAuth secret
NEXTAUTH_SECRET="V92FqABTUDD7BJdUKDaPCWAuY7ATVIxKc2/nCus+eQA="
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### 3. Clean Build (CRITICAL - removes old basePath from build)

```bash
# Remove old build that might have /tms basePath
rm -rf .next
rm -rf node_modules/.cache

# Rebuild with empty basePath
npm run build
```

### 4. Restart PM2

```bash
# Restart with updated environment
pm2 restart tms --update-env

# Or if not running, start it
pm2 start ecosystem.config.js
pm2 save

# Check status
pm2 list
pm2 logs tms --lines 20
```

### 5. Test

```bash
# Test local connection
curl -I http://localhost:3001
# Should return HTTP 200

# Test in browser
# https://tms.vaidera.eu - should load
# https://alogix.info - should load
```

---

## Key Points

❌ **WRONG for subdomain:**
```env
NEXT_PUBLIC_BASE_PATH=/tms
NEXTAUTH_URL="https://tms.vaidera.eu/tms"
```

✅ **CORRECT for subdomain:**
```env
NEXT_PUBLIC_BASE_PATH=
NEXTAUTH_URL="https://tms.vaidera.eu"
```

---

## Why This Matters

- **Subdomain deployment** (`tms.vaidera.eu`) = NO basePath, routes at root `/`
- **Subdirectory deployment** (`domain.com/tms`) = basePath `/tms`, routes at `/tms/*`

Your nginx config already routes correctly (proxies to root `/`), so the app just needs to be built without basePath.

---

**Last Updated:** 2025-12-20

