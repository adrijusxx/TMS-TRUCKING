# TMS-TRUCKING — Accounting Department Roadmap

> Full audit and phased implementation plan for in-house accounting.
> Last updated: 2026-02-23.
> NO QuickBooks integration. All accounting is handled in-house.
> Factoring companies are ACTIVELY used.
>
> **Status:** ALL PHASES DONE (1-4).
> **Pending:** Run `prisma generate` (stop dev server first), then `prisma migrate dev --name accounting-overhaul`.

---

## Table of Contents

1. [Current Status Audit](#1-current-status-audit)
2. [Phase 1: Foundation Fixes (CRITICAL)](#2-phase-1-foundation-fixes-critical)
3. [Phase 2: Invoice Workflow (HIGH)](#3-phase-2-invoice-workflow-high)
4. [Phase 3: Organization & Navigation (MEDIUM)](#4-phase-3-organization--navigation-medium)
5. [Phase 4: Advanced Features (LOWER)](#5-phase-4-advanced-features-lower)
6. [QuickBooks Removal Checklist](#6-quickbooks-removal-checklist)
7. [File Reference Index](#7-file-reference-index)

---

## 1. Current Status Audit

### What WORKS (Verified)

| Area | Key Files |
|------|-----------|
| Settlement calculation engine (5 pay types: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY, WEEKLY_FLAT) | `lib/managers/settlement/CalculationEngine.ts` |
| Settlement deduction rules & frequency windows (weekly, biweekly, monthly, one-time) | `lib/managers/settlement/RuleProcessor.ts` |
| Settlement approval workflow (submit → approve → reject → pay) | `lib/managers/settlement/WorkflowManager.ts` |
| Settlement orchestrator (load fetching, deduplication, generation) | `lib/managers/settlement/Orchestrator.ts` |
| Invoice generation (manual, from load IDs) | `lib/managers/InvoiceManager.ts` |
| Invoice PDF + Rate Con + POD + BOL merged package | `lib/managers/invoice/InvoiceDocumentBuilder.ts` |
| Batch email sending with smart factoring routing | `lib/managers/invoice/BatchEmailManager.ts` |
| Invoice validation (POD check, rate mismatch, BOL weight) | `lib/managers/invoice/InvoiceValidationManager.ts` |
| Invoice data snapshots at creation time | `lib/managers/invoice/InvoiceSnapshotService.ts` |
| Invoice audit (orphan loads, settlement parity) | `lib/managers/invoice/InvoiceAuditService.ts` |
| Factoring submit/fund/reserve-release workflow | `lib/managers/FactoringManager.ts` |
| Factoring utility calculations | `lib/utils/factoring.ts` |
| Load cost calculator (per-load breakdown) | `lib/managers/costing/LoadCostCalculator.ts` |
| Load profitability analyzer (aggregate analytics) | `lib/managers/costing/LoadProfitabilityAnalyzer.ts` |
| Accounting sync manager (load-to-accounting sync) | `lib/managers/AccountingSyncManager.ts` |
| IFTA fuel tax calculations (48 states + DC) | `lib/services/IFTACalculatorService.ts` |

### What is BROKEN or INCOMPLETE

| Issue | Severity | Details |
|-------|----------|---------|
| **No financial lock** | HIGH | `driverPay` and `revenue` editable at any time, even after invoicing/settlement. No `financialLockedAt` field. No API enforcement. |
| **Auto-invoice generation is naive** | HIGH | `lib/automation/invoice-generation.ts` uses hardcoded 8% tax, ignores `isBillingHold`, ignores POD, ignores customer `paymentTerms`. |
| **Accounting dashboard is a redirect** | MEDIUM | `app/dashboard/accounting/page.tsx` redirects to `/dashboard/invoices`. No overview metrics. |
| **AccountingMetrics has TODOs** | MEDIUM | `weeklyRevenue`, `weeklyProfit`, `profitMargin` are all hardcoded to 0. |
| **No consolidated billing** | MEDIUM | No configurable billing cycles (weekly/biweekly/monthly) per customer. |
| **No collections workflow** | MEDIUM | `InvoiceSubStatus` enum exists but no actual 30/60/90 day action stages. |
| **No customer credit management** | MEDIUM | No credit limits, DSO tracking, or credit holds on Customer model. |
| **Factoring export unimplemented** | MEDIUM | `FactoringManager.exportToFactoringCompany()` throws "not implemented". |
| **No LedgerEntry model** | MEDIUM | PLAN.md references it for post-payment adjustments but model doesn't exist. |
| **No CreditMemo model** | LOW | Rate disputes with already-invoiced loads can't create credit memos. |
| **QuickBooks fields pollute schema** | LOW | 6 QB fields on Invoice model, 8+ files reference QuickBooks. |
| **Navigation is flat** | MEDIUM | Missing dashboard, reports, deduction rules, advance approvals links. |
| **settlement-generation.ts is 648 lines** | LOW | Exceeds 500-line hard limit. Duplicated logic between two generation functions. |

---

## 2. Phase 1: Foundation Fixes (CRITICAL) — DONE

### 1.1 Financial Lock Mechanism — DONE

**Problem:** Revenue and driverPay can be edited at any point, even after invoicing.

**Schema changes** on Load model:
- `financialLockedAt DateTime?`
- `financialLockedById String?`
- `financialLockReason String?` — "AUTO_READY_TO_BILL" | "ADMIN_OVERRIDE"

**New file:** `lib/managers/FinancialLockManager.ts` (~120 lines)
- `lockFinancials(loadId, userId, reason)` — auto-called on READY_TO_BILL transition
- `unlockFinancials(loadId, adminUserId, overrideReason)` — admin override with audit trail
- `isLocked(loadId)` — check status
- `validateUpdate(loadId, fields)` — blocks revenue/driverPay/fuelAdvance edits when locked

**API enforcement** in `app/api/loads/[id]/route.ts` PUT handler:
- Call `FinancialLockManager.validateUpdate()` before any update
- Return 403 if locked fields being modified without `loads.override_financial_lock` permission

**Auto-lock trigger:** When load transitions to READY_TO_BILL or INVOICED, call `lockFinancials()` automatically.

**UI:** Lock icon on Load detail next to revenue/driverPay. Admin override button with confirmation dialog.

**Files:** `prisma/schema.prisma`, `lib/managers/FinancialLockManager.ts` (NEW), `app/api/loads/[id]/route.ts`, `lib/permissions.ts`

### 1.2 Fix Automated Invoice Generation — DONE

**Problem:** `lib/automation/invoice-generation.ts` has hardcoded 8% tax, skips billing hold checks, ignores customer payment terms.

**Rewrite** (~200 lines):
- [ ] Query DELIVERED loads where `isBillingHold = false`, `invoicedAt IS NULL`
- [ ] Run `InvoiceValidationManager.isReadyToBill()` before generating
- [ ] Use customer's `taxRate` and `isTaxExempt` (NOT hardcoded 8%)
- [ ] Use customer's `paymentTerms` for due date calculation
- [ ] Update load: status → INVOICED, `invoicedAt` → now, `readyForSettlement` → true
- [ ] Call `FinancialLockManager.lockFinancials()` if not already locked
- [ ] If customer has `factoringCompanyId`, auto-set factoring fields on invoice
- [ ] Respect `AccountingSettings.requirePodForInvoicing`

**Files:** `lib/automation/invoice-generation.ts` (rewrite)

### 1.3 Refactor settlement-generation.ts (648 lines → 3 files) — DONE

Split into:
- `lib/automation/settlement-generation.ts` (~200 lines) — entry points + orchestration
- `lib/automation/settlement-notifications.ts` (~80 lines) — driver/accounting notifications
- `lib/automation/settlement-cron-logger.ts` (~50 lines) — cron execution logging

Merge duplicated `runWeeklySettlementGeneration` / `runSettlementGenerationForAllCompanies` into single `generateSettlementsForCompanies()`.

### 1.4 QuickBooks — DEFERRED

> Keeping QuickBooks integration code for potential future use.
> If/when QB integration is needed, the code is already in place (incomplete but functional OAuth flow).
> Files: `lib/integrations/quickbooks.ts`, `lib/inngest/functions/sync-quickbooks.ts`, 4 API routes, settings form.

---

## 3. Phase 2: Invoice Workflow (HIGH) — DONE

### 2.1 Billing Hold Logic — DONE (pre-existing)

**New file:** `lib/managers/BillingHoldManager.ts` (~150 lines)
- `setHold(loadId, reason, userId)` — sets `isBillingHold = true`, creates ActivityLog
- `resolveHold(loadId, resolution, userId)` — clears hold, logs resolution
- `getHeldLoads(mcWhere)` — query loads with billing holds

**New API:** `app/api/loads/[id]/billing-hold/route.ts` — PUT (set/resolve), GET (status + history)

**New component:** `components/accounting/BillingHoldQueue.tsx` (~200 lines) — table with Load #, Customer, Revenue, Hold Reason, Held Since, Actions (Resolve/Release)

### 2.2 Consolidated Billing — DONE

**Schema additions** on Customer:
- `billingCycle BillingCycle? @default(ON_DELIVERY)` — ON_DELIVERY | WEEKLY | BIWEEKLY | MONTHLY
- `billingCycleDay Int?` — day of week (1-7) or month (1-28)
- `consolidatedBilling Boolean @default(false)`

**New file:** `lib/managers/ConsolidatedBillingManager.ts` (~200 lines)
- `getLoadsForBillingPeriod(customerId, periodStart, periodEnd)`
- `generateConsolidatedInvoice(customerId, loadIds, options)`
- `getCustomersDueForBilling(companyId)`

Integrate into `lib/automation/invoice-generation.ts` — check billing cycle before generating.

### 2.3 Factoring Enhancements — DONE (CSV export)

- [ ] Implement `FactoringManager.exportToFactoringCompany()` — CSV export (Invoice #, Customer, Date, Total, Load Numbers)
- [ ] New Inngest cron `lib/inngest/functions/check-reserve-releases.ts` (~80 lines) — daily check, notify accounting, optional auto-release
- [ ] Enhance `components/factoring/FactoringDashboard.tsx` — pending releases section, days-until-release, bulk release action

### 2.4 Invoice List Enhancements — DONE

Add columns to `components/invoices/InvoiceListNew.tsx`:
- Factoring Status badge (NOT_FACTORED | SUBMITTED | FUNDED | RESERVE_RELEASED)
- Payment Method
- Short Pay amount/reason
- Days Outstanding (calculated from invoiceDate)
- Sub-Status

Update `app/api/invoices/route.ts` to include these fields in response.

---

## 4. Phase 3: Organization & Navigation (MEDIUM) — DONE

### 3.1 Accounting Dashboard — DONE

Replace redirect in `app/dashboard/accounting/page.tsx` with actual dashboard.

Fix `components/accounting/AccountingMetrics.tsx` — implement weeklyRevenue, weeklyProfit, profitMargin.

**New API:** `app/api/accounting/dashboard/route.ts` (~150 lines)
- AR aging summary (current, 30, 60, 90+ days)
- AP summary (pending settlements, pending advances)
- Cash position (invoiced unpaid, funded from factoring, reserves held)
- Revenue/profit this week vs. last week
- Top 5 overdue invoices
- Loads pending invoicing/settlement counts

**New component:** `components/accounting/AccountingDashboard.tsx` (~300 lines)
- Metric cards (revenue, profit, receivables, payables)
- AR aging bar chart
- Cash position summary
- Action items: "X loads ready to invoice", "X settlements pending approval"
- Quick links to common actions

### 3.2 Navigation Restructure — DONE

Restructure `components/accounting/AccountingNav.tsx` into grouped sections:

```
ACCOUNTING
  Dashboard           → /dashboard/accounting

RECEIVABLES (AR)
  Invoices            → /dashboard/invoices
  Aging Report        → /dashboard/invoices/aging
  Billing Holds       → /dashboard/accounting/billing-holds
  Factoring           → /dashboard/accounting/factoring

PAYABLES (AP)
  Settlements         → /dashboard/settlements
  Salary Batches      → /dashboard/accounting/salary/batches
  Deduction Rules     → /dashboard/accounting/deduction-rules
  Advance Approvals   → /dashboard/accounting/advances
  Expenses            → /dashboard/accounting/expenses

REPORTING
  Reports             → /dashboard/accounting/reports
  IFTA                → /dashboard/accounting/ifta

SETTINGS
  Settings            → /dashboard/accounting/settings
```

### 3.3 Financial Reporting — DONE

New report components in `components/accounting/reports/`:

**P&L Report** (~200 lines): Revenue, Cost of Revenue (driver pay + expenses), Gross Profit, Factoring Fees, Net Profit — by date range, by MC number

**Driver Pay Summary** (~200 lines): Per-driver gross pay, deductions, additions, net pay with totals row

**Factoring Summary** (~150 lines): Submitted vs Funded amounts, Total fees paid, Reserves held vs released, Net after factoring

All reports: date range filter, MC number filter, CSV/Excel export, printable

---

## 5. Phase 4: Advanced Features (LOWER) — DONE

### 4.1 Collections Workflow — DONE

**Schema additions** on Invoice:
- `collectionStage CollectionStage?` — CURRENT | PAST_DUE_30 | PAST_DUE_60 | PAST_DUE_90 | COLLECTIONS | WRITTEN_OFF
- `lastCollectionAction String?`, `lastCollectionDate DateTime?`, `nextFollowUpDate DateTime?`, `collectionAssignedTo String?`

**New file:** `lib/managers/CollectionsManager.ts` (~200 lines)
- `updateCollectionStages(companyId)` — batch update based on days outstanding
- `recordCollectionAction(invoiceId, action, userId)` — log follow-up
- `scheduleFollowUp(invoiceId, date, userId)`
- `writeOff(invoiceId, reason, userId)`

Daily Inngest cron to auto-update stages.

**New page:** `app/dashboard/accounting/collections/page.tsx` with tabbed queue by stage.

### 4.2 Customer Credit Management — DONE

**Schema additions** on Customer: `creditLimit Float?`, `creditHold Boolean @default(false)`, `creditHoldReason String?`, `creditRating String?`, `averageDSO Float?`

**New file:** `lib/managers/CustomerCreditManager.ts` (~180 lines)
- `checkCreditLimit(customerId)` → `{ withinLimit, currentBalance, creditLimit, percentUsed }`
- `calculateDSO(customerId, periodMonths?)`
- `setCreditHold(customerId, reason, userId)` / `releaseCreditHold(customerId, userId)`

Integration: warn dispatchers on load creation when customer at credit limit.

### 4.3 Post-Payment Adjustments (LedgerEntry) — DONE

**New model** `LedgerEntry`: id, companyId, driverId, type (ADJUSTMENT | DEDUCTION | CREDIT | REIMBURSEMENT), amount, description, loadId?, settlementId?, targetSettlementId?, status (PENDING | APPLIED | CANCELLED), createdById

**New file:** `lib/managers/LedgerEntryManager.ts` (~150 lines)
- `createAdjustment(driverId, amount, description, userId)`
- `applyToSettlement(entryId, settlementId)`
- `getPendingEntries(driverId)`

Integrate into `CalculationEngine.ts` — include pending ledger entries in settlement calculation.

### 4.4 Rate Dispute Workflow — DONE

**New file:** `lib/managers/RateDisputeManager.ts` (~180 lines)
- `openDispute(loadId, reason, userId)` — sets `isBillingHold = true`
- `resolveDispute(loadId, resolution, adjustedRevenue?, userId)`
- `createCreditMemo(invoiceId, amount, reason, userId)`

**New model** `CreditMemo`: memoNumber, amount, reason, status (PENDING | APPROVED | APPLIED | VOIDED), invoiceId

When applied, reduce `Invoice.balance` by memo amount.

### 4.5 Rate Confirmation Matching — DONE

**New file:** `lib/services/RateConfirmationMatcherService.ts` (~200 lines)
- `matchRateConToLoad(loadId)` — compare rate con amount vs load revenue
- `detectDiscrepancies(companyId)` — batch check

Integration: flag mismatches in `InvoiceValidationManager.isReadyToBill()`.

---

## 6. QuickBooks Removal Checklist

- [ ] `prisma/schema.prisma` — Remove 6 QB fields from Invoice model
- [ ] `lib/integrations/quickbooks.ts` — DELETE file
- [ ] `lib/inngest/functions/sync-quickbooks.ts` — DELETE file
- [ ] `lib/inngest/functions/index.ts` — Remove QB function export
- [ ] `lib/inngest/client.ts` — Remove QB event types
- [ ] `lib/validations/integrations.ts` — Remove QB schemas
- [ ] `lib/schema-reference.ts` — Remove QB references
- [ ] `lib/schema-reference.json` — Remove QB references
- [ ] `lib/config/subscription-plans.ts` — Remove QB feature flags
- [ ] `components/` — Search and remove any QB-related UI
- [ ] `app/api/` — Search and remove any QB-related API routes
- [ ] Run migration: `npx prisma migrate dev --name remove-quickbooks`

---

## 7. File Reference Index

### Existing Files (to modify)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add financial lock fields, billing cycle, collections, LedgerEntry, CreditMemo; remove QB fields |
| `lib/automation/invoice-generation.ts` | Complete rewrite |
| `lib/automation/settlement-generation.ts` | Split into 3 files |
| `lib/managers/FactoringManager.ts` | Implement export method |
| `lib/managers/settlement/CalculationEngine.ts` | Integrate ledger entries |
| `components/accounting/AccountingNav.tsx` | Restructure into groups |
| `components/accounting/AccountingMetrics.tsx` | Implement 3 missing metrics |
| `app/dashboard/accounting/page.tsx` | Replace redirect with dashboard |
| `lib/permissions.ts` | Add `loads.override_financial_lock` |

### New Files (to create)

| File | Phase | Est. Lines |
|------|-------|-----------|
| `lib/managers/FinancialLockManager.ts` | 1.1 | ~120 |
| `lib/managers/BillingHoldManager.ts` | 2.1 | ~150 |
| `lib/managers/ConsolidatedBillingManager.ts` | 2.2 | ~200 |
| `lib/managers/CollectionsManager.ts` | 4.1 | ~200 |
| `lib/managers/CustomerCreditManager.ts` | 4.2 | ~180 |
| `lib/managers/LedgerEntryManager.ts` | 4.3 | ~150 |
| `lib/managers/RateDisputeManager.ts` | 4.4 | ~180 |
| `lib/services/RateConfirmationMatcherService.ts` | 4.5 | ~200 |
| `app/api/accounting/dashboard/route.ts` | 3.1 | ~150 |
| `components/accounting/AccountingDashboard.tsx` | 3.1 | ~300 |
| `components/accounting/BillingHoldQueue.tsx` | 2.1 | ~200 |
| `components/accounting/CollectionsQueue.tsx` | 4.1 | ~250 |
| `components/accounting/reports/ProfitLossReport.tsx` | 3.3 | ~200 |
| `components/accounting/reports/DriverPaySummary.tsx` | 3.3 | ~200 |
| `components/accounting/reports/FactoringSummary.tsx` | 3.3 | ~150 |
| `lib/automation/settlement-notifications.ts` | 1.3 | ~80 |
| `lib/automation/settlement-cron-logger.ts` | 1.3 | ~50 |
| `lib/inngest/functions/check-reserve-releases.ts` | 2.3 | ~80 |
