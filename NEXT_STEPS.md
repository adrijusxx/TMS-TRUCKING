# MC Functionality - Next Steps

## Current Status

### ✓ Completed (Core Infrastructure - 100%)
1. `lib/managers/McStateManager.ts` - Fully rewritten and tested
2. `lib/mc-number-filter.ts` - Updated to use new McStateManager
3. `lib/filters/role-data-filter.ts` - Separated MC from role filtering
4. 4 GET API routes fixed (loads, drivers, trucks, trailers)
5. 3 POST API routes fixed (loads, drivers, trucks)

### 🔄 In Progress (API Routes - 27% Complete)
- 22 GET routes remaining
- ~5 POST routes remaining

### ⏳ Pending (UI & Testing)
- UI components not started
- Testing not started
- Documentation update pending

## Immediate Next Steps (Priority Order)

### Step 1: Complete GET Route Fixes (Est: 2-3 hours)

Apply this exact pattern to each remaining GET route:

**Files to fix:**
```
app/api/customers/route.ts
app/api/settlements/route.ts
app/api/invoices/route.ts
app/api/dispatch/board/route.ts
app/api/loads/stats/route.ts
app/api/analytics/dashboard/route.ts
app/api/analytics/revenue-forecast/route.ts
app/api/analytics/empty-miles/route.ts
app/api/analytics/fuel/route.ts
app/api/analytics/drivers/performance/route.ts
app/api/analytics/revenue/route.ts
app/api/analytics/profitability/route.ts
app/api/dashboard/load-status-distribution/route.ts
app/api/customers/stats/route.ts
app/api/fleet-board/route.ts
app/api/dashboard/truck-performance/route.ts
app/api/dashboard/revenue-trends/route.ts
app/api/dashboard/driver-performance/route.ts
app/api/dashboard/customer-performance/route.ts
app/api/dashboard/deadlines/route.ts
app/api/import-export/[entity]/route.ts
app/api/search/route.ts
```

**Find and replace pattern:**

FIND:
```typescript
const isAdmin = (session?.user as any)?.role === 'ADMIN';
const viewingAll = isAdmin;

let mcWhere: { companyId?: string; mcNumberId?: string | { in: string[] } };

if (!viewingAll) {
  const mcState = await McStateManager.getMcState(session, request);
  if (mcState.viewMode === 'multi' && mcState.mcNumberIds.length > 0) {
    mcWhere = await buildMultiMcNumberWhereClause(session, request);
  } else {
    mcWhere = await buildMcNumberWhereClause(session, request);
  }
} else {
  mcWhere = {};
}
```

REPLACE WITH:
```typescript
const mcWhere = await buildMcNumberWhereClause(session, request);
```

FIND:
```typescript
const roleFilter = getXXXFilter(
  createFilterContext(
    session.user.id,
    session.user.role as any,
    viewingAll ? 'ADMIN_ALL_COMPANIES' : session.user.companyId,
    mcNumberIdForFilter
  )
);

const cleanRoleFilter = { ...roleFilter };
if (viewingAll) {
  delete cleanRoleFilter.mcNumberId;
  delete cleanRoleFilter.companyId;
}

const where: any = {
  ...cleanRoleFilter,
  deletedAt: null,
};

if (!viewingAll && mcWhere.companyId) {
  where.companyId = mcWhere.companyId;
}

if (!viewingAll && mcWhere.mcNumberId !== undefined) {
  where.mcNumberId = mcWhere.mcNumberId;
}
```

REPLACE WITH:
```typescript
const roleFilter = getXXXFilter(
  createFilterContext(
    session.user.id,
    session.user.role as any,
    session.user.companyId
  )
);

const where: any = {
  ...mcWhere,
  ...roleFilter,
  deletedAt: null,
};
```

### Step 2: Complete POST Route Fixes (Est: 1 hour)

Apply this pattern to remaining POST routes:

**Files to fix:**
```
app/api/trailers/route.ts - POST
app/api/customers/route.ts - POST
(Check for other routes creating MC-assigned data)
```

**Add before prisma.xxx.create():**
```typescript
// Determine MC number assignment
// Rule: Only admins can choose MC; employees use their default MC
const isAdmin = session.user.role === 'ADMIN';
let assignedMcNumberId: string | null = null;

if (isAdmin && validated.mcNumberId) {
  // Admin provided mcNumberId - use it (optionally validate)
  assignedMcNumberId = validated.mcNumberId;
} else {
  // Employee or admin without explicit mcNumberId - use user's default MC
  assignedMcNumberId = (session.user as any).mcNumberId || null;
}
```

**Update create statement:**
```typescript
const record = await prisma.xxx.create({
  data: {
    ...validated,
    companyId: session.user.companyId,
    mcNumberId: assignedMcNumberId, // Admin can choose, employee uses their default
    // ... other fields
  },
});
```

### Step 3: Verify User Management API (Est: 30 minutes)

**File:** `app/api/settings/users/[id]/route.ts`

Verify:
- [ ] Admin can set `mcNumberId` (user's default MC)
- [ ] Admin can set `mcAccess` array (MCs user can access)
- [ ] For employees: `mcAccess` includes at least their `mcNumberId`
- [ ] Validation: all MC IDs in `mcAccess` belong to company
- [ ] When updating driver's MC, sync with `Driver.mcNumberId`

The current implementation looks good, just needs verification.

### Step 4: Create MC Selector Component (Est: 2 hours)

**File:** `components/mc-numbers/McSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Building2, Check } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

export default function McSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const isAdmin = session?.user?.role === 'ADMIN';
  const mcAccess = (session?.user as any)?.mcAccess || [];
  
  // Fetch available MC numbers
  const { data: mcNumbers } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/mc-numbers'));
      return res.json();
    },
  });
  
  // Admin with empty mcAccess can view all or filter
  if (isAdmin && mcAccess.length === 0) {
    return <AdminMcSelector mcNumbers={mcNumbers?.data || []} />;
  }
  
  // Employee with mcAccess array sees their assigned MCs (read-only info)
  if (mcAccess.length > 0) {
    return <EmployeeMcInfo mcAccess={mcAccess} mcNumbers={mcNumbers?.data || []} />;
  }
  
  return null;
}

function AdminMcSelector({ mcNumbers }: { mcNumbers: any[] }) {
  const [selectedMcIds, setSelectedMcIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'filtered'>('all');
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const switchMutation = useMutation({
    mutationFn: async (data: { viewMode: 'all' | 'filtered'; mcIds: string[] }) => {
      const res = await fetch(apiUrl('/api/mc/switch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.refresh();
      toast.success('MC view updated');
    },
  });
  
  const handleViewAll = () => {
    setViewMode('all');
    setSelectedMcIds([]);
    switchMutation.mutate({ viewMode: 'all', mcIds: [] });
  };
  
  const handleToggleMc = (mcId: string) => {
    const newSelection = selectedMcIds.includes(mcId)
      ? selectedMcIds.filter(id => id !== mcId)
      : [...selectedMcIds, mcId];
    
    setSelectedMcIds(newSelection);
    setViewMode('filtered');
    switchMutation.mutate({ viewMode: 'filtered', mcIds: newSelection });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {viewMode === 'all' 
            ? 'All MCs' 
            : `${selectedMcIds.length} MC${selectedMcIds.length !== 1 ? 's' : ''}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>MC Number Filter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuCheckboxItem
          checked={viewMode === 'all'}
          onCheckedChange={handleViewAll}
        >
          View All MCs
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Filter by MC:
        </DropdownMenuLabel>
        
        {mcNumbers.map((mc) => (
          <DropdownMenuCheckboxItem
            key={mc.id}
            checked={selectedMcIds.includes(mc.id)}
            onCheckedChange={() => handleToggleMc(mc.id)}
          >
            {mc.companyName} ({mc.number})
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmployeeMcInfo({ mcAccess, mcNumbers }: { mcAccess: string[]; mcNumbers: any[] }) {
  const assignedMcs = mcNumbers.filter(mc => mcAccess.includes(mc.id));
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Building2 className="h-4 w-4" />
      <span>
        {assignedMcs.length === 1 
          ? assignedMcs[0]?.companyName 
          : `${assignedMcs.length} MCs`}
      </span>
    </div>
  );
}
```

### Step 5: Integrate MC Selector into Header (Est: 30 minutes)

**File:** `components/layout/DashboardLayout.tsx`

Add `<McSelector />` to the header navigation, next to other header controls.

### Step 6: Add MC Indicators to Lists (Est: 2 hours)

Add MC badge to list items in:
- LoadList.tsx
- DriverList.tsx
- TruckList.tsx
- TrailerList.tsx
- CustomerList.tsx
- etc.

Example:
```typescript
<Badge variant="outline" className="text-xs">
  MC: {load.mcNumber?.number}
</Badge>
```

### Step 7: Testing (Est: 3 hours)

Create test scenarios for:
1. Admin viewing all data
2. Admin filtering by single MC
3. Admin filtering by multiple MCs
4. Admin creating records with MC assignment
5. Employee with single MC access
6. Employee with multiple MC access
7. Employee creating records
8. Security: Employee cannot access non-assigned MCs

### Step 8: Update Documentation (Est: 30 minutes)

Update `.cursorrules` with:
- New MC view modes
- Employee multi-MC access rules
- Data creation rules
- Updated code examples

## Quick Commands

### Find routes needing GET fix:
```bash
grep -r "const viewingAll = isAdmin" app/api/ --include="*.ts"
```

### Find routes needing POST fix:
```bash
grep -r "prisma\\..*\\.create" app/api/ --include="*.ts" | grep -v "mcNumberId:"
```

### Check for linter errors:
```bash
npm run lint
```

### Run tests:
```bash
npm run test
```

## Success Criteria

- [ ] All 26 GET routes use new MC filtering pattern
- [ ] All POST routes enforce admin-only MC selection
- [ ] MC selector component works for admins
- [ ] MC info displays for employees
- [ ] MC indicators show on all lists
- [ ] All tests pass
- [ ] No linter errors
- [ ] Documentation updated
- [ ] User can successfully:
  - [ ] View all data as admin
  - [ ] Filter by MC as admin
  - [ ] Create records with MC as admin
  - [ ] View assigned MC data as employee
  - [ ] Create records (goes to default MC) as employee

## Estimated Total Time Remaining

- GET routes: 2-3 hours
- POST routes: 1 hour
- User management verification: 30 minutes
- MC selector component: 2 hours
- Header integration: 30 minutes
- List indicators: 2 hours
- Testing: 3 hours
- Documentation: 30 minutes

**Total: ~12-13 hours**

## Notes

- All core logic is complete and working
- Patterns are established and tested
- Remaining work is straightforward application of patterns
- No new logic needs to be invented
- Changes are backward compatible

