# TMS-TRUCKING — Implementation Plan

> Living roadmap. Last updated: 2026-02-17.

---

## Completed Features

### Core Operations
- [x] Load CRUD with multi-stop support (LoadStop)
- [x] Load status state machine (12+ states with transition validation)
- [x] Driver management (profiles, qualifications, assignments, pay profiles)
- [x] Truck management (fleet tracking, maintenance status, inspections)
- [x] Trailer management (equipment tracking, assignments)
- [x] Customer management (contacts, billing info, rate agreements)
- [x] Vendor management
- [x] Location/terminal management

### Dispatch & Operations
- [x] Dispatch board with real-time view
- [x] Driver-truck-trailer assignment
- [x] Google Maps integration (geocoding, route visualization, live map)
- [x] Samsara GPS/telematics integration (device sync, mileage tracking)
- [x] Load status tracking with history
- [x] Route management and segment tracking
- [x] Calendar view for scheduling
- [x] Fleet board overview

### Financial & Accounting
- [x] Settlement calculation engine (per-mile, per-load, percentage, hourly, weekly flat)
- [x] Settlement deduction rules and templates
- [x] Settlement approval workflow (multi-stage)
- [x] Invoice generation and management
- [x] Invoice factoring with batch processing
- [x] Load expense tracking (fuel, toll, detention, motel, etc.)
- [x] Accessorial charge management
- [x] Rate confirmation parsing
- [x] Driver advance requests with approval
- [x] Driver pay calculation (`lib/utils/calculateDriverPay.ts`)
- [x] Revenue, cost, and profit analytics
- [x] Invoice aging analysis
- [x] Salary batch processing

### Import/Export
- [x] CSV and Excel import with column auto-mapping
- [x] 8 entity importers: drivers, trucks, trailers, customers, loads, vendors, invoices, settlements
- [x] BaseImporter pattern with best-effort parsing
- [x] AI-powered load status/type prediction during import
- [x] Field mapping profiles (saved per user)
- [x] Import batch tracking with error/warning reporting
- [x] Data export utilities

### Safety & Compliance
- [x] Driver Qualification File (DQF) tracking
- [x] Medical card and CDL expiration monitoring
- [x] Drug/alcohol test records
- [x] MVR records
- [x] Safety incident tracking
- [x] Safety training records
- [x] DVIR (vehicle inspection) reports
- [x] HOS violation tracking
- [x] Roadside inspection records
- [x] Annual review tracking
- [x] Safety policy management with acknowledgments

### AI Services (25+ specialized)
- [x] Load matching (driver-load optimization)
- [x] Dynamic pricing / rate recommendations
- [x] Route optimization
- [x] Backhaul recommendations
- [x] Anomaly detection
- [x] Breakdown/maintenance prediction
- [x] Cash flow prediction
- [x] Compliance risk assessment
- [x] Customer intelligence
- [x] Dispatch assistant
- [x] Fuel optimization
- [x] Invoice matching/reconciliation
- [x] Safety risk scoring
- [x] Settlement calculation recommendations
- [x] AI chatbot
- [x] AI suggestion verification workflow

### Platform & Infrastructure
- [x] Role-based access control (~200 permissions, 9 roles)
- [x] MC number multi-tenancy (McFilterContext)
- [x] Soft delete with admin restore
- [x] Activity logging and audit trails
- [x] Notification system (in-app + Telegram)
- [x] Global search
- [x] User column preferences per table
- [x] Dynamic status management (custom statuses)
- [x] Custom field support
- [x] Tag system across entities
- [x] Document management and templates
- [x] API caching layer
- [x] Stripe subscription management
- [x] AWS Secrets Manager integration
- [x] AWS SES email sending

### Other
- [x] Mobile driver app (loads, breakdowns, settlements, support)
- [x] Customer tracking portal
- [x] CRM/leads management with pipeline
- [x] EDI support (basic)
- [x] Telegram bot integration
- [x] Knowledge base / help system
- [x] On-call shift management
- [x] Inventory tracking

---

## In Progress

- [ ] **Schema migration** — Adding `tripId`, `stopsCount`, `lastNote`, `onTimeDelivery`, `lastUpdate` fields to Load model
- [ ] **Load import alignment** — Updating entity-config.ts, LoadRowMapper.ts, LoadImporter.ts to match new schema fields
- [ ] **Financial field rename** — Replacing `profit` → `netProfit`, `expenses` (scalar) → `totalExpenses` (relation) across codebase
- [ ] **Deprecated field removal** — Removing `serviceFee`, pickup/delivery time start/end/contact/phone/notes fields

---

## High Priority — Next Up

These items are specified in [PRD.md](docs/PRD.md) but need full implementation or verification:

### 1. Safety Gate Service
Pre-dispatch driver validation before PENDING → ASSIGNED transition.
- [ ] CDL validity check (expiry > currentDate + 30 days)
- [ ] Medical card expiry validation
- [ ] DQF status verification (all documents current)
- [ ] HOS compliance check (available hours)
- [ ] Return `{ isValid, errors, warnings, blockedReasons }`
- **Location:** Create `lib/services/SafetyGateService.ts`

### 2. Fleet Gate Service
Pre-dispatch truck/trailer validation.
- [ ] Registration expiry check
- [ ] Insurance expiration validation
- [ ] Inspection expiry check
- [ ] Maintenance status (block OUT_OF_SERVICE, IN_MAINTENANCE)
- [ ] Breakdown status (block unresolved breakdowns)
- **Location:** Create `lib/services/FleetGateService.ts`

### 3. Dispatch Validation Service
Combined gate validation orchestrating Safety + Fleet gates.
- [ ] Validate driver-truck compatibility
- [ ] MC number assignment verification
- [ ] Block PENDING → ASSIGNED unless both gates pass
- [ ] Integrate into dispatch UI with clear error/warning display
- **Location:** Create `lib/services/DispatchValidationService.ts`

### 4. Financial Lock Mechanism
Prevent edits to financial fields after READY_TO_BILL.
- [ ] Lock `driverPay` and `revenue` fields on Load
- [ ] Admin override with audit trail
- [ ] UI indicators showing locked state
- [ ] API-level enforcement in load update routes

### 5. Negative Balance Handling
When settlement deductions exceed gross pay.
- [ ] Create `DriverNegativeBalance` record
- [ ] Carry over to next settlement period
- [ ] Dashboard visibility for dispatchers/accounting
- [ ] Settlement report includes negative balance info

### 6. Automated Invoice Creation
Trigger when load reaches READY_TO_BILL and `isBillingHold = false`.
- [ ] Auto-create Invoice with line items from Load
- [ ] Calculate tax from Customer.taxRate
- [ ] Support consolidated billing (multiple loads per customer)
- [ ] Factoring integration ("Notice of Assignment")
- **Related:** `lib/managers/InvoiceManager.ts`

### 7. Settlement Trigger Automation
When load reaches DELIVERED + `readyForSettlement = true`.
- [ ] Auto-create LedgerEntry with type = PAY_ITEM, amount = Load.driverPay
- [ ] Mark load as PENDING_SETTLEMENT
- [ ] Integrate with Inngest for async processing
- **Related:** `lib/managers/settlement/Orchestrator.ts`

---

## Medium Priority

### 8. Billing Hold Logic
- [ ] Block invoicing without blocking settlement
- [ ] Admin resolution workflow
- [ ] Billing hold reason tracking
- [ ] Dashboard for held loads

### 9. Consolidated Billing
- [ ] Group multiple loads per customer within billing period
- [ ] Configurable billing cycles (weekly, bi-weekly, monthly)
- [ ] Combined invoice generation with load-level line items

### 10. Load Repower / Split
- [ ] Create LoadSegment per driver on repower
- [ ] Revenue stays on original Load
- [ ] Driver pay calculated per segment
- [ ] UI for initiating and managing repowers
- **Related:** `lib/managers/LoadSplitManager.ts`

### 11. Post-Payment Adjustments
- [ ] Create LedgerEntry with type = DEDUCTION after settlement
- [ ] Apply to next settlement period (never modify settled settlements)
- [ ] Audit trail for all adjustments

### 12. Rate Dispute Workflow
- [ ] Set `isBillingHold = true` on dispute
- [ ] If already invoiced, create credit memo
- [ ] Adjust `Load.revenue` with manager approval
- [ ] Resolution tracking

### 13. QuickBooks Full Sync
- [ ] Verify completeness of `AccountingSyncManager.ts`
- [ ] Invoice push to QuickBooks
- [ ] Payment reconciliation
- [ ] Chart of accounts mapping
- [ ] Error handling and retry logic

### 14. IFTA Reporting
- [ ] Complete fuel tax calculations per state
- [ ] State mileage aggregation
- [ ] Quarterly report generation
- [ ] Integration with Samsara mileage data
- **Related:** `lib/services/IFTACalculatorService.ts`, `lib/managers/IFTAManager.ts`

---

## Low Priority / Polish

### Code Quality
- [ ] **Refactor oversized files** (8 files > 1,000 lines — see CLAUDE.md)
- [ ] **Split Prisma schema** into multi-file format (currently 7,192 lines)
- [ ] **Fix `any` casts** in AI services where include typing is lost
- [ ] **Remove duplicate commit** artifacts from git history

### Testing
- [ ] **Expand unit test coverage** — Add tests for all managers and services
- [ ] **E2E testing setup** — Add Playwright or Cypress
- [ ] **Integration tests** — Database-level tests for critical workflows
- [ ] **Load status state machine tests** — All valid/invalid transitions

### Documentation & API
- [ ] **OpenAPI/Swagger generation** for API routes
- [ ] **Storybook** for UI component documentation
- [ ] **Architecture Decision Records** (ADRs) for key decisions

### Features
- [ ] **Mobile app expansion** — More driver-facing features, offline support
- [ ] **Branded email templates** — Transactional emails (invoice, settlement notifications)
- [ ] **Webhook system** — External event notifications for integrations
- [ ] **Custom report builder** — Complete ReportConstructor UI
- [ ] **Loadboard integration** — External load board API connections (DAT, Truckstop)
- [ ] **ELD direct integration** — Beyond HOS violation tracking
- [ ] **Multi-language support** — i18n for Spanish (driver-facing)

### Performance
- [ ] **Query optimization** — Analyze slow queries with Prisma query logging
- [ ] **Caching strategy review** — Redis or in-memory caching for hot paths
- [ ] **Bundle size analysis** — Code splitting for large feature areas
- [ ] **Database indexing audit** — Verify indexes match query patterns

---

## Technical Debt

| Issue | Impact | Effort |
|-------|--------|--------|
| 8 files > 1,000 lines | Maintainability | Medium |
| Prisma schema 7,192 lines (single file) | Developer experience | Medium |
| AI services use `any` casts for relation typing | Type safety | Low |
| Some components mix data fetching with presentation | Testability | Medium |
| No E2E test suite | Regression risk | High |
| Pending migration uncommitted | Deployment blocker | Low |

---

## Performance Targets (from PRD)

| Operation | Target |
|-----------|--------|
| Dispatch validation | < 500ms |
| Settlement calculation (100 loads) | < 5 seconds |
| Invoice generation (50 loads) | < 3 seconds |

---

## Key File References

| Area | Files |
|------|-------|
| Load management | `lib/managers/LoadCreationManager.ts`, `LoadUpdateManager.ts`, `LoadStatusMachine.ts` |
| Settlement | `lib/managers/settlement/Orchestrator.ts`, `CalculationEngine.ts`, `WorkflowManager.ts` |
| Import | `lib/managers/import/BaseImporter.ts`, `lib/import-export/entity-config.ts` |
| Permissions | `lib/permissions.ts` |
| Auth | `lib/auth.ts` |
| Validation | `lib/validations/load/main.ts`, `lib/validations/load/import.ts` |
| Driver pay | `lib/utils/calculateDriverPay.ts` |
| Database | `prisma/schema.prisma`, `lib/prisma.ts` |
| PRD | `docs/PRD.md` |
| Conventions | `docs/PROJECT_ORGANIZATION_GUIDELINES.md` |
