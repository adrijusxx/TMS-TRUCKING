# Storing Samsara API Key in Database

## Overview

The Samsara API key can be stored in **two places**:

1. **Database** (per-company, recommended for multi-tenant)
2. **Environment Variables** (global fallback)

The system checks the database first, then falls back to environment variables.

## How It Works

1. When `LiveMapService` or other services need the API key, they pass the `companyId`
2. The system checks the `Integration` table for a Samsara entry with that `companyId`
3. If found and active, it uses the API key from the database
4. If not found, it falls back to `SAMSARA_API_KEY` environment variable

## Storing API Key in Database

### Option 1: Using Prisma Studio (GUI)

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Navigate to the `Integration` table

3. Create a new record or edit existing:
   - **companyId**: Your company ID
   - **provider**: `SAMSARA`
   - **isActive**: `true`
   - **apiKey**: Your Samsara API key
   - **apiSecret**: (optional) Your webhook secret

4. Save the record

### Option 2: Using SQL

```sql
INSERT INTO "Integration" (
  "id",
  "companyId",
  "provider",
  "isActive",
  "apiKey",
  "apiSecret",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,  -- or use a CUID generator
  'your-company-id-here',
  'SAMSARA',
  true,
  'your-samsara-api-key-here',
  'your-webhook-secret-here',  -- optional
  NOW(),
  NOW()
)
ON CONFLICT ("companyId", "provider")
DO UPDATE SET
  "apiKey" = EXCLUDED."apiKey",
  "apiSecret" = EXCLUDED."apiSecret",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();
```

### Option 3: Using API Endpoint (if available)

If you have an API endpoint for managing integrations, use that to store the key.

## Verification

After storing the API key in the database:

1. **Restart your Next.js server** (important!)
2. Check server logs for:
   - ✅ `[Samsara] Using API key from database for company: [companyId]`
   - ❌ `[Samsara] API key not configured` - means neither database nor env var has the key

3. Test the Live Map - it should now load data using the database API key

## Priority Order

1. **Database** (`Integration` table with `companyId` + `provider='SAMSARA'`)
2. **Environment Variable** (`SAMSARA_API_KEY` in `.env.local`)

## Troubleshooting

### "API key not configured" error

- Check database: `SELECT * FROM "Integration" WHERE "provider" = 'SAMSARA' AND "companyId" = 'your-company-id'`
- Check environment variable: `echo $SAMSARA_API_KEY` (or check `.env.local`)
- Restart server after making changes

### "Authentication failed" error

- API key in database might be invalid
- Generate a new API key in Samsara dashboard
- Update the database record with the new key
- Restart server

### Still using old API key

- Clear Next.js cache: `rm -rf .next`
- Restart server
- Hard refresh browser: `Ctrl+Shift+R`

## Benefits of Database Storage

- ✅ Per-company API keys (multi-tenant support)
- ✅ Can update without restarting server (if you implement a refresh mechanism)
- ✅ Better for production deployments
- ✅ Can track which company is using which API key

## Benefits of Environment Variables

- ✅ Simpler setup for single-company deployments
- ✅ Works immediately after server restart
- ✅ No database dependency

## Recommendation

- **Development**: Use environment variables (`.env.local`)
- **Production**: Use database (per-company keys, better security)



