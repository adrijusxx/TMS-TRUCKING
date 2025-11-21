# Accounting Department - Feature Requirements & Implementation Plan

**Version:** 1.0  
**Date:** 2024  
**Project:** TMS Trucking System  
**Status:** Requirements Gathering

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Missing Features](#critical-missing-features)
3. [Menu Structure Improvements](#menu-structure-improvements)
4. [Invoice View Enhancements](#invoice-view-enhancements)
5. [Dashboard Recommendations](#dashboard-recommendations)
6. [Integration Needs](#integration-needs)
7. [Quick Wins](#quick-wins)
8. [Industry-Specific Considerations](#industry-specific-considerations)
9. [Implementation Progress](#implementation-progress)

---

## Overview

This document outlines comprehensive requirements for enhancing the accounting department functionality in the TMS Trucking System. The improvements focus on trucking industry-specific needs including factoring, customer credit management, detention charges, and profitability tracking.

---

## Critical Missing Features

### 1. Factoring Integration

**Priority:** HIGH  
**Status:** ❌ Not Started

Most trucking carriers use factoring companies to improve cash flow. This feature set is critical for operations.

#### 1.1 Factoring Status Column in Invoices Table

**Requirements:**
- Add `factoringStatus` enum field to Invoice model with values:
  - `NOT_FACTORED` (default)
  - `SUBMITTED_TO_FACTOR`
  - `FUNDED`
  - `RESERVE_RELEASED`
- Display factoring status in invoice list with color-coded badges
- Filter invoices by factoring status

**Database Changes:**
```prisma
enum FactoringStatus {
  NOT_FACTORED
  SUBMITTED_TO_FACTOR
  FUNDED
  RESERVE_RELEASED
}

model Invoice {
  // ... existing fields
  factoringStatus FactoringStatus @default(NOT_FACTORED)
  factoringCompany String?
  submittedToFactorAt DateTime?
  fundedAt DateTime?
  reserveReleaseDate DateTime?
  factoringFee Float?
  reserveAmount Float?
  advanceAmount Float?
}
```

#### 1.2 Factoring Dashboard

**Requirements:**
- Display key metrics:
  - Total invoices submitted to factor
  - Total advance received
  - Total reserve held
  - Total fees paid (this period, YTD)
- Visual charts showing factoring trends
- List of invoices by factoring status
- Reserve release calendar (90-day typical hold)

**Components Needed:**
- `FactoringDashboard.tsx` - Main dashboard component
- `FactoringMetrics.tsx` - KPI cards
- `FactoringInvoiceList.tsx` - Filtered invoice list
- `ReserveReleaseCalendar.tsx` - Calendar view for releases

#### 1.3 Batch Upload to Factor

**Requirements:**
- Select multiple invoices for factoring
- Export to factoring company via:
  - API integration (RTS, TAFS, etc.)
  - CSV/EDI file export
  - Manual submission workflow
- Track submission status per invoice
- Generate submission confirmation

**Components Needed:**
- Enhanced `CreateBatchForm.tsx` with factoring option
- `FactoringExportDialog.tsx` - Export format selection
- `FactoringAPI.ts` - API integration service
- `FactoringExportManager.ts` - Export file generation

#### 1.4 Funding Tracking

**Requirements:**
- Match factoring company payments to invoices
- Import funding records from factoring company
- Auto-match by invoice number and amount
- Manual matching interface for discrepancies
- Track funding date vs. submission date

**Components Needed:**
- `FundingImportDialog.tsx` - Import funding records
- `FundingMatchingTool.tsx` - Match payments to invoices
- `FundingReconciliation.tsx` - Reconciliation view

#### 1.5 Reserve Release Tracking

**Requirements:**
- Track 90-day reserve (configurable per factoring company)
- Alert when reserve release date approaches
- Automatically update invoice status when reserve released
- Calculate expected reserve release date
- Reserve release history

**Components Needed:**
- `ReserveReleaseTracker.tsx` - Track reserves
- `ReserveReleaseAlert.tsx` - Alerts component
- Reserve release automation job

#### 1.6 Factoring Company Management

**Requirements:**
- Create factoring company records
- Configure per-factor settings:
  - Reserve percentage
  - Reserve hold period (days)
  - Fee structure
  - API credentials
  - File export format
- Assign factoring companies per customer
- Track which factor handles which invoices

**Database Changes:**
```prisma
model FactoringCompany {
  id String @id @default(cuid())
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  name String
  accountNumber String?
  reservePercentage Float @default(10) // 10%
  reserveHoldDays Int @default(90)
  
  // API Integration
  apiProvider String? // RTS, TAFS, etc.
  apiEndpoint String?
  apiKey String?
  apiSecret String?
  
  // File Export
  exportFormat String? // CSV, EDI, Excel
  
  // Contact
  contactName String?
  contactEmail String?
  contactPhone String?
  
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  invoices Invoice[]
  customers Customer[]
  
  @@index([companyId])
}

model Invoice {
  // ... existing fields
  factoringCompanyId String?
  factoringCompany FactoringCompany? @relation(fields: [factoringCompanyId], references: [id])
}
```

**Progress:** ❌ Not Started

---

### 2. Customer Credit Management

**Priority:** HIGH  
**Status:** ❌ Not Started

Critical for managing cash flow and reducing bad debt.

#### 2.1 Credit Limits per Customer

**Requirements:**
- Set credit limit per customer
- Available credit calculation (limit - current AR balance)
- Alert when customer approaches limit (configurable threshold: 80%, 90%, 100%)
- Block new loads when credit limit exceeded
- Credit limit history/audit trail

**Database Changes:**
```prisma
model Customer {
  // ... existing fields
  creditLimit Float?
  creditAlertThreshold Float @default(80) // percentage
  creditHold Boolean @default(false)
  creditLimitNotes String?
  
  // Calculated fields (derived, not stored)
  // currentARBalance - sum of unpaid invoices
  // availableCredit - creditLimit - currentARBalance
}
```

#### 2.2 Credit Hold Status

**Requirements:**
- Flag customers on credit hold
- Prevent load assignment for customers on hold
- Reason code for credit hold
- Automated workflow:
  - Auto-place on hold when credit limit exceeded
  - Auto-place on hold when invoices overdue X days
  - Manual override capability

**Components Needed:**
- `CustomerCreditHoldDialog.tsx` - Manage hold status
- Credit hold alerts in dispatch interface
- Credit hold badge on customer records

#### 2.3 Days Sales Outstanding (DSO) by Customer

**Requirements:**
- Calculate DSO per customer
- Display DSO in customer list and detail view
- DSO trends over time (charts)
- Compare to payment terms
- Alert on high DSO customers

**Calculation:**
```
DSO = (Accounts Receivable / Total Credit Sales) × Number of Days
```

**Components Needed:**
- `DSOCalculator.ts` - DSO calculation utility
- `CustomerDSOChart.tsx` - DSO trend visualization
- DSO column in customer list

#### 2.4 Payment Terms Tracking and Enforcement

**Requirements:**
- Track payment terms per customer (Net 30, Net 45, Quick Pay, etc.)
- Calculate expected payment date based on terms
- Alert when payment due date approaching
- Track discount terms (2% 10, Net 30)
- Payment terms violation tracking

**Database Changes:**
```prisma
model Customer {
  // ... existing fields
  paymentTerms Int @default(30) // days (already exists, enhance usage)
  paymentTermsType String? // NET, QUICK_PAY, DISCOUNT
  discountPercentage Float? // 2% for quick pay
  discountDays Int? // 10 days for discount
}
```

#### 2.5 Customer Payment History

**Requirements:**
- Average days to pay calculation
- On-time payment percentage
- Payment history timeline
- Late payment tracking
- Payment pattern analysis

**Components Needed:**
- `CustomerPaymentHistory.tsx` - Payment history view
- `PaymentAnalytics.tsx` - Payment metrics
- Payment history API endpoint

#### 2.6 Collections Workflow

**Requirements:**
- Systematic approach to aging AR
- Collections stages (30, 60, 90+ days)
- Automated email/letter generation
- Collection notes and history
- Collections dashboard
- Integration with collection agencies

**Components Needed:**
- `CollectionsWorkflow.tsx` - Main workflow interface
- `CollectionsStageManager.tsx` - Stage management
- `CollectionsLetterGenerator.tsx` - Letter templates
- `CollectionsDashboard.tsx` - Collections overview

**Progress:** ❌ Not Started

---

### 3. Detention & Accessorial Charges

**Priority:** HIGH  
**Status:** ❌ Not Started

Separate tracking for additional charges that often get missed.

#### 3.1 Detention Charges Tracking

**Requirements:**
- Track detention time per load (hours)
- Calculate detention charges based on rate
- Separate from base freight charges
- Bill detention separately or include in invoice
- Detention rate configuration per customer

**Database Changes:**
```prisma
model AccessorialCharge {
  id String @id @default(cuid())
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  loadId String
  load Load @relation(fields: [loadId], references: [id])
  
  invoiceId String? // Link to invoice when billed
  invoice Invoice? @relation(fields: [invoiceId], references: [id])
  
  chargeType AccessorialChargeType
  description String
  
  // Detention specific
  detentionHours Float?
  detentionRate Float?
  
  // Other accessorials
  amount Float
  
  status AccessorialChargeStatus @default(PENDING)
  approvedById String?
  approvedBy User? @relation(fields: [approvedById], references: [id])
  approvedAt DateTime?
  
  notes String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@index([loadId])
  @@index([invoiceId])
  @@index([chargeType])
  @@index([status])
}

enum AccessorialChargeType {
  DETENTION
  LAYOVER
  TONU // Truck Ordered Not Used
  LUMPER
  SCALE_TICKET
  ADDITIONAL_STOP
  FUEL_SURCHARGE
  RECLASSIFICATION
  REEFER_FUEL
  DRIVER_ASSIST
  SORT_SEGREGATE
  INSIDE_DELIVERY
  RESIDENTIAL_DELIVERY
  SATURDAY_DELIVERY
  AFTER_HOURS
  OTHER
}

enum AccessorialChargeStatus {
  PENDING
  APPROVED
  BILLED
  PAID
  DENIED
}
```

#### 3.2 Layover Pay Tracking

**Requirements:**
- Track layover occurrences
- Layover rate configuration
- Link to specific load
- Approve/bill workflow

#### 3.3 TONU (Truck Ordered Not Used)

**Requirements:**
- Track TONU charges
- TONU rate configuration
- Reason code tracking
- Customer approval workflow

#### 3.4 Lumper Fees

**Requirements:**
- Track lumper fees per load
- Receipt/documentation upload
- Reimbursement tracking
- Include in driver settlement deduction

#### 3.5 Scale Tickets

**Requirements:**
- Upload scale ticket documents
- Track scale ticket fees
- Weight verification
- Link to accessorial charge

#### 3.6 Additional Stops

**Requirements:**
- Track multiple pickup/delivery stops
- Additional stop charges
- Per-stop rate configuration

**Components Needed:**
- `AccessorialChargesList.tsx` - Main list view
- `AccessorialChargeForm.tsx` - Create/edit form
- `DetentionCalculator.tsx` - Detention calculation tool
- `AccessorialApprovalWorkflow.tsx` - Approval interface
- `AccessorialChargesReport.tsx` - Reporting

**Progress:** ❌ Not Started

---

### 4. Rate Confirmation Matching

**Priority:** MEDIUM  
**Status:** ❌ Not Started

Ensure invoices match agreed rates.

#### 4.1 Upload Rate Confirmations

**Requirements:**
- Upload rate confirmation documents (PDF, image)
- Store rate confirmation per load
- Extract rate details from document (OCR capability)
- Manual entry of rate details

**Database Changes:**
```prisma
model RateConfirmation {
  id String @id @default(cuid())
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  loadId String
  load Load @relation(fields: [loadId], references: [id])
  
  rateConfNumber String? // Rate confirmation number
  
  // Rate Details
  baseRate Float
  fuelSurcharge Float @default(0)
  accessorialCharges Float @default(0)
  totalRate Float
  
  // Payment Terms
  paymentTerms Int @default(30)
  paymentMethod String? // FACTOR, DIRECT, QUICK_PAY
  
  // Document
  documentId String?
  document Document? @relation(fields: [documentId], references: [id])
  
  // Matching
  matchedToInvoice Boolean @default(false)
  invoiceId String?
  invoice Invoice? @relation(fields: [invoiceId], references: [id])
  
  matchedAt DateTime?
  matchedById String?
  matchedBy User? @relation(fields: [matchedById], references: [id])
  
  notes String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([loadId])
  @@index([companyId])
  @@index([loadId])
  @@index([invoiceId])
}

model Load {
  // ... existing fields
  rateConfirmation RateConfirmation?
}

model Invoice {
  // ... existing fields
  rateConfirmation RateConfirmation?
}
```

#### 4.2 Auto-Match RateCon to Invoice

**Requirements:**
- Automatically match rate confirmation to invoice by load
- Compare invoice amount vs. rate confirmation amount
- Flag discrepancies
- Match confidence score

**Components Needed:**
- `RateConfirmationMatcher.ts` - Auto-matching logic
- `RateConfirmationMatchDialog.tsx` - Manual matching interface

#### 4.3 Discrepancy Alerts

**Requirements:**
- Alert when invoice doesn't match RateCon
- Discrepancy amount and percentage
- Discrepancy reason code
- Approval workflow for discrepancies
- Track approved discrepancies

**Components Needed:**
- `RateConfirmationDiscrepancyAlert.tsx` - Alert component
- `DiscrepancyApprovalDialog.tsx` - Approval workflow

#### 4.4 Flag Short Pays with Reason Codes

**Requirements:**
- Track short pays (customer paid less than invoiced)
- Short pay reason codes (deduction codes)
- Short pay amount tracking
- Approval workflow for write-offs

**Database Changes:**
```prisma
model Invoice {
  // ... existing fields
  shortPayAmount Float @default(0)
  shortPayReasonCode String?
  shortPayReason String?
  shortPayApproved Boolean @default(false)
  shortPayApprovedById String?
  shortPayApprovedBy User? @relation(fields: [shortPayApprovedById], references: [id])
  shortPayApprovedAt DateTime?
}
```

**Progress:** ❌ Not Started

---

### 5. Driver Settlements Integration

**Priority:** HIGH  
**Status:** ⚠️ Partially Implemented

Connect settlements to accounting for complete financial picture.

#### 5.1 Per-Load Pay Calculation

**Requirements:**
- Show driver pay vs. revenue per load
- Profitability per load (revenue - driver pay - expenses)
- Driver pay rate configuration (percentage or flat rate)
- Per-load settlement preview

**Components Needed:**
- `LoadProfitabilityCard.tsx` - Show profit per load
- `DriverPayCalculator.tsx` - Calculate driver pay
- Link settlements to invoice/load views

#### 5.2 Deductions Tracking

**Requirements:**
- Track deductions per settlement:
  - Fuel advances
  - Insurance premiums
  - Equipment rental
  - Other deductions
- Deduction categories
- Deduction history per driver

**Database Changes:**
```prisma
model SettlementDeduction {
  id String @id @default(cuid())
  settlementId String
  settlement Settlement @relation(fields: [settlementId], references: [id])
  
  deductionType DeductionType
  description String
  amount Float
  
  // For fuel advances, link to fuel entry
  fuelEntryId String?
  fuelEntry FuelEntry? @relation(fields: [fuelEntryId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([settlementId])
}

enum DeductionType {
  FUEL_ADVANCE
  INSURANCE
  EQUIPMENT_RENTAL
  MAINTENANCE
  TOLLS
  PERMITS
  FUEL_CARD
  OTHER
}

model Settlement {
  // ... existing fields
  deductions SettlementDeduction[]
}
```

#### 5.3 1099 Management for Owner-Operators

**Requirements:**
- Track owner-operator status per driver
- Calculate 1099 eligible earnings
- Generate 1099 forms at year-end
- 1099 reporting dashboard
- W-9 form tracking

**Components Needed:**
- `Driver1099Status.tsx` - 1099 eligibility view
- `1099ReportGenerator.tsx` - Generate 1099 reports
- `W9FormManager.tsx` - W-9 management

#### 5.4 Pay Period Status

**Requirements:**
- Track settlement status (pending, approved, paid)
- Pay period calendar
- Settlement batch processing
- Payment method tracking (ACH, check, wire)

**Database Changes:**
```prisma
model Settlement {
  // ... existing fields
  payPeriodStart DateTime
  payPeriodEnd DateTime
  paymentMethod PaymentMethod?
  paymentDate DateTime?
  paymentReference String?
}
```

#### 5.5 Link Settlements to Accounting

**Requirements:**
- Connect settlements to expense recognition
- Driver pay expense category
- Cost per mile calculations including driver pay
- Settlement accruals for period-end closing

**Progress:** ⚠️ Partially Implemented (basic settlement exists, needs enhancements)

---

## Menu Structure Improvements

**Priority:** MEDIUM  
**Status:** ❌ Not Started

Reorganize accounting menu for better usability and logical grouping.

### Current Menu Structure
- Batches
- Invoice
- Settlements
- Salary
- Bill
- Customers
- Vendors
- Locations
- Analytics
- Automation
- Net Profit
- Expenses
- Tariffs
- Payment Types

### Proposed Menu Structure

```
ACCOUNTING (section header)
│
├── Revenue Management
│   ├── Dashboard (new - accounting overview)
│   ├── Invoices (enhance existing)
│   ├── Rate Confirmations (new)
│   ├── Accessorial Charges (new)
│   ├── Factoring (new)
│   └── Aging Report (enhance - dedicated page)
│
├── Batches
│   ├── Invoice Batches (existing - enhance)
│   ├── Factoring Batches (new)
│   └── Payment Batches (new - batch payment imports)
│
├── Payables
│   ├── Bills (rename from "Bill" - make plural)
│   ├── Vendor Payments (new)
│   ├── Fuel Cards (new)
│   ├── Owner-Operator Settlements (enhance existing)
│   └── Expense Approvals (new - workflow)
│
├── Settlements
│   ├── Driver Settlements (enhance existing)
│   ├── Settlement Batches (new - group by pay period)
│   ├── Deductions (new)
│   └── 1099 Tracking (new)
│
├── Cash Management (new section)
│   ├── Bank Accounts (new)
│   ├── Deposits (new)
│   ├── Payment Methods (enhance existing)
│   └── Cash Flow Forecast (new)
│
├── Customers (enhance existing)
│   └── Add credit management features
│
├── Vendors (enhance existing)
│   └── Add payment terms, W-9, 1099 tracking
│
├── Salary (consider renaming to "Payroll")
│   ├── Driver Pay Rates (new)
│   └── Mileage Rate Tables (new)
│
├── Locations (keep existing)
│
├── Analytics (greatly expand)
│   ├── Profitability by Customer
│   ├── Profitability by Lane
│   ├── Revenue per Truck
│   ├── Operating Ratio
│   ├── Cost per Mile
│   ├── Cash Flow Visualization
│   ├── AR Aging Trends
│   └── On-Time Payment by Customer
│
├── Automation (enhance existing)
│   └── Add automated workflows
│
├── Net Profit (keep existing)
│
├── Expenses (enhance existing)
│   └── Break down by type with per-mile calculations
│
├── Tariffs (keep if contract rates exist)
│
└── Payment Types (keep existing)
```

**Progress:** ❌ Not Started

---

## Invoice View Enhancements

**Priority:** HIGH  
**Status:** ⚠️ Partially Implemented

### Current Invoice Table Columns
- Invoice Number
- MC Number
- Load ID
- Customer (MC Number only - needs customer name)
- Invoice Date
- Due Date
- Total
- Status
- Aging Days
- Reconciliation Status

### Required Additional Columns

1. **Customer Name** (not just MC number)
   - Display full customer name
   - Show MC number as secondary info

2. **Payment Method**
   - Factor
   - Direct
   - Quick Pay
   - Display as badge

3. **Payment Terms**
   - Net 30, Net 45, Quick Pay, etc.
   - Show calculated due date

4. **Expected Payment Date**
   - Based on payment terms
   - Calculate from invoice date + terms

5. **Short Pay Amount**
   - If customer paid less than invoiced
   - Red highlight if short pay exists

6. **Short Pay Reason**
   - Deduction reason code
   - Tooltip with full reason

7. **Factoring Status**
   - Show factoring status badge
   - Color-coded (Not Factored, Submitted, Funded)

### Status Indicator Improvements

**Current Issues:**
- "Not Overdue" in green when aging days is -29 (not yet due) is confusing

**Proposed Improvements:**
- "Not Yet Due" vs "Overdue"
- "Partially Paid" status
- "Disputed" status
- "Written Off" status
- Color coding:
  - Not Yet Due: Blue
  - Due Soon (within 5 days): Yellow
  - Overdue: Red
  - Partially Paid: Orange
  - Paid: Green
  - Disputed: Purple
  - Written Off: Gray

**Database Changes:**
```prisma
enum InvoiceSubStatus {
  NOT_YET_DUE
  DUE_SOON
  OVERDUE
  PARTIALLY_PAID
  DISPUTED
  WRITTEN_OFF
  PAID
}

model Invoice {
  // ... existing fields
  subStatus InvoiceSubStatus?
  disputedAt DateTime?
  disputedReason String?
  writtenOffAt DateTime?
  writtenOffReason String?
  writtenOffById String?
  writtenOffBy User? @relation(fields: [writtenOffById], references: [id])
}
```

### Quick Actions

**Required Actions:**
1. **Resend Invoice** button
   - Email invoice to customer
   - Track resend history

2. **Mark as Paid** quick action
   - Quick payment application
   - Payment dialog

3. **Apply Payment** quick action
   - Apply partial or full payment
   - Link to payment form

4. **Send to Collections**
   - Move to collections workflow
   - Update status

5. **Submit to Factor** (batch action)
   - Select multiple invoices
   - Create factoring batch

**Components Needed:**
- `InvoiceQuickActions.tsx` - Action menu
- `ResendInvoiceDialog.tsx` - Resend interface
- `QuickPaymentDialog.tsx` - Quick payment
- `SendToCollectionsDialog.tsx` - Collections workflow

### Reconciliation Workflow Improvements

**Current Issue:**
- All invoices show "Not reconciled"

**Requirements:**
- Auto-reconciliation when payment amount matches invoice amount exactly
- Manual reconciliation for short pays with reason code
- Reconciliation date tracking
- Reconciled by (user who reconciled)
- Reconciliation history/audit trail

**Database Changes:**
```prisma
model Reconciliation {
  // ... existing fields (already exists)
  reconciledAt DateTime
  reconciledById String
  reconciledBy User @relation(fields: [reconciledById], references: [id])
  reconciliationMethod ReconciliationMethod @default(MANUAL)
  notes String?
}

enum ReconciliationMethod {
  AUTO
  MANUAL
  IMPORT
}
```

**Components Needed:**
- `AutoReconciliationJob.ts` - Background job for auto-reconciliation
- `ManualReconciliationDialog.tsx` - Manual reconciliation interface
- `ReconciliationHistory.tsx` - History view

**Progress:** ⚠️ Partially Implemented (basic reconciliation exists, needs enhancements)

---

## Dashboard Recommendations

**Priority:** HIGH  
**Status:** ❌ Not Started

### Accounting Dashboard (Landing Page)

**Location:** `/dashboard/accounting`

**Required Widgets:**

1. **Cash Position**
   - Bank balance + AR - AP
   - Visual indicator (positive/negative)
   - Trend over time

2. **AR Aging Summary**
   - Visual breakdown: Current, 30, 60, 90+ days
   - Pie chart and bar chart
   - Total AR by aging bucket

3. **Top 5 Overdue Customers**
   - Customer name
   - Overdue amount
   - Days overdue
   - Quick action to view details

4. **Outstanding Invoices**
   - Total count
   - Total amount
   - Link to invoice list

5. **This Month Revenue vs. Last Month**
   - Comparison chart
   - Percentage change
   - Month-over-month growth

6. **Invoices Awaiting Approval** (if approval workflow exists)
   - Count of pending approvals
   - List with quick approve/reject

7. **Factoring Summary** (if factoring enabled)
   - Submitted amount
   - Funded amount
   - Reserve held
   - Link to factoring dashboard

8. **Upcoming Bills Due** (next 7 days)
   - List of bills due soon
   - Total amount due
   - Vendor names

9. **Driver Settlements Pending Approval**
   - Count of pending settlements
   - Total settlement amount
   - Link to settlements

**Components Needed:**
- `AccountingDashboard.tsx` - Main dashboard
- `CashPositionCard.tsx` - Cash position widget
- `ARAgingWidget.tsx` - AR aging visualization
- `OverdueCustomersWidget.tsx` - Top overdue customers
- `RevenueComparisonWidget.tsx` - Revenue comparison
- `FactoringSummaryWidget.tsx` - Factoring summary
- `UpcomingBillsWidget.tsx` - Bills due widget

**Progress:** ❌ Not Started

---

## Integration Needs

**Priority:** MEDIUM  
**Status:** ❌ Not Started

### Load Management → Accounting

**Requirements:**
- Auto-generate invoice when load status = DELIVERED
- Pull load details (rate, customer, accessorials) into invoice
- Link invoice back to load

**Implementation:**
- Event listener on Load status change
- Auto-invoice generation automation
- Configuration option to enable/disable auto-invoice

### Fleet Management → Accounting

**Requirements:**
- Pull fuel costs for profitability analysis
- Track fuel expenses per load
- Fuel surcharge calculations

### Safety → Accounting

**Requirements:**
- Track accident costs impact on profitability
- Insurance claims cost tracking
- Safety incident expense allocation

### HR → Accounting

**Requirements:**
- Driver pay rates for settlement calculations
- Salary expense tracking
- Benefits cost allocation

**Progress:** ❌ Not Started

---

## Quick Wins for Immediate Improvement

**Priority:** HIGH  
**Status:** ⚠️ Partial

### 1. Add Customer Name to Invoice Table ✅
- **Status:** Already displays customer name in some views
- **Action:** Ensure all invoice lists show customer name prominently

### 2. Add Factoring Status ❌
- **Priority:** Critical for trucking cash flow
- **Effort:** Medium
- **Database:** Add factoringStatus enum and fields to Invoice
- **UI:** Add column to invoice table, filters, badges

### 3. Fix Reconciliation Flow ❌
- **Priority:** High
- **Effort:** Medium
- **Action:** Implement auto-reconciliation, improve manual reconciliation UI

### 4. Add Detention/Accessorials Tracking ❌
- **Priority:** High - you're leaving money on the table
- **Effort:** High
- **Action:** Create AccessorialCharge model and full workflow

### 5. Expand Aging Report ❌
- **Priority:** Medium
- **Effort:** Low
- **Action:** Add collection workflow integration, more detailed views

### 6. Add Quick Pay Discount Tracking ❌
- **Priority:** Medium
- **Effort:** Low
- **Action:** Track discount terms, calculate discount amounts

### 7. Payment Matching Tool ❌
- **Priority:** High
- **Effort:** High
- **Action:** Import bank deposits, auto-match to invoices

---

## Industry-Specific Considerations

**Priority:** MEDIUM  
**Status:** ⚠️ Partial

### Per-Load Profitability

**Requirements:**
- Calculate profit per load (revenue - driver pay - fuel - expenses)
- Display profitability indicator in load list
- Identify unprofitable loads
- Profitability trends by customer/lane

### Fuel Surcharge Tracking

**Requirements:**
- Track fuel surcharge separate from base rate
- Fuel surcharge calculation based on fuel price index
- Historical fuel surcharge data

### Broker vs Direct Customer Accounting

**Requirements:**
- Different margin expectations
- Separate reporting for broker vs direct
- Broker commission tracking

### Loaded vs Empty Miles Cost Allocation

**Requirements:**
- Track loaded and empty miles separately
- Allocate costs appropriately
- Calculate revenue per loaded mile
- Cost per empty mile tracking

### IFTA Reporting Tie-in

**Requirements:**
- Fuel tax by state
- IFTA quarterly reporting support
- Link fuel entries to IFTA reporting

### Quarterly Tax Estimates for Owner-Operators

**Requirements:**
- Calculate estimated taxes
- Quarterly tax estimate tracking
- 1099 tax reporting integration

**Progress:** ⚠️ Partial (some profitability tracking exists)

---

## Implementation Progress

### Phase 1: Critical Features (Weeks 1-4)

- [ ] **Week 1: Factoring Integration Foundation**
  - [ ] Database schema for factoring
  - [ ] Factoring status enum and fields
  - [ ] Basic factoring dashboard
  - [ ] Factoring status in invoice table

- [ ] **Week 2: Customer Credit Management**
  - [ ] Credit limits and tracking
  - [ ] Credit hold functionality
  - [ ] DSO calculations
  - [ ] Payment terms enforcement

- [ ] **Week 3: Accessorial Charges**
  - [ ] Database schema for accessorials
  - [ ] Detention tracking
  - [ ] Basic accessorial charges list
  - [ ] Approval workflow

- [ ] **Week 4: Invoice Enhancements**
  - [ ] Add missing columns to invoice table
  - [ ] Improve status indicators
  - [ ] Quick actions menu
  - [ ] Better reconciliation workflow

### Phase 2: Enhanced Features (Weeks 5-8)

- [ ] **Week 5: Rate Confirmation Matching**
  - [ ] Rate confirmation upload
  - [ ] Auto-matching logic
  - [ ] Discrepancy alerts

- [ ] **Week 6: Collections & Payments**
  - [ ] Collections workflow
  - [ ] Payment matching tool
  - [ ] Short pay tracking

- [ ] **Week 7: Dashboard & Analytics**
  - [ ] Accounting dashboard
  - [ ] Profitability analytics
  - [ ] Cash flow visualization

- [ ] **Week 8: Settlements Integration**
  - [ ] Link settlements to accounting
  - [ ] 1099 management
  - [ ] Deductions tracking

### Phase 3: Menu Reorganization & Polish (Weeks 9-12)

- [ ] **Week 9-10: Menu Restructure**
  - [ ] Reorganize menu items
  - [ ] Create new page structures
  - [ ] Update navigation

- [ ] **Week 11: Integrations**
  - [ ] Load management integration
  - [ ] Fleet management integration
  - [ ] Safety integration

- [ ] **Week 12: Testing & Documentation**
  - [ ] Comprehensive testing
  - [ ] User documentation
  - [ ] Training materials

---

## Database Schema Summary

### New Models Needed

1. **FactoringCompany** - Manage factoring company relationships
2. **AccessorialCharge** - Track detention, layover, TONU, etc.
3. **RateConfirmation** - Store and match rate confirmations
4. **SettlementDeduction** - Track settlement deductions
5. **CollectionsNote** - Collections workflow tracking
6. **BankAccount** - Bank account management
7. **Deposit** - Customer payment deposits
8. **VendorPayment** - Vendor payment tracking

### Models to Enhance

1. **Invoice** - Add factoring, short pay, status fields
2. **Customer** - Add credit management fields
3. **Vendor** - Add payment terms, W-9, 1099 fields
4. **Settlement** - Add deductions, 1099 tracking
5. **Load** - Link to rate confirmation, accessorials

### Enums Needed

1. **FactoringStatus** - NOT_FACTORED, SUBMITTED_TO_FACTOR, FUNDED, RESERVE_RELEASED
2. **AccessorialChargeType** - DETENTION, LAYOVER, TONU, LUMPER, etc.
3. **AccessorialChargeStatus** - PENDING, APPROVED, BILLED, PAID, DENIED
4. **InvoiceSubStatus** - NOT_YET_DUE, DUE_SOON, OVERDUE, PARTIALLY_PAID, etc.
5. **DeductionType** - FUEL_ADVANCE, INSURANCE, EQUIPMENT_RENTAL, etc.
6. **ReconciliationMethod** - AUTO, MANUAL, IMPORT

---

## Notes

- All dates should be timezone-aware
- All monetary values should use appropriate precision (Float vs Decimal)
- Consider audit trails for all financial transactions
- Implement proper permissions/access control for financial data
- Ensure proper validation for all financial calculations
- Consider multi-currency support for future expansion
- All user actions on financial data should be logged

---

## Appendices

### A. Factoring Company API Integration Examples

**RTS (RTS Financial)**
- API Endpoint: `https://api.rtsfinancial.com/v1/invoices`
- Authentication: API Key
- Export Format: JSON, CSV

**TAFS (Transportation Alliance Bank)**
- API Endpoint: `https://api.tafsbank.com/invoices`
- Authentication: OAuth 2.0
- Export Format: EDI 214

### B. Accessorial Charge Rate Examples

- Detention: $50/hour after 2 free hours
- Layover: $250/day
- TONU: $500 flat
- Lumper: Actual cost (receipt required)
- Additional Stop: $100 per stop

### C. Payment Terms Examples

- Net 30: Payment due 30 days from invoice date
- Net 45: Payment due 45 days from invoice date
- Quick Pay: 2% discount if paid within 10 days, Net 30
- Cash on Delivery (COD): Payment due on delivery
- Prepaid: Payment required before pickup

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** After Phase 1 completion

