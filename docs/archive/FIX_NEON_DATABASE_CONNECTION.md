# Fix: Neon Database Connection Issues

## Your Setup

You're using **Neon** (cloud PostgreSQL), not local PostgreSQL. This is why `systemctl status postgresql` shows "not found" - that's expected!

## Database Connection Status

✅ **Database connection is WORKING** - `prisma db pull` succeeded and found 31 models.

## Prisma Connection Errors Explained

The `Error in PostgreSQL connection: Error { kind: Closed, cause: None }` errors are likely due to:

1. **Connection Pool Timeouts** - Neon uses connection pooling, connections can timeout after inactivity
2. **Connection Pool Exhaustion** - Too many connections open at once
3. **Network Issues** - Temporary network interruptions

## Solutions

### Solution 1: Add Connection Pool Configuration

Update your `DATABASE_URL` to use Neon's connection pooler with better settings:

```bash
# Current (direct connection):
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Better (with connection pool settings):
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require&connect_timeout=10&pool_timeout=20"
```

### Solution 2: Use Direct Connection (Not Pooler)

If pooler is causing issues, try direct connection:

```bash
# Get direct connection string from Neon dashboard
# It will look like:
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"
# (Note: no "-pooler" in hostname)
```

### Solution 3: Configure Prisma Connection Pool

Update `lib/prisma.ts` to handle connection errors better:

```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Handle connection errors gracefully
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma error:', e);
});
```

## Quick Fix Steps

```bash
cd ~/TMS-TRUCKING

# 1. Verify DATABASE_URL (should be Neon connection string)
grep DATABASE_URL .env

# 2. Test connection (should work - you already did this)
npx prisma db pull

# 3. Update DATABASE_URL if needed (add connection timeout params)
# Edit .env and add: &connect_timeout=10&pool_timeout=20

# 4. Rebuild (finish the interrupted build)
npm run build

# 5. Restart TMS
pm2 restart tms --update-env

# 6. Check logs
pm2 logs tms --lines 30
```

## Why PostgreSQL Service Not Found?

You're using **Neon** (cloud database), not local PostgreSQL. That's why:
- `systemctl status postgresql` → "not found" ✅ (expected)
- `ps aux | grep postgres` → no results ✅ (expected)
- `prisma db pull` → works ✅ (database is accessible)

## Neon Connection Best Practices

1. **Use Connection Pooler** (you're already doing this - URL has `-pooler`)
2. **Set Connection Timeouts** - Add `&connect_timeout=10` to DATABASE_URL
3. **Handle Reconnections** - Prisma will auto-reconnect, but you can add retry logic
4. **Monitor Connections** - Check Neon dashboard for connection limits

## Check Neon Dashboard

1. Go to https://console.neon.tech
2. Check your project
3. Look at "Connections" tab
4. Verify connection limits aren't exceeded
5. Check for any connection errors

## Files Changed

- `lib/prisma.ts` - Added datasource configuration (already done)

