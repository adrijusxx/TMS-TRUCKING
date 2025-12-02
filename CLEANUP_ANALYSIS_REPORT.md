# TMS Project Deep Cleanup Analysis Report

**Generated:** Analysis of codebase for shadow files, duplicate components, and dead code.

---

## STEP 1: Shadow Files Identified

### 1.1 Duplicate Mobile Directories
**[DELETE SHADOW]** `app/mobile/` (Reason: Duplicate of `app/(mobile)/` route group)
- Both directories contain identical driver dashboard pages
- Only difference: `app/mobile/driver/page.tsx` redirects to `/login` vs `/auth/login`
- Next.js route groups `(mobile)` are preferred over `mobile` for organization
- **Action:** Delete `app/mobile/` directory and keep `app/(mobile)/`

### 1.2 Files with "New" Suffix (Not Shadows, But Migration Pattern)
These are NOT shadows but appear to be newer implementations replacing older ones:
- `*ListNew.tsx` components exist alongside older `*List.tsx` versions
- Both are currently in use, indicating a partial migration
- See STEP 2 for merging strategy

---

## STEP 2: Intelligent Component Merging (90% Rule)

### 2.1 DocumentList Components
**[MERGE PROPOSAL]** `components/documents/DocumentList.tsx` + `components/documents/DocumentListNew.tsx` → Keep `DocumentListNew.tsx` (Reason: Newer implementation using `DataTableWrapper`, more maintainable)
- **Current Usage:**
  - `DocumentList.tsx`: Used in `app/dashboard/documents/page.tsx` and `components/safety/compliance/DriverComplianceEditor.tsx`
  - `DocumentListNew.tsx`: Used in `app/dashboard/safety/documents/page.tsx`
- **Differences:** `DocumentListNew` uses modern `DataTableWrapper` pattern, `DocumentList` uses custom table implementation
- **Action:** Migrate remaining usages to `DocumentListNew`, then delete `DocumentList.tsx`

### 2.2 BatchList Components
**[MERGE PROPOSAL]** `components/batches/BatchList.tsx` + `components/batches/BatchListNew.tsx` → Keep `BatchListNew.tsx` (Reason: Uses modern `DataTableWrapper`, cleaner implementation)
- **Current Usage:**
  - `BatchList.tsx`: Used in `app/dashboard/batches/page.tsx`
  - `BatchListNew.tsx`: Used in `app/dashboard/accounting/batches/page.tsx`
- **Differences:** `BatchListNew` uses `DataTableWrapper` pattern, `BatchList` has custom implementation with more inline logic
- **Action:** Migrate remaining usage to `BatchListNew`, then delete `BatchList.tsx`

### 2.3 Safety Driver Pages (Structural Duplicates)
**[MERGE PROPOSAL]** Create unified `DriverCompliancePage.tsx` wrapper (Reason: All 7 pages share identical structure, only differ in breadcrumb labels and component import)
- **Affected Files:**
  1. `app/dashboard/safety/drivers/[driverId]/mvr/page.tsx`
  2. `app/dashboard/safety/drivers/[driverId]/cdl/page.tsx`
  3. `app/dashboard/safety/drivers/[driverId]/hos/page.tsx`
  4. `app/dashboard/safety/drivers/[driverId]/drug-tests/page.tsx`
  5. `app/dashboard/safety/drivers/[driverId]/dqf/page.tsx`
  6. `app/dashboard/safety/drivers/[driverId]/medical-cards/page.tsx`
  7. `app/dashboard/safety/drivers/[driverId]/annual-review/page.tsx`
- **Structure:** All pages follow identical pattern:
  ```tsx
  - Same imports (use, Breadcrumb)
  - Same page wrapper structure
  - Only differences: breadcrumb labels, page title, component import
  ```
- **Action:** Create `app/dashboard/safety/drivers/[driverId]/[complianceType]/page.tsx` with dynamic component loading

### 2.4 Safety API Route Handlers (Duplicate Code Blocks)
**[MERGE PROPOSAL]** Extract shared route handler utilities (Reason: Multiple API routes share identical error handling and response patterns)
- **Affected Patterns:**
  - All `app/api/safety/drivers/[driverId]/*/route.ts` files share similar structure
  - All `app/api/safety/vehicles/[vehicleId]/*/route.ts` files share similar structure
  - All `app/api/safety/compliance/fmcsa/action-items/*/route.ts` share error handling
- **Action:** Create shared utilities in `lib/api/safety/route-helpers.ts` for common patterns

### 2.5 List Components Migration Pattern
**Note:** The following "New" variants should eventually replace their older counterparts, but both are currently in use:
- `InvoiceListNew.tsx` (used in 2 places) vs `InvoiceList.tsx` (unused per report)
- `LoadListNew.tsx` (used) vs `LoadList.tsx` (check if used)
- `TrailerListNew.tsx` (used) vs older variant (check if exists)
- `LocationListNew.tsx` (used) vs older variant (check if exists)
- `SettlementListNew.tsx` (used in 2 places) vs older variant (check if exists)
- `VendorListNew.tsx` (used) vs older variant (check if exists)
- `FactoringCompanyListNew.tsx` (used) vs older variant (check if exists)
- `RateConfirmationListNew.tsx` (used) vs older variant (check if exists)

---

## STEP 3: Dead Code Removal

### 3.1 Unused Components (0 Imports Found)
**[DELETE UNUSED]** The following files are listed in `unused_report.txt` and have 0 import references:

1. `components/drivers/DriverListNew.tsx` (Reason: File doesn't exist - already deleted or never created)
2. `components/drivers/DriverListStats.tsx` (Reason: Listed in unused report, 0 imports found)
3. `components/drivers/DriverQuickView.tsx` (Reason: Listed in unused report, 0 imports found)
4. `components/drivers/DriverInlineEdit.tsx` (Reason: Listed in unused report, 0 imports found - NOTE: There's also `DriverInlineEdit.tsx` in drivers folder, verify it's not the same)
5. `components/drivers/DriverFinancialsView.tsx` (Reason: Listed in unused report, 0 imports found)
6. `components/drivers/DriverPaymentsActivity.tsx` (Reason: Listed in unused report, 0 imports found)
7. `components/drivers/DriverDocuments.tsx` (Reason: Listed in unused report, 0 imports found)
8. `components/invoices/InvoiceList.tsx` (Reason: Listed in unused report, replaced by `InvoiceListNew.tsx`)
9. `components/invoices/InvoiceQuickView.tsx` (Reason: Listed in unused report, 0 imports found)
10. `components/invoices/InvoiceListStats.tsx` (Reason: Listed in unused report, 0 imports found)
11. `components/invoices/InvoiceQuickActions.tsx` (Reason: Listed in unused report, 0 imports found)
12. `components/invoices/InvoiceImportDialog.tsx` (Reason: Listed in unused report, 0 imports found)
13. `components/invoices/InvoiceSubStatusBadge.tsx` (Reason: Listed in unused report, 0 imports found)
14. `components/invoices/PaymentMethodBadge.tsx` (Reason: Listed in unused report, 0 imports found)
15. `components/loads/LoadList.tsx` (Reason: Verify if used - `LoadListNew.tsx` is active)
16. `components/loads/LoadQuickView.tsx` (Reason: Listed in unused report, 0 imports found)
17. `components/loads/LoadListStats.tsx` (Reason: Listed in unused report, 0 imports found)
18. `components/loads/LoadStatusQuickActions.tsx` (Reason: Only referenced in docs, not code)
19. `components/loads/LoadCompletionMetrics.tsx` (Reason: Listed in unused report, 0 imports found)
20. `components/loads/DocumentViewerDialog.tsx` (Reason: Listed in unused report, 0 imports found)
21. `components/loads/BulkStatusUpdate.tsx` (Reason: Listed in unused report, 0 imports found)
22. `components/inspections/InspectionListNew.tsx` (Reason: Listed in unused report, `InspectionList.tsx` is active instead)
23. `components/maintenance/MaintenanceListNew.tsx` (Reason: Listed in unused report, `MaintenanceList.tsx` is active instead)

### 3.2 Unused Hooks
**[DELETE UNUSED]** The following hooks are listed in unused report:
- `hooks/useClientSideMcFilter.ts`
- `hooks/useEntityFetch.ts`
- `hooks/useMcQueryKey.ts`
- `hooks/useSmoothMcQuery.ts`

### 3.3 Unused Scripts (Likely Safe to Delete)
**[DELETE UNUSED]** Scripts typically safe to remove if unused:
- Most scripts in `scripts/` folder are utility/maintenance scripts
- Verify if any are referenced in `package.json` scripts before deletion
- Scripts listed: `add-dispatcher-column-visibility.ts`, `check-admin-password.ts`, `check-auth-config.js`, `check-drivers.ts`, `check-mc-numbers.ts`, `check-user-emails.ts`, `debug-password.ts`, `fix-nextjs15-params.ts`, `generate-auth-secret.js`, `list-companies-simple.ts`, `list-companies.ts`, `migrate-load-mcnumberid.ts`, `migrate-mc-access.ts`, `reset-demo-passwords.ts`, `test-login-direct.ts`, `test-password.ts`, `update-api-routes-for-deleted-records.ts`

### 3.4 Unused Lib Files
**[DELETE UNUSED]** The following lib files are listed in unused report:
- `lib/page-layout-constants.ts`
- `lib/contexts/McSelectionContext.tsx`
- `lib/managers/BatchManager.ts`
- `lib/managers/ReconciliationManager.ts`
- `lib/utils/mc-state-client.ts`
- `lib/utils/permission-helpers.ts`
- `lib/validations/api-response-validator.ts`
- `lib/validations/form-field-validator.ts`
- Multiple safety service files: `CDLService.ts`, `DrugAlcoholTestService.ts`, `IncidentService.ts`, `MedicalCardService.ts`, `MVRService.ts`, `RoadsideInspectionService.ts`
- `src/lib/services/accounting/rating-engine.ts` (Note: `src/` path suggests old structure)
- `src/lib/services/analytics/kpi-calculator.ts`
- `src/lib/services/fleet/inspection-manager.ts`

---

## Summary Statistics

- **Shadow Files Found:** 1 (duplicate mobile directory)
- **Merge Opportunities:** 5 major categories (DocumentList, BatchList, Safety Pages, API Routes, List Components)
- **Unused Components:** ~23 files identified
- **Unused Hooks:** 4 files
- **Unused Scripts:** ~19 files (verify before deletion)
- **Unused Lib Files:** ~15 files

---

## Recommended Action Priority

### HIGH PRIORITY (Immediate Impact)
1. Delete `app/mobile/` directory (clear duplicate)
2. Merge `DocumentList` and `BatchList` components (used in production)
3. Consolidate Safety Driver Pages (7 files → 1 dynamic route)

### MEDIUM PRIORITY (Code Quality)
4. Extract API route helper utilities
5. Remove unused component files confirmed with 0 imports
6. Complete "New" component migration

### LOW PRIORITY (Cleanup)
7. Remove unused hooks and lib files
8. Archive or remove unused scripts (verify first)
9. Remove unused validation utilities

---

## Notes

- All "ListNew.tsx" components appear to be part of a modernization effort
- Many unused files may be part of planned features or deprecated functionality
- Verify with team before deleting scripts and utility files
- Some files in `src/` suggest old project structure - may indicate incomplete migration




