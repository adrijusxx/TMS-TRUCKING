# Admin Soft-Deleted Record Visibility

This document explains how admins can view soft-deleted records in the TMS UI.

## Overview

By default, soft-deleted records (records with `deletedAt` set) are hidden from all users. Admins can now toggle visibility to see **all records**, including soft-deleted ones, to manage and restore them if needed.

## Features

### 1. Admin-Only Toggle
- **Show Deleted Toggle**: Admins see a toggle switch in list views to show/hide soft-deleted records
- **URL Parameter**: The toggle uses `?includeDeleted=true` query parameter
- **Visual Indicators**: Deleted records are clearly marked with badges and reduced opacity

### 2. Visual Indicators
- **Deleted Badge**: Red "Deleted" badge with trash icon on deleted records
- **Tooltip**: Hover to see deletion timestamp
- **Row Styling**: Deleted records have reduced opacity (60%) and muted background

### 3. API Support
- All API routes support `includeDeleted=true` query parameter (admins only)
- Non-admin users cannot access deleted records even with the parameter

## Implementation Details

### Utility Functions

#### `lib/filters/deleted-records-filter.ts`
```typescript
// Build where clause that conditionally includes soft-deleted records
const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

// Parse includeDeleted from request
const includeDeleted = parseIncludeDeleted(request);

// Check if record is deleted
const isDeleted = isRecordDeleted(record);
```

### Components

#### `ShowDeletedToggle`
Toggle component for admins to show/hide deleted records:
```tsx
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';

{isAdmin && <ShowDeletedToggle />}
```

#### `DeletedRecordBadge`
Badge component to visually indicate deleted records:
```tsx
import { DeletedRecordBadge } from '@/components/common/DeletedRecordBadge';

<DeletedRecordBadge deletedAt={record.deletedAt} />
```

### API Route Pattern

All API routes should follow this pattern:

```typescript
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  // Parse includeDeleted parameter (admins only)
  const includeDeleted = parseIncludeDeleted(request);
  
  // Build deleted records filter
  const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
  
  // Use in query
  const where: any = {
    ...mcWhere,
    ...roleFilter,
    ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
  };
  
  // Include deletedAt in select for UI indicators
  const records = await prisma.model.findMany({
    where,
    select: {
      // ... other fields
      deletedAt: true, // Include for UI indicators
      isActive: true,
    },
  });
}
```

### Adding to List Components

1. **Add imports**:
```tsx
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';
import { DeletedRecordBadge } from '@/components/common/DeletedRecordBadge';
```

2. **Add toggle to filters**:
```tsx
const isAdmin = useIsAdmin();

{/* In filters section */}
{isAdmin && <ShowDeletedToggle />}
```

3. **Update interface** to include `deletedAt`:
```tsx
interface Driver {
  // ... other fields
  deletedAt?: Date | null;
  isActive?: boolean;
}
```

4. **Update query** to include `includeDeleted`:
```tsx
const { data } = useQuery({
  queryKey: ['drivers', page, statusFilter, includeDeleted],
  queryFn: () => fetchDrivers({
    page,
    status: statusFilter,
    ...(isAdmin && includeDeleted && { includeDeleted: 'true' }),
  }),
});
```

5. **Add badge to table rows**:
```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <span>{record.name}</span>
    <DeletedRecordBadge deletedAt={record.deletedAt} />
  </div>
</TableCell>
```

## Status

### Completed
- ✅ Utility functions for deleted record filtering
- ✅ `ShowDeletedToggle` component
- ✅ `DeletedRecordBadge` component
- ✅ `useIsAdmin` hook
- ✅ Updated drivers API route
- ✅ Updated loads API route
- ✅ Updated DriverList component
- ✅ Visual indicators in DataTable

### To Do
- [ ] Update other API routes (trucks, trailers, customers, invoices, etc.)
- [ ] Update other list components
- [ ] Add restore functionality (set `deletedAt` to `null`)
- [ ] Add bulk restore action for admins

## Examples

### Drivers List
The drivers list now includes:
- Toggle to show/hide deleted drivers (admin only)
- Badge on deleted driver rows
- Reduced opacity on deleted rows

### Loads List
The loads list includes:
- Toggle to show/hide deleted loads (admin only)
- Badge on deleted load rows

## Security

- Only **ADMIN** role can see deleted records
- The API automatically filters out deleted records for non-admin users
- The toggle component only renders for admins
- URL parameter manipulation by non-admins has no effect

## Future Enhancements

1. **Restore Functionality**: Add restore button to bring back deleted records
2. **Bulk Restore**: Allow restoring multiple records at once
3. **Deletion History**: Show who deleted the record and when
4. **Permanent Delete**: Option to permanently delete records (with warnings)
5. **Deleted Records Dashboard**: Dedicated page showing all deleted records across all entities

















