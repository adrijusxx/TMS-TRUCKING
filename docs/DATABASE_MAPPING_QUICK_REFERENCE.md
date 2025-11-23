# Database Mapping Quick Reference

## Quick Commands

```bash
# Extract schema reference (run after schema changes)
npx tsx scripts/extract-schema-reference.ts

# Run full audit
npx tsx scripts/audit-database-mappings.ts

# Run build-time validation
npx tsx scripts/validate-database-mappings.ts
```

## Common Patterns

### Validating Fields in Code

```typescript
import { validateField } from '@/lib/validations/database-field-validator';

// Before using a field
const result = validateField('Load', 'loadNumber');
if (!result.isValid) {
  console.error('Field validation failed:', result.errors);
}
```

### Validating API Responses

```typescript
import { validateApiResponse } from '@/lib/validations/api-response-validator';

// After fetching data
const response = await fetch('/api/loads');
const data = await response.json();
const validation = validateApiResponse('Load', data);
if (!validation.isValid) {
  console.warn('Missing fields:', validation.missingFields);
}
```

### Validating Form Fields

```typescript
import { validateFormFields } from '@/lib/validations/form-field-validator';

// Before form submission
const formFields = ['loadNumber', 'customerId', 'driverId'];
const validation = validateFormFields('Load', formFields);
if (!validation.isValid) {
  console.error('Unmapped fields:', validation.unmappedFields);
  console.log('Suggestions:', validation.suggestions);
}
```

## Schema Access

```typescript
import { 
  schemaReference, 
  fieldExists, 
  getModelFields, 
  getEnumValues 
} from '@/lib/schema-reference';

// Check if field exists
if (fieldExists('Load', 'loadNumber')) {
  // Safe to use
}

// Get all fields for a model
const fields = getModelFields('Load');
console.log(fields.map(f => f.name));

// Get enum values
const statuses = getEnumValues('LoadStatus');
console.log(statuses); // ['PENDING', 'ASSIGNED', ...]
```

## Model Names

Prisma uses camelCase in code but models are PascalCase in schema:

| Code | Schema Model |
|------|--------------|
| `prisma.truck` | `Truck` |
| `prisma.load` | `Load` |
| `prisma.driver` | `Driver` |
| `prisma.customer` | `Customer` |

## Common Issues & Solutions

### Issue: Field doesn't exist error
**Solution**: Check field name spelling and case. Use `getModelFields()` to see available fields.

### Issue: Enum value invalid
**Solution**: Use `getEnumValues()` to see valid enum values.

### Issue: Relation not found
**Solution**: Check relation name matches schema. Relations are typically the model name in camelCase.

### Issue: Type mismatch
**Solution**: Ensure field types match (String vs string, DateTime vs Date, etc.)

## Integration Points

1. **Pre-commit**: Add validation to catch issues early
2. **CI/CD**: Run full audit in pipeline
3. **Development**: Use validation utilities in new code
4. **Code Review**: Check audit report before merging

