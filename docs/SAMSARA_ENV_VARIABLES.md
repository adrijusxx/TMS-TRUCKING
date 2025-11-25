# Samsara Environment Variables Guide

## Overview

These environment variables control **optional features** in the Samsara integration. They are **NOT required** for the Live Map to work - the map will show trucks and locations even if these are not set.

## Core Required Variables

### `SAMSARA_API_KEY` (REQUIRED)
- **Purpose**: Your Samsara API key for authentication
- **Location**: `.env.local` or database `Integration` table
- **Required**: Yes - without this, nothing will work
- **Example**: `SAMSARA_API_KEY=samsara_abc123xyz`

### `SAMSARA_WEBHOOK_SECRET` (Optional)
- **Purpose**: Secret for verifying Samsara webhook signatures
- **Required**: No - only needed if using webhooks
- **Example**: `SAMSARA_WEBHOOK_SECRET=your_webhook_secret`

## Optional Feature Flags

These flags control optional features. **By default, all features are ENABLED** (will attempt to fetch data). Only set them to `false` if you want to explicitly disable a feature.

### `SAMSARA_STATS_ENABLED` (Optional)
- **Purpose**: Enable/disable vehicle stats (speed, fuel, odometer)
- **Default**: Enabled (will try to fetch if not set)
- **Values**: 
  - Not set or `true` = Try to fetch stats
  - `false` = Skip stats entirely
- **Note**: Even if enabled, stats may not be available depending on your Samsara plan
- **Example**: `SAMSARA_STATS_ENABLED=true` (or omit to enable by default)

### `SAMSARA_CAMERA_MEDIA_ENABLED` (Optional)
- **Purpose**: Enable/disable camera media (forward-facing, driver-facing cameras)
- **Default**: Enabled (will try to fetch if not set)
- **Values**:
  - Not set or `true` = Try to fetch camera media
  - `false` = Skip camera media entirely
- **Note**: Requires Safety license and camera hardware
- **Example**: `SAMSARA_CAMERA_MEDIA_ENABLED=true` (or omit to enable by default)

### `SAMSARA_CAMERA_MEDIA_TYPES` (Optional)
- **Purpose**: Specify which camera types to fetch
- **Default**: `forwardFacing,driverFacing`
- **Example**: `SAMSARA_CAMERA_MEDIA_TYPES=forwardFacing,driverFacing`

### `SAMSARA_TRIPS_ENABLED` (Optional)
- **Purpose**: Enable/disable trip data
- **Default**: Enabled (will try to fetch if not set)
- **Values**:
  - Not set or `true` = Try to fetch trips
  - `false` = Skip trips entirely
- **Example**: `SAMSARA_TRIPS_ENABLED=true` (or omit to enable by default)

### `SAMSARA_TRIPS_LIMIT` (Optional)
- **Purpose**: Number of recent trips to fetch per vehicle
- **Default**: `3`
- **Example**: `SAMSARA_TRIPS_LIMIT=5`

## Important Notes

### ✅ What Works Without These Flags

Even if you don't set any of the optional flags, the Live Map will still:
- ✅ Show trucks on the map
- ✅ Show truck locations
- ✅ Show truck headings/directions
- ✅ Show routes and loads
- ✅ Show basic truck information

### ⚠️ What Requires These Flags

These features are **optional** and won't break the map if unavailable:
- Speed data (can come from locations if stats unavailable)
- Fuel level (requires stats endpoint)
- Camera feeds (requires Safety license)
- Trip history (nice-to-have feature)

### 🔧 Behavior Changes

**Before (Old Behavior)**:
- If flag not set = Feature disabled (returns `null`)
- Required `SAMSARA_STATS_ENABLED=true` to enable

**After (New Behavior)**:
- If flag not set = Feature enabled (tries to fetch)
- Only disabled if `SAMSARA_STATS_ENABLED=false`

## Recommended `.env.local` Setup

### Minimal Setup (Just API Key)
```env
# Required
SAMSARA_API_KEY=your_api_key_here

# Optional - omit these to enable by default
# SAMSARA_STATS_ENABLED=true
# SAMSARA_CAMERA_MEDIA_ENABLED=true
# SAMSARA_TRIPS_ENABLED=true
```

### Full Setup (All Features Enabled)
```env
# Required
SAMSARA_API_KEY=your_api_key_here

# Optional Features (all enabled by default, but explicit is clearer)
SAMSARA_STATS_ENABLED=true
SAMSARA_CAMERA_MEDIA_ENABLED=true
SAMSARA_CAMERA_MEDIA_TYPES=forwardFacing,driverFacing
SAMSARA_TRIPS_ENABLED=true
SAMSARA_TRIPS_LIMIT=3
```

### Minimal Setup (Disable Optional Features)
```env
# Required
SAMSARA_API_KEY=your_api_key_here

# Disable optional features to reduce API calls
SAMSARA_STATS_ENABLED=false
SAMSARA_CAMERA_MEDIA_ENABLED=false
SAMSARA_TRIPS_ENABLED=false
```

## Troubleshooting

### "Nothing showing on map"

**This is NOT caused by these flags!** These flags only affect optional features.

Check instead:
1. ✅ `SAMSARA_API_KEY` is set correctly
2. ✅ API key is valid and has permissions
3. ✅ Server was restarted after updating `.env.local`
4. ✅ Check server logs for authentication errors

### "No speed/fuel data showing"

Possible causes:
1. `SAMSARA_STATS_ENABLED=false` (explicitly disabled)
2. Stats endpoint not available for your Samsara plan
3. API key doesn't have "Read Vehicles Statistics" permission

**Solution**: Speed data will still come from vehicle locations even if stats are disabled.

### "No camera feed showing"

Possible causes:
1. `SAMSARA_CAMERA_MEDIA_ENABLED=false` (explicitly disabled)
2. No Safety license in Samsara account
3. No cameras installed on vehicles
4. API key doesn't have camera permissions

**Solution**: Camera feeds are optional - map will still work without them.

## Summary

- **Required**: Only `SAMSARA_API_KEY`
- **Optional Flags**: All default to enabled (will try to fetch)
- **To Disable**: Set flag to `false` (e.g., `SAMSARA_STATS_ENABLED=false`)
- **Map Will Work**: Even if all optional features are disabled or unavailable



