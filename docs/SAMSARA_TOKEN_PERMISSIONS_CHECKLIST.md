# Samsara API Token Permissions Checklist

**Important**: API access is NOT plan-based. All Samsara customers can use the API. Access is controlled by **token permissions and scopes**, not subscription tier.

## Required Permissions for Live Map View

After updating your token permissions, verify these specific permissions are enabled:

### ✅ Essential Permissions

1. **Read Vehicles** (or "Vehicles: Read")
   - Required for: Vehicle locations, basic vehicle info
   - Usually included by default

2. **Read Vehicles Statistics** (or "Vehicles Statistics: Read")
   - Required for: Speed, fuel level, odometer, engine hours
   - **Critical for speed/fuel data**

3. **Read Vehicles Trips** (or "Trips: Read")
   - Required for: Recent trip history
   - Optional but recommended

4. **Read Vehicles Diagnostics** (or "Diagnostics: Read")
   - Required for: Fault codes, check engine light status
   - Usually included with "Read Vehicles"

### ⚠️ Optional Permissions (for Camera Data)

5. **Read Safety Events & Scores** (or "Safety: Read")
   - Required for: Camera media/images
   - May also require Safety license in Samsara account

## How to Verify Permissions

### In Samsara Dashboard:
1. Go to **Settings** → **API Tokens**
2. Find your token (or create a new one)
3. Check the permission list
4. Look for the specific permissions listed above

### What You Should See:
- ✅ Read: 58 permissions (good - you have this)
- ✅ Write: 51 permissions (not needed for Live Map, but fine to have)
- ✅ Entire Organization scope (recommended)

## After Updating Permissions

### If You Created a New Token:
1. **Update `.env.local`**:
   ```env
   SAMSARA_API_KEY=your_new_token_here
   ```

2. **Restart Dev Server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Clear Cache** (optional):
   ```bash
   rm -rf .next
   npm run dev
   ```

### If You Updated Existing Token Permissions:
- Just restart your dev server
- No need to change `.env.local` if the token itself didn't change

## Testing After Permission Update

1. **Check Server Logs** for:
   - No more "Invalid stat type" errors
   - Successful API calls
   - Debug messages showing which endpoints work

2. **Test Live Map View**:
   - Select a truck
   - Check if speed/fuel data appears
   - Check if camera feed appears (if available)

3. **Expected Results**:
   - ✅ Location data: Should always work
   - ✅ Speed data: Should work if "Read Vehicles Statistics" is enabled
   - ✅ Fuel data: Should work if "Read Vehicles Statistics" is enabled
   - ⚠️ Camera data: May still not work if Safety license is missing

## Common Issues

### "Invalid stat type(s)" Error
- **Cause**: Stat type names don't match your API version
- **Solution**: Code now tries multiple variations automatically
- **Check**: Verify "Read Vehicles Statistics" permission is enabled

### "Not Found" Errors
- **Cause**: Feature not enabled in your Samsara account dashboard
- **Solution**: Handled gracefully, data just won't be available
- **Check**: Verify the feature is enabled in your Samsara dashboard (not about plan tier)
- **Note**: API access is available to all customers; missing features need to be enabled in your account

### No Data Showing
- **Check**: Environment variables are set correctly
- **Check**: Server was restarted after updating token
- **Check**: Token has "Entire Organization" scope
- **Check**: Vehicle Gateway (VG) is installed and working

## Permission Count vs Specific Permissions

**Important**: Having 58 read permissions is good, but the **specific permissions** matter more than the count.

Make sure these specific permissions are in your list:
- ✅ Read Vehicles
- ✅ Read Vehicles Statistics
- ✅ Read Vehicles Trips (optional)
- ✅ Read Safety Events & Scores (for camera data)

## Next Steps

1. ✅ Verify specific permissions listed above are enabled
2. ✅ Restart dev server if you updated the token
3. ✅ Test Live Map View
4. ✅ Check server logs for any remaining errors
5. ✅ If issues persist, check Samsara account licenses (Safety license for camera data)

