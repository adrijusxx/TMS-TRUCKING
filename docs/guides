# Quick Start Guide - After Stopping Dev Server

## ⚠️ IMPORTANT: Stop Dev Server First

The Prisma client files are locked by the running dev server. You **MUST** stop it first:

1. Find the terminal/command prompt where `npm run dev` is running
2. Press `Ctrl+C` to stop the server
3. Wait a few seconds for the process to fully terminate

## Step-by-Step Commands

Once the dev server is stopped, run these commands in order:

```bash
# 1. Generate Prisma Client (creates TypeScript types for new models)
npx prisma generate

# 2. Create and apply database migration
npx prisma migrate dev --name add_load_splits_and_payment_tracking

# 3. Restart dev server
npm run dev
```

## What Each Command Does

### `npx prisma generate`
- Generates TypeScript types for the new `LoadSegment` model
- Updates types for modified `Payment`, `FuelEntry`, and `Breakdown` models
- Creates Prisma client methods like `prisma.loadSegment.create()`

### `npx prisma migrate dev`
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to your database
- Creates the `LoadSegment` table
- Adds new columns to `Payment`, `FuelEntry`, and `Breakdown` tables

### `npm run dev`
- Restarts your Next.js development server
- The new features will now be available

## Troubleshooting

### If `prisma generate` still fails:
- Make sure the dev server is completely stopped
- Close any IDE windows that might have the Prisma client files open
- Try closing and reopening your terminal
- On Windows, you may need to run as Administrator

### If `prisma migrate dev` shows database drift:
- Review the drift message carefully
- The drift might be from other changes not yet migrated
- You may need to resolve conflicts manually
- Contact support if you're unsure about resolving drift

### If you see TypeScript errors after generation:
- Make sure `npx prisma generate` completed successfully
- Restart your TypeScript server in your IDE
- In VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## Testing After Setup

1. **Load Splits**:
   - Navigate to any load detail page
   - Look for "Load Segments" section
   - Try clicking "Split Load" button

2. **Payment Tracking**:
   - Navigate to a breakdown detail page
   - Look for "Payments" section in the costs tab
   - Try recording a payment

3. **Accounting Menu**:
   - Navigate to Accounting department
   - Verify IFTA is in "Main Features" section
   - Verify menu is organized correctly

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify the dev server is stopped
3. Check that all files were saved correctly
4. Review the `IMPLEMENTATION_SUMMARY.md` for details
