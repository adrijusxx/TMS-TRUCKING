# Fix: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error in Local Dev

## Problem
When testing locally, NextAuth returns HTML (404 page) instead of JSON, causing:
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause
1. **Accessing wrong URL**: Using `http://localhost:3000/login` instead of `http://localhost:3000/tms/login`
2. **Missing `.env.local`**: `NEXTAUTH_URL` not set correctly for local dev
3. **NextAuth client calling wrong path**: Client-side NextAuth might not include basePath

## Solution

### Step 1: Create `.env.local` File

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# NextAuth - CRITICAL: Must include /tms basePath
NEXTAUTH_URL="http://localhost:3000/tms"
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"

# BasePath for local testing (must match production)
NEXT_PUBLIC_BASE_PATH=/tms
```

### Step 2: Access App at Correct URL

**❌ WRONG:**
```
http://localhost:3000/login
```

**✅ CORRECT:**
```
http://localhost:3000/tms/login
```

### Step 3: Restart Dev Server

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Verify

1. Open browser DevTools (F12) > Network tab
2. Go to `http://localhost:3000/tms/login`
3. Check Network tab for `/api/auth/session` call
4. Should see: `http://localhost:3000/tms/api/auth/session` (with `/tms` prefix)
5. Response should be JSON (200 or 401), NOT HTML

## Why This Happens

When `basePath: '/tms'` is set in `next.config.js`:
- ✅ Routes are at: `/tms/login`, `/tms/dashboard`
- ✅ API routes are at: `/tms/api/auth/session`
- ❌ `/login` and `/api/auth/session` return 404 (HTML page)

NextAuth client-side needs to call `/tms/api/auth/session`, not `/api/auth/session`.

## Quick Test

```bash
# Test API endpoint directly
curl http://localhost:3000/tms/api/auth/session

# Should return JSON like:
# {"user":null} or {"user":{...}}
# NOT HTML
```

## Alternative: Test Without basePath (Optional)

If you want to test without basePath locally:

1. **Temporarily comment out basePath in `next.config.js`:**
```javascript
// basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
basePath: '', // Test without basePath
```

2. **Update `.env.local`:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_PATH=
```

3. **Access at:** `http://localhost:3000/login`

**⚠️ Remember to revert before deploying to production!**

