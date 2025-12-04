# TMS Trucking - Quick Reference Cheat Sheet

> **⚡ Lightning-fast reference** for common patterns, commands, and rules  
> **Print this out** or keep it open in a second tab while coding

---

## 🚀 Getting Started (30 Seconds)

```bash
# Clone & Setup
npm install
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run dev                # Start dev server (localhost:3000)
```

**First Time?** Read in this order:
1. `PROJECT-CONTEXT.md` (5 min) - Current state
2. `PROJECT_RULES.md` (10 min) - Coding standards
3. Start coding! 🎉

---

## 📏 Code Size Limits (CRITICAL!)

| Lines | Status | Action |
|-------|--------|--------|
| < 300 | ✅ Good | Keep going |
| 300-400 | ⚠️ Warning | Consider refactoring |
| 400-500 | 🔴 Critical | Refactor NOW |
| > 500 | ❌ Unacceptable | Must refactor before commit |

**Exception:** Auto-generated files only (e.g., `schema-reference.ts`)

---

## 🗂️ Where Does This Go?

```
Is it a React component?
├─ YES → Does it render UI?
│  ├─ YES → Reusable? → components/ui/
│  │       Not reusable? → components/{domain}/
│  └─ NO → Is it a hook? → hooks/
│
└─ NO → Is it business logic?
   ├─ Complex workflow? → lib/managers/
   ├─ External service? → lib/services/
   ├─ Validation? → lib/validations/
   └─ Utility function? → lib/utils/
```

---

## 🔐 API Route Template (Copy & Paste)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/filters/mc-number-filter';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session, 'resource:read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query Data
    const data = await prisma.model.findMany({
      where: { ...mcWhere, deletedAt: null }
    });

    // 5. Return Success
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Component Template (Copy & Paste)

```typescript
'use client'; // Only if using hooks/state

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface MyComponentProps {
  id: string;
}

export function MyComponent({ id }: MyComponentProps) {
  // 1. State
  const [isOpen, setIsOpen] = useState(false);

  // 2. Data Fetching
  const { data, isLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => fetch(`/api/resource/${id}`).then(r => r.json())
  });

  // 3. Mutations
  const mutation = useMutation({
    mutationFn: (data) => fetch('/api/resource', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success('Success!');
    }
  });

  // 4. Handlers
  const handleSubmit = () => {
    mutation.mutate({ id });
  };

  // 5. Loading State
  if (isLoading) return <div>Loading...</div>;

  // 6. Render
  return (
    <Card>
      {/* Your component UI */}
    </Card>
  );
}
```

---

## 📝 Form Template (Copy & Paste)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// 1. Define Schema
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email')
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  // 2. Setup Form
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' }
  });

  // 3. Submit Handler
  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch('/api/resource', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      toast.success('Saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  // 4. Render
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## 🎯 Multi-MC Filtering (ALWAYS Required)

```typescript
// ✅ CORRECT - Always filter by MC
const mcWhere = await buildMcNumberWhereClause(session, request);
const loads = await prisma.load.findMany({
  where: { ...mcWhere, deletedAt: null }
});

// ❌ WRONG - Missing MC filter
const loads = await prisma.load.findMany({
  where: { companyId: session.user.companyId }
});
```

**Rules:**
- ✅ ALWAYS use `buildMcNumberWhereClause()`
- ✅ ALWAYS include `mcNumberId` when creating records
- ✅ ALWAYS respect user's `mcAccess` array
- ✅ Admin "All MCs" view = no MC filter (automatic)

---

## 🔑 Permissions Quick Reference

```typescript
// Check Permission
if (!hasPermission(session, 'loads:read')) {
  return unauthorized();
}

// Common Permissions
'loads:read'          // View loads
'loads:write'         // Create/edit loads
'drivers:read'        // View drivers
'drivers:write'       // Create/edit drivers
'settlements:approve' // Approve settlements
'settings:manage'     // Manage settings
```

**Permission Format:** `resource:action`

---

## 🎨 Tailwind Class Order (Convention)

```tsx
<div className="
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 gap-2
  // Sizing
  w-full h-auto
  // Typography
  text-sm font-medium
  // Colors
  bg-white text-gray-900
  // Borders
  border border-gray-200 rounded-lg
  // Effects
  shadow-sm hover:shadow-md
  // Transitions
  transition-all duration-200
"/>
```

---

## 🗄️ Database Query Patterns

```typescript
// ✅ Include Relations
const load = await prisma.load.findUnique({
  where: { id },
  include: {
    customer: true,
    driver: { include: { user: true } },
    truck: true
  }
});

// ✅ Use Transactions
await prisma.$transaction(async (tx) => {
  await tx.load.update({ where: { id }, data: { status: 'DELIVERED' } });
  await tx.invoice.create({ data: { loadId: id } });
});

// ✅ Soft Delete (NEVER hard delete)
await prisma.load.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// ❌ NEVER DO THIS
await prisma.load.delete({ where: { id } }); // ❌ NO!
```

---

## 🚨 Common Mistakes to Avoid

| ❌ Don't Do This | ✅ Do This Instead |
|------------------|-------------------|
| Skip MC filtering | Always use `buildMcNumberWhereClause()` |
| Use `any` type | Use proper TypeScript types |
| Hard delete records | Soft delete with `deletedAt` |
| Files over 500 lines | Refactor into smaller components |
| Inline styles | Use Tailwind classes |
| Fetch in loops | Batch queries with `include` |
| Skip auth checks | Always check `session` first |
| Expose sensitive data | Use `filterSensitiveFields()` |

---

## 📦 Common Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # Check TypeScript
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
npm run db:reset         # Reset database (CAUTION!)
```

### Auditing
```bash
npm run audit:schema     # Extract schema reference
npm run audit:full       # Full system audit
npm run audit:loads      # Generate test loads
```

### Testing
```bash
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## 🔍 Finding Things

```bash
# Find a component
components/{domain}/{ComponentName}.tsx

# Find business logic
lib/managers/{FeatureManager}.ts

# Find validation
lib/validations/{feature}.ts

# Find API route
app/api/{resource}/route.ts

# Find utility
lib/utils/{utilName}.ts
```

---

## 🎓 Learning Path

### Day 1: Setup & Context
- [ ] Read `PROJECT-CONTEXT.md`
- [ ] Read this cheat sheet
- [ ] Run `npm install && npm run dev`

### Day 2: Understand Architecture
- [ ] Read `PROJECT_RULES.md`
- [ ] Explore `prisma/schema.prisma`
- [ ] Look at existing API routes

### Day 3: Start Coding
- [ ] Pick a small feature
- [ ] Copy templates from this cheat sheet
- [ ] Test with different MC selections
- [ ] Test with different user roles

---

## 🆘 When You're Stuck

1. **Search First:** Check if similar code exists
   - Search `components/` for UI patterns
   - Search `lib/managers/` for business logic
   
2. **Check Docs:**
   - `PROJECT-CONTEXT.md` - Current state
   - `PROJECT_RULES.md` - Coding standards
   - `docs/PROJECT_ORGANIZATION_GUIDELINES.md` - Organization

3. **Common Issues:**
   - **401 Unauthorized:** Check `auth()` call
   - **403 Forbidden:** Check `hasPermission()`
   - **No data showing:** Check MC filter
   - **TypeScript errors:** Run `npm run db:generate`

---

## 🔗 Important Imports

```typescript
// Auth & Permissions
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// MC Filtering
import { buildMcNumberWhereClause } from '@/lib/filters/mc-number-filter';

// Database
import { prisma } from '@/lib/prisma';

// Validation
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// React Query
import { useQuery, useMutation } from '@tanstack/react-query';

// Forms
import { useForm } from 'react-hook-form';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Notifications
import { toast } from 'sonner';

// Icons
import { Plus, Edit, Trash } from 'lucide-react';
```

---

## 📊 Performance Checklist

- [ ] Queries include MC filter
- [ ] Pagination enabled (20 items default)
- [ ] Using `include` instead of separate queries
- [ ] Database indexes on frequently queried fields
- [ ] Search debounced (300ms)
- [ ] Large lists virtualized
- [ ] Images lazy loaded
- [ ] Components memoized (if expensive)

---

## ✅ Pre-Commit Checklist

- [ ] File under 400 lines (ideally under 300)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] No ESLint errors
- [ ] MC filtering applied
- [ ] Auth & permission checks in place
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Tested with different MC selections
- [ ] Tested with different user roles

---

## 🎯 Remember The Golden Rules

1. **HIGHLANDER:** There can be only ONE! (No duplicates)
2. **MC FILTER:** ALWAYS filter by MC number
3. **AUTH FIRST:** Check auth before anything else
4. **SOFT DELETE:** Never hard delete (use `deletedAt`)
5. **FILE SIZE:** Keep under 400 lines
6. **SEARCH FIRST:** Check if it exists before creating
7. **TYPE SAFE:** No `any` types (use proper TypeScript)
8. **SERVER FIRST:** Use Server Components unless you need "use client"

---

**Print this out and keep it next to your monitor!** 🖨️

**Bookmark in browser:** Keep this tab open while coding 🔖

**Last Updated:** December 4, 2025

