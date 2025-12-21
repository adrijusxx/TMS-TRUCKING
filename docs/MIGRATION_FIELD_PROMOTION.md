# Migration Field Promotion Guide

## Overview

After migrating data, you can promote frequently used metadata fields to either CustomField definitions or actual schema columns.

## When to Promote Fields

### Promote to CustomField When:
- Field is used by 50-80% of records
- Field has many unique values (>100)
- Field type is complex (JSON, arrays)
- Field is entity-specific and not critical for queries

### Promote to Schema Column When:
- Field is used by 80%+ of records
- Field has limited unique values (<100)
- Field is critical for queries and filtering
- Field type is simple (string, number, date, boolean)

## Promotion Process

### Step 1: Analyze Metadata Usage

```typescript
// Get analysis for specific entity
const analysis = await fetch('/api/migration/analysis?entityType=LOAD');
```

### Step 2: Review Recommendations

The analysis will provide:
- Field usage statistics
- Promotion recommendations
- Priority levels (high, medium, low)

### Step 3: Promote Field

#### Promote to CustomField

```typescript
const result = await fetch('/api/migration/promote', {
  method: 'POST',
  body: JSON.stringify({
    entityType: "LOAD",
    fieldName: "special_instructions",
    promotionType: "customField",
    label: "Special Instructions",
    dataType: "string",
    required: false
  })
});
```

#### Promote to Schema Column

```typescript
const result = await fetch('/api/migration/promote', {
  method: 'POST',
  body: JSON.stringify({
    entityType: "LOAD",
    fieldName: "special_instructions",
    promotionType: "schemaColumn",
    dataType: "string",
    required: false
  })
});

// This returns migration SQL that must be applied
// The data is automatically migrated from metadata to the new column
```

## Accounting Field Promotion Considerations

For accounting entities, consider:

1. **Financial Integrity** - Ensure promoted fields don't break financial calculations
2. **Audit Trail** - Preserve original values in metadata
3. **Relationships** - Ensure promoted fields maintain relationships
4. **Validation** - Add appropriate validation rules

## Example: Promoting Settlement Field

```typescript
// Analyze settlements
const analysis = await fetch('/api/migration/analysis?entityType=SETTLEMENT');

// Review recommendations
// If "original_currency" is used in 90% of records, promote it:

const result = await fetch('/api/migration/promote', {
  method: 'POST',
  body: JSON.stringify({
    entityType: "SETTLEMENT",
    fieldName: "original_currency",
    promotionType: "schemaColumn",
    dataType: "string",
    required: false
  })
});

// Apply the migration SQL returned in result.data.migrationSql
```

## Best Practices

1. **Analyze First** - Always analyze metadata usage before promoting
2. **Start with High Priority** - Promote high-priority fields first
3. **Test Migrations** - Test schema column migrations on a test database first
4. **Preserve Metadata** - Keep original metadata for audit purposes
5. **Update UI** - Update UI components to use promoted fields

## API Endpoints

- `GET /api/migration/analysis` - Get analysis and recommendations
- `POST /api/migration/promote` - Promote field to CustomField or schema column

