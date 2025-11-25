# Samsara API Endpoint Fixes

## Issues Identified and Fixed

### Problem #1: Too Many Vehicle IDs ✅ FIXED

**Issue**: Passing ~300 vehicle IDs in a single request, but Samsara has a limit of **50 IDs maximum per request**.

**Solution**: Implemented automatic batching:
- All endpoints now automatically split vehicle IDs into batches of 50
- Multiple requests are made and results are combined
- Works transparently - no code changes needed elsewhere

**Affected Functions**:
- ✅ `getSamsaraAssetLocationAndSpeed()` - Batches to 50 IDs
- ✅ `getSamsaraVehicleLocations()` - Batches to 50 IDs  
- ✅ `getSamsaraVehicleDiagnostics()` - Batches to 50 IDs

### Problem #2: Wrong Endpoints ✅ FIXED

**Issue**: Several endpoints don't exist or have changed in the current Samsara API.

#### Fixed Endpoints:

| ❌ Old (Wrong) | ✅ New (Correct) | Status |
|---|---|---|
| `/fleet/locations` | `/fleet/vehicles/locations` | ✅ Fixed |
| `/fleet/vehicles/locations/snapshot` | `/fleet/vehicles/locations?types=currentLocation` | ✅ Fixed |
| `/fleet/trips/recent` | `/fleet/trips?startTime=X&endTime=Y` | ✅ Fixed |
| `/fleet/vehicles/diagnostics` | `/fleet/vehicles/stats` (with fallback) | ✅ Fixed |

#### Details:

1. **Vehicle Locations**:
   - ❌ `/fleet/locations` - Doesn't exist
   - ✅ `/fleet/vehicles/locations` - Correct endpoint
   - ✅ `/fleet/vehicles/locations?types=currentLocation` - With type filter
   - ✅ Falls back gracefully if types parameter doesn't work

2. **Trips**:
   - ❌ `/fleet/trips/recent?limit=3` - Doesn't exist
   - ✅ `/fleet/trips?startTime=X&endTime=Y&limit=3` - Correct endpoint with time range

3. **Diagnostics**:
   - ❌ `/fleet/vehicles/diagnostics` - May not exist for all accounts
   - ✅ `/fleet/vehicles/stats?types=checkEngineLightOn,faultCodes` - Tries stats first
   - ✅ Falls back to diagnostics endpoint if stats doesn't work

### Problem #3: Feature/Plan Availability ✅ HANDLED

**Issue**: Some endpoints genuinely may not be available depending on:
- Token permissions/scopes
- Features enabled in Samsara dashboard
- Account licenses (e.g., Safety license for camera data)

**Solution**: 
- All endpoints have graceful fallbacks
- Errors are logged at debug level (not error level)
- Missing data doesn't break the Live Map
- Code continues to work with partial data

## How Batching Works

### Example: 200 Vehicles

**Before (Broken)**:
```javascript
// ❌ Single request with 200 IDs - FAILS
getSamsaraVehicleLocations([id1, id2, ..., id200])
```

**After (Fixed)**:
```javascript
// ✅ Automatically batched into 4 requests
Batch 1: [id1...id50]   → Request 1
Batch 2: [id51...id100]  → Request 2
Batch 3: [id101...id150] → Request 3
Batch 4: [id151...id200] → Request 4
// Results combined and returned
```

### Implementation

All functions now check:
```javascript
if (vehicleIds && vehicleIds.length > 50) {
  // Split into batches of 50
  // Process each batch
  // Combine results
}
```

## Endpoint Priority Order

### Vehicle Locations:
1. `/assets/location-and-speed/stream` (if IDs available, max 50 per batch)
2. `/fleet/vehicles/locations?types=currentLocation` (with type filter)
3. `/fleet/vehicles/locations` (without type filter)

### Diagnostics:
1. `/fleet/vehicles/stats?types=checkEngineLightOn,faultCodes` (tries stats first)
2. `/fleet/vehicles/diagnostics` (fallback)

### Trips:
1. `/fleet/trips?startTime=X&endTime=Y&limit=N` (with time range)

## Testing

After these fixes, you should see:

✅ **No more "Need to filter by 50 or less asset IDs" errors**
✅ **No more "Endpoint not found" errors for corrected endpoints**
✅ **Live Map loads with all vehicles** (even if you have 300+)
✅ **Graceful handling of unavailable endpoints**

## Remaining Expected Messages

These are **normal** and indicate features not available in your account:

- `[Samsara] Endpoint not found: /fleet/cameras/media` - Camera feature not enabled
- `[Samsara] Endpoint not found: /safety/media` - Safety license not available
- `[Samsara] Vehicle stats endpoint not available` - Stats feature not available
- `[Samsara] Speed data will be obtained from vehicle locations instead` - Normal fallback

These messages are logged at **debug level** and don't indicate errors.

## Summary

✅ **Fixed**: Batching for all endpoints (50 IDs max)
✅ **Fixed**: Correct endpoint paths
✅ **Fixed**: Proper time range parameters
✅ **Handled**: Graceful fallbacks for unavailable features

The Live Map should now work correctly with any number of vehicles!



