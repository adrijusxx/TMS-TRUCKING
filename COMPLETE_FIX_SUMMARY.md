# Complete Fix Summary - TMS Application

This document summarizes all fixes applied to resolve TypeScript errors, build issues, redirect loops, API 404 errors, and static asset loading problems.

## Issues Fixed

1. **51 TypeScript errors across 16 files**
2. **Next.js build errors** (dynamic server usage, async params)
3. **Redirect loops** (constant page refreshing)
4. **Login redirect issues** (redirecting to wrong app)
5. **API call 404 errors** (73 files with missing basePath)
6. **Static asset 404 errors** (Next.js chunks not loading)

---

## Fix 1: TypeScript Errors

### Problem
51 TypeScript errors across 16 files including:
- Type mismatches
- Missing type assertions
- Incorrect prop names
- Invalid enum values

### Solution
Fixed individual type errors in each file:
- Added type assertions where needed
- Fixed prop names (e.g., `onApply` → `onApplyFilter`)
- Removed invalid enum values
- Added proper type annotations

**Files Fixed:**
- `app/api/integrations/quickbooks/sync-invoice/route.ts`
- `components/customers/CustomerList.tsx`
- `components/drivers/DriverList.tsx`
- `components/invoices/InvoiceList.tsx`
- `components/loads/LoadList.tsx`
- `components/trucks/TruckList.tsx`
- `components/invoices/InvoiceQuickView.tsx`
- `components/customer/CustomerTrackingView.tsx`
- `components/dashboard/LoadStatusDistribution.tsx`
- `components/loads/CreateLoadForm.tsx`
- `components/loads/EditLoadForm.tsx`
- `components/loads/LoadQuickView.tsx`
- `components/loads/LoadMap.tsx`
- `components/settings/RolePermissions.tsx`
- `types/google-maps.d.ts` (created)
- And more...

---

## Fix 2: Next.js Build Errors

### Problem 1: Dynamic Server Usage
```
Error: Dynamic server usage: Route /dashboard couldn't be rendered statically because it used headers.
```

### Solution
Added explicit runtime declaration to dynamic routes:

**File: `app/dashboard/page.tsx`**
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Added this
```

**File: `app/dashboard/layout.tsx`**
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Added this
```

### Problem 2: Next.js 16 Async Params
```
Type error: Type 'typeof import(...)' does not satisfy the constraint 'RouteHandlerConfig<"/api/customers/[id]">'.
```

### Solution
Updated route handlers to use `Promise<{ id: string }>` instead of union type:

**Before:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
}
```

**After:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params; // Direct await
}
```

**Files Fixed:**
- `app/api/loads/[id]/route.ts`
- `app/api/loads/[id]/assign/route.ts`
- `app/api/settings/users/[id]/route.ts`
- `app/api/trailers/[id]/route.ts`
- And other dynamic route handlers

---

## Fix 3: Redirect Loops (Constant Refreshing)

### Problem
Website constantly refreshing when accessing `/tms` or `/crm`.

### Root Cause
Nginx rewrite rule was stripping the basePath, but Next.js was generating URLs without it, causing redirect loops.

### Solution

**Step 1: Configure Next.js basePath**

**File: `next.config.js`**
```javascript
const nextConfig = {
  // ... existing config ...
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
}
```

**Step 2: Set Environment Variable**

**File: `.env`**
```env
NEXT_PUBLIC_BASE_PATH=/tms
NEXTAUTH_URL=http://34.121.40.233/tms
```

**Step 3: Update Nginx Config - REMOVE Rewrite Rule**

**File: `/etc/nginx/sites-available/crm`**
```nginx
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
    
    # CRITICAL: NO REWRITE - Let Next.js handle /tms prefix with basePath
    # rewrite ^/tms/?(.*)$ /$1 break;  <-- REMOVE THIS LINE
}
```

**Step 4: Update PM2 Ecosystem Config**

**File: `ecosystem.config.js`**
```javascript
const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value.trim();
        }
      }
    });
  }
  
  return env;
}

const envVars = loadEnvFile();

module.exports = {
  apps: [
    {
      name: 'tms',
      script: 'npm',
      args: 'start -- -p 3001',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Load from .env file
        NEXT_PUBLIC_BASE_PATH: envVars.NEXT_PUBLIC_BASE_PATH || '/tms',
        NEXTAUTH_URL: envVars.NEXTAUTH_URL || 'http://34.121.40.233/tms',
        // Spread all other env vars from .env
        ...envVars,
        ...process.env,
      },
    },
  ],
};
```

**Step 5: Rebuild and Restart**
```bash
# Clean build
rm -rf .next
npm run build

# Restart PM2 with updated env
pm2 restart tms --update-env

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Fix 4: Login Redirect Issues

### Problem
After login, users were redirected to the wrong app (TMS → CRM) or to incorrect URLs like `/tms/tms/login`.

### Solution

**Step 1: Fix NextAuth Configuration**

**File: `lib/auth.ts`**
```typescript
export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // CRITICAL for basePath/subdirectory deployments
  
  // DO NOT set basePath here - NextAuth v5 auto-detects from NEXTAUTH_URL
  // When Next.js has basePath, it strips it before passing to route handlers
  // NextAuth receives /api/auth/session (not /tms/api/auth/session)
  
  providers: [
    // ... providers ...
  ],
  
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // baseUrl already includes basePath from NEXTAUTH_URL (e.g., http://34.121.40.233/tms)
      // So we just need to append the relative URL to it
      
      // If url is relative, append it to baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If url is absolute, check if it's on the same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (e) {
        // Invalid URL, fall through to return baseUrl
      }
      
      // Default: return baseUrl (which includes basePath from NEXTAUTH_URL)
      return baseUrl;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/api/auth/error',
  },
};
```

**Step 2: Fix Login Page**

**File: `app/(auth)/login/page.tsx`**
```typescript
const onSubmit = async (data: LoginInput) => {
  // ... validation ...
  
  try {
    // Extract basePath from current URL or env
    const basePath = typeof window !== 'undefined' 
      ? (window.location.pathname.startsWith('/tms') ? '/tms' : '/crm')
      : (process.env.NEXT_PUBLIC_BASE_PATH || '/tms');
    
    // Calculate full callback URL with basePath
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const fullCallbackUrl = `${basePath}${callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`}`;
    
    // Test NextAuth API endpoint before attempting sign in
    const sessionTest = await fetch(`${basePath}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!sessionTest.ok && sessionTest.status !== 401) {
      setError(`Authentication server error: ${sessionTest.status}`);
      return;
    }
    
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: fullCallbackUrl, // Pass the full callback URL
    });
    
    if (result?.ok) {
      window.location.href = fullCallbackUrl;
    }
  } catch (err) {
    setError('An error occurred. Please try again.');
  }
};
```

**Step 3: Fix Session Provider**

**File: `components/providers/SessionProvider.tsx`**
```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Get basePath from environment or detect from window.location
  const getBasePath = () => {
    // Client-side: extract from current URL
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/tms')) return '/tms';
      if (pathname.startsWith('/crm')) return '/crm';
    }
    // Server-side or fallback: use env var
    return process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  };

  const basePath = getBasePath();

  // Explicitly set basePath for NextAuth client-side calls
  // This ensures NextAuth calls /tms/api/auth/session instead of /api/auth/session
  return (
    <NextAuthSessionProvider basePath={`${basePath}/api/auth`}>
      {children}
    </NextAuthSessionProvider>
  );
}
```

**Step 4: Create Error Handler Route**

**File: `app/api/auth/error/route.ts`** (NEW FILE)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Extract basePath from the request URL
  const pathname = request.nextUrl.pathname;
  let basePath = '';
  
  if (pathname.startsWith('/tms/')) {
    basePath = '/tms';
  } else if (pathname.startsWith('/crm/')) {
    basePath = '/crm';
  } else {
    basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  }
  
  // Construct login URL with basePath
  const loginUrl = new URL(`${basePath}/login`, request.url);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(loginUrl);
}
```

**Step 5: Fix Root Redirects**

**File: `app/page.tsx`**
```typescript
import { redirect } from 'next/navigation';

export default function Home() {
  // Next.js redirect() automatically prepends basePath from next.config.js
  redirect('/login');
}
```

**File: `app/dashboard/layout.tsx`**
```typescript
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    // Next.js redirect() automatically prepends basePath from next.config.js
    redirect('/login');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
```

**Step 6: Add Nginx Route for /api/auth/***

**File: `/etc/nginx/sites-available/crm`**
```nginx
# CRITICAL: Handle /api/auth/* routes that NextAuth generates without basePath
location ~ ^/api/auth(/.*)?$ {
    # Rewrite /api/auth/* to /tms/api/auth/* so Next.js basePath works
    rewrite ^/api/auth(/.*)?$ /tms/api/auth$1 break;
    
    # Proxy to TMS
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

---

## Fix 5: API Call 404 Errors (73 Files)

### Problem
All client-side API calls were returning 404 because they didn't include the basePath (`/tms`).

### Solution

**Step 1: Create API URL Helper**

**File: `lib/utils/index.ts`** (Added to existing file)
```typescript
/**
 * Get the basePath for API calls
 * In browser, extracts from window.location.pathname
 * On server, uses NEXT_PUBLIC_BASE_PATH env var
 */
export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    // Client-side: extract from current URL
    const pathname = window.location.pathname;
    if (pathname.startsWith('/tms')) return '/tms';
    if (pathname.startsWith('/crm')) return '/crm';
  }
  // Server-side or fallback: use env var
  return process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
}

/**
 * Construct an API URL with basePath
 * @param path - API path (e.g., '/api/activity' or 'api/activity')
 * @returns Full API URL with basePath (e.g., '/tms/api/activity')
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Ensure basePath doesn't end with /
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${normalizedBasePath}${normalizedPath}`;
}
```

**Step 2: Update All Client-Side Fetch Calls**

**Pattern: Find and Replace in all component files**

**Before:**
```typescript
const response = await fetch('/api/loads');
```

**After:**
```typescript
import { apiUrl } from '@/lib/utils';

const response = await fetch(apiUrl('/api/loads'));
```

**Files Fixed (73 total):**
- All list components (LoadList, TruckList, CustomerList, DriverList, InvoiceList)
- All QuickView components
- All ListStats components
- All Detail pages
- All Form components
- Dashboard components
- Analytics components
- Settings components
- Map components
- Mobile components
- And more...

**Example Fix:**
```typescript
// components/loads/LoadList.tsx
import { apiUrl } from '@/lib/utils'; // Added import

async function fetchLoads(params: {...}) {
  const queryParams = new URLSearchParams();
  // ... build query params ...
  
  const response = await fetch(apiUrl(`/api/loads?${queryParams}`)); // Changed from `/api/loads`
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}
```

---

## Fix 6: Static Asset 404 Errors

### Problem
Next.js static chunks returning 404:
- `/tms/_next/static/chunks/01a23bfe2c3218a7.js`
- `/tms/_next/static/chunks/21ca62cdad5bceaa.js`

### Root Cause
Build was done before `basePath` was set, or Nginx wasn't properly handling static asset requests.

### Solution

**Step 1: Update Nginx Config for Static Assets**

**File: `/etc/nginx/sites-available/crm`**
```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRITICAL: Handle Next.js static assets FIRST (before other location blocks)
    location ~ ^/tms/_next/static {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Cache static assets
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # ... rest of config ...
}
```

**Step 2: Clean Rebuild**

```bash
cd ~/TMS-TRUCKING

# Verify basePath is set
grep NEXT_PUBLIC_BASE_PATH .env
# Should show: NEXT_PUBLIC_BASE_PATH=/tms

# Clean build directory
rm -rf .next

# Rebuild with basePath (CRITICAL - regenerates chunks with /tms prefix)
npm run build

# Restart PM2
pm2 restart tms --update-env

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Step 3: Verify Static Assets**

```bash
# Test directly on Next.js port
curl -I http://localhost:3001/tms/_next/static/chunks/webpack.js

# Test through Nginx
curl -I http://34.121.40.233/tms/_next/static/chunks/webpack.js
```

Both should return 200 OK.

---

## Complete Checklist for CRM

Apply these same fixes to your CRM app:

### 1. TypeScript Errors
- [ ] Fix any TypeScript errors in your codebase
- [ ] Add missing type assertions
- [ ] Fix incorrect prop names
- [ ] Remove invalid enum values

### 2. Next.js Build Configuration
- [ ] Add `basePath` and `assetPrefix` to `next.config.js`:
  ```javascript
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/crm',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/crm',
  ```
- [ ] Add `export const runtime = 'nodejs';` to dynamic routes
- [ ] Fix async params in route handlers (Next.js 16)

### 3. Environment Variables
- [ ] Add to `.env`:
  ```env
  NEXT_PUBLIC_BASE_PATH=/crm
  NEXTAUTH_URL=http://34.121.40.233/crm
  ```

### 4. Nginx Configuration
- [ ] Remove rewrite rules from `/crm` location block
- [ ] Add explicit handling for `/_next/static` paths
- [ ] Add handling for `/api/auth/*` routes (if using NextAuth)
- [ ] Test config: `sudo nginx -t`
- [ ] Reload: `sudo systemctl reload nginx`

### 5. PM2 Configuration
- [ ] Update `ecosystem.config.js` to load `.env` variables
- [ ] Ensure `NEXT_PUBLIC_BASE_PATH` and `NEXTAUTH_URL` are in PM2 env
- [ ] Restart: `pm2 restart crm --update-env`

### 6. NextAuth Configuration (if using)
- [ ] Add `trustHost: true` to `authOptions`
- [ ] Fix `redirect` callback to handle basePath
- [ ] Update `SessionProvider` to set `basePath` prop
- [ ] Create `/api/auth/error/route.ts` handler
- [ ] Fix login page to calculate correct `callbackUrl`

### 7. API Calls (CRITICAL)
- [ ] Create `apiUrl()` helper in `lib/utils/index.ts`
- [ ] Find all `fetch('/api/...')` calls in components
- [ ] Replace with `fetch(apiUrl('/api/...'))`
- [ ] Add `import { apiUrl } from '@/lib/utils';` to each file

**To find all files needing updates:**
```bash
# Find all files with fetch('/api/
grep -r "fetch(['\"]/api/" components/ app/ --files-with-matches
```

### 8. Root Redirects
- [ ] Update `app/page.tsx` to use `redirect('/login')` (Next.js auto-adds basePath)
- [ ] Update protected route redirects to use `redirect()` from `next/navigation`

### 9. Clean Rebuild
- [ ] Remove `.next` directory: `rm -rf .next`
- [ ] Rebuild: `npm run build`
- [ ] Restart PM2: `pm2 restart crm --update-env`

### 10. Verify
- [ ] Test login flow
- [ ] Test API calls (check browser console)
- [ ] Test static assets loading
- [ ] Check PM2 logs: `pm2 logs crm --lines 50`

---

## Key Takeaways

1. **basePath is critical**: Must be set in `next.config.js`, `.env`, and PM2 config
2. **No Nginx rewrites**: When using basePath, don't rewrite in Nginx
3. **All API calls need basePath**: Use `apiUrl()` helper for all client-side fetch calls
4. **Clean rebuild required**: After setting basePath, must rebuild to regenerate chunks
5. **NextAuth needs special handling**: `trustHost: true` and explicit basePath in SessionProvider
6. **Static assets need explicit Nginx handling**: Add location block for `/_next/static`

---

## Files Created/Modified Summary

### New Files Created:
- `lib/utils/index.ts` - Added `getBasePath()` and `apiUrl()` helpers
- `app/api/auth/error/route.ts` - NextAuth error handler
- `types/google-maps.d.ts` - Google Maps type definitions
- `nginx-fixed-static-assets.conf` - Updated Nginx config
- `FIX_STATIC_ASSETS_404.md` - Documentation

### Key Files Modified:
- `next.config.js` - Added basePath and assetPrefix
- `lib/auth.ts` - Fixed NextAuth configuration
- `components/providers/SessionProvider.tsx` - Added basePath prop
- `app/(auth)/login/page.tsx` - Fixed callback URL calculation
- `ecosystem.config.js` - Added .env loading
- **73 component files** - Updated fetch calls to use `apiUrl()`

---

## Quick Reference Commands

```bash
# Verify basePath in .env
grep NEXT_PUBLIC_BASE_PATH .env

# Clean rebuild
rm -rf .next && npm run build

# Restart PM2 with updated env
pm2 restart crm --update-env

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check PM2 logs
pm2 logs crm --lines 50

# Test static assets
curl -I http://localhost:3000/crm/_next/static/chunks/webpack.js
curl -I http://34.121.40.233/crm/_next/static/chunks/webpack.js

# Find all API calls needing fix
grep -r "fetch(['\"]/api/" components/ app/ --files-with-matches
```

---

This summary should give you everything needed to apply the same fixes to your CRM app!

