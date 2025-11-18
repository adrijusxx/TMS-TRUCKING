# Fix All API Calls with basePath

## Summary
All client-side API calls need to use the `apiUrl()` helper function to include the `/tms` basePath.

## Files Already Fixed
- ✅ `components/loads/LoadListStats.tsx`
- ✅ `components/filters/SavedFilters.tsx`
- ✅ `components/loads/LoadList.tsx`
- ✅ `components/trucks/TruckList.tsx`
- ✅ `components/customers/CustomerList.tsx`
- ✅ `components/drivers/DriverList.tsx`
- ✅ `components/invoices/InvoiceList.tsx`
- ✅ `components/notifications/NotificationBell.tsx`
- ✅ `components/dispatch/DispatchBoard.tsx`
- ✅ `components/analytics/AnalyticsDashboard.tsx`
- ✅ `components/settings/NotificationPreferences.tsx`
- ✅ `components/analytics/DriverPerformanceScorecard.tsx`
- ✅ `components/analytics/EmptyMilesAnalysis.tsx`
- ✅ `components/analytics/FuelCostAnalysis.tsx`
- ✅ `components/analytics/ProfitabilityAnalysis.tsx`
- ✅ `components/analytics/RevenueForecast.tsx`

## Remaining Files to Fix

Run this PowerShell script to find all remaining files:

```powershell
Get-ChildItem -Path components -Recurse -Filter *.tsx | Select-String -Pattern "fetch\(['\"`]/api/" | Select-Object -ExpandProperty Path -Unique
```

## Pattern to Replace

**Before:**
```typescript
const response = await fetch(`/api/endpoint?${params}`);
// or
const response = await fetch('/api/endpoint', { ... });
```

**After:**
```typescript
import { apiUrl } from '@/lib/utils';
// ...
const response = await fetch(apiUrl(`/api/endpoint?${params}`));
// or
const response = await fetch(apiUrl('/api/endpoint'), { ... });
```

## Quick Fix Script

For each file:
1. Add `apiUrl` to imports: `import { ..., apiUrl } from '@/lib/utils';`
2. Replace `fetch(\`/api/...\`)` with `fetch(apiUrl(\`/api/...\`))`
3. Replace `fetch('/api/...')` with `fetch(apiUrl('/api/...'))`

