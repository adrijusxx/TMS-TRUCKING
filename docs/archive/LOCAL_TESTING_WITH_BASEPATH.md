# Local Testing with basePath

## Setup for Local Testing

You can test all the basePath and API call fixes locally before deploying to your VM.

### Step 1: Configure Local Environment

**Create/update `.env.local` (or `.env` for local testing):**

```env
# Database (use your Neon connection string)
DATABASE_URL="postgresql://neondb_owner:[YOUR_DATABASE_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# NextAuth - Use localhost with /tms basePath
NEXTAUTH_URL="http://localhost:3000/tms"
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"

# BasePath for local testing
NEXT_PUBLIC_BASE_PATH=/tms
```

### Step 2: Update next.config.js for Local Testing

Your `next.config.js` already has basePath configured. For local testing, you can:

**Option A: Test with basePath (recommended - matches production)**
```javascript
// next.config.js already has this:
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
```

**Option B: Test without basePath (for comparison)**
```javascript
// Temporarily comment out basePath:
// basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
basePath: '', // Test without basePath
```

### Step 3: Run Locally

```bash
# Install dependencies (if not done)
npm install

# Generate Prisma Client
npm run db:generate

# Run migrations (if needed)
npm run db:migrate

# Seed database (if needed)
npm run db:seed

# Start dev server
npm run dev
```

### Step 4: Access Locally

**With basePath (`/tms`):**
- Login: `http://localhost:3000/tms/login`
- Dashboard: `http://localhost:3000/tms/dashboard`
- API: `http://localhost:3000/tms/api/activity`

**Without basePath (if testing):**
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- API: `http://localhost:3000/api/activity`

### Step 5: Test API Calls

Open browser DevTools (F12) > Console and check for:
- ✅ No 404 errors on API calls
- ✅ API calls include `/tms` prefix when using basePath
- ✅ All dashboard sections load correctly

### Step 6: Test Login Flow

1. Go to `http://localhost:3000/tms/login`
2. Login with test credentials
3. Should redirect to `http://localhost:3000/tms/dashboard`
4. Check all sections load (Activity Feed, Recent Loads, etc.)

## Quick Local Test Script

Create `test-local.sh`:

```bash
#!/bin/bash

echo "🧪 Testing TMS Locally with basePath"

# Check .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found, creating from .env.example"
    cp .env.example .env.local 2>/dev/null || echo "DATABASE_URL=your-db-url" > .env.local
fi

# Check DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env.local; then
    echo "❌ DATABASE_URL not found in .env.local"
    exit 1
fi

# Check NEXTAUTH_URL includes /tms
if ! grep -q "NEXTAUTH_URL.*tms" .env.local; then
    echo "⚠️  NEXTAUTH_URL should include /tms for local testing"
    echo "   Add: NEXTAUTH_URL=\"http://localhost:3000/tms\""
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npm run db:generate

# Start dev server
echo "🚀 Starting dev server..."
echo "   Access at: http://localhost:3000/tms/login"
npm run dev
```

Make it executable:
```bash
chmod +x test-local.sh
./test-local.sh
```

## Testing Checklist

- [ ] Login works: `http://localhost:3000/tms/login`
- [ ] Redirects to dashboard after login
- [ ] Dashboard stats load (Total Loads, Drivers, etc.)
- [ ] Activity Feed loads
- [ ] Recent Loads loads
- [ ] Upcoming Deadlines loads
- [ ] No 404 errors in browser console
- [ ] API calls include `/tms` prefix
- [ ] Navigation links work correctly

## Common Local Testing Issues

### Issue 1: Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# or on Windows:
# netstat -ano | findstr :3000
# taskkill /PID <PID> /F
```

### Issue 2: Database Connection
- Verify `DATABASE_URL` in `.env.local` is correct
- Test connection: `npx prisma db pull`

### Issue 3: NextAuth Errors
- Ensure `NEXTAUTH_URL="http://localhost:3000/tms"` (includes `/tms`)
- Ensure `NEXTAUTH_SECRET` is set

### Issue 4: API Calls Failing
- Check browser console for errors
- Verify `apiUrl()` helper is being used in components
- Check Network tab to see actual API URLs being called

## Benefits of Local Testing

1. **Faster iteration** - No need to rebuild and deploy to VM
2. **Better debugging** - Full access to dev tools and logs
3. **No VM impact** - Test without affecting production
4. **Hot reload** - Changes reflect immediately

## After Local Testing

Once everything works locally:

1. **Commit your changes**
2. **Push to repository**
3. **Deploy to VM:**
   ```bash
   # On VM
   git pull
   npm run build
   pm2 restart tms --update-env
   ```

## Files to Test Locally

All the fixes we made will work locally:
- ✅ `lib/utils/index.ts` - `apiUrl()` helper
- ✅ `lib/auth.ts` - NextAuth basePath config
- ✅ `components/dashboard/*.tsx` - Updated API calls
- ✅ `components/activity/ActivityFeed.tsx` - Updated API calls

