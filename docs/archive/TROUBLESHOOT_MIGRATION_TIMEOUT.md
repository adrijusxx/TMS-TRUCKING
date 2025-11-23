# Troubleshooting Migration Timeout (If It Worked Before)

## If Migrations Worked Before

If migrations worked previously with the pooler connection, the issue might be:

1. **Stale Advisory Lock** - Previous migration left a lock
2. **Another Process** - Another migration is running
3. **Network Issues** - Temporary connectivity problems
4. **Neon Service Changes** - Neon might have changed something

## Quick Diagnostic

Run this to see what's happening:

```bash
npm run db:diagnose
```

This will check:
- Database connectivity
- Running Prisma processes
- Migration status
- Configuration issues

## Solutions (Try in Order)

### Solution 1: Try Pooler Connection with Increased Timeout

If it worked before, try again with the increased timeout:

```bash
# Pull latest changes (includes increased timeout)
git pull

# Try migration with pooler (now has 30s timeout instead of 10s)
npm run db:migrate:deploy-pooler
```

### Solution 2: Check for Stale Locks

If a previous migration failed, it might have left a lock:

```bash
# Check migration status
npx prisma migrate status

# If it shows errors, try to see what's locked
# (You'd need database access to check pg_locks)
```

### Solution 3: Kill Any Running Prisma Processes

```bash
# Check for running Prisma processes
ps aux | grep prisma

# Kill them if found
pkill -f prisma

# Wait a few seconds, then try migration again
npm run db:migrate:deploy
```

### Solution 4: Try Migration During Low Traffic

Connection poolers can be slower during high traffic:

```bash
# Try during off-peak hours
npm run db:migrate:deploy
```

### Solution 5: Use Direct Connection (Last Resort)

If pooler really stopped working, get direct connection from Neon:

```bash
# Get instructions
npm run db:get-neon-connection

# Follow instructions to get direct connection string
# Add to .env as DATABASE_URL_MIGRATE
# Then run migration
npm run db:migrate:deploy
```

## What Changed?

The config now:
- ✅ Uses `DATABASE_URL_MIGRATE` if set, otherwise `DATABASE_URL`
- ✅ Has increased timeout (30s instead of 10s)
- ✅ Better error messages

## Most Likely Causes

1. **Temporary Network Issue** - Try again in a few minutes
2. **Stale Lock** - Previous migration didn't complete cleanly
3. **Neon Service Update** - Neon might have changed pooler behavior

## Quick Test

```bash
# 1. Check if database is reachable
npm run db:test-connection

# 2. Check migration status
npx prisma migrate status

# 3. Try migration with increased timeout
npm run db:migrate:deploy-pooler
```

If the pooler connection test works but migration times out, it's likely an advisory lock issue. In that case, you'll need the direct connection string from Neon.


