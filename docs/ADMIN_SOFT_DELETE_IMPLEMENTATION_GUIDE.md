# Admin Soft-Delete Visibility - Implementation Guide

This guide provides a template for updating ALL API routes to support admin visibility of soft-deleted records.

## Status

### ✅ Completed Routes
- `/api/drivers` - Full implementation
- `/api/loads` - Full implementation  
- `/api/trucks` - Full implementation
- `/api/trailers` - Full implementation
- `/api/customers` - Full implementation

### 📋 Remaining Routes (Need Update)
All routes that filter by `deletedAt: null` need to be updated. Run:
```bash
grep -r "deletedAt.*null" app/api/
```

## Standard Implementation Pattern

### Step 1: Add Imports
```typescript
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
```

### Step 2: Update Where Clause
**Before:**
```typescript
const where: any = {
  ...mcWhere,
  ...roleFilter,
  deletedAt: null,
};
```

**After:**
```typescript
// Parse includeDeleted parameter (admins only)
const includeDeleted = parseIncludeDeleted(request);

// Build deleted records filter (admins can include deleted records if requested)
const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

// Merge MC filter with role filter and deleted filter
const where: any = {
  ...mcWhere,
  ...roleFilter,
  ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
};
```

### Step 3: Include deletedAt in Select
Add `deletedAt` to the select/include so the UI can display badges:

**For `select`:**
```typescript
select: {
  // ... other fields
  deletedAt: true, // Include deletedAt for UI indicators
  isActive: true,  // If model has this field
}
```

**For `include`:**
```typescript
include: {
  // ... other relations
  // deletedAt is already included in the base model
}
```

## UI Components Already Available

### DataTableWrapper
✅ Already updated to include:
- `ShowDeletedToggle` component (admin only)
- Passes `includeDeleted` parameter to `fetchData`
- Automatically works for all tables using `DataTableWrapper`

### Individual List Components
If using custom list components (not DataTableWrapper), add:

```tsx
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';

// In component:
const isAdmin = useIsAdmin();

// In filters section:
{isAdmin && <ShowDeletedToggle />}
```

### DeletedRecordBadge
Add to table rows to show deleted status:

```tsx
import { DeletedRecordBadge } from '@/components/common/DeletedRecordBadge';

// In table cell:
<DeletedRecordBadge deletedAt={record.deletedAt} />
```

## Common Routes That Need Updates

Based on `deletedAt: null` search, these routes likely need updates:

1. **Fleet Routes:**
   - `/api/trucks` ✅ Done
   - `/api/trailers` ✅ Done
   - `/api/maintenance` (if exists)
   - `/api/breakdowns` 

2. **Customer Routes:**
   - `/api/customers` ✅ Done
   - `/api/customers/stats`

3. **Invoice Routes:**
   - `/api/invoices`
   - `/api/invoices/stats`

4. **Settlement Routes:**
   - `/api/settlements`

5. **User Routes:**
   - `/api/settings/users`

6. **Import/Export:**
   - `/api/import-export/[entity]` (already handles deletedAt but may need includeDeleted support)

7. **Search:**
   - `/api/search` (may need includeDeleted support)

8. **Analytics:**
   - `/api/analytics/*` (usually aggregates, may not need changes)

9. **Safety:**
   - `/api/safety/incidents`

10. **Bulk Actions:**
    - `/api/bulk-actions` (may need includeDeleted support)

## Testing Checklist

For each updated route:

- [ ] Admin can toggle "Show Deleted" 
- [ ] Deleted records appear when toggle is on
- [ ] Deleted records have badge/visual indicator
- [ ] Non-admin cannot see deleted records (even with URL param)
- [ ] Query parameter `?includeDeleted=true` works
- [ ] Cache key includes `includeDeleted` (for React Query)

## Quick Update Script Pattern

For routes with simple structure:

```typescript
// 1. Add import
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

// 2. In GET handler, before building where clause:
const includeDeleted = parseIncludeDeleted(request);
const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

// 3. Update where clause:
const where: any = {
  // ... existing filters
  ...(deletedFilter && { ...deletedFilter }), // Replace deletedAt: null
};

// 4. Ensure deletedAt is in select/include
```

## Notes

- The `buildDeletedRecordsFilter` function automatically:
  - Returns `undefined` for admins when `includeDeleted=true` (shows all)
  - Returns `{ deletedAt: null }` for admins when `includeDeleted=false` (default)
  - Returns `{ deletedAt: null }` for non-admins (always filtered)

- URL parameter: `?includeDeleted=true` 
- Only admins can use this parameter - non-admins are automatically filtered

- The DataTableWrapper component automatically:
  - Shows toggle for admins
  - Passes `includeDeleted` to fetchData
  - Includes it in cache key

## Example: Complete Route Update

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);
    
    // NEW: Parse includeDeleted parameter (admins only)
    const includeDeleted = parseIncludeDeleted(request);
    
    // NEW: Build deleted records filter
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
    
    // UPDATED: Merge with deleted filter (removed deletedAt: null)
    const where: any = {
      ...mcWhere,
      ...(deletedFilter && { ...deletedFilter }),
    };

    const records = await prisma.model.findMany({
      where,
      select: {
        id: true,
        // ... other fields
        deletedAt: true, // NEW: Include for UI indicators
      },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```











