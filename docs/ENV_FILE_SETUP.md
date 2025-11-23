# Environment File Setup Guide

## Correct File Names

For Next.js projects, use these exact file names (case-sensitive):

1. **`.env.local`** - Recommended for local development
   - Takes highest priority
   - Ignored by git (safe for secrets)
   - Use this for your Samsara API keys

2. **`.env`** - For default values (can be committed to git)
   - Lower priority than `.env.local`
   - Usually contains non-sensitive defaults

3. **`.env.development`** - Development-specific
4. **`.env.production`** - Production-specific

## Common Mistakes

❌ **Wrong**: `.env (1)` - Has spaces and parentheses  
❌ **Wrong**: `.env.local.txt` - Has .txt extension  
❌ **Wrong**: `env.local` - Missing the leading dot  
❌ **Wrong**: `.env.local (1)` - Has spaces and parentheses  

✅ **Correct**: `.env.local` - Exact name, no spaces, no extension

## Required Samsara Environment Variables

Create or update `.env.local` in your project root with:

```env
# Samsara API Configuration
SAMSARA_API_KEY=your_api_key_here

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

## How to Fix

### If your file is named incorrectly:

1. **Rename the file**:
   - If you have `.env (1)` or similar, rename it to `.env.local`
   - Remove any spaces, parentheses, or extra extensions

2. **Or create a new file**:
   ```bash
   # In your project root directory
   touch .env.local
   # Then edit it with your values
   ```

3. **Verify the file location**:
   - Must be in the **root** of your project (same level as `package.json`)
   - Not in a subdirectory
   - Full path should be: `C:\Users\Adrian\Documents\GITHUB-PROJECTS\TMS-TRUCKING\.env.local`

## Verification Steps

1. **Check file exists**:
   ```bash
   # Windows PowerShell
   Test-Path .env.local
   
   # Should return: True
   ```

2. **Check file name** (no hidden characters):
   ```bash
   # Windows PowerShell
   Get-ChildItem -Force | Where-Object { $_.Name -like ".env*" }
   ```

3. **Restart your dev server**:
   - Environment variables are loaded at startup
   - Changes require a server restart

4. **Verify variables are loaded**:
   Add this temporarily to check:
   ```typescript
   // In any API route or server component
   console.log('SAMSARA_STATS_ENABLED:', process.env.SAMSARA_STATS_ENABLED);
   console.log('SAMSARA_CAMERA_MEDIA_ENABLED:', process.env.SAMSARA_CAMERA_MEDIA_ENABLED);
   ```

## File Location

```
TMS-TRUCKING/
├── .env.local          ← Should be here (root directory)
├── package.json
├── next.config.js
├── app/
├── components/
└── ...
```

## Important Notes

- **No quotes needed**: `SAMSARA_STATS_ENABLED=true` (not `"true"`)
- **No spaces around `=`**: `KEY=value` (not `KEY = value`)
- **Case sensitive**: `SAMSARA_STATS_ENABLED` (all caps)
- **Restart required**: Always restart `npm run dev` after changing `.env.local`

## Troubleshooting

If variables still don't work after fixing the filename:

1. **Check for typos** in variable names
2. **Ensure no BOM** (Byte Order Mark) - save as UTF-8 without BOM
3. **Check for trailing spaces** in values
4. **Verify Next.js version** - older versions may have different behavior
5. **Clear Next.js cache**: Delete `.next` folder and restart

