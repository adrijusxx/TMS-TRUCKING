# Fix: TMS Login Redirecting to CRM

## Problem
When logging into TMS at `http://34.121.40.233/tms`, users were being redirected to CRM instead of staying in the TMS application. The login would redirect to `/api/auth/error` or to the CRM dashboard.

## Root Causes

### 1. **NextAuth Redirect Callback Not Respecting basePath**
   - NextAuth's `redirect` callback was not properly handling the `/tms` basePath
   - When NextAuth redirected after login, it was using URLs without the basePath prefix
   - This caused the browser to navigate to the root domain, which nginx then routed to CRM

### 2. **Login Page Not Passing basePath to signIn()**
   - The login page was calculating the correct redirect URL but not passing it to NextAuth's `signIn()` function
   - NextAuth needs the `callbackUrl` parameter to know where to redirect after successful authentication

### 3. **PM2 Environment Variables Not Loading**
   - PM2 wasn't loading environment variables from `.env` file
   - This meant `NEXT_PUBLIC_BASE_PATH` and `NEXTAUTH_URL` weren't available to the application at runtime

## Solutions Implemented

### Fix 0: Hardcode basePath Fallback in `next.config.js` (CRITICAL)

**This is the most important fix - it ensures basePath is set even if env vars aren't read during build.**

**Before:**
```javascript
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
```

**After:**
```javascript
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
```

**Why this matters:** If the environment variable isn't read during the build process, the basePath would be empty, causing all routes to be generated without the `/tms` prefix. By hardcoding the fallback to `/tms`, we ensure the basePath is always set, matching what worked for CRM.

### Fix 1: Updated NextAuth Redirect Callback (`lib/auth.ts`)

**Before:**
```typescript
async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
  // Allow relative callback URLs
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  // Allow callback URLs on the same origin
  if (new URL(url).origin === baseUrl) return url;
  return baseUrl;
}
```

**After:**
```typescript
async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
  // baseUrl already includes basePath from NEXTAUTH_URL (e.g., http://34.121.40.233/tms)
  // So we just need to append the relative URL to it
  
  // If url is relative, append it to baseUrl
  if (url.startsWith('/')) {
    // baseUrl already has the basePath, so just append the url
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
```

**Key Point:** The `baseUrl` parameter in NextAuth's redirect callback already includes the basePath from `NEXTAUTH_URL`. So if `NEXTAUTH_URL=http://34.121.40.233/tms`, then `baseUrl` will be `http://34.121.40.233/tms`. We just need to append the relative path to it.

### Fix 2: Updated Login Page to Pass callbackUrl (`app/(auth)/login/page.tsx`)

**Before:**
```typescript
const result = await signIn('credentials', {
  email: data.email,
  password: data.password,
  redirect: false,
});

if (result?.ok) {
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  // ... calculate basePath ...
  window.location.href = fullPath;
}
```

**After:**
```typescript
// Get callbackUrl from query params or default to dashboard
const params = new URLSearchParams(window.location.search);
const callbackUrl = params.get('callbackUrl') || '/dashboard';

// Extract basePath from current URL (e.g., /tms or /crm)
const currentPath = window.location.pathname;
const basePath = currentPath.startsWith('/tms') ? '/tms' 
  : currentPath.startsWith('/crm') ? '/crm' 
  : process.env.NEXT_PUBLIC_BASE_PATH || '';

// Ensure callbackUrl includes basePath
const fullCallbackUrl = basePath && !callbackUrl.startsWith(basePath)
  ? `${basePath}${callbackUrl}`
  : callbackUrl;

const result = await signIn('credentials', {
  email: data.email,
  password: data.password,
  redirect: false,
  callbackUrl: fullCallbackUrl, // Pass the callbackUrl with basePath
});

if (result?.ok) {
  // Use the callbackUrl we already calculated
  window.location.href = fullCallbackUrl;
}
```

**Key Points:**
1. Extract basePath from the current URL pathname (more reliable than env var at runtime)
2. Calculate the full callback URL with basePath BEFORE calling `signIn()`
3. Pass `callbackUrl` to `signIn()` so NextAuth knows where to redirect
4. Use the same `fullCallbackUrl` for the manual redirect

### Fix 3: Updated PM2 Ecosystem Config (`ecosystem.config.js`)

**Before:**
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
},
```

**After:**
```javascript
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

env: {
  NODE_ENV: 'production',
  PORT: 3001,
  // Load from .env file
  NEXT_PUBLIC_BASE_PATH: envVars.NEXT_PUBLIC_BASE_PATH || '/tms',
  NEXTAUTH_URL: envVars.NEXTAUTH_URL || 'http://34.121.40.233/tms',
  // Spread all other env vars from .env
  ...envVars,
  // Also include process.env for any system variables
  ...process.env,
},
```

**Key Point:** PM2 doesn't automatically load `.env` files. We manually parse and load all environment variables from `.env` into the PM2 process environment.

## Required Environment Variables

Make sure your `.env` file has:

```env
NEXT_PUBLIC_BASE_PATH=/tms
NEXTAUTH_URL=http://34.121.40.233/tms
NEXTAUTH_SECRET=your-secret-key-here
```

## Deployment Steps

1. **Update code:**
   ```bash
   git pull
   ```

2. **Verify next.config.js has hardcoded fallback:**
   ```bash
   grep "basePath.*'/tms'" next.config.js
   ```
   Should show: `basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',`

3. **Clean and rebuild (CRITICAL):**
   ```bash
   rm -rf .next
   npm run build
   ```
   The basePath is baked into the Next.js build, so you MUST rebuild after any changes.

4. **Verify basePath in build:**
   ```bash
   grep -o '"basePath":"[^"]*"' .next/required-server-files.json
   ```
   Should show: `"basePath":"/tms"` (NOT empty)

5. **Restart PM2:**
   ```bash
   pm2 restart tms
   ```

6. **Verify environment variables:**
   ```bash
   pm2 env 2 | grep -E "NEXT_PUBLIC_BASE_PATH|NEXTAUTH_URL"
   ```

7. **Run verification script:**
   ```bash
   chmod +x verify-tms-basepath.sh
   ./verify-tms-basepath.sh
   ```

## How It Works Now

1. User visits `http://34.121.40.233/tms/login`
2. Login page extracts `/tms` from the URL pathname
3. User submits credentials
4. `signIn()` is called with `callbackUrl: '/tms/dashboard'`
5. NextAuth authenticates and uses the redirect callback
6. Redirect callback receives `baseUrl: 'http://34.121.40.233/tms'` (from NEXTAUTH_URL)
7. Redirect callback appends `/dashboard` to get `http://34.121.40.233/tms/dashboard`
8. User is redirected to `/tms/dashboard` (stays in TMS)

## Testing

1. Clear browser cookies (or use incognito)
2. Go to `http://34.121.40.233/tms`
3. Log in with valid credentials
4. Should redirect to `/tms/dashboard` (not CRM)

## Key Takeaways

1. **basePath must be in the build** - Rebuild after changing `NEXT_PUBLIC_BASE_PATH`
2. **NEXTAUTH_URL must include basePath** - Set to `http://domain/tms`, not just `http://domain`
3. **Extract basePath from URL** - More reliable than env vars at runtime
4. **Pass callbackUrl to signIn()** - NextAuth needs to know where to redirect
5. **PM2 needs explicit env loading** - Use ecosystem file to load `.env` variables

## Related Files

- `lib/auth.ts` - NextAuth configuration and redirect callback
- `app/(auth)/login/page.tsx` - Login form and redirect logic
- `ecosystem.config.js` - PM2 configuration for loading environment variables
- `next.config.js` - Next.js basePath configuration
- `.env` - Environment variables (NEXT_PUBLIC_BASE_PATH, NEXTAUTH_URL)

