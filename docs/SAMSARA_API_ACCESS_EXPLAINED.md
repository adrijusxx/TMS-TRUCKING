# Samsara API Access Explained

## Key Understanding: API Access is NOT Plan-Based

**Important**: The Samsara API is available to ALL customers, regardless of subscription plan. Access is controlled by **API token permissions and scopes**, not by your plan tier.

## How API Access Works

### 1. Token Permissions & Scopes

When creating an API token in your Samsara dashboard, you select:

#### Permission Level:
- **Full Admin** - Access to all endpoints (GET, POST, PATCH, DELETE)
- **Read-Only Admin** - Access only to GET endpoints (retrieve data only)

#### Granular Scopes:
You can limit access to specific data categories:
- ✅ **Routes** (Read/Write)
- ✅ **Compliance** (Read/Write)
- ✅ **Addresses** (Read/Write)
- ✅ **Drivers** (Read/Write)
- ✅ **Vehicles** (Read/Write) - **REQUIRED for Live Map**
- ✅ **Documents** (Read/Write)
- ✅ **Safety** (Read/Write) - Required for camera media
- ✅ **Sensors** (Read/Write)
- ✅ **Assets** (Read/Write)
- ✅ **Fuel & Energy** (Read/Write)
- And many more...

#### Tag Access:
- Limit the token to only access data within specific organizational tags

### 2. Feature Availability in Your Dashboard

The real limiting factor is what features you have **enabled** in your Samsara account:

- If you don't have the "Routes" feature → Routes API won't return meaningful data
- If you don't have dash cams → Safety Events API won't have video data
- If you don't have ELD compliance enabled → HOS endpoints may not return data
- If you don't have Safety license → Camera media endpoints won't work

### 3. How to Check Your Access

#### Step 1: Check Your API Token
1. Log into your Samsara dashboard
2. Go to **Settings → API Tokens**
3. View your existing token or create a new one
4. Check which scopes are:
   - ✅ Available to select
   - ❌ Grayed out (those features may not be in your plan)

#### Step 2: Test the API Endpoints

Test basic vehicle access:
```bash
curl --request GET 'https://api.samsara.com/fleet/vehicles' \
  --header 'Authorization: Bearer YOUR_TOKEN'
```

If you get:
- ✅ **200 OK** → Token has permission
- ❌ **403 Forbidden** → Token doesn't have permission for that endpoint
- ❌ **401 Unauthorized** → Token is invalid or expired

#### Step 3: Check Required Permissions for Live Map

For the Live Map to work, your token needs:

**Minimum Required:**
- ✅ **Vehicles** → Read (to get vehicle list and locations)
- ✅ **Read-Only Admin** or **Full Admin** permission level

**Optional (for enhanced features):**
- ✅ **Safety** → Read (for camera media)
- ✅ **Compliance** → Read (for HOS data)
- ✅ **Routes** → Read (for route data)

### 4. Common Issues and Solutions

#### Issue: "Endpoint not found" (404)
**Cause**: Feature not enabled in your Samsara account
**Solution**: 
- Check if the feature is enabled in your dashboard
- Contact Samsara support to enable the feature
- Or upgrade your subscription if needed

#### Issue: "Forbidden" (403)
**Cause**: API token doesn't have the required scope
**Solution**:
1. Go to Settings → API Tokens
2. Edit your token
3. Add the missing scope (e.g., "Vehicles - Read")
4. Save and use the new token

#### Issue: "Invalid stat type(s)"
**Cause**: Stats endpoint may require specific permissions or the feature isn't available
**Solution**:
- Check if "Vehicles Statistics" scope is available
- The Live Map will still work using location data (which includes speed)

#### Issue: "No vehicles or locations returned"
**Cause**: Token doesn't have "Vehicles - Read" permission
**Solution**:
1. Verify token has "Vehicles" scope enabled
2. Check token has "Read-Only Admin" or "Full Admin" permission level
3. Regenerate token if needed

### 5. Creating/Updating Your API Token

#### To Create a New Token:
1. Go to **Settings → API Tokens** in Samsara dashboard
2. Click **"Create Token"**
3. Select **Permission Level**:
   - For Live Map: **Read-Only Admin** is sufficient
4. Select **Scopes**:
   - ✅ **Vehicles** → Read (REQUIRED)
   - ✅ **Safety** → Read (optional, for camera)
   - ✅ **Compliance** → Read (optional, for HOS)
5. Set **Tag Access** (if needed):
   - Leave empty for all vehicles
   - Or select specific tags
6. Click **"Create"**
7. **Copy the token immediately** (you won't see it again!)
8. Update your `.env.local`:
   ```env
   SAMSARA_API_KEY=your_new_token_here
   ```
9. **Restart your server**

#### To Update an Existing Token:
1. Go to **Settings → API Tokens**
2. Find your token
3. Click **"Edit"**
4. Add missing scopes
5. Save changes
6. **Note**: You may need to regenerate the token if scopes were changed

### 6. Contact Samsara Support

If specific features/endpoints are unavailable, you may need to:

- **Upgrade your Samsara subscription** to include that feature
- **Enable certain modules** in your account
- **Contact Samsara support** to verify which features are included in your plan

### 7. Quick Checklist for Live Map

Before troubleshooting, verify:

- [ ] API token is set in `.env.local` as `SAMSARA_API_KEY`
- [ ] Token has **"Vehicles - Read"** scope enabled
- [ ] Token has **"Read-Only Admin"** or **"Full Admin"** permission level
- [ ] Server was restarted after updating the token
- [ ] Token is not expired or revoked
- [ ] Test API call returns 200 OK (not 401/403)

### 8. Testing Your Token

Use this command to test your token:

```bash
# Test vehicle access
curl --request GET 'https://api.samsara.com/fleet/vehicles' \
  --header 'Authorization: Bearer YOUR_TOKEN'

# Test location access
curl --request GET 'https://api.samsara.com/fleet/locations?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z' \
  --header 'Authorization: Bearer YOUR_TOKEN'
```

## Summary

**Bottom Line**: 
- The API is available to all customers
- Access depends on **token permissions/scopes**, not plan tier
- Data availability depends on **features enabled** in your account
- Most issues are caused by missing token scopes, not plan limitations

**For Live Map to Work**:
1. Token must have **"Vehicles - Read"** scope
2. Token must have **"Read-Only Admin"** or higher permission
3. Vehicles feature must be enabled in your Samsara account

