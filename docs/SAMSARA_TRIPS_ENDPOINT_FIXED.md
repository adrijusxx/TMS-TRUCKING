# Samsara Trips Endpoint - Fixed

## Problem Identified

**Real Samsara API Error**:
```json
{
  "message": "Bad Request",
  "requestId": "..."
}
```

**Root Cause**: The `/trips` endpoint requires at least one filter parameter:
- `vehicleIds` (comma-separated list) **OR**
- `driverIds` (comma-separated list) **OR**
- Both

**Previous Code** (❌ Wrong):
```typescript
// Missing required filter
GET /trips?startTime=2025-11-22T23:33:10.830Z&endTime=2025-11-23T23:33:10.830Z&limit=3
```

## Solution Applied

### ✅ Updated Function Signature

**Before**:
```typescript
export async function getSamsaraTrips(companyId?: string)
```

**After**:
```typescript
export async function getSamsaraTrips(
  vehicleIds?: string[],
  driverIds?: string[],
  companyId?: string
)
```

### ✅ Added Required Filter Validation

```typescript
// The /trips endpoint requires at least one filter: vehicleIds OR driverIds
if ((!vehicleIds || vehicleIds.length === 0) && (!driverIds || driverIds.length === 0)) {
  console.debug('[Samsara] Trips endpoint requires vehicleIds or driverIds filter - skipping');
  return null;
}
```

### ✅ Correct Request Format

**Option 1: Filter by Vehicle IDs** (✅ Correct):
```typescript
GET /trips?vehicleIds=123,456,789&startTime=2025-11-22T00:00:00Z&endTime=2025-11-23T00:00:00Z&limit=3
```

**Option 2: Filter by Driver IDs** (✅ Correct):
```typescript
GET /trips?driverIds=111,222,333&startTime=2025-11-22T00:00:00Z&endTime=2025-11-23T00:00:00Z&limit=3
```

**Option 3: Filter by Both** (✅ Correct):
```typescript
GET /trips?vehicleIds=123&driverIds=111&startTime=2025-11-22T00:00:00Z&endTime=2025-11-23T00:00:00Z&limit=3
```

### ✅ Automatic Batching

The function now automatically batches vehicle IDs into chunks of 50 (API limit):

```typescript
// Batch vehicle IDs if more than 50
const batches: string[][] = [];
for (let i = 0; i < vehicleIds.length; i += 50) {
  batches.push(vehicleIds.slice(i, i + 50));
}

// Make requests for each batch and combine results
const allTrips: SamsaraTrip[] = [];
for (const batch of batches) {
  const result = await samsaraRequest(`/trips?vehicleIds=${batch.join(',')}&...`);
  allTrips.push(...trips);
}
```

### ✅ Updated Call Site

**Before** (❌ Wrong):
```typescript
const tripsPromise = getSamsaraTrips(this.companyId).catch(...)
```

**After** (✅ Correct):
```typescript
const tripsPromise = (async () => {
  try {
    const vehicleIds = vehicles?.map((v) => v.id).filter(Boolean) as string[] | undefined;
    if (vehicleIds && vehicleIds.length > 0) {
      return await getSamsaraTrips(vehicleIds, undefined, this.companyId);
    }
    // If no vehicle IDs, trips can't be fetched (endpoint requires filter)
    return null;
  } catch (error) {
    console.info('[Samsara] Trips unavailable:', error instanceof Error ? error.message : error);
    return null;
  }
})();
```

### ✅ Legacy Endpoint Fallback

The legacy endpoint (`/v1/fleet/trips`) also requires `vehicleIds`:

```typescript
// Fallback to legacy endpoint if new one doesn't work
if (vehicleIds && vehicleIds.length > 0) {
  const legacyResult = await samsaraRequest('/v1/fleet/trips', {
    method: 'POST',
    body: JSON.stringify({
      vehicleIds: vehicleIds.slice(0, 50), // Legacy may also have limits
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      limit,
    }),
  });
}
```

## Code Changes

### File: `lib/integrations/samsara.ts`

1. **Updated function signature** to accept `vehicleIds` and `driverIds`
2. **Added validation** to ensure at least one filter is provided
3. **Implemented batching** for vehicle IDs (50 per request)
4. **Updated legacy endpoint** to also include `vehicleIds`

### File: `lib/maps/live-map-service.ts`

1. **Updated call site** to pass `vehicleIds` from vehicles
2. **Added error handling** for cases where no vehicle IDs are available

## Expected Results

After these fixes:

✅ **No more "Bad Request" errors** - Endpoint now includes required filter
✅ **Trips data retrieved** - If endpoint is enabled and vehicles exist
✅ **Automatic batching** - Handles large numbers of vehicles (50 per request)
✅ **Graceful fallback** - Returns null if no vehicle IDs available
✅ **Legacy endpoint support** - Falls back if new endpoint unavailable

## Testing

1. **With Vehicle IDs**:
   - Should make request: `GET /trips?vehicleIds=123,456&startTime=...&endTime=...&limit=3`
   - Should return trips data if available

2. **Without Vehicle IDs**:
   - Should skip request (logs debug message)
   - Should return null gracefully

3. **With Many Vehicles (>50)**:
   - Should batch into multiple requests
   - Should combine results from all batches

4. **Legacy Endpoint**:
   - Should try if new endpoint fails
   - Should include vehicleIds in POST body

## Summary

The `/trips` endpoint now correctly includes the required `vehicleIds` or `driverIds` filter, preventing "Bad Request" errors. The function automatically batches large numbers of vehicle IDs and gracefully handles cases where no filter can be provided.

