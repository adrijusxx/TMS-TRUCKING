# Fix: Neon Direct Connection for Migrations

## Error
```
Error: P1001: Can't reach database server at `ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech:5432`
```

## Problem
The direct connection string is missing the port number or has incorrect format.

## Solution

### Step 1: Get Correct Direct Connection String from Neon

1. Go to https://console.neon.tech
2. Select your project
3. Click **"Connection Details"**
4. Select **"Direct connection"** (NOT "Pooled connection")
5. Copy the **full connection string**

It should look like one of these formats:

**Format 1 (with port):**
```
postgresql://neondb_owner:password@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
```

**Format 2 (connection string from dashboard):**
```
postgresql://neondb_owner:password@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Update .env File

Edit your `.env` file:

```bash
nano .env
```

Make sure `DATABASE_URL_MIGRATE` has the **complete** connection string from Neon Dashboard.

**Important differences:**

| Connection Type | Hostname | Port | Use Case |
|----------------|----------|------|----------|
| **Pooled** | `ep-xxx-pooler.xxx.neon.tech` | Usually not needed | Application connections |
| **Direct** | `ep-xxx.xxx.neon.tech` | `:5432` (may be required) | Migrations |

### Step 3: Verify Connection String Format

Your `DATABASE_URL_MIGRATE` should:
- ✅ NOT have `-pooler` in hostname
- ✅ Include port `:5432` if provided by Neon
- ✅ Include `?sslmode=require` at the end
- ✅ Have the correct password

Example:
```bash
# ✅ CORRECT - Direct connection (for migrations)
DATABASE_URL_MIGRATE="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# ✅ CORRECT - Direct connection without explicit port (Neon handles it)
DATABASE_URL_MIGRATE="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ❌ WRONG - Has pooler (will timeout)
DATABASE_URL_MIGRATE="postgresql://...@ep-xxx-pooler.xxx.neon.tech/..."
```

### Step 4: Test Connection

```bash
# Test the connection
npm run db:test-connection

# If that works, try migration
npm run db:migrate:deploy
```

## Alternative: Use Connection String from Neon Dashboard

The easiest way is to copy the **exact** connection string from Neon Dashboard:

1. Go to Neon Dashboard → Your Project → Connection Details
2. Select "Direct connection"
3. Copy the **entire** connection string (it will include all parameters)
4. Paste it directly into `.env` as `DATABASE_URL_MIGRATE`

Example from Neon Dashboard:
```
postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Troubleshooting

### If connection still fails:

1. **Check if port is needed:**
   ```bash
   # Try with port
   DATABASE_URL_MIGRATE="postgresql://...@host:5432/db?sslmode=require"
   
   # Or without port (let Neon handle it)
   DATABASE_URL_MIGRATE="postgresql://...@host/db?sslmode=require"
   ```

2. **Verify credentials:**
   ```bash
   # Check if password has special characters that need encoding
   # Special characters in passwords need URL encoding:
   # @ = %40
   # : = %3A
   # / = %2F
   # etc.
   ```

3. **Test with psql (if available):**
   ```bash
   psql "$DATABASE_URL_MIGRATE" -c "SELECT 1;"
   ```

4. **Check Neon Dashboard:**
   - Verify the project is active
   - Check if there are any connection limits
   - Verify the endpoint is correct

## Quick Fix Command

If you have the connection string from Neon Dashboard, just update `.env`:

```bash
# Edit .env
nano .env

# Add or update DATABASE_URL_MIGRATE with the EXACT string from Neon Dashboard
# (Copy-paste the entire connection string from Neon)

# Save and test
npm run db:test-connection
```


