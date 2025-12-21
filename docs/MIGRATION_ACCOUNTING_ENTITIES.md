# Migration Guide for Accounting Entities

## Overview

Accounting entities require special handling during migration to preserve financial integrity and relationships.

## Import Order

Accounting entities must be imported in this specific order:

1. **Rate Confirmations** - Needed for invoices
2. **Accessorial Charges** - Needed for invoices
3. **Invoices** - Core revenue records
4. **Invoice Batches** - Groups invoices
5. **Driver Advances** - Needed for settlements
6. **Load Expenses** - Needed for settlements
7. **Settlements** - Driver pay calculations
8. **Payments** - Customer payments
9. **Reconciliations** - Payment matching

## Bulk Import Endpoint

Use the bulk import endpoint for accounting entities:

```typescript
const result = await fetch('/api/migration/accounting/bulk-import', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      rateConfirmations: [...],
      accessorialCharges: [...],
      invoices: [...],
      invoiceBatches: [...],
      driverAdvances: [...],
      loadExpenses: [...],
      settlements: [...],
      payments: [...],
      reconciliations: [...]
    },
    mappingConfigs: {
      invoices: invoiceMappingConfig,
      settlements: settlementMappingConfig,
      // ... other configs
    },
    sourceSystem: "ThirdPartyTMS"
  })
});
```

## Field Mapping Examples

### Invoice Mapping

```typescript
const invoiceMapping = {
  entityType: "INVOICE",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    { sourceField: "invoice_number", targetField: "invoiceNumber", dataType: "string", required: true },
    { sourceField: "total", targetField: "total", dataType: "number", required: true },
    { sourceField: "invoice_date", targetField: "invoiceDate", dataType: "date", required: true },
    { sourceField: "due_date", targetField: "dueDate", dataType: "date", required: true },
    { sourceField: "original_currency", targetField: null, dataType: "string" },
    { sourceField: "exchange_rate", targetField: null, dataType: "number" },
    { sourceField: "source_tax_amount", targetField: null, dataType: "number" },
  ]
};
```

### Settlement Mapping

```typescript
const settlementMapping = {
  entityType: "SETTLEMENT",
  sourceSystem: "ThirdPartyTMS",
  version: "1.0",
  mappings: [
    { sourceField: "settlement_number", targetField: "settlementNumber", dataType: "string", required: true },
    { sourceField: "gross_pay", targetField: "grossPay", dataType: "number", required: true },
    { sourceField: "net_pay", targetField: "netPay", dataType: "number", required: true },
    { sourceField: "period_start", targetField: "periodStart", dataType: "date", required: true },
    { sourceField: "period_end", targetField: "periodEnd", dataType: "date", required: true },
    { sourceField: "original_currency", targetField: null, dataType: "string" },
    { sourceField: "source_system_status", targetField: null, dataType: "string" },
  ]
};
```

## Financial Data Validation

The system automatically validates:

- Invoice totals > 0
- Settlement gross pay > 0
- Payment amounts > 0
- Amount paid doesn't exceed invoice total
- Net pay calculations

## Preserving Financial Audit Trail

All accounting entities store:

```json
{
  "sourceSystem": "ThirdPartyTMS",
  "sourceId": "INV-12345",
  "migratedAt": "2024-01-15T10:30:00Z",
  "migrationVersion": "1.0",
  "financialFields": {
    "originalCurrency": "USD",
    "exchangeRate": 1.0,
    "sourceTaxAmount": 150.00
  },
  "unmappedFields": {
    "customInvoiceField": "value"
  }
}
```

## Relationship Preservation

The bulk import automatically:

1. Links invoices to rate confirmations
2. Links settlements to driver advances and load expenses
3. Links payments to invoices
4. Links reconciliations to invoices and payments
5. Maintains invoice batch relationships

## Post-Migration Verification

After importing accounting entities:

1. **Verify Totals** - Check invoice, payment, and settlement totals match source
2. **Check Relationships** - Verify all foreign key relationships are intact
3. **Validate Calculations** - Ensure net pay, balances are correct
4. **Review Metadata** - Check that all unmapped fields are preserved

## Common Issues

### Issue: Missing Relationships

**Solution**: Ensure entities are imported in correct order. Rate confirmations must exist before invoices.

### Issue: Financial Totals Don't Match

**Solution**: Check metadata for original currency and exchange rates. Verify all financial fields were mapped correctly.

### Issue: Duplicate Records

**Solution**: Use unique identifiers (invoice number, settlement number) to prevent duplicates.

## Best Practices

1. **Import in Order** - Always use bulk import endpoint for accounting entities
2. **Validate First** - Validate financial data before importing
3. **Preserve Audit Trail** - Keep all source system references
4. **Test Incrementally** - Test with small batches first
5. **Verify Relationships** - Check all relationships after import

