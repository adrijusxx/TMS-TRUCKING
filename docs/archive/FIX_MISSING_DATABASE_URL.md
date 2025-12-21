# Fix: Missing DATABASE_URL

## Problem
`DATABASE_URL` is not set in your `.env` file. This is required for:
- Application database connections
- Testing connections
- Normal Prisma operations

## Solution

### Step 1: Check Your .env File

```bash
cat .env | grep DATABASE
```

You should see both:
- `DATABASE_URL` (for application - with pooler)
- `DATABASE_URL_MIGRATE` (for migrations - direct connection)

### Step 2: Add DATABASE_URL to .env

Edit your `.env` file:

```bash
nano .env
```

Add or update `DATABASE_URL` with your pooler connection string:

```bash
# Application connection (with pooler - for better performance)
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Migration connection (direct - for migrations, no pooler)
DATABASE_URL_MIGRATE="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Important:**
- `DATABASE_URL` should have `-pooler` in hostname (for app performance)
- `DATABASE_URL_MIGRATE` should NOT have `-pooler` (for migrations)

### Step 3: Verify Both Are Set

```bash
grep DATABASE .env
```

You should see both variables.

### Step 4: Test Connections

```bash
npm run db:test-connection
```

Both connections should work.

### Step 5: Run Migration

```bash
npm run db:migrate:deploy
```

## Why Both Are Needed

- **DATABASE_URL**: Used by your Next.js application for all database queries (uses pooler for better performance)
- **DATABASE_URL_MIGRATE**: Used only for migrations (uses direct connection to avoid advisory lock timeouts)

## Quick Fix Command

If you know your pooler connection string, add it quickly:

```bash
# Edit .env
nano .env

# Add this line (replace with your actual pooler connection string):
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Save: Ctrl+X, Y, Enter

# Test
npm run db:test-connection
```


