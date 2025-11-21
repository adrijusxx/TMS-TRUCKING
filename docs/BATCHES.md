# Invoice Batches - How They Work

## Overview
Invoice Batches allow you to group multiple invoices together for processing, typically for sending to a factoring company or for accounting purposes.

## Batch Lifecycle

### 1. **UNPOSTED** Status
- Initial status when a batch is created
- You can add or remove invoices from the batch
- Batch can be deleted if it's UNPOSTED
- Total amount is automatically calculated from included invoices

### 2. **POSTED** Status
- Batch has been sent to a factoring company
- Invoices can no longer be added or removed
- Batch cannot be deleted
- Status changes when you "Send Batch" via `/api/batches/[id]/send`

### 3. **PAID** Status
- Batch has been paid by the factoring company
- Final status - batch cannot be modified or sent

## Creating a Batch

### API Endpoint
`POST /api/batches`

### Request Body
```json
{
  "invoiceIds": ["invoice1", "invoice2", "invoice3"],
  "batchNumber": "IB-000123", // Optional - auto-generated if not provided
  "mcNumber": "160847", // Optional - extracted from first invoice if not provided
  "notes": "Optional notes about the batch"
}
```

### Process
1. Validates all invoices belong to your company
2. Checks that invoices are not already in another batch
3. Generates batch number in format `IB-000XXX` (6 digits with leading zeros)
4. Calculates total amount from all invoice totals
5. Creates batch with all invoice items linked via `InvoiceBatchItem` table

### Auto-Generated Batch Number
- Format: `IB-000001`, `IB-000002`, etc.
- Automatically increments based on latest batch for your company
- Implemented in `lib/utils/batch-numbering.ts`

## Managing Batches

### View All Batches
`GET /api/batches?page=1&limit=20&postStatus=UNPOSTED&search=IB-000`

### View Single Batch
`GET /api/batches/[id]`
- Returns batch with all invoices and their details
- Includes invoice count and calculated total

### Update Batch
`PATCH /api/batches/[id]`
```json
{
  "postStatus": "POSTED", // Optional
  "mcNumber": "160847", // Optional
  "notes": "Updated notes" // Optional
}
```

### Delete Batch
`DELETE /api/batches/[id]`
- Only allowed for UNPOSTED batches
- Deletes batch and all associated batch items (cascade delete)

## Managing Invoices in a Batch

### Add Invoices
`POST /api/batches/[id]/invoices`
```json
{
  "invoiceIds": ["invoice4", "invoice5"]
}
```
- Only works for UNPOSTED batches
- Validates invoices don't already belong to another batch
- Recalculates total amount after adding

### Remove Invoices
`DELETE /api/batches/[id]/invoices?invoiceIds=invoice1,invoice2`
- Only works for UNPOSTED batches
- Recalculates total amount after removal

## Sending Batch to Factoring

### API Endpoint
`POST /api/batches/[id]/send`

### Request Body
```json
{
  "factoringCompany": "ABC Factoring Inc.", // Optional
  "notes": "Optional notes about sending" // Optional
}
```

### Process
1. Validates batch exists and belongs to your company
2. Prevents sending if batch is already PAID
3. Updates batch status to POSTED
4. Records `sentToFactoringAt` timestamp
5. Stores factoring company name (if provided)

## Batch Number Format

### Auto-Generation
- Format: `IB-000001`, `IB-000002`, `IB-000123`, etc.
- First batch: `IB-000001`
- Next batch: Finds latest batch number, extracts number, increments by 1
- Always 6 digits with leading zeros

### Validation
- Must match pattern: `/^IB-\d{6}$/`
- Validates in `lib/utils/batch-numbering.ts`

## Database Schema

### InvoiceBatch Table
```prisma
model InvoiceBatch {
  id            String          @id @default(cuid())
  companyId     String
  batchNumber   String          @unique
  postStatus    BatchPostStatus @default(UNPOSTED)
  mcNumber      String?
  totalAmount   Float           @default(0)
  createdById   String
  sentToFactoringAt DateTime?
  factoringCompany String?
  notes         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  items         InvoiceBatchItem[]
}
```

### InvoiceBatchItem Table
```prisma
model InvoiceBatchItem {
  id        String       @id @default(cuid())
  batchId   String
  batch     InvoiceBatch @relation(...)
  invoiceId String
  invoice   Invoice      @relation(...)
  createdAt DateTime     @default(now())
  
  @@unique([batchId, invoiceId]) // Prevents duplicate invoice in same batch
}
```

### BatchPostStatus Enum
```prisma
enum BatchPostStatus {
  UNPOSTED  // Initial state, can modify
  POSTED    // Sent to factoring, cannot modify
  PAID      // Paid by factoring, final state
}
```

## Business Rules

1. **One Invoice, One Batch**: An invoice can only belong to one batch at a time
2. **Status Restrictions**:
   - UNPOSTED: Full CRUD operations allowed
   - POSTED: Cannot add/remove invoices, cannot delete
   - PAID: No modifications allowed, cannot send again
3. **Company Isolation**: Batches are scoped to company - users can only see/manage their company's batches
4. **MC Number**: Batches can optionally be associated with an MC number for filtering
5. **Automatic Totals**: Total amount is automatically recalculated when invoices are added/removed

## UI Components

### BatchList Component
- Located: `components/batches/BatchList.tsx`
- Features:
  - List all batches with pagination
  - Filter by status (UNPOSTED, POSTED, PAID)
  - Search by batch number, MC number, or notes
  - Create new batch button
  - View batch details

### CreateBatchForm Component
- Located: `components/batches/CreateBatchForm.tsx`
- Features:
  - Select multiple invoices
  - Optional batch number input
  - Optional MC number
  - Optional notes

### BatchDetail Component
- Located: `components/batches/BatchDetail.tsx`
- Features:
  - View batch details and all invoices
  - Send batch to factoring
  - Add/remove invoices (if UNPOSTED)
  - Update batch information
  - Delete batch (if UNPOSTED)

## Integration with Accounting

### Invoice Status
- When invoices are added to a batch, their status can remain unchanged
- Invoices are linked to batches via `InvoiceBatchItem` junction table
- Batch status doesn't directly affect invoice status

### Reconciliation
- Payments can be recorded against individual invoices within a batch
- Reconciliation works at the invoice level, not batch level
- See `lib/managers/ReconciliationManager.ts` for details

### Aging Reports
- Batches don't affect invoice aging calculations
- Aging is calculated at the invoice level based on due dates
- See `/api/invoices/aging` for aging report logic

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/batches` | List all batches |
| POST | `/api/batches` | Create new batch |
| GET | `/api/batches/[id]` | Get batch details |
| PATCH | `/api/batches/[id]` | Update batch |
| DELETE | `/api/batches/[id]` | Delete batch (UNPOSTED only) |
| POST | `/api/batches/[id]/send` | Send batch to factoring |
| POST | `/api/batches/[id]/invoices` | Add invoices to batch |
| DELETE | `/api/batches/[id]/invoices` | Remove invoices from batch |

## Error Handling

### Common Errors

1. **INVOICES_IN_BATCH**: Invoice(s) already belong to another batch
   - Solution: Remove from existing batch first

2. **INVALID_INVOICES**: Some invoices not found or don't belong to company
   - Solution: Verify invoice IDs and company ownership

3. **INVALID_STATUS**: Cannot perform operation on current batch status
   - Solution: Check batch status - operations only allowed on UNPOSTED batches

4. **NOT_FOUND**: Batch not found
   - Solution: Verify batch ID exists and belongs to your company

## Testing

To test batches functionality:

1. **Create a batch**: Select multiple invoices and create a batch
2. **Add invoices**: Add more invoices to an UNPOSTED batch
3. **Remove invoices**: Remove invoices from an UNPOSTED batch
4. **Send batch**: Send an UNPOSTED batch to factoring (changes to POSTED)
5. **View batch**: View batch details including all invoices
6. **Delete batch**: Delete an UNPOSTED batch

## Notes

- Batch numbers are unique per company
- Total amount is always calculated from invoice totals, not stored separately
- MC number filtering works if you need to filter batches by MC number
- Batch creation is tracked with `createdById` for audit purposes

