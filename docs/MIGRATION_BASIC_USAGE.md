# Basic Migration Usage Guide

## Step 1: Run the Database Migration

First, apply the database migration to add metadata fields to all entities:

```bash
npx prisma migrate dev
```

This will add `metadata` JSONB columns to all 37+ entities.

## Step 2: Basic Import (Automatic Metadata Storage)

The simplest way to import data is using the existing import endpoint. **Unmapped fields are automatically stored in metadata.**

### Example: Import Customers

```typescript
// Using the existing import endpoint
const formData = new FormData();
formData.append('file', csvFile); // Your CSV/Excel file

const response = await fetch('/api/import-export/customers', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result.data.created - number of records created
// result.data.errors - any errors
```

**What happens automatically:**
- Fields that match your schema → stored in normal columns
- Fields that DON'T match → automatically stored in `metadata.unmappedFields`
- Source system info → stored in `metadata.sourceSystem`

### Example CSV File

```csv
Company name,Customer Number,Address,City,State,Special Field 1,Custom Notes
ABC Logistics,CUST-001,123 Main St,Chicago,IL,Value 1,Some notes
XYZ Transport,CUST-002,456 Oak Ave,New York,NY,Value 2,More notes
```

**Result:**
- `name`, `customerNumber`, `address`, `city`, `state` → stored in normal columns
- `Special Field 1`, `Custom Notes` → stored in `metadata.unmappedFields`

## Step 3: View Metadata

Query entities to see what was stored in metadata:

```typescript
// Get a customer with metadata
const customer = await prisma.customer.findFirst({
  where: { customerNumber: 'CUST-001' },
  select: {
    id: true,
    name: true,
    customerNumber: true,
    metadata: true
  }
});

console.log(customer.metadata);
// {
//   sourceSystem: "ThirdPartyTMS",
//   migratedAt: "2024-01-15T10:30:00Z",
//   migrationVersion: "1.0",
//   unmappedFields: {
//     "Special Field 1": "Value 1",
//     "Custom Notes": "Some notes"
//   }
// }
```

## Step 4: Query Metadata Fields

Use the metadata query utilities:

```typescript
import { queryMetadataField } from '@/lib/utils/metadata-query';

// Find all customers with a specific metadata field
const customers = await queryMetadataField(
  'CUSTOMER',
  companyId,
  'Special Field 1'
);

// Find customers with specific metadata value
const customersWithValue = await queryMetadataField(
  'CUSTOMER',
  companyId,
  'Special Field 1',
  'Value 1'
);
```

## Step 5: Advanced - Use Field Mapping

If you want to explicitly map fields, create a field mapping configuration:

```typescript
// Create field mapping
const mappingConfig = {
  companyId: "your-company-id",
  entityType: "CUSTOMER",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    {
      sourceField: "Company name",
      targetField: "name",
      dataType: "string",
      required: true
    },
    {
      sourceField: "Special Field 1",
      targetField: null, // Store in metadata
      dataType: "string"
    }
  ]
};

// Save mapping configuration
await fetch('/api/migration/field-mapping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mappingConfig)
});

// Import with mapping
await fetch('/api/migration/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityType: "CUSTOMER",
    data: customerDataArray,
    mappingConfig: mappingConfig
  })
});
```

## Step 6: Analyze Metadata Usage

After importing data, analyze what fields are commonly used:

```typescript
// Get analysis for all entities
const analysis = await fetch('/api/migration/analysis');

// Get analysis for specific entity
const customerAnalysis = await fetch('/api/migration/analysis?entityType=CUSTOMER');

const result = await customerAnalysis.json();
// result.data.analyses - usage statistics
// result.data.recommendations - fields to promote
```

## Step 7: Promote Frequently Used Fields

If a field is used in 80%+ of records, promote it to a schema column:

```typescript
// Promote to CustomField (for 50-80% usage)
await fetch('/api/migration/promote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityType: "CUSTOMER",
    fieldName: "Special Field 1",
    promotionType: "customField",
    label: "Special Field",
    dataType: "string"
  })
});

// Or promote to schema column (for 80%+ usage)
const result = await fetch('/api/migration/promote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityType: "CUSTOMER",
    fieldName: "Special Field 1",
    promotionType: "schemaColumn",
    dataType: "string"
  })
});

// Apply the migration SQL returned in result.data.migrationSql
```

## Quick Start Example

Here's a complete example for importing customers:

```typescript
// 1. Prepare your CSV/Excel file with customer data
// Include any fields - mapped and unmapped

// 2. Import using existing endpoint
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/import-export/customers', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.success) {
  console.log(`Created ${result.data.created} customers`);
  console.log(`Errors: ${result.data.errors.length}`);
  
  // 3. Check metadata for unmapped fields
  const customer = await prisma.customer.findFirst({
    where: { customerNumber: 'CUST-001' }
  });
  
  if (customer.metadata?.unmappedFields) {
    console.log('Unmapped fields stored:', customer.metadata.unmappedFields);
  }
}
```

## Supported Entities

You can import any of these entities the same way:

**Core:**
- `/api/import-export/loads`
- `/api/import-export/drivers`
- `/api/import-export/customers`
- `/api/import-export/trucks`
- `/api/import-export/trailers`
- `/api/import-export/vendors`
- `/api/import-export/locations`

**Accounting:**
- `/api/import-export/invoices`
- Use `/api/migration/accounting` for bulk accounting import

**Other:**
- `/api/import-export/breakdowns`
- `/api/import-export/inspections`
- And more...

## Tips

1. **Start Simple** - Just import your CSV/Excel file. Unmapped fields are automatically stored.
2. **Check Metadata** - After import, query a few records to see what was stored in metadata.
3. **Analyze Later** - Run analysis after importing to see which fields are commonly used.
4. **Promote When Ready** - Only promote fields that are used frequently (50%+ of records).

## Need Help?

- See `docs/MIGRATION_FIELD_MAPPING.md` for advanced field mapping
- See `docs/MIGRATION_FIELD_PROMOTION.md` for promoting fields
- See `docs/MIGRATION_ACCOUNTING_ENTITIES.md` for accounting imports

