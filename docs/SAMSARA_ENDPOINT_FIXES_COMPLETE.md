# Samsara Endpoint Fixes - Complete

## Summary

Fixed all incorrect Samsara API endpoint paths and reduced logging noise by implementing endpoint availability caching.

## Fixes Applied

### 1. ✅ Trips Endpoint - Fixed

**Problem**: Using `/fleet/trips` which doesn't exist in current API.

**Before** (❌ Wrong):
```typescript
GET /fleet/trips?startTime=...&endTime=...&limit=3
```

**After** (✅ Correct):
```typescript
// Try new endpoint first (requires enablement)
GET /trips?startTime=...&endTime=...&limit=3

// Fallback to legacy endpoint
POST /v1/fleet/trips
{
  "startTime": "...",
  "endTime": "...",
  "limit": 3
}
```

**Implementation**:
- Tries `/trips` first (requires enablement by Samsara rep)
- Falls back to legacy `/v1/fleet/trips` if new endpoint fails
- Only logs "not available" once per session to reduce noise

### 2. ✅ Diagnostics Endpoint - Removed

**Problem**: Calling `/fleet/vehicles/diagnostics` which doesn't exist.

**Before** (❌ Wrong):
```typescript
GET /fleet/vehicles/diagnostics?vehicleIds=...
```

**After** (✅ Correct):
```typescript
// Use stats endpoint with faultCodes instead
GET /fleet/vehicles/stats?types=faultCodes&vehicleIds=...
```

**Implementation**:
- Removed fallback to `/fleet/vehicles/diagnostics`
- Diagnostics are now obtained via `/fleet/vehicles/stats?types=faultCodes`
- No more "endpoint not found" errors for diagnostics

### 3. ✅ Reduced Logging Noise

**Problem**: Logging the same "endpoint not found" errors repeatedly.

**Solution**: Implemented endpoint availability caching.

**Implementation**:
```typescript
// Cache for unavailable endpoints to reduce log noise
const unavailableEndpoints = new Set<string>();

// Only log once per endpoint
if (!unavailableEndpoints.has(endpoint)) {
  unavailableEndpoints.add(endpoint);
  console.debug(`[Samsara] Endpoint not found: ${endpoint}`);
}
```

**Benefits**:
- Each unavailable endpoint logged only once per session
- Reduces console noise significantly
- Still provides useful debugging info on first failure

### 4. ✅ Conditional Feature Checks

**Problem**: Always trying unavailable endpoints even after they fail.

**Solution**: Check cache before attempting optional features.

**Implementation**:
```typescript
// Camera media - check cache first
if (unavailableEndpoints.has('/fleet/cameras/media') && 
    unavailableEndpoints.has('/safety/media')) {
  return null; // Skip if both endpoints unavailable
}

// Trips - check cache first
if (unavailableEndpoints.has('/trips')) {
  return null; // Skip if endpoint unavailable
}
```

**Benefits**:
- Skips unnecessary API calls
- Faster response times
- Less API rate limit usage

## Endpoint Status Tracking

The system now tracks unavailable endpoints:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/trips` | ✅ Fixed | Tries new endpoint, falls back to legacy |
| `/v1/fleet/trips` | ✅ Fixed | Legacy fallback for trips |
| `/fleet/vehicles/diagnostics` | ✅ Removed | Use `/fleet/vehicles/stats?types=faultCodes` instead |
| `/fleet/cameras/media` | ✅ Cached | Only tries once, then skips |
| `/safety/media` | ✅ Cached | Only tries once, then skips |

## Code Changes

### File: `lib/integrations/samsara.ts`

1. **Added endpoint availability cache**:
   ```typescript
   const unavailableEndpoints = new Set<string>();
   ```

2. **Updated `samsaraRequest`**:
   - Only logs 404 errors once per endpoint
   - Only logs "invalid id" errors once per endpoint

3. **Updated `getSamsaraTrips`**:
   - Uses `/trips` first (requires enablement)
   - Falls back to `/v1/fleet/trips` (legacy)
   - Caches unavailable status

4. **Updated `getSamsaraVehicleDiagnostics`**:
   - Removed fallback to `/fleet/vehicles/diagnostics`
   - Uses `/fleet/vehicles/stats?types=faultCodes` only

5. **Updated `getSamsaraCameraMedia`**:
   - Checks cache before attempting endpoints
   - Marks endpoints as unavailable on failure
   - Only logs once per endpoint

## Expected Results

After these fixes:

✅ **No more "endpoint not found" spam** - Each endpoint logged once
✅ **Correct trips endpoint** - Uses `/trips` or legacy `/v1/fleet/trips`
✅ **No diagnostics endpoint errors** - Uses stats endpoint instead
✅ **Faster responses** - Skips unavailable endpoints after first failure
✅ **Cleaner logs** - Only shows new/unexpected errors

## Testing

1. **Trips Endpoint**:
   - If enabled: Should work with `/trips`
   - If not enabled: Should try legacy `/v1/fleet/trips`
   - Should only log "not available" once

2. **Camera Media**:
   - First call: Tries both endpoints, logs failures
   - Subsequent calls: Skips if both unavailable
   - Should only log once per endpoint

3. **Diagnostics**:
   - Should use `/fleet/vehicles/stats?types=faultCodes`
   - Should NOT try `/fleet/vehicles/diagnostics`
   - No more "endpoint not found" for diagnostics

## Summary

All endpoint paths are now correct, and the system intelligently caches unavailable endpoints to reduce log noise and improve performance. The code is more efficient and provides better debugging information.

