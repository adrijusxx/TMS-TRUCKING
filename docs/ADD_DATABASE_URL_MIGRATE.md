# How to Add DATABASE_URL_MIGRATE to Fix Migration Timeouts

## Problem
Prisma migrations timeout when using Neon's connection pooler because it doesn't support advisory locks.

## Solution
Add a direct connection string (without pooler) for migrations.

## Steps

### 1. Get Direct Connection String from Neon

1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details"
4. Choose "Direct connection" (NOT "Pooled connection")
5. Copy the connection string

It should look like:
```
postgresql://neondb_owner:password@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Note:** The hostname should NOT have `-pooler` in it.

### 2. Add to .env File

Edit your `.env` file and add:

```bash
# Application connection (with pooler - better for app performance)
DATABASE_URL="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Migration connection (direct - required for migrations)
DATABASE_URL_MIGRATE="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Important:** 
- `DATABASE_URL` keeps the `-pooler` (for app performance)
- `DATABASE_URL_MIGRATE` removes `-pooler` (for migrations)

### 3. Run Migration

Now you can run migrations using the script:

```bash
npm run db:migrate:deploy
```

Or manually:

```bash
DATABASE_URL_MIGRATE="your-direct-connection-string" npx prisma migrate deploy
```

## Quick Command to Add

On your VM, run:

```bash
# Edit .env
nano .env

# Add this line (replace with your direct connection string):
DATABASE_URL_MIGRATE="postgresql://neondb_owner:npg_b4YTB8ruqRif@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Save and exit (Ctrl+X, Y, Enter)

# Then run migration
npm run db:migrate:deploy
```

## Verify It Works

```bash
# Check that DATABASE_URL_MIGRATE is loaded
grep DATABASE_URL_MIGRATE .env

# Run migration
npm run db:migrate:deploy

# Should complete without timeout errors
```

## Why Two Connection Strings?

- **DATABASE_URL (pooler)**: Better for application connections (handles many concurrent connections)
- **DATABASE_URL_MIGRATE (direct)**: Required for migrations (supports advisory locks)

The Prisma config automatically uses `DATABASE_URL_MIGRATE` if it exists, otherwise falls back to `DATABASE_URL`.





