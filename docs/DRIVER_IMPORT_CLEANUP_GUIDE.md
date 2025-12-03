# Driver Import Cleanup Guide

## Quick Commands

### Diagnose Blocked Imports
```bash
npm run db:diagnose-imports
```

### List Soft-Deleted Drivers
```bash
npm run db:cleanup-drivers -- --action=list
```

### Reactivate Soft-Deleted Drivers
```bash
npm run db:cleanup-drivers -- --action=reactivate
```

### Permanently Delete Soft-Deleted Drivers
```bash
npm run db:cleanup-drivers -- --action=delete
```

### Dry Run (Preview Changes Without Making Them)
```bash
npm run db:cleanup-drivers -- --action=reactivate --dry-run
npm run db:cleanup-drivers -- --action=delete --dry-run
```

## Note on PowerShell

In PowerShell, you need to use `--` to pass arguments to npm scripts:

```powershell
# ✅ Correct
npm run db:cleanup-drivers -- --action=reactivate

# ❌ Wrong (this won't work)
npm run db:cleanup-drivers --action=reactivate
tsx scripts/cleanup-soft-deleted-drivers.ts --action=reactivate
```

## What Was Found

Based on your diagnostic output, you have:
- **3 soft-deleted drivers** blocking imports:
  1. Driver #DRV-123-001 (driver1@demotruckingcompany.com)
  2. Driver #DRV-123-002 (driver2@demotruckingcompany.com)
  3. Driver #DRV-123-003 (driver3@demotruckingcompany.com)

## Recommended Action

Since these drivers were deleted on Nov 25, 2025, you have two options:

### Option 1: Reactivate Them (Recommended if you want to re-import)
This will restore the drivers so you can update them during import:

```powershell
npm run db:cleanup-drivers -- --action=reactivate
```

Then when importing, **enable "Update existing drivers"** to update their data.

### Option 2: Permanently Delete Them
⚠️ **Warning**: This permanently deletes the drivers and their user accounts. Only do this if you're sure you don't need them.

```powershell
npm run db:cleanup-drivers -- --action=delete
```

This will fail if the drivers have related records (loads, settlements, etc.).

## After Cleanup

Once you've reactivated or deleted the soft-deleted drivers, you should be able to:

1. Import drivers with the same driver numbers/emails
2. Use "Update existing drivers" to update their data if reactivated











