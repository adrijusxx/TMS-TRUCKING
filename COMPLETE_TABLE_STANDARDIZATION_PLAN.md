# Complete Table Standardization Plan

## Goal: ONE Table Component Everywhere

**All tables across the entire web application should use `DataTableWrapper<TData>` with entity configs. Same component, different data.**

---

## Current State

### ✅ **Already Standardized (Using DataTableWrapper):**
- `DocumentListNew.tsx`
- `BatchListNew.tsx`
- `InvoiceListNew.tsx`
- `LoadListNew.tsx`
- `TrailerListNew.tsx`
- `LocationListNew.tsx`
- `SettlementListNew.tsx`
- `VendorListNew.tsx`
- `FactoringCompanyListNew.tsx`
- `RateConfirmationListNew.tsx`

### ❌ **Hardcoded Tables (Need Refactoring): 53 files found**

---

## Complete Inventory of Hardcoded Tables

### **Priority 1: Main Entity Lists (High Traffic)**

1. **`components/drivers/DriverTable.tsx`** (~400 lines)
   - Used by: `DriverList.tsx`
   - Has: Column visibility, row selection, inline edit, pagination
   - **Config exists:** `lib/config/entities/drivers.tsx` (needs update)
   - **Action:** Refactor to `DataTableWrapper`

2. **`components/documents/DocumentList.tsx`**
   - Has: Pagination, type filtering
   - **Config exists:** `lib/config/entities/documents.tsx`
   - **Action:** Migrate to use existing `DocumentListNew.tsx` pattern

3. **`components/batches/BatchList.tsx`**
   - Has: Status filtering, pagination, bulk delete
   - **Config exists:** `lib/config/entities/batches.tsx`
   - **Action:** Migrate to use existing `BatchListNew.tsx` pattern

4. **`components/inspections/InspectionList.tsx`**
   - Has: Type/status filters, pagination
   - **Config:** Needs creation
   - **Action:** Create config, refactor to `DataTableWrapper`

5. **`components/maintenance/MaintenanceList.tsx`**
   - Has: Type/truck filters, pagination
   - **Config:** Needs creation
   - **Action:** Create config, refactor to `DataTableWrapper`

6. **`components/inventory/InventoryList.tsx`**
   - **Action:** Create config, refactor to `DataTableWrapper`

### **Priority 2: Safety & Compliance**

7. **`components/safety/compliance/DriverComplianceTable.tsx`** (~620 lines)
   - Has: Complex compliance data, column visibility, expandable rows
   - **Action:** Create config, refactor to `DataTableWrapper`

### **Priority 3: Analytics & Reports**

8. **`components/analytics/DriverPerformanceTable.tsx`** (~230 lines)
   - Uses raw HTML `<table>` elements
   - **Action:** Refactor to `DataTable` (no wrapper needed if static data)

9. **`components/analytics/ProfitabilityAnalysis.tsx`**
10. **`components/analytics/FuelCostAnalysis.tsx`**
11. **`components/analytics/EmptyMilesAnalysis.tsx`**
12. **`components/analytics/DriverPerformanceScorecard.tsx`**
13. **`components/analytics/RevenueForecast.tsx`**
14. **`components/analytics/CustomerAnalysisReport.tsx`**
15. **`components/analytics/RouteEfficiencyAnalysis.tsx`**
16. **`components/analytics/LoadProfitabilityChart.tsx`**

### **Priority 4: Accounting & Queues**

17. **`components/accounting/BillingExceptionsQueue.tsx`**
18. **`components/accounting/SettlementApprovalQueue.tsx`**
19. **`components/accounting/AdvanceApprovalQueue.tsx`**
20. **`components/accounting/IFTAReport.tsx`**

### **Priority 5: Fleet Management**

21. **`components/fleet/FleetInspections.tsx`**
22. **`components/fleet/PreventiveMaintenance.tsx`**
23. **`components/fleet/ActiveBreakdownsDashboard.tsx`**
24. **`components/fleet/BreakdownCostTracking.tsx`**
25. **`components/fleet/BreakdownHotspots.tsx`**
26. **`components/fleet/BreakdownVendorDirectory.tsx`**
27. **`components/fleet/FleetReports.tsx`**

### **Priority 6: Detail Pages & Nested Tables**

28. **`components/drivers/DriverEditTabs/DriverTruckHistoryTable.tsx`**
29. **`components/drivers/DriverEditTabs/DriverTrailerHistoryTable.tsx`**
30. **`components/drivers/DriverEditTabs/DriverFinancialPayrollTab.tsx`**
31. **`components/drivers/DriverAdvanceRequest.tsx`**
32. **`components/drivers/DriverSettlementHistory.tsx`**
33. **`components/invoices/InvoiceDetail.tsx`**
34. **`components/invoices/AgingReport.tsx`**
35. **`components/invoices/InvoiceReports.tsx`**
36. **`components/batches/BatchDetail.tsx`**
37. **`components/batches/BatchInvoiceSelector.tsx`**
38. **`components/settlements/SettlementDetail.tsx`**

### **Priority 7: Settings & Management**

39. **`components/settings/UserManagement.tsx`**
40. **`components/settings/customizations/ExpenseCategories.tsx`**
41. **`components/settings/customizations/TagManagement.tsx`**
42. **`components/mc-numbers/McNumberList.tsx`**
43. **`components/accessorial/AccessorialChargesList.tsx`**

### **Priority 8: Specialized Features**

44. **`components/safety/SafetyPage.tsx`**
45. **`components/ai/AIVerificationQueue.tsx`**
46. **`components/dispatch/WeeklyScheduleView.tsx`**
47. **`components/loadboard/LoadBoardSearch.tsx`**
48. **`components/factoring/FactoringDashboard.tsx`**
49. **`components/import-export/ImportDialog.tsx`**
50. **`components/import-export/ImportPage.tsx`**
51. **`components/invoices/GenerateInvoiceForm.tsx`**

---

## Migration Strategy

### **Phase 1: Core Entity Lists (Week 1)**
Refactor main list pages that users interact with most:

1. ✅ **DriverTable.tsx** → Use `DataTableWrapper` with updated `driversTableConfig`
2. ✅ **DocumentList.tsx** → Replace with `DocumentListNew.tsx` usage
3. ✅ **BatchList.tsx** → Replace with `BatchListNew.tsx` usage
4. ✅ **InspectionList.tsx** → Create config, use `DataTableWrapper`
5. ✅ **MaintenanceList.tsx** → Create config, use `DataTableWrapper`
6. ✅ **InventoryList.tsx** → Create config, use `DataTableWrapper`

### **Phase 2: Safety & Compliance (Week 2)**
7. ✅ **DriverComplianceTable.tsx** → Create config, use `DataTableWrapper`

### **Phase 3: Analytics & Reports (Week 3)**
8-16. Refactor analytics tables (can use simpler `DataTable` if static data)

### **Phase 4: Queues & Accounting (Week 4)**
17-20. Refactor queue and accounting tables

### **Phase 5: Fleet & Detail Tables (Week 5)**
21-38. Refactor fleet and nested detail tables

### **Phase 6: Settings & Specialized (Week 6)**
39-51. Clean up remaining tables

---

## Standard Pattern for ALL Tables

### **For List Pages (with API fetching):**

```tsx
// ✅ CORRECT: Using DataTableWrapper
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { [entity]TableConfig } from '@/lib/config/entities/[entity]';

export default function [Entity]List() {
  const fetchData = async (params) => {
    // Fetch from API
    const response = await fetch(apiUrl(`/api/[entities]?...`));
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
      config={[entity]TableConfig}
      fetchData={fetchData}
      rowActions={(row) => (
        <div className="flex gap-2">
          {/* Action buttons */}
        </div>
      )}
      emptyMessage="No [entities] found."
    />
  );
}
```

### **For Static/Simple Tables:**

```tsx
// ✅ CORRECT: Using DataTable for static data
import { DataTable } from '@/components/data-table/DataTable';

export default function SimpleTable() {
  const columns = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
    // ... more columns
  ];

  return (
    <DataTable
      columns={columns}
      data={staticData}
      enableRowSelection={false}
      enableColumnVisibility={false}
    />
  );
}
```

### **❌ NEVER DO THIS:**

```tsx
// ❌ WRONG: Hardcoded table
import { Table, TableHeader, TableBody, ... } from '@/components/ui/table';

export default function BadTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>...</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(...)}
      </TableBody>
    </Table>
  );
}
```

---

## Action Items

### **Immediate (Do First):**

1. ✅ **Update `lib/config/entities/drivers.tsx`** to match actual `Driver` interface
2. ✅ **Refactor `DriverTable.tsx` → Remove, update `DriverList.tsx`** to use `DataTableWrapper`
3. ✅ **Delete `components/documents/DocumentList.tsx`** - replace all usages with `DocumentListNew.tsx`
4. ✅ **Delete `components/batches/BatchList.tsx`** - replace all usages with `BatchListNew.tsx`

### **Next Batch:**

5. Create `lib/config/entities/inspections.tsx`
6. Create `lib/config/entities/maintenance.tsx`
7. Create `lib/config/entities/inventory.tsx`
8. Refactor corresponding list components

---

## Benefits After Full Migration

✅ **Consistency:** Every table looks and behaves the same
✅ **Maintainability:** Update table features in ONE place
✅ **Less Code:** Delete ~10,000+ lines of duplicate table code
✅ **Type Safety:** Full TypeScript generics everywhere
✅ **Features:** Sorting, filtering, pagination, column visibility work everywhere automatically
✅ **User Experience:** Predictable, professional interface

---

## Quick Reference: Table Config Template

```tsx
// lib/config/entities/[entity].tsx
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef } from '@/components/data-table/types';

interface [Entity]Data {
  id: string;
  // ... your fields
}

const columns: ExtendedColumnDef<[Entity]Data>[] = [
  {
    id: 'field1',
    accessorKey: 'field1',
    header: 'Field 1',
    cell: ({ row }) => row.original.field1,
    defaultVisible: true,
  },
  // ... more columns
];

export const [entity]TableConfig = createEntityTableConfig<[Entity]Data>({
  entityType: '[entities]',
  columns,
  defaultVisibleColumns: ['field1', 'field2'],
  defaultSort: [{ id: 'field1', desc: false }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  // ... more options
});
```

---

**Let's start with Priority 1 items and work through systematically. Ready to refactor the first batch?**




