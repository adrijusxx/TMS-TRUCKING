# Fix: Database Connection Errors and NextAuth basePath Warnings

## Issues Found

1. **Prisma PostgreSQL Connection Errors**: `Error in PostgreSQL connection: Error { kind: Closed, cause: None }`
2. **NextAuth basePath Mismatch Warning**: `[auth][warn][env-url-basepath-mismatch]`

## Fix 1: Database Connection Errors

### Problem
Prisma connections are closing unexpectedly. This can happen due to:
- Connection pool exhaustion
- Database server restarting
- Connection timeouts
- Missing connection pool configuration

### Solution

**On your VM, check database connection:**

```bash
cd ~/TMS-TRUCKING

# 1. Verify DATABASE_URL is set
grep DATABASE_URL .env
# Should show a valid PostgreSQL connection string

# 2. Test database connection
npx prisma db pull
# If this fails, your DATABASE_URL is incorrect or database is unreachable

# 3. Check if PostgreSQL is running (if using local database)
sudo systemctl status postgresql
# or
ps aux | grep postgres

# 4. If using cloud database, verify connection string is correct
# Check for:
# - Correct host/port
# - Valid credentials
# - SSL mode if required (sslmode=require)
```

**If database connection is failing:**

1. **Check DATABASE_URL format:**
   ```bash
   # Should be like:
   # postgresql://user:password@host:port/database?schema=public
   # For cloud databases, might need: ?sslmode=require
   ```

2. **Test connection manually:**
   ```bash
   # If using psql
   psql "$DATABASE_URL"
   # Should connect successfully
   ```

3. **Check database server status:**
   ```bash
   # For local PostgreSQL
   sudo systemctl restart postgresql
   sudo systemctl status postgresql
   ```

## Fix 2: NextAuth basePath Mismatch Warning

### Problem
NextAuth is warning about mismatch between `NEXTAUTH_URL` and `basePath` configuration.

### Solution

The warning occurs because:
- `NEXTAUTH_URL="http://34.121.40.233/tms"` (includes `/tms`)
- `basePath: '/api/auth'` in `authOptions` (path NextAuth receives)

This is actually correct for our setup, but NextAuth v5 beta is warning about it.

**Option 1: Suppress the warning (recommended)**
The current configuration is correct. The warning is informational and can be ignored.

**Option 2: Set AUTH_URL instead of NEXTAUTH_URL**
NextAuth v5 beta prefers `AUTH_URL`:

```bash
# In .env, add:
AUTH_URL="http://34.121.40.233/tms"

# Keep NEXTAUTH_URL for compatibility:
NEXTAUTH_URL="http://34.121.40.233/tms"
```

**Option 3: Remove basePath from authOptions**
Try removing `basePath` and let NextAuth auto-detect:

```typescript
// In lib/auth.ts, remove:
// basePath: '/api/auth',
```

But this might bring back the UnknownAction error, so test carefully.

## Quick Diagnostic Commands

```bash
cd ~/TMS-TRUCKING

# 1. Check environment variables
echo "DATABASE_URL: $(grep DATABASE_URL .env | cut -d'=' -f2- | head -c 50)..."
echo "NEXTAUTH_URL: $(grep NEXTAUTH_URL .env)"

# 2. Test database connection
npx prisma db pull 2>&1 | head -10

# 3. Check PM2 environment
pm2 env 2 | grep -E "DATABASE_URL|NEXTAUTH_URL"

# 4. Check if database is accessible
# (if using local PostgreSQL)
sudo -u postgres psql -c "SELECT 1;" 2>&1

# 5. Restart TMS with fresh environment
pm2 restart tms --update-env

# 6. Monitor logs
pm2 logs tms --lines 50
```

## Most Likely Causes

1. **Database Connection:**
   - DATABASE_URL not set correctly
   - Database server not running
   - Connection pool exhausted (restart TMS)
   - Network/firewall blocking connection

2. **basePath Warning:**
   - NextAuth v5 beta warning (can be ignored if login works)
   - Mismatch between NEXTAUTH_URL and basePath config

## Files Changed

- `lib/prisma.ts` - Added explicit datasource configuration

