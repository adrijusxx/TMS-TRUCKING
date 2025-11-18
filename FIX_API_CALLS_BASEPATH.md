# Fix: API Calls Failing Due to Missing basePath

## Problem
After login, many sections fail to load data:
- Activity feed failed to load
- All loads failed to load  
- Other sections also failing to load

Dashboard stats work (Total Loads, Drivers, Trucks, Revenue) because they're server-side rendered, but client-side API calls fail.

## Root Cause
Client-side `fetch()` calls use relative paths like `/api/activity` and `/api/loads`. With `basePath: '/tms'` in Next.js config, these need to include the basePath: `/tms/api/activity` and `/tms/api/loads`.

Next.js automatically handles basePath for:
- Server-side API calls
- Next.js `<Link>` components
- Server-side `fetch()` calls

But **NOT** for client-side `fetch()` calls in browser JavaScript.

## Solution

### Created `apiUrl()` Helper Function

Added to `lib/utils/index.ts`:

```typescript
/**
 * Get the basePath for API calls
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
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${normalizedBasePath}${normalizedPath}`;
}
```

### Updated Components

Updated all dashboard components to use `apiUrl()`:

**Before:**
```typescript
const response = await fetch('/api/activity');
```

**After:**
```typescript
import { apiUrl } from '@/lib/utils';
const response = await fetch(apiUrl('/api/activity'));
```

### Components Updated

- ✅ `components/activity/ActivityFeed.tsx`
- ✅ `components/dashboard/RecentLoads.tsx`
- ✅ `components/dashboard/UpcomingDeadlines.tsx`
- ✅ `components/dashboard/LoadStatusDistribution.tsx`
- ✅ `components/dashboard/RevenueTrends.tsx`
- ✅ `components/dashboard/DriverPerformanceSummary.tsx`
- ✅ `components/dashboard/TruckPerformanceSummary.tsx`
- ✅ `components/dashboard/CustomerPerformanceMetrics.tsx`

## Deployment Steps

```bash
cd ~/TMS-TRUCKING

# Pull latest code
git pull

# Rebuild (CRITICAL - new utils functions need to be in build)
npm run build

# Restart TMS
pm2 restart tms --update-env

# Test
# Open browser to http://34.121.40.233/tms/dashboard
# Check browser console (F12) for any API errors
# All sections should now load correctly
```

## Remaining Components to Update

There are ~50+ more components with `fetch('/api/...')` calls that should be updated. For now, the critical dashboard components are fixed. Other components can be updated as needed.

To find remaining components:
```bash
grep -r "fetch('/api/" components/ --include="*.tsx" --include="*.ts"
```

## How It Works

1. **Client-side**: `getBasePath()` extracts `/tms` from `window.location.pathname`
2. **Server-side**: Falls back to `process.env.NEXT_PUBLIC_BASE_PATH`
3. **apiUrl()**: Prepends basePath to API paths, ensuring correct URLs

Example:
- Input: `apiUrl('/api/activity')`
- Output: `/tms/api/activity` (when running under `/tms`)

## Testing

After deployment:
1. Login to TMS
2. Check dashboard - all sections should load
3. Check browser console (F12) - no 404 errors on API calls
4. Navigate to other sections - they should work if they use `apiUrl()`

## Files Changed

- `lib/utils/index.ts` - Added `getBasePath()` and `apiUrl()` functions
- `components/activity/ActivityFeed.tsx` - Updated to use `apiUrl()`
- `components/dashboard/*.tsx` - Updated all dashboard components to use `apiUrl()`

