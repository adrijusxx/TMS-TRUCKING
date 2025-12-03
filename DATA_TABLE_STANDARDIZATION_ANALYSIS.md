# Data Table Standardization Analysis & Refactoring Guide

## 1. Current State Analysis

### ✅ **Library: TanStack Table**
Your project uses **TanStack Table** (`@tanstack/react-table`) - confirmed by imports in `components/data-table/DataTable.tsx`.

### ✅ **UI Styling: Shadcn UI**
You use Shadcn UI table components (`@/components/ui/table`) for styling, which is the correct approach.

### ✅ **Generic Components Exist**
You already have:
- `DataTable<TData>` - Core generic table component using TanStack Table
- `DataTableWrapper<TData>` - Higher-level wrapper with data fetching, column visibility, search, etc.
- Configuration system - `lib/config/entities/*.tsx` files define table configs

---

## 2. Hardcoded Tables Found

### **Hardcoded Tables (Need Refactoring):**

1. **`components/drivers/DriverTable.tsx`** 
   - Uses raw Shadcn `Table`, `TableHeader`, `TableBody`, etc.
   - Manual row selection, column visibility, pagination
   - ~400 lines of hardcoded table logic
   - **Used by:** `components/drivers/DriverList.tsx`

2. **`components/safety/compliance/DriverComplianceTable.tsx`**
   - Uses raw Shadcn table components
   - Manual search, filtering, column visibility
   - ~620 lines of hardcoded table logic

3. **`components/analytics/DriverPerformanceTable.tsx`**
   - Uses raw HTML `<table>` elements (not even Shadcn!)
   - No TanStack Table features
   - ~230 lines

4. **Other Potential Candidates:**
   - `components/drivers/DriverEditTabs/DriverTruckHistoryTable.tsx`
   - `components/drivers/DriverEditTabs/DriverTrailerHistoryTable.tsx`

### **Tables Already Using Generic DataTable:**
- ✅ `components/documents/DocumentListNew.tsx` - Uses `DataTableWrapper`
- ✅ `components/batches/BatchListNew.tsx` - Uses `DataTableWrapper`
- ✅ `components/invoices/InvoiceListNew.tsx` - Uses `DataTableWrapper`
- ✅ `components/loads/LoadListNew.tsx` - Uses `DataTableWrapper`
- ✅ Most "ListNew" components use the modern pattern

---

## 3. Refactoring Strategy

### **Step 1: Refactor `DriverTable.tsx` to use Generic `DataTable`**

You already have `driversTableConfig` in `lib/config/entities/drivers.tsx`, but it needs to match the data structure used by `DriverList.tsx`.

**Current Issue:** `DriverTable.tsx` uses a different `Driver` interface than `driversTableConfig` expects.

**Solution:** Update the config to match, then replace `DriverTable` usage.

### **Step 2: Update `DriverList.tsx`**

`DriverList.tsx` currently:
- Uses custom `DriverTable` component
- Manages its own data fetching with `useQuery`
- Has manual pagination, search, column visibility logic

**Refactored version** should:
- Use `DataTableWrapper` with `driversTableConfig`
- Let `DataTableWrapper` handle all state management
- Remove `DriverTable` import entirely

---

## 4. Example Refactoring: DriverTable → Generic DataTable

### **Before (DriverList.tsx using DriverTable.tsx):**

```tsx
// components/drivers/DriverList.tsx
import DriverTable from './DriverTable';

export default function DriverList() {
  const [page, setPage] = useState(1);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({...});
  
  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, ...],
    queryFn: () => fetchDrivers({...}),
  });

  return (
    <div>
      {/* Manual search, filters, column visibility */}
      <DriverTable
        drivers={data?.data || []}
        selectedDriverIds={selectedDriverIds}
        onSelectDriver={...}
        visibleColumns={visibleColumns}
        // ... many props
      />
    </div>
  );
}
```

### **After (DriverList.tsx using DataTableWrapper):**

```tsx
// components/drivers/DriverList.tsx
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { driversTableConfig } from '@/lib/config/entities/drivers';
import DriverExpandedEdit from './DriverExpandedEdit';

export default function DriverList() {
  const fetchDrivers = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());
    
    // Apply sorting, filters, etc.
    
    const response = await fetch(apiUrl(`/api/drivers?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch drivers');
    const result = await response.json();

    return {
      data: result.data || [],
      meta: result.meta ? {
        totalCount: result.meta.total,
        totalPages: result.meta.totalPages,
        page: result.meta.page,
        pageSize: result.meta.limit,
      } : undefined,
    };
  };

  return (
    <DataTableWrapper
      config={driversTableConfig}
      fetchData={fetchDrivers}
      rowActions={(row) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/drivers/${row.id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
        </div>
      )}
      inlineEditComponent={DriverExpandedEdit}
      emptyMessage="No drivers found. Get started by adding your first driver."
    />
  );
}
```

**Result:**
- ✅ Removed ~400 lines from `DriverTable.tsx`
- ✅ Removed manual state management from `DriverList.tsx`
- ✅ Automatic column visibility, search, sorting, pagination
- ✅ Consistent UX across all tables
- ✅ Can delete `DriverTable.tsx` entirely

---

## 5. Required Config Updates

### **Update `lib/config/entities/drivers.tsx`**

The config needs to match the actual `Driver` interface used in `DriverList.tsx`:

```tsx
// Update DriverData interface to match actual API response
interface DriverData {
  id: string;
  driverNumber: string;
  firstName: string;  // Instead of user.firstName
  lastName: string;   // Instead of user.lastName
  email: string;
  phone: string | null;
  driverType: DriverType;
  mcNumber: { id: string; number: string } | null;
  status: DriverStatus;
  employeeStatus: EmployeeStatus;
  assignmentStatus: AssignmentStatus;
  dispatchStatus: DispatchStatus | null;
  truck?: { id: string; truckNumber: string } | null;
  trailer?: { id: string; trailerNumber: string } | null;
  // ... rest of fields
}

// Add columns for all fields used in DriverTable
const columns: ExtendedColumnDef<DriverData>[] = [
  {
    id: 'assignmentStatus',
    header: 'Assign Status',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getAssignmentStatusIcon(row.original.assignmentStatus)}
        <span>{getAssignmentStatusText(row.original.assignmentStatus)}</span>
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'employeeStatus',
    header: 'Employee Status',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getEmployeeStatusBadge(row.original.employeeStatus)}
        <DeletedRecordBadge deletedAt={row.original.deletedAt} />
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
    defaultVisible: true,
  },
  // ... add all other columns
];
```

---

## 6. Migration Checklist

### **For each hardcoded table:**

- [ ] Create/update table config in `lib/config/entities/[entity].tsx`
- [ ] Update column definitions to match actual data structure
- [ ] Refactor list component to use `DataTableWrapper`
- [ ] Extract row actions to `rowActions` prop
- [ ] Move inline edit components to `inlineEditComponent` prop (if applicable)
- [ ] Test sorting, filtering, pagination, column visibility
- [ ] Delete old hardcoded table component file

### **Priority Order:**

1. **High Priority:**
   - `DriverTable.tsx` (used in main DriverList)
   
2. **Medium Priority:**
   - `DriverComplianceTable.tsx` (safety feature)
   
3. **Low Priority:**
   - `DriverPerformanceTable.tsx` (analytics, can keep raw HTML if simpler)
   - History tables (sub-components, less critical)

---

## 7. Benefits

After refactoring, you'll have:

✅ **One reusable pattern** - All tables use the same component
✅ **Less code** - Delete hundreds of lines of duplicate table logic
✅ **Consistent UX** - All tables behave the same (sort, filter, pagination)
✅ **Easier maintenance** - Update table features in one place
✅ **Type safety** - Full TypeScript support via generic `DataTable<TData>`
✅ **Built-in features** - Column visibility, bulk actions, search, etc. work automatically

---

## 8. Next Steps

Would you like me to:
1. ✅ Refactor `DriverTable.tsx` → `DataTableWrapper` with updated config?
2. ✅ Update `DriverList.tsx` to use the new pattern?
3. ✅ Show refactoring for `DriverComplianceTable.tsx`?
4. ✅ Create a migration script to check for other hardcoded tables?






