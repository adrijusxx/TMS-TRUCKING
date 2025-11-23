# Samsara Data Diagnostic Guide

## Issue: Missing Speed, Fuel, and Camera Data

When selecting a truck on the Live Map, you're only seeing location data but no speed, fuel level, or camera feed.

## Root Cause

The Samsara integration requires **environment variables** to be enabled for these features. If they're not set, the API calls are skipped entirely.

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# Enable vehicle stats (speed, fuel, odometer, etc.)
SAMSARA_STATS_ENABLED=true

# Enable camera media (forward-facing, driver-facing cameras)
SAMSARA_CAMERA_MEDIA_ENABLED=true

# Optional: Camera media types (default: forwardFacing,driverFacing)
SAMSARA_CAMERA_MEDIA_TYPES=forwardFacing,driverFacing

# Optional: Enable trips data
SAMSARA_TRIPS_ENABLED=true
SAMSARA_TRIPS_LIMIT=3
```

## How It Works

1. **Location Data**: Always fetched (no env var needed)
   - Uses `/fleet/vehicles/locations/snapshot` endpoint (with fallback to `/fleet/vehicles/locations`)
   - Provides: lat, lng, address, heading, speed (from location)
   - Reference: https://developers.samsara.com/reference/getfleetvehicleslocations

2. **Speed & Fuel Data**: Requires `SAMSARA_STATS_ENABLED=true`
   - Uses `/fleet/vehicles/stats/snapshot` endpoint (with fallback to `/fleet/vehicles/stats`)
   - Provides: currentSpeed, speedLimit, fuelPercent, odometerMiles, engineHours, engineState, seatbeltStatus
   - **If not enabled**: Returns `null` immediately, no API call is made
   - Reference: https://developers.samsara.com/reference/getfleetvehiclesstats
   - **Important**: Requires API token with "Read Vehicles Statistics" permission

3. **Camera Media**: Requires `SAMSARA_CAMERA_MEDIA_ENABLED=true`
   - Uses `/safety/media` endpoint (with fallback to `/fleet/cameras/media`)
   - Provides: latest camera still images from the last 24 hours
   - **If not enabled**: Returns `null` immediately, no API call is made
   - Reference: https://developers.samsara.com/reference/listuploadedmediabytimerange
   - **Important**: Requires API token with "Read Safety Events & Scores" permission and Safety license

4. **Diagnostics**: Always attempted (but may fail silently)
   - Uses `/fleet/vehicles/diagnostics` endpoint
   - May show "invalid id" errors if vehicle IDs don't match

## Data Flow

```
1. LiveMapService.getSnapshot()
   ↓
2. getSamsaraVehiclesWithTelemetry()
   ↓
3. Parallel API calls:
   - getSamsaraVehicles() ✅ Always called
   - getSamsaraVehicleLocations() ✅ Always called
   - getSamsaraVehicleStats() ⚠️ Only if SAMSARA_STATS_ENABLED=true
   - getSamsaraCameraMedia() ⚠️ Only if SAMSARA_CAMERA_MEDIA_ENABLED=true
   - getSamsaraVehicleDiagnostics() ✅ Always attempted
   ↓
4. Data mapped to trucks by vehicleId
   ↓
5. Attached to loads via truck.id matching
   ↓
6. Displayed in TruckDetailsPanel
```

## Troubleshooting Steps

### Step 1: Check Environment Variables

Verify these are set in your `.env.local`:

```bash
# Check if variables are set
echo $SAMSARA_STATS_ENABLED
echo $SAMSARA_CAMERA_MEDIA_ENABLED
```

**Important**: After adding environment variables, you MUST restart your Next.js dev server for changes to take effect.

### Step 2: Check Server Logs

Look for these messages in your server console:

- `[Samsara] Stats unavailable:` - Stats are disabled or failed
- `[Samsara] Camera media unavailable:` - Camera media is disabled or failed
- `Samsara API request error: Error: Samsara API error: {"message":"invalid id."}` - Vehicle ID mismatch

### Step 3: Verify Samsara API Access & Permissions

**Critical**: Your Samsara API token must have the following permissions:

1. **Vehicle Locations**: "Read Vehicles" permission ✅ (usually included by default)
2. **Vehicle Stats**: "Read Vehicles Statistics" permission ⚠️ (required for speed/fuel)
3. **Camera Media**: "Read Safety Events & Scores" permission ⚠️ (required for camera data)
4. **Vehicle Diagnostics**: "Read Vehicles" permission ✅ (usually included)

**To check/update permissions**:
1. Log into Samsara Dashboard
2. Go to Settings → API Tokens
3. Find your API token
4. Verify it has all required permissions listed above
5. If missing, create a new token with the required scopes

**Additional Requirements**:
- Camera media may require a **Safety license** in your Samsara account
- Some vehicles may not have cameras installed
- Vehicle Gateway (VG) must be properly installed and configured

### Step 4: Check Vehicle Matching

The system matches trucks to Samsara vehicles by:
1. Truck Number ↔ Vehicle Name
2. License Plate ↔ Vehicle License Plate
3. VIN ↔ Vehicle VIN

If matching fails, you'll only get location data from the load's route/geocoded addresses.

## Quick Fix

1. **Create `.env.local` file** in your project root (if it doesn't exist)

2. **Add these variables** to `.env.local`:
```env
SAMSARA_STATS_ENABLED=true
SAMSARA_CAMERA_MEDIA_ENABLED=true
```

3. **Restart your Next.js dev server** (NOT your whole system):
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again
   - Environment variables are loaded at server startup

4. **Refresh the Live Map page** in your browser

## About the Errors You're Seeing

### Source Map Warnings (Harmless)
```
Invalid source map. Only conformant source maps can be used...
```
These are **harmless warnings** from Next.js/Turbopack. They don't affect functionality and can be safely ignored. They're common in development mode.

### Samsara API "Not Found" Errors
```
Samsara API error: {"message":"Not Found"}
```
This means:
- The camera media endpoint may not be available for your Samsara account
- You may need a **Safety license** to access camera data
- The endpoint might require different permissions
- **This is handled gracefully** - the app will continue working, just without camera data

**Solution**: The code now handles 404 errors gracefully. Camera media will simply be unavailable if the endpoint doesn't exist for your account, but other data (location, speed, fuel) will still work.

## Expected Behavior After Fix

After enabling the environment variables, you should see:

- **Current Speed**: Shows actual speed from Samsara (e.g., "65 mph")
- **Fuel Level**: Shows fuel percentage with progress bar (e.g., "75%")
- **Latest Camera Feed**: Shows latest camera image if available

## Notes

- This is **NOT a webhook issue** - the system uses REST API polling
- Data is fetched on-demand when the Live Map loads
- Some trucks may not have camera/media if they don't have Samsara cameras installed
- Speed data may also come from location data (`location.speedMilesPerHour`) if stats are unavailable

