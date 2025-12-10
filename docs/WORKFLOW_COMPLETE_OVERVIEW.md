# Complete Workflow: Load Creation to Billing & Settlements

## Overview
This document explains the complete end-to-end workflow of the TMS system from load creation through billing, factoring, and driver settlements. This system is designed for **Asset-Based Carriers** who receive Rate Confirmations from Brokers and dispatch their own trucks/drivers.

---

## 1. LOAD CREATION (Ingest Phase)

### 1.1 Entry Points
Loads can be created through multiple methods:

#### A. Rate Confirmation Upload
- **Location**: `app/api/rate-confirmations/route.ts`
- **Process**:
  1. User uploads/enters a Rate Confirmation received from a Broker (e.g., TQL, CH Robinson)
  2. Rate Confirmation contains:
     - Rate Confirmation Number (primary external reference)
     - Base Rate
     - Fuel Surcharge
     - Accessorial Charges
     - Total Rate
     - Payment Terms
  3. System creates a `RateConfirmation` record linked to a `Load`
  4. Load status: `PENDING`

#### B. Manual Load Entry
- **Location**: `app/api/loads/route.ts` (POST)
- **Process**:
  1. Dispatcher manually creates load with:
     - Load Number (unique)
     - Customer (Broker) information
     - Pickup/Delivery details
     - Equipment type
     - Revenue amount
  2. Load status: `PENDING`

#### C. Bulk Import (Excel/CSV)
- **Location**: `app/api/import-export/[entity]/route.ts`
- **Process**:
  1. Import loads from Excel/CSV files
  2. System maps columns to load fields
  3. Creates multiple loads in batch
  4. Load status: Mapped from import data (defaults to `PENDING`)

#### D. AI-Powered PDF Import
- **Location**: `app/api/loads/import-pdf/route.ts`
- **Process**:
  1. Upload PDF Rate Confirmation
  2. AI extracts load data from PDF
  3. Creates load automatically
  4. Load status: `PENDING`

### 1.2 Load Status at Creation
- **Status**: `PENDING`
- **Key Fields Set**:
  - `loadNumber` (unique identifier)
  - `customerId` (Broker/Customer)
  - `revenue` (from Rate Confirmation or manual entry)
  - `pickupDate`, `deliveryDate`
  - `equipmentType`
  - `mcNumberId` (MC Number assignment)

---

## 2. DISPATCH (Assignment Phase)

### 2.1 Dispatch Board
- **Location**: `app/api/dispatch/board/route.ts`
- **Features**:
  - Shows unassigned loads
  - Shows assigned loads with driver/truck info
  - Lists available drivers (status: `AVAILABLE`)
  - Lists available trucks (status: `AVAILABLE`)

### 2.2 Load Assignment
- **Location**: `app/api/loads/[id]/assign/route.ts`
- **Process**:
  1. Dispatcher selects load and assigns:
     - Driver (optional but recommended)
     - Truck (optional)
  2. **Safety Gates**:
     - System checks if Driver CDL/Med Card is expired
     - System checks if Truck is marked "Maintenance"
     - Prevents dispatch if safety checks fail
  3. **Driver Pay Calculation**:
     - System automatically calculates `driverPay` based on:
       - Driver's `payType` (PER_MILE, PERCENTAGE, PER_LOAD, HOURLY)
       - Driver's `payRate`
       - Load's `totalMiles`, `loadedMiles`, `revenue`
     - Calculation logic: `lib/utils/calculateDriverPay.ts`
  4. Load status changes: `PENDING` → `ASSIGNED`
  5. `assignedAt` timestamp set

### 2.3 AI Dispatch Assistant (Optional)
- **Location**: `lib/services/AIDispatchAssistant.ts`
- **Features**:
  - AI analyzes unassigned loads
  - Recommends driver/truck assignments
  - Detects scheduling conflicts
  - Prioritizes loads by revenue/urgency

### 2.4 Bulk Assignment
- **Location**: `app/api/dispatch/bulk-assign/route.ts`
- **Process**:
  - Assign multiple loads to drivers/trucks at once
  - Useful for weekly planning

---

## 3. ACTIVE LOAD TRACKING (Status Transitions)

### 3.1 Load Status Flow
```
PENDING → ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP → LOADED → 
EN_ROUTE_DELIVERY → AT_DELIVERY → DELIVERED → [BILLING_HOLD | READY_TO_BILL] → 
INVOICED → PAID
```

### 3.2 Status Definitions
- **PENDING**: Load created, not yet assigned
- **ASSIGNED**: Driver/Truck assigned, ready to dispatch
- **EN_ROUTE_PICKUP**: Driver en route to pickup location
- **AT_PICKUP**: Driver arrived at pickup
- **LOADED**: Freight loaded, ready to depart
- **EN_ROUTE_DELIVERY**: Driver en route to delivery
- **AT_DELIVERY**: Driver arrived at delivery
- **DELIVERED**: Load completed, POD uploaded
- **BILLING_HOLD**: Blocks invoicing (AR), allows settlement (AP)
- **READY_TO_BILL**: Passed audit gate, ready for invoice
- **INVOICED**: Invoice generated and sent
- **PAID**: Payment received from broker

### 3.3 Status Updates
Status can be updated:
- **Manually**: By dispatcher via UI
- **Mobile App**: Driver updates status via mobile app (`app/api/mobile/loads/[id]/route.ts`)
- **Automatically**: System auto-updates based on dates (`lib/automation/load-status.ts`)

### 3.4 Detention Tracking
- **Location**: `components/accessorial/AccessorialChargeForm.tsx`
- **Process**:
  1. Driver reports detention hours at pickup/delivery
  2. System tracks:
     - `detentionHours`
     - `detentionRate` (per hour)
     - Calculates: `detentionHours * detentionRate`
  3. Creates `AccessorialCharge` record
  4. Status: `PENDING` → `APPROVED` → `BILLED` → `PAID`

---

## 4. LOAD COMPLETION (POD Upload)

### 4.1 POD Upload
- **Location**: `app/api/loads/[id]/pod-upload/route.ts`
- **Process**:
  1. Driver uploads POD (Proof of Delivery) document
  2. Document type: `POD`
  3. System updates:
   - `podUploadedAt` timestamp
  4. If load status is `DELIVERED`, triggers completion workflow

### 4.2 Load Completion Workflow
- **Location**: `lib/managers/LoadCompletionManager.ts`
- **Process**:
  1. **Validation**:
     - Checks for required fields (`deliveredAt`, `revenue`)
     - Verifies BOL and POD documents exist
  2. **Cost Calculation**:
     - Calculates total expenses
     - Calculates net profit: `revenue - driverPay - totalExpenses`
  3. **Accounting Sync**:
     - Syncs load data to accounting system
     - Updates `accountingSyncStatus`
  4. **Metrics Update**:
     - Updates driver statistics (total loads, miles, on-time %)
     - Updates truck odometer
     - Updates customer statistics
  5. **Mark Ready for Settlement**:
     - Sets `readyForSettlement = true` if driver assigned
  6. **Notifications**:
     - Creates activity log
     - Notifies accounting department

### 4.3 Completion Trigger
- **Location**: `app/api/loads/[id]/complete/route.ts`
- **Manual Trigger**: Dispatcher can manually mark load as complete
- **Automatic Trigger**: When POD uploaded and status is `DELIVERED`

---

## 5. INVOICING (AR - Accounts Receivable)

### 5.1 Invoice Generation
- **Location**: `app/api/invoices/generate/route.ts`
- **Process**:
  1. **Load Selection**:
     - Select delivered loads (`status = DELIVERED`)
     - Loads must pass validation:
       - Not on `BILLING_HOLD`
       - Has Rate Confirmation
       - Has POD document
       - Revenue > 0
  2. **Invoice Creation**:
     - Groups loads by customer (Broker)
     - Generates invoice number: `INV-YYYY-XXXXXX`
     - Calculates:
       - `subtotal` (sum of load revenues + accessorials)
       - `tax` (configurable percentage)
       - `total` (subtotal + tax)
       - `balance` (starts equal to total)
     - Sets `dueDate` (based on customer payment terms)
  3. **Invoice Status**: `DRAFT` → `SENT` → `POSTED` → `PAID`

### 5.2 Invoice Documents
- **Attachments**:
  - Rate Confirmation (from `RateConfirmation` record)
  - POD (Proof of Delivery)
  - Any other supporting documents

### 5.3 Invoice Sending
- **Location**: `app/api/invoices/[id]/send/route.ts`
- **Process**:
  1. Generates invoice PDF
  2. Sends email to broker with:
     - Invoice PDF attachment
     - Invoice details
     - Payment instructions
  3. Updates invoice status: `DRAFT` → `SENT`

### 5.4 Automated Invoice Generation
- **Location**: `lib/automation/invoice-generation.ts`
- **Process**:
  - Cron job or manual trigger
  - Finds all `DELIVERED` loads with `invoicedAt = null`
  - Automatically generates invoices
  - Groups by customer for batch processing

### 5.5 Invoice Batches
- **Location**: `components/batches/CreateBatchForm.tsx`
- **Process**:
  - Group multiple invoices into a batch
  - Send batch to broker
  - Track batch status: `UNPOSTED` → `POSTED` → `PAID`

---

## 6. FACTORING (Invoice Financing)

### 6.1 Factoring Overview
Most invoices are sent to a **Factoring Company**, not directly to the Broker. The factoring company advances funds and collects from the broker.

### 6.2 Submit to Factor
- **Location**: `app/api/invoices/[id]/submit-to-factor/route.ts`
- **Process**:
  1. Select factoring company
  2. System calculates:
     - `reserveAmount` (e.g., 10% of invoice total)
     - `advanceAmount` (e.g., 90% of invoice total)
     - `factoringFee` (e.g., 3% of invoice total)
  3. Updates invoice:
     - `factoringStatus`: `NOT_FACTORED` → `SUBMITTED_TO_FACTOR`
     - `factoringCompanyId`
     - `submittedToFactorAt`
  4. **Export Methods**:
     - **API**: If factoring company has API integration
     - **File Export**: CSV, EDI, Excel, JSON format
  5. **Location**: `lib/integrations/factoring-api.ts`

### 6.3 Factoring Status Flow
```
NOT_FACTORED → SUBMITTED_TO_FACTOR → FUNDED → RESERVE_RELEASED
```

### 6.4 Mark as Funded
- **Location**: `lib/managers/FactoringManager.ts`
- **Process**:
  1. When factoring company funds the invoice:
     - Updates `factoringStatus`: `SUBMITTED_TO_FACTOR` → `FUNDED`
     - Sets `fundedAt` timestamp
     - Sets `fundedAmount`
     - Calculates `reserveReleaseDate` (e.g., 90 days from funding)
  2. Reserve is held until `reserveReleaseDate`

### 6.5 Reserve Release
- **Process**:
  - After reserve hold period (typically 90 days)
  - Updates `factoringStatus`: `FUNDED` → `RESERVE_RELEASED`
  - Releases reserve amount to carrier

---

## 7. DRIVER SETTLEMENTS (AP - Accounts Payable)

### 7.1 Settlement Overview
Driver settlements are **independent** of invoicing. A load can be on `BILLING_HOLD` (blocking invoicing) but still eligible for driver settlement.

### 7.2 Settlement Generation
- **Location**: `lib/managers/SettlementManager.ts`
- **Trigger**:
  - **Weekly Cron**: `lib/automation/settlement-generation.ts`
  - **Manual**: `app/api/settlements/generate/route.ts`

### 7.3 Settlement Calculation (STRICT Hierarchy)

#### Step 1: Gross Pay Calculation
- **Company Drivers**:
  - `PER_MILE`: `totalMiles * payRate`
  - `PERCENTAGE`: `revenue * (payRate / 100)` (excludes Fuel Surcharge)
  - `PER_LOAD`: Fixed `payRate` per load
  - `HOURLY`: `estimatedHours * payRate`
- **Owner Operators**:
  - `PERCENTAGE`: Typically 88% of gross load pay

#### Step 2: Additions
- **Stop Pay**: Additional pay for extra stops
- **Detention Pay**: Driver pay for detention hours
- **Reimbursements**: Tolls, scale tickets (approved expenses)

#### Step 3: Deductions (Priority Order)
1. **Advances** (Priority 1):
   - Fuel advances
   - Cash advances
   - Previous advances not yet settled
2. **Recurring Deductions** (Priority 2):
   - Insurance
   - Truck payment
   - Trailer payment
   - Other recurring charges
3. **Garnishments/Escrow** (Priority 3):
   - Child support
   - Tax levies
   - Escrow accounts

#### Step 4: Negative Balance Handling
- If `netPay < 0`:
  - Creates `DriverNegativeBalance` record
  - Stores negative amount
  - Applies to next week's settlement
  - **DO NOT throw error** - create record instead

#### Step 5: Net Pay Calculation
```
netPay = grossPay + additions - advances - deductions - previousNegativeBalance
```

### 7.4 Settlement Record
- **Location**: `prisma/schema.prisma` (Settlement model)
- **Fields**:
  - `settlementNumber` (e.g., `SET-2024-123456`)
  - `grossPay`
  - `deductions`
  - `advances`
  - `additions`
  - `netPay`
  - `periodStart`, `periodEnd`
  - `status`: `PENDING` → `APPROVED` → `PAID`
  - `approvalStatus`: `PENDING` → `APPROVED` → `REJECTED`

### 7.5 Settlement Approval
- **Process**:
  1. Settlement generated with `approvalStatus = PENDING`
  2. Accountant reviews settlement
  3. Approves or rejects
  4. If approved: `approvalStatus = APPROVED`, `status = PAID`
  5. Payment processed to driver

### 7.6 Settlement Automation
- **Weekly Cron**: `lib/automation/settlement-generation.ts`
- **Process**:
  1. Runs weekly (typically Sunday)
  2. Finds all drivers with completed loads in period
  3. Generates settlement for each driver
  4. Sends notifications:
     - Driver notification (settlement ready)
     - Accounting notification (review required)

---

## 8. ACCESSORIAL CHARGES

### 8.1 Types of Accessorials
- **DETENTION**: Wait time at pickup/delivery
- **LAYOVER**: Overnight delays
- **TONU**: Truck Ordered Not Used
- **LUMPER**: Loading/unloading fees
- **SCALE_TICKET**: Weigh station fees
- **ADDITIONAL_STOP**: Extra stops
- **FUEL_SURCHARGE**: Fuel surcharge
- **Other**: Various other charges

### 8.2 Accessorial Workflow
- **Location**: `app/api/accessorial-charges/route.ts`
- **Process**:
  1. Create accessorial charge (status: `PENDING`)
  2. Approve charge (status: `APPROVED`)
  3. Include in invoice (status: `BILLED`)
  4. Payment received (status: `PAID`)

### 8.3 Detention Calculation
- **Formula**: `detentionHours * detentionRate`
- **Tracking**: System tracks detention hours at stops
- **Billing**: Included in invoice to broker

---

## 9. PAYMENT PROCESSING

### 9.1 Payment Recording
- **Location**: `prisma/schema.prisma` (Payment model)
- **Types**:
  - `INVOICE`: Payment for invoice
  - `FUEL`: Payment for fuel entry
  - `BREAKDOWN`: Payment for breakdown
  - `OTHER`: Other payments

### 9.2 Payment Methods
- `CHECK`
- `WIRE`
- `ACH`
- `CREDIT_CARD`
- `CASH`
- `FACTOR` (from factoring company)
- `QUICK_PAY` (quick pay from broker)

### 9.3 Payment Application
- **Process**:
  1. Record payment received
  2. Link to invoice
  3. Update invoice `balance`
  4. If `balance = 0`: Update invoice status to `PAID`
  5. Update load status: `INVOICED` → `PAID`

---

## 10. KEY BUSINESS RULES

### 10.1 AR/AP Decoupling
- **Billing Hold** (`isBillingHold = true`):
  - Blocks invoicing (AR)
  - **ALLOWS** driver settlement (AP)
  - Used when there are disputes or issues with load

### 10.2 Rate Confirmation
- **Primary External Reference**: Rate Confirmation Number
- **Required for Invoicing**: Load must have Rate Confirmation to invoice
- **Attached to Invoice**: Rate Confirmation document attached to invoice

### 10.3 POD Requirement
- **Required for Completion**: POD must be uploaded to mark load complete
- **Attached to Invoice**: POD document attached to invoice

### 10.4 Driver Pay Calculation
- **Automatic on Assignment**: Calculated when driver assigned to load
- **Manual Override**: Can be manually set if needed
- **Settlement Uses Current Rate**: Settlement uses driver's current `payRate`, not stored `load.driverPay`

### 10.5 IFTA Tracking
- **Location**: `prisma/schema.prisma` (IFTAEntry, IFTAStateMileage)
- **Process**:
  - Tracks miles per state for each load
  - Calculates IFTA tax per state
  - Used for quarterly IFTA reporting

---

## 11. DATA FLOW SUMMARY

```
1. RATE CONFIRMATION → Load Created (PENDING)
2. DISPATCH → Driver/Truck Assigned (ASSIGNED)
3. DRIVER UPDATES → Status Transitions (EN_ROUTE_PICKUP → ... → DELIVERED)
4. POD UPLOAD → Load Completion Workflow
5. INVOICE GENERATION → Invoice Created (DRAFT)
6. INVOICE SENT → Invoice Status (SENT)
7. FACTORING → Invoice Submitted to Factor (SUBMITTED_TO_FACTOR)
8. FACTORING FUNDED → Invoice Status (FUNDED)
9. SETTLEMENT GENERATION → Driver Settlement Created (PENDING)
10. SETTLEMENT APPROVED → Driver Paid (PAID)
11. PAYMENT RECEIVED → Invoice Paid (PAID)
```

---

## 12. KEY FILES REFERENCE

### Load Management
- `app/api/loads/route.ts` - Load CRUD
- `app/api/loads/[id]/assign/route.ts` - Load assignment
- `app/api/loads/[id]/complete/route.ts` - Load completion
- `app/api/loads/[id]/pod-upload/route.ts` - POD upload

### Dispatch
- `app/api/dispatch/board/route.ts` - Dispatch board
- `app/api/dispatch/bulk-assign/route.ts` - Bulk assignment
- `lib/services/AIDispatchAssistant.ts` - AI dispatch recommendations

### Invoicing
- `app/api/invoices/generate/route.ts` - Invoice generation
- `app/api/invoices/[id]/send/route.ts` - Send invoice
- `lib/automation/invoice-generation.ts` - Automated invoicing

### Factoring
- `app/api/invoices/[id]/submit-to-factor/route.ts` - Submit to factor
- `lib/managers/FactoringManager.ts` - Factoring operations
- `lib/integrations/factoring-api.ts` - Factoring API integration

### Settlements
- `lib/managers/SettlementManager.ts` - Settlement generation
- `app/api/settlements/generate/route.ts` - Manual settlement generation
- `lib/automation/settlement-generation.ts` - Automated settlements
- `lib/utils/calculateDriverPay.ts` - Driver pay calculation

### Accessorials
- `app/api/accessorial-charges/route.ts` - Accessorial charges
- `components/accessorial/AccessorialChargeForm.tsx` - Accessorial form

### Completion
- `lib/managers/LoadCompletionManager.ts` - Load completion workflow
- `lib/managers/AccountingSyncManager.ts` - Accounting sync
- `lib/managers/LoadCostingManager.ts` - Cost calculation

---

## 13. STATUS TRANSITIONS DIAGRAM

```
LOAD LIFECYCLE:
PENDING → ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP → LOADED → 
EN_ROUTE_DELIVERY → AT_DELIVERY → DELIVERED → READY_TO_BILL → 
INVOICED → PAID

INVOICE LIFECYCLE:
DRAFT → SENT → POSTED → PARTIAL → PAID

FACTORING LIFECYCLE:
NOT_FACTORED → SUBMITTED_TO_FACTOR → FUNDED → RESERVE_RELEASED

SETTLEMENT LIFECYCLE:
PENDING → APPROVED → PAID

ACCESSORIAL LIFECYCLE:
PENDING → APPROVED → BILLED → PAID
```

---

## 14. CRITICAL INTEGRATION POINTS

### 14.1 Accounting System Sync
- **Location**: `lib/managers/AccountingSyncManager.ts`
- **Triggers**: Load completion
- **Syncs**: Revenue, expenses, profitability

### 14.2 QuickBooks Integration
- **Location**: `app/api/integrations/quickbooks/sync-invoice/route.ts`
- **Syncs**: Invoices, payments, customers

### 14.3 EDI Integration
- **Location**: `lib/edi/` (various files)
- **Processes**: EDI transactions for load tracking

---

## 15. AUTOMATION & CRON JOBS

### 15.1 Automated Invoice Generation
- **Schedule**: Daily or on-demand
- **Location**: `lib/automation/invoice-generation.ts`
- **Action**: Generates invoices for delivered loads

### 15.2 Automated Settlement Generation
- **Schedule**: Weekly (typically Sunday)
- **Location**: `lib/automation/settlement-generation.ts`
- **Action**: Generates settlements for all drivers

### 15.3 Load Status Auto-Update
- **Schedule**: Daily
- **Location**: `lib/automation/load-status.ts`
- **Action**: Updates load status based on dates

---

## END OF WORKFLOW DOCUMENT

This document provides a comprehensive overview of the complete workflow from load creation through billing, factoring, and settlements. For specific implementation details, refer to the individual file locations listed in Section 12.











