# Seed and Build Guide

## Do I Need to Build for Seeding?

**No, you don't need to run `npm run build` for seeding to work.**

Seeding runs directly with Node.js and Prisma - it doesn't require Next.js to be built. The seed script (`prisma/seed.ts`) is executed by Prisma's seed command, which runs independently of Next.js.

## Running the Seed

### On Your VM:

```bash
# Option 1: Using npm script
npm run db:seed

# Option 2: Direct Prisma command
npx prisma db seed

# Option 3: Using tsx directly
npx tsx prisma/seed.ts
```

### What the Seed Does

The seed file creates comprehensive test data:
- 3 Companies
- 9 MC Numbers (3 per company)
- Multiple Users (3 of each role type per company)
- 9 Drivers (3 per company)
- 9 Trucks (3 per company)
- 9 Trailers (3 per company)
- 9 Customers (3 per company)
- 9 Loads with stops (3 per company)
- 9 Invoices (3 per company)
- 9 Settlements (3 per company)
- 9 Maintenance Records (3 per company)
- 9 Breakdowns (3 per company)
- 9 Safety Incidents (3 per company)
- 9 Documents (3 per company)
- 9 Locations (3 per company)
- 9 Vendors (3 per company)
- 9 Expense Categories (3 per company)
- 9 Expense Types (3 per company)
- 9 Deduction Rules (3 per company)
- 9 Accessorial Charges (3 per company)

## When to Build

You only need to run `npm run build` when:
- Deploying to production
- Testing the production build locally
- Checking for build-time errors

**For seeding, just run: `npm run db:seed`**

## TypeScript Errors Fixed

All TypeScript errors have been fixed:

1. ✅ **prisma.config.ts** - Removed invalid `migrate` property
2. ✅ **deductionRule** - Added type assertions (Prisma client needs regeneration)
3. ✅ **All other TypeScript errors** - Resolved

## Before Pushing to VM

### Quick Checklist:

```bash
# 1. Check for TypeScript errors
npx tsc --noEmit

# 2. Check for linting errors
npm run lint

# 3. Test seed (optional, but recommended)
npm run db:seed

# 4. If everything passes, push to VM
git add .
git commit -m "Fix TypeScript errors and update seed file"
git push
```

## On Your VM After Pulling

```bash
# 1. Pull latest changes
git pull

# 2. Regenerate Prisma client (important!)
npx prisma generate

# 3. Run seed
npm run db:seed

# 4. Build (only if deploying)
npm run build
```

## Note About Prisma Client

If you see errors about `deductionRule` not existing, regenerate Prisma client:

```bash
npx prisma generate
```

This updates the TypeScript types based on your schema.



