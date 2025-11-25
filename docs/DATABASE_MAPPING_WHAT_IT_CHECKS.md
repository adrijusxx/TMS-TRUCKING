# What the Database Mapping Audit Actually Checks

## Quick Answer

**The audit checks the files you write directly, NOT imported files.**

It scans your source files (API routes, pages, components) and looks for:
- Prisma queries (`prisma.modelName.findMany`, etc.)
- Field names used in queries
- Relations in `include`/`select` clauses
- Enum values

It does **NOT**:
- Follow `import` statements to check imported files
- Check type definitions in separate files
- Validate across module boundaries

## What Gets Checked

### ✅ Files That Are Scanned

1. **API Routes** - `app/api/**/*.ts`
   - All route handlers
   - Prisma queries in GET/POST/PUT/DELETE handlers

2. **Page Components** - `app/**/*.tsx` (excluding API routes)
   - Server components with Prisma queries
   - Field access patterns

3. **React Components** - `components/**/*.tsx`
   - Prop interfaces
   - Field access in components

### ✅ What Gets Checked in Each File

The audit looks for these patterns in the **file content directly**:

#### 1. Prisma Queries
```typescript
// ✅ This gets checked
prisma.load.findMany({
  where: { status: 'PENDING' },
  include: { customer: true }
})
```

#### 2. Field Names
```typescript
// ✅ Checks if 'loadNumber' exists on Load model
where: { loadNumber: '12345' }
```

#### 3. Relations
```typescript
// ✅ Checks if 'customer' relation exists on Load model
include: { customer: true }
```

#### 4. Enum Values
```typescript
// ✅ Checks if 'PENDING' is valid for LoadStatus enum
where: { status: 'PENDING' }
```

#### 5. Interface Definitions
```typescript
// ✅ Checks if interface fields match schema
interface Load {
  loadNumber: string;  // Checks if this field exists
  customerId: string;  // Checks if this field exists
}
```

## What Does NOT Get Checked

### ❌ Imported Files

If you have:
```typescript
// api/loads/route.ts
import { getLoads } from '@/lib/services/load-service';

export async function GET() {
  const loads = await getLoads();  // ❌ Audit doesn't check getLoads()
}
```

The audit **will NOT**:
- Follow the import to check `lib/services/load-service.ts`
- Validate Prisma queries inside `getLoads()`
- Check field names in that file

### ❌ Type Definitions in Separate Files

If you have:
```typescript
// types/load.ts
export interface Load {
  loadNumber: string;
}

// components/LoadList.tsx
import { Load } from '@/types/load';  // ❌ Audit doesn't check types/load.ts
```

The audit **will NOT**:
- Check the interface in `types/load.ts`
- Validate it against the schema

### ❌ Utility Functions

If you have:
```typescript
// lib/utils/load-helpers.ts
export function formatLoad(load: Load) {
  return load.loadNumber;  // ❌ Audit doesn't check this
}

// components/LoadCard.tsx
import { formatLoad } from '@/lib/utils/load-helpers';  // ❌ Not checked
```

## How It Works

The audit uses a **simple file scanner**:

1. **Finds files** using glob patterns:
   - `app/api/**/*.ts` - All API routes
   - `app/**/*.tsx` - All pages
   - `components/**/*.tsx` - All components

2. **Reads file content** directly:
   ```typescript
   const content = fs.readFileSync(file, 'utf-8');
   const lines = content.split('\n');
   ```

3. **Parses the content** line by line:
   - Looks for `prisma.modelName` patterns
   - Extracts field names from queries
   - Checks against schema reference

4. **Does NOT follow imports**:
   - No TypeScript AST parsing
   - No import resolution
   - Just text pattern matching

## Example: What Gets Checked vs Not

### File: `app/api/loads/route.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { getLoads } from '@/lib/services/load-service';  // ❌ Not checked

export async function GET() {
  // ✅ This gets checked
  const loads = await prisma.load.findMany({
    where: { status: 'PENDING' },  // ✅ Checks 'status' field
    include: { customer: true }     // ✅ Checks 'customer' relation
  });
  
  // ❌ This does NOT get checked
  const otherLoads = await getLoads();  // Function in imported file
}
```

### File: `lib/services/load-service.ts` (NOT checked)

```typescript
// ❌ This file is NOT scanned by the audit
export async function getLoads() {
  return prisma.load.findMany({
    where: { invalidField: 'value' }  // ❌ Won't catch this error
  });
}
```

## Limitations

### Current Limitations

1. **No Import Following** - Only checks files directly
2. **Simple Pattern Matching** - Not full TypeScript parsing
3. **False Positives** - Flags Prisma keywords as fields
4. **No Type Checking** - Doesn't validate TypeScript types

### What This Means

- ✅ **Good for**: Finding obvious issues in direct Prisma queries
- ❌ **Not good for**: Validating code in utility functions, services, or imported modules
- ⚠️ **Use with caution**: Many false positives from parsing issues

## How to Make It More Useful

### Option 1: Move Prisma Queries to Audited Files

Instead of:
```typescript
// lib/services/load-service.ts (not checked)
export async function getLoads() {
  return prisma.load.findMany({ ... });
}
```

Do:
```typescript
// app/api/loads/route.ts (checked)
export async function GET() {
  const loads = await prisma.load.findMany({ ... });
  return NextResponse.json({ data: loads });
}
```

### Option 2: Use Validation Utilities in Code

```typescript
import { validateField } from '@/lib/validations/database-field-validator';

// This runs at runtime and will catch real errors
const result = validateField('Load', 'loadNumber');
if (!result.isValid) {
  console.error(result.errors);
}
```

### Option 3: Improve the Audit Script (Future)

- Use TypeScript compiler API to follow imports
- Parse AST instead of text patterns
- Better Prisma query understanding

## Summary

| What | Checked? | Notes |
|------|----------|-------|
| Direct Prisma queries | ✅ Yes | In API routes, pages, components |
| Field names in queries | ✅ Yes | Validates against schema |
| Relations in includes | ✅ Yes | Checks relation names |
| Enum values | ✅ Yes | Validates enum values |
| Imported files | ❌ No | Doesn't follow imports |
| Utility functions | ❌ No | Only checks direct files |
| Type definitions | ⚠️ Partial | Only if in same file |
| Runtime validation | ❌ No | Use validation utilities instead |

## Bottom Line

**The audit checks what you write directly in your route/page/component files, but NOT code in imported modules or utility functions.**

For comprehensive validation:
1. Use the audit for direct Prisma queries
2. Use validation utilities in your code for runtime checks
3. Consider moving critical Prisma queries to audited files



