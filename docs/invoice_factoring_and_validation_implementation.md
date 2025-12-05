# Invoice Factoring Logic & Validation Gate Implementation

**Date:** 2025-01-27  
**Status:** ✅ **IMPLEMENTED**

---

## Implementation Complete

### Files Created/Modified

1. **`lib/managers/InvoiceManager.ts`** ✅ CREATED
   - `finalizeInvoice(invoiceId)` - Handles factoring logic
   - `isReadyToBill(loadId, options?)` - Validation gate ("Clean Load" check)
   - `areLoadsReadyToBill(loadIds[], options?)` - Batch validation

2. **`app/api/invoices/[id]/pdf/route.tsx`** ✅ UPDATED
   - Integrated `finalizeInvoice()` call
   - Added "Remit To" section for factoring companies
   - Added "Notice of Assignment" section when factored

3. **`app/api/invoices/generate/route.ts`** ✅ UPDATED
   - Integrated `isReadyToBill()` validation gate
   - Blocks invoice creation if loads fail validation

---

## 1. Factoring Logic ✅

### Implementation: `finalizeInvoice(invoiceId)`

**Location:** `lib/managers/InvoiceManager.ts`

**Logic:**
```typescript
// Check if customer is factored
const isFactored = invoice.customer.factoringCompanyId !== null;

if (isFactored && invoice.customer.factoringCompany) {
  // FACTORED: Use Factoring Company Address
  // - Swap "Remit To" to Factoring Company
  // - Generate "Notice of Assignment" text
} else {
  // NOT FACTORED: Use Standard Company Address
}
```

**Key Features:**
- ✅ Checks `Customer.factoringCompanyId` (not null = factored)
- ✅ Fetches FactoringCompany details
- ✅ Returns `remitToAddress` object with factoring company info
- ✅ Returns `noticeOfAssignment` text for PDF
- ✅ Falls back to company address if not factored

**Remit To Address Structure:**
```typescript
{
  name: string;        // Factoring company name
  address: string;     // Contact name + company name
  city: string;        // (if available)
  state: string;       // (if available)
  zip: string;         // (if available)
  phone?: string;      // Contact phone
  email?: string;      // Contact email
}
```

**Notice of Assignment Text:**
```
NOTICE OF ASSIGNMENT

This invoice has been assigned to [FactoringCompany] for collection purposes.

All payments should be remitted directly to:
[FactoringCompany Name]
[Address]
[Phone/Email]

Please make all payments payable to [FactoringCompany] and reference Invoice #[Number].

Any questions regarding this invoice should be directed to [FactoringCompany].
```

---

## 2. Validation Gate: `isReadyToBill(loadId)` ✅

### Implementation

**Location:** `lib/managers/InvoiceManager.ts`

**Returns FALSE if:**

### Check 1: POD Image Missing
```typescript
const podDocuments = load.documents.filter(doc => doc.type === 'POD' && doc.fileUrl);
if (podDocuments.length === 0) {
  reasons.push('POD (Proof of Delivery) image is missing');
}
```

### Check 2: CarrierRate != CustomerRate
```typescript
const carrierRate = load.driverPay || 0;  // What we pay carrier
const customerRate = load.revenue || 0;    // What customer pays us

const isBrokerageSplit = options?.allowBrokerageSplit || load.customer.type === 'BROKER';

if (carrierRate !== customerRate && !isBrokerageSplit) {
  reasons.push(`Rate mismatch: Carrier Rate ($${carrierRate}) does not match Customer Rate ($${customerRate}). Brokerage split override required.`);
}
```

**Override Logic:**
- ✅ Allows rate mismatch if `allowBrokerageSplit === true`
- ✅ Automatically allows if `Customer.type === 'BROKER'`
- ✅ Otherwise, blocks invoice creation

### Check 3: BOL Weight Missing/Zero
```typescript
if (!load.weight || load.weight === 0) {
  reasons.push('BOL Weight is missing or zero');
}
```

**Return Structure:**
```typescript
{
  ready: boolean;              // true if all checks pass
  reasons?: string[];          // Array of failure reasons
  missingPOD?: boolean;        // POD check failed
  rateMismatch?: boolean;      // Rate mismatch (not overridden)
  missingBOLWeight?: boolean;  // Weight check failed
}
```

---

## 3. PDF Integration ✅

### Updated PDF Component

**File:** `app/api/invoices/[id]/pdf/route.tsx`

**Changes:**
1. Added `remitToAddress` and `noticeOfAssignment` props to `InvoicePDF` component
2. Added "Remit To" section (shown when factored)
3. Added "Notice of Assignment" section (yellow highlighted box when factored)

**PDF Structure:**
```
[Header: Company Info]
[Remit To: Factoring Company (if factored)]
[Bill To: Customer]
[Loads Table]
[Totals]
[Notes]
[Notice of Assignment (if factored)] ← Yellow highlighted box
[Footer]
```

---

## 4. Invoice Generation Integration ✅

### Updated Endpoint

**File:** `app/api/invoices/generate/route.ts`

**Validation Flow:**
```typescript
for (const load of loads) {
  // Check 1: Billing hold eligibility
  const eligibility = await billingHoldManager.checkInvoicingEligibility(load.id);
  if (!eligibility.eligible) { /* block */ }

  // Check 2: "Clean Load" validation gate
  const readyToBill = await invoiceManager.isReadyToBill(load.id, {
    allowBrokerageSplit: load.customer.type === 'BROKER',
  });
  if (!readyToBill.ready) { /* block */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVOICING_NOT_ELIGIBLE",
    "message": "One or more loads are not eligible for invoicing",
    "details": [
      {
        "loadNumber": "LD-12345",
        "reason": "Load validation failed: POD (Proof of Delivery) image is missing; BOL Weight is missing or zero"
      }
    ]
  }
}
```

---

## Usage Examples

### Finalize Invoice (Factoring)
```typescript
import { InvoiceManager } from '@/lib/managers/InvoiceManager';

const invoiceManager = new InvoiceManager();
const result = await invoiceManager.finalizeInvoice(invoiceId);

if (result.success) {
  // Use result.remitToAddress for PDF "Remit To" section
  // Use result.noticeOfAssignment for PDF notice section
}
```

### Check Ready to Bill
```typescript
const readyToBill = await invoiceManager.isReadyToBill(loadId, {
  allowBrokerageSplit: true, // Override rate mismatch check
});

if (!readyToBill.ready) {
  console.log('Validation failures:', readyToBill.reasons);
  // Block invoice creation
}
```

### Batch Validation
```typescript
const batchResult = await invoiceManager.areLoadsReadyToBill(loadIds, {
  allowBrokerageSplit: false,
});

if (!batchResult.allReady) {
  // Show which loads failed and why
  batchResult.results.forEach(r => {
    if (!r.ready) {
      console.log(`Load ${r.loadId}: ${r.reasons?.join(', ')}`);
    }
  });
}
```

---

## Testing Checklist

- [x] Factoring logic checks `factoringCompanyId !== null`
- [x] Factored invoices show Factoring Company address in "Remit To"
- [x] Factored invoices include "Notice of Assignment" in PDF
- [x] Non-factored invoices use standard company address
- [x] POD validation blocks invoice if POD missing
- [x] Rate mismatch validation blocks invoice (unless brokerage split)
- [x] BOL Weight validation blocks invoice if weight is 0 or null
- [x] Brokerage split override allows rate mismatch for BROKER customers
- [x] Validation errors returned with specific reasons

---

## Database Schema Notes

### Customer Model
- `factoringCompanyId: String?` - If not null, customer is factored
- `type: CustomerType` - `DIRECT` or `BROKER` (affects rate mismatch validation)

### Load Model
- `revenue: Float` - Customer rate (what customer pays)
- `driverPay: Float?` - Carrier rate (what we pay driver)
- `weight: Float` - BOL weight (must be > 0)

### Document Model
- `type: DocumentType` - Includes `POD` type
- `fileUrl: String` - Must exist for POD validation

### FactoringCompany Model
- `name: String` - Company name
- `contactName: String?` - Contact person
- `contactEmail: String?` - Contact email
- `contactPhone: String?` - Contact phone
- Note: No address fields - uses contact info or company address

---

**Implementation Status:** ✅ **COMPLETE**

All factoring logic and validation gates implemented as specified.









