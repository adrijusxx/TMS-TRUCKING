# Troubleshooting: Live Map Not Showing Data

## Issue: Nothing Showing on Live Map After Updating API Key

### Step 1: Verify API Key is Set Correctly

1. **Check `.env.local` file exists** in project root:
   ```bash
   # Windows PowerShell
   Test-Path .env.local
   ```

2. **Verify API key format** in `.env.local`:
   ```env
   SAMSARA_API_KEY=your_api_key_here
   ```
   - No quotes around the value
   - No spaces around the `=`
   - Key should be on a single line

3. **Check for typos**:
   - Should be `SAMSARA_API_KEY` (all caps, with underscores)
   - Not `SAMSARA_APIKEY` or `SAMSARAAPIKEY`

### Step 2: Restart Dev Server (CRITICAL)

**Environment variables are loaded at server startup.** After updating `.env.local`:

1. **Stop the current server**:
   - Press `Ctrl+C` in the terminal running `npm run dev`

2. **Start the server again**:
   ```bash
   npm run dev
   ```

3. **Wait for server to fully start** (look for "Ready" message)

4. **Refresh the browser** (hard refresh: `Ctrl+Shift+R` or `Ctrl+F5`)

### Step 3: Check Server Logs

After restarting, look for these messages:

#### ✅ Good Signs:
- No "Samsara API key not configured" warnings
- Successful API calls
- Data being returned

#### ❌ Bad Signs:
- `[Samsara] API key not configured` - API key not loaded
- `[Samsara] Authentication failed` - API key is invalid
- `[Samsara] Access forbidden` - API key lacks permissions
- `No vehicles or locations returned` - API key not working

### Step 4: Verify API Key is Valid

1. **Check Samsara Dashboard**:
   - Go to Settings → API Tokens
   - Verify the token is active
   - Check it has "Read Vehicles" permission

2. **Test API Key Manually** (optional):
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.samsara.com/fleet/vehicles
   ```

### Step 5: Clear Next.js Cache

If issues persist after restart:

```bash
# Delete .next folder
rm -rf .next

# Restart server
npm run dev
```

## Common Issues

### Issue: "Samsara API key not configured"
**Solution**: 
- Verify `.env.local` exists in project root
- Check API key is set correctly
- Restart dev server

### Issue: "Authentication failed" (401 error)
**Solution**:
- API key is invalid or expired
- Generate a new token in Samsara dashboard
- Update `.env.local` and restart server

### Issue: "Access forbidden" (403 error)
**Solution**:
- API key doesn't have required permissions
- Check token has "Read Vehicles" permission
- May need "Read Vehicles Statistics" for speed/fuel data

### Issue: No vehicles/locations returned
**Solution**:
- API key might be for different organization
- Check token has "Entire Organization" scope
- Verify vehicles exist in Samsara account

## Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] `SAMSARA_API_KEY=...` is set correctly (no quotes, no spaces)
- [ ] Dev server was restarted after updating API key
- [ ] Browser was refreshed (hard refresh recommended)
- [ ] API key is active in Samsara dashboard
- [ ] API key has "Read Vehicles" permission
- [ ] API key has "Entire Organization" scope
- [ ] No authentication errors in server logs

## Still Not Working?

1. **Check browser console** for frontend errors
2. **Check server logs** for backend errors
3. **Verify API key** in Samsara dashboard is active
4. **Try generating a new API key** and updating `.env.local`
5. **Clear Next.js cache** and restart



