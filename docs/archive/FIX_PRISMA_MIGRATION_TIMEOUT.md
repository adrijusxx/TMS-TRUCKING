# Fix: Prisma Migration Timeout (Advisory Lock)

## Error
```
Error: P1002
The database server was reached but timed out.
Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)). Timeout: 10000ms.
```

## Root Cause
This happens when Prisma tries to acquire an advisory lock on PostgreSQL, but:
1. **Connection Pooler Issue**: Neon's pooler doesn't support advisory locks well
2. **Another Migration Running**: Another process is holding the lock
3. **Stale Lock**: Previous migration failed and left a lock
4. **Network Timeout**: Connection is too slow

## Solutions (Try in Order)

### Solution 1: Use Direct Connection for Migrations (RECOMMENDED)

Neon's connection pooler (`-pooler`) doesn't support advisory locks. Use direct connection for migrations:

```bash
# 1. Get direct connection string from Neon Dashboard
# Go to: https://console.neon.tech → Your Project → Connection Details
# Use "Direct connection" (not "Pooled connection")

# 2. Create a migration-specific DATABASE_URL
# In your .env, add:
DATABASE_URL_MIGRATE="postgresql://neondb_owner:password@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"
# Note: No "-pooler" in hostname

# 3. Run migration with direct connection
DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma migrate deploy
```

### Solution 2: Increase Timeout in Prisma Config

Update `prisma.config.ts` to increase timeout:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
  // Add timeout configuration
  migrate: {
    timeout: 30000, // 30 seconds instead of 10
  },
});
```

### Solution 3: Check for Running Migrations

```bash
# 1. Check if another migration is running
ps aux | grep prisma

# 2. Check for stale locks in database
# Connect to your database and run:
psql "$DATABASE_URL" -c "SELECT * FROM pg_locks WHERE locktype = 'advisory';"

# 3. If you see locks, you can manually release them (CAREFUL!)
# Only do this if you're sure no migration is running:
psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock_all();"
```

### Solution 4: Use Migration Status Check

```bash
# Check migration status first
npx prisma migrate status

# If status shows pending migrations, try deploy again
npx prisma migrate deploy
```

### Solution 5: Manual Lock Release (Last Resort)

If you're absolutely sure no migration is running:

```bash
# Connect to database
psql "$DATABASE_URL"

# Check for advisory locks
SELECT pid, locktype, objid, mode, granted 
FROM pg_locks 
WHERE locktype = 'advisory';

# If you see locks with granted=true, you can kill the process (CAREFUL!)
# First, check what the process is:
SELECT pid, usename, application_name, state, query 
FROM pg_stat_activity 
WHERE pid IN (SELECT pid FROM pg_locks WHERE locktype = 'advisory');

# If it's safe, kill the process:
SELECT pg_terminate_backend(pid) FROM pg_locks WHERE locktype = 'advisory' AND granted = true;

# Or release all advisory locks (safer):
SELECT pg_advisory_unlock_all();
```

## Quick Fix Script

Create a script to handle this automatically:

```bash
#!/bin/bash
# fix-migration-timeout.sh

echo "Checking for running migrations..."
ps aux | grep -i "prisma migrate" | grep -v grep

if [ $? -eq 0 ]; then
    echo "⚠️  Another migration process detected. Wait for it to finish."
    exit 1
fi

echo "Checking database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Check DATABASE_URL."
    exit 1
fi

echo "Attempting migration with direct connection..."
# Use direct connection (not pooler) for migrations
if [ -n "$DATABASE_URL_MIGRATE" ]; then
    DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma migrate deploy
else
    echo "⚠️  DATABASE_URL_MIGRATE not set. Using regular DATABASE_URL."
    echo "⚠️  If this fails, set DATABASE_URL_MIGRATE to direct connection string."
    npx prisma migrate deploy
fi
```

## Best Practices for Neon + Prisma Migrations

1. **Always use direct connection for migrations** (not pooler)
2. **Keep pooler for application connections** (better performance)
3. **Run migrations during low-traffic periods**
4. **Monitor Neon dashboard** for connection limits
5. **Use `migrate deploy` in production** (not `migrate dev`)

## Environment Setup

In your `.env` file:

```bash
# Application connection (use pooler for better performance)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require"

# Migration connection (use direct connection for advisory locks)
DATABASE_URL_MIGRATE="postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require"
```

## Verify Fix

After applying the fix:

```bash
# 1. Test connection
npx prisma db pull

# 2. Check migration status
npx prisma migrate status

# 3. Run migration
DATABASE_URL="$DATABASE_URL_MIGRATE" npx prisma migrate deploy

# 4. Verify migrations applied
npx prisma migrate status
```

## References

- [Prisma Advisory Locking](https://pris.ly/d/migrate-advisory-locking)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/troubleshooting-development)


