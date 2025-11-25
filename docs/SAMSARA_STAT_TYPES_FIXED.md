# Samsara Stat Types - Fixed

## Problem Identified

The code was using **invalid stat types** that don't exist in Samsara's API:
- ❌ `checkEngineLightOn` - **Does NOT exist**
- ❌ `gpsSpeed` - May not be available
- ❌ `fuelLevel` - Wrong field name
- ❌ `obdOdometerMiles` - Wrong field name

## Solution Applied

### ✅ Fixed Stat Types

Replaced invalid types with **valid Samsara API stat types**:

| ❌ Invalid | ✅ Valid | Notes |
|---|---|---|
| `checkEngineLightOn` | `faultCodes` | Use `faultCodes` and extract `milStatus` |
| `gpsSpeed` | `ecuSpeedMph` | More reliable speed from ECU |
| `fuelLevel` | `fuelPercents` | Array of fuel percentages |
| `obdOdometerMiles` | `obdOdometerMeters` | In meters, convert to miles |
| `engineHours` | `obdEngineSeconds` or `syntheticEngineSeconds` | In seconds, convert to hours |
| `engineState` | `engineStates.state` | Object with state property |

### Valid Stat Types (From Samsara API)

These are the **actual valid stat types** you can use:

- `ecuSpeedMph` - Speed from ECU (most reliable)
- `fuelPercents` - Fuel level (array)
- `obdOdometerMeters` - Odometer in meters
- `engineRpm` - Engine RPM
- `engineStates` - Engine state (On/Off/Idle)
- `faultCodes` - Diagnostic trouble codes (includes `milStatus`)
- `gps` - GPS data
- `gpsDistanceMeters` - GPS distance
- `gpsOdometerMeters` - GPS odometer
- `obdEngineSeconds` - Engine hours in seconds
- `syntheticEngineSeconds` - Synthetic engine hours
- `engineCoolantTemperatureMilliC` - Coolant temperature
- `engineOilPressureKPa` - Oil pressure
- `batteryMilliVolts` - Battery voltage
- And many more...

## Code Changes

### 1. Diagnostics Function (`getSamsaraVehicleDiagnostics`)

**Before**:
```typescript
params.append('types', 'checkEngineLightOn,faultCodes'); // ❌ Invalid
```

**After**:
```typescript
params.append('types', 'faultCodes'); // ✅ Valid
// Extract milStatus from faultCodes response
const milStatus = entry.milStatus || entry.faultCodes?.milStatus;
const checkEngineLightOn = milStatus === 'On' || milStatus === true;
```

### 2. Stats Function (`getSamsaraVehicleStats`)

**Before**:
```typescript
// Was returning null immediately
return null; // ❌ Never tried valid types
```

**After**:
```typescript
const validStatTypes = [
  'ecuSpeedMph',      // Speed
  'fuelPercents',     // Fuel level
  'obdOdometerMeters', // Odometer
  'engineRpm',         // Engine RPM
  'engineStates',      // Engine state
];
// Actually tries the API with valid types ✅
```

### 3. Data Processing (`live-map-service.ts`)

**Before**:
```typescript
const speed = entry.gpsSpeed ?? entry.currentSpeed; // ❌ Wrong field
const fuelPercent = entry.fuelLevel; // ❌ Wrong field
const odometerMiles = entry.obdOdometerMiles; // ❌ Wrong field
```

**After**:
```typescript
const speed = entry.ecuSpeedMph ?? entry.gpsSpeed; // ✅ Correct field
// fuelPercents is an array
const fuelPercent = Array.isArray(entry.fuelPercents) 
  ? entry.fuelPercents[0] 
  : entry.fuelLevel;
// obdOdometerMeters is in meters, convert to miles
const odometerMiles = entry.obdOdometerMeters 
  ? entry.obdOdometerMeters * 0.000621371 
  : entry.obdOdometerMiles;
// engineStates is an object
const engineState = entry.engineStates?.state ?? entry.engineState;
// engineHours from seconds
const engineHours = entry.obdEngineSeconds 
  ? entry.obdEngineSeconds / 3600 
  : entry.engineHours;
```

## How `faultCodes` Works

The `faultCodes` stat type returns diagnostic trouble codes (DTCs) with a `milStatus` field:

```typescript
{
  vehicleId: "123",
  faultCodes: [
    {
      code: "P0301",
      description: "Cylinder 1 Misfire",
      milStatus: "On" // ← This tells you check engine light is on
    }
  ],
  milStatus: "On" // ← Or at top level
}
```

**To determine check engine light**:
- Check `milStatus === 'On'` (at top level or in fault codes)
- If any fault code has `milStatus === 'On'`, check engine light is on
- If `faultCodes` array has items, there are active faults

## Expected Results

After these fixes:

✅ **No more "Invalid stat type(s)" errors**
✅ **Stats endpoint will actually work** (if available in your account)
✅ **Check engine light status** extracted from `faultCodes.milStatus`
✅ **Speed data** from `ecuSpeedMph` (more reliable)
✅ **Fuel data** from `fuelPercents` array
✅ **Odometer** from `obdOdometerMeters` (converted to miles)

## Testing

After restarting your server, you should see:

- ✅ Successful stats API calls (if endpoint is available)
- ✅ No "Invalid stat type" errors
- ✅ Speed, fuel, and odometer data showing in Live Map
- ✅ Check engine light status working correctly

## Summary

✅ **Fixed**: Replaced `checkEngineLightOn` with `faultCodes`
✅ **Fixed**: Using valid stat types (`ecuSpeedMph`, `fuelPercents`, etc.)
✅ **Fixed**: Proper data extraction and conversion
✅ **Fixed**: Handling array responses (`fuelPercents`)
✅ **Fixed**: Unit conversions (meters → miles, seconds → hours)

The code now uses **only valid Samsara API stat types**!



