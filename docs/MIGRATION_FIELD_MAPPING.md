# Migration Field Mapping Guide

## Overview

The field mapping system allows you to map fields from a third-party TMS to your TMS schema, with automatic storage of unmapped fields in metadata.

## Creating Field Mappings

### Basic Field Mapping

A field mapping defines how a source field maps to a target field:

```typescript
{
  sourceField: "load_number",
  targetField: "loadNumber",  // null = store in metadata
  dataType: "string",
  entityType: "LOAD",
  required: true
}
```

### Field Mapping Configuration

A complete mapping configuration includes:

```typescript
{
  companyId: "company-123",
  entityType: "LOAD",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    {
      sourceField: "load_number",
      targetField: "loadNumber",
      dataType: "string",
      required: true
    },
    {
      sourceField: "special_instructions",
      targetField: null,  // Will be stored in metadata
      dataType: "string"
    }
  ]
}
```

## Supported Entity Types

- **Core Operations**: LOAD, LOAD_STOP, LOAD_TEMPLATE, DRIVER, TRUCK, TRAILER, CUSTOMER, VENDOR, LOCATION
- **Accounting**: INVOICE, INVOICE_BATCH, SETTLEMENT, SETTLEMENT_DEDUCTION, DRIVER_ADVANCE, DRIVER_NEGATIVE_BALANCE, LOAD_EXPENSE, PAYMENT, RECONCILIATION, FACTORING_COMPANY, FACTORING_BATCH, ACCESSORIAL_CHARGE, RATE_CONFIRMATION
- **Maintenance**: FUEL_ENTRY, MAINTENANCE_RECORD, BREAKDOWN, INSPECTION
- **Safety**: SAFETY_INCIDENT, SAFETY_TRAINING, DVIR, ROADSIDE_INSPECTION, DRUG_ALCOHOL_TEST, MVR_RECORD
- **Other**: DOCUMENT, COMMUNICATION, PROJECT, TASK

## Data Types

- `string` - Text values
- `number` - Numeric values
- `date` - Date/time values
- `boolean` - True/false values
- `json` - Complex objects/arrays

## Examples

### Example 1: Load Import with Mapping

```typescript
const mappingConfig = {
  entityType: "LOAD",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    { sourceField: "load_number", targetField: "loadNumber", dataType: "string", required: true },
    { sourceField: "revenue", targetField: "revenue", dataType: "number", required: true },
    { sourceField: "special_instructions", targetField: null, dataType: "string" },
    { sourceField: "custom_field_1", targetField: null, dataType: "string" },
  ]
};

// Import with mapping
const result = await fetch('/api/migration/import', {
  method: 'POST',
  body: JSON.stringify({
    entityType: "LOAD",
    data: loadData,
    mappingConfig
  })
});
```

### Example 2: Accounting Entity Import

```typescript
// Import settlements with financial field preservation
const settlementMapping = {
  entityType: "SETTLEMENT",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    { sourceField: "settlement_number", targetField: "settlementNumber", dataType: "string" },
    { sourceField: "gross_pay", targetField: "grossPay", dataType: "number" },
    { sourceField: "original_currency", targetField: null, dataType: "string" },
    { sourceField: "exchange_rate", targetField: null, dataType: "number" },
  ]
};
```

## Best Practices

1. **Map Critical Fields First** - Map all required fields to target schema fields
2. **Store Unmapped Fields** - Set `targetField: null` for fields that don't have a direct mapping
3. **Use Transformations** - Add transform functions for data type conversions
4. **Validate Mappings** - Always validate mappings before importing
5. **Preserve Source References** - Include source system ID in metadata

## API Endpoints

- `GET /api/migration/field-mapping` - Retrieve field mappings
- `POST /api/migration/field-mapping` - Save field mapping configuration
- `PUT /api/migration/field-mapping` - Update field mapping
- `DELETE /api/migration/field-mapping` - Delete field mapping
- `POST /api/migration/import` - Import with field mapping

