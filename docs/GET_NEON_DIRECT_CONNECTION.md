# How to Get Neon Direct Connection String

## Problem
The guessed connection strings didn't work. You need the **exact** direct connection string from Neon Dashboard.

## Step-by-Step Instructions

### 1. Go to Neon Dashboard
- Open: https://console.neon.tech
- Log in if needed

### 2. Select Your Project
- Click on your project (should be the one with database "neondb")

### 3. Open Connection Details
- Look for **"Connection Details"** button/link
- Or go to **Settings** → **Connection Details**
- Or look for a **"Connect"** button

### 4. Select Direct Connection
- You should see connection type options:
  - **"Pooled connection"** (what you're currently using)
  - **"Direct connection"** (what you need)
- Click on **"Direct connection"** tab/option

### 5. Copy the Connection String
- You'll see a connection string that looks like:
  ```
  postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
  ```
- **Copy the ENTIRE string** (including all parameters)
- It might have additional parameters like `&channel_binding=require`

### 6. Update Your .env File

On your VM:

```bash
nano .env
```

Add or update this line (paste your exact connection string):

```bash
DATABASE_URL_MIGRATE="postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**Important:**
- Use the EXACT string from Neon Dashboard
- Keep the quotes around it
- Make sure there are no extra spaces

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 7. Test the Connection

```bash
npm run db:test-connection
```

This should show that `DATABASE_URL_MIGRATE` connection works.

### 8. Run Migration

```bash
npm run db:migrate:deploy
```

## What to Look For

The direct connection string should:
- ✅ NOT have `-pooler` in the hostname
- ✅ Have the correct hostname (might be different from pooler)
- ✅ Include `?sslmode=require` (or similar SSL parameters)
- ✅ Match the format shown in Neon Dashboard exactly

## Common Issues

### Can't Find Connection Details?
- Look for a "Connect" or "Connection" button
- Check the project overview page
- Look in Settings/Configuration section

### Connection String Format
Neon might show it in different formats:
- **Connection string format**: `postgresql://user:pass@host/db?params`
- **Connection parameters**: Separate fields for host, port, database, etc.

If it's in separate fields, combine them like:
```
postgresql://username:password@hostname:port/database?sslmode=require
```

### Still Having Issues?

1. **Check Neon Dashboard** for any connection restrictions or IP allowlists
2. **Verify your project is active** (not paused)
3. **Check if there are multiple endpoints** - try each one
4. **Contact Neon support** if the direct connection option isn't available

## Quick Command Reference

```bash
# Get instructions
npm run db:get-neon-connection

# Test connections
npm run db:test-connection

# Run migration
npm run db:migrate:deploy
```

## Alternative: Use Pooler with Workaround

If you absolutely cannot get the direct connection to work, you can try:

1. **Increase timeout** in Prisma config (not recommended)
2. **Run migrations during low-traffic periods**
3. **Use Neon's migration tool** if available
4. **Contact Neon support** about advisory lock support in pooler

But the best solution is to use the direct connection string from Neon Dashboard.



