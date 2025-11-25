# TMS (Transportation Management System) - Cursor Rules

## Project Context
- USA trucking company with 150-truck fleet operating under MULTIPLE MC numbers
- Single company, multiple MC numbers (different operating authorities)
- Users can switch between MC numbers they have access to
- Admins can view data across all MC numbers
- Tech Stack: Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma ORM, TailwindCSS, NextAuth v5
- Focus: Replace DataTruck, eliminate integration costs, full customer control
- Operations: Long-haul + local delivery, DOT compliance required

## Multi-MC Architecture

### Core Concept
```
Company (Single Entity)
  ├── MC Number 1 (Operating Authority)
  │     ├── Trucks assigned to MC-1
  │     ├── Drivers assigned to MC-1
  │     └── Loads under MC-1
  ├── MC Number 2 (Operating Authority)
  │     ├── Trucks assigned to MC-2
  │     ├── Drivers assigned to MC-2
  │     └── Loads under MC-2
  └── MC Number 3...

User
  ├── Assigned to Company
  ├── Has Role (ADMIN, DISPATCHER, DRIVER, etc.)
  └── Has MC Access (which MC numbers they can see/manage)
```

### MC View Modes
Users can view data in different modes:
- **Single MC** - View only one specific MC number's data
- **Multiple MC** - View data from selected MC numbers (multi-select)
- **All MCs** - View data across all MC numbers (Admin only)

### Session & State
- Session includes: `companyId`, `role`, `mcAccess[]` (array of accessible MC IDs)
- MC state stored in: Cookie + Session token
- Use `McStateManager` to get/set current MC selection
- MC selection persists across page navigation

### Data Filtering Rules
```typescript
// Rule 1: ADMIN role with "All MCs" view
if (session.user.role === 'ADMIN' && mcView === 'all') {
  where: { companyId: session.user.companyId }
  // No MC filtering - sees everything
}

// Rule 2: Single MC selected
if (mcView === 'single' && selectedMcId) {
  where: { 
    companyId: session.user.companyId,
    mcNumberId: selectedMcId 
  }
}

// Rule 3: Multiple MCs selected
if (mcView === 'multi' && selectedMcIds.length > 0) {
  where: { 
    companyId: session.user.companyId,
    mcNumberId: { in: selectedMcIds }
  }
}

// Rule 4: User with limited MC access
if (mcAccess.length > 0 && role !== 'ADMIN') {
  where: {
    companyId: session.user.companyId,
    mcNumberId: { in: mcAccess }
  }
}
```

## Architecture Principles

### Next.js App Router
- Use Next.js App Router (NOT Pages Router)
- Server Components by default, Client Components only when needed ("use client" directive)
- API routes in `app/api/` directory using `route.ts` files
- Use async/await in Server Components and API routes
- Layout files for shared UI structure

### File Structure
```
app/
  (auth)/          # Auth routes (login, register)
  (customer)/      # Customer portal routes
  (mobile)/        # Mobile driver app routes
  dashboard/       # Main dashboard routes
  api/             # API routes
components/        # React components organized by feature
  ui/              # shadcn/ui components
  layout/          # Layout components (McSwitcher, etc.)
lib/
  managers/        # Business logic managers
  services/        # Service classes (AI, Safety, etc.)
  validations/     # Zod schemas
  filters/         # Data filtering logic (MC filtering, role-based, etc.)
  integrations/    # External API integrations
  utils/           # Utility functions
prisma/            # Database schema and migrations
types/             # TypeScript type definitions
```

## Code Standards

### TypeScript
- TypeScript strict mode enabled
- No `.js` or `.jsx` files - use `.ts` and `.tsx`
- Avoid `any` type - use proper types or `unknown`
- Use Prisma generated types from `@prisma/client`
- Define interfaces/types in `types/` directory or co-located with components

### Components
- Functional components with hooks (NO class components)
- Keep components under 300 lines (split if larger)
- Use PascalCase for component files: `LoadList.tsx`
- Server Components by default, add "use client" only when needed
- Extract reusable logic into custom hooks in `hooks/` directory

### API Routes - Standard Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/filters/mc-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-fields';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session, 'loads:read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deletedAt: null
      },
      include: {
        customer: true,
        driver: true,
        truck: true
      }
    });

    // 5. Filter Sensitive Fields based on role
    const filteredData = filterSensitiveFields(loads, session);

    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      data: filteredData
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An error occurred processing your request' 
        } 
      },
      { status: 500 }
    );
  }
}
```

### Database Operations
- Use Prisma for ALL database operations (never raw SQL)
- Always include `companyId` in queries (company isolation)
- Always apply MC number filtering via `buildMcNumberWhereClause()`
- Use soft deletes (`deletedAt` field) - NEVER hard delete
- Include `createdAt`, `updatedAt` timestamps on all models
- Use transactions for multi-step operations
- Add database indexes for frequently queried fields

### MC Number Filtering Utilities

#### `buildMcNumberWhereClause(session, request)`
Returns Prisma where clause for MC filtering:
```typescript
// Admin viewing "All MCs"
{ companyId: "xxx" }

// User viewing specific MC(s)
{ companyId: "xxx", mcNumberId: "mc-123" }
// OR
{ companyId: "xxx", mcNumberId: { in: ["mc-123", "mc-456"] } }

// User with limited access
{ companyId: "xxx", mcNumberId: { in: user.mcAccess } }
```

#### `buildMultiMcNumberWhereClause(session, mcIds[])`
For explicit multi-MC queries:
```typescript
{ companyId: "xxx", mcNumberId: { in: mcIds } }
```

#### `McStateManager`
Manages MC selection state:
- `getCurrentMcState(session, request)` - Get current MC selection
- `setMcState(mcView, selectedIds)` - Update MC selection (stores in cookie)
- `getMcAccess(session)` - Get user's accessible MC numbers
- `canAccessMc(session, mcId)` - Check if user can access specific MC

### Data Filtering & Security

#### Role-Based Filtering
```typescript
import { getLoadFilter } from '@/lib/filters/load-filter';

const filter = getLoadFilter(session);
// Returns role-specific where clause

const loads = await prisma.load.findMany({
  where: {
    ...mcWhere,
    ...filter,
    deletedAt: null
  }
});
```

#### Sensitive Field Filtering
```typescript
import { filterSensitiveFields } from '@/lib/filters/sensitive-fields';

const data = await prisma.load.findMany({ where });
const filtered = filterSensitiveFields(data, session);
// Removes fields like: driverPay, profit, etc. based on role
```

### Managers & Services
- Business logic goes in `lib/managers/` (e.g., `SettlementManager`, `LoadCompletionManager`)
- Service classes in `lib/services/` (e.g., `AIService`, `SafetyService`)
- Managers handle complex business workflows
- Services handle specific domain logic (AI, Safety, Compliance, etc.)
- Use dependency injection patterns where possible

### Validation
- Use Zod schemas in `lib/validations/` directory
- Validate ALL user inputs with Zod
- Use `@hookform/resolvers` with React Hook Form
- Validate API request bodies before processing
- Return clear validation error messages

### State Management
- React Query (`@tanstack/react-query`) for server state
- Zustand for global client state (if needed)
- React Hook Form for form state
- Use `useQuery`, `useMutation` from React Query
- Implement optimistic updates where appropriate

### Forms
- Use React Hook Form for all forms
- Use Zod resolver: `zodResolver(schema)`
- Use shadcn/ui form components
- Show loading states during submission
- Show success/error toasts after submission

### Error Handling
- Always use try-catch blocks
- Return user-friendly error messages
- Log errors server-side (don't expose details to client)
- Use toast notifications for user feedback (sonner)
- Implement proper error boundaries for React components

## UI/UX Patterns

### Components Library
- Use shadcn/ui components from `components/ui/`
- TailwindCSS for ALL styling (no custom CSS files)
- Mobile-first responsive design
- Dark mode support via `next-themes`

### MC Switcher Component
- Use `<McSwitcher />` component in header/nav
- Shows current MC selection
- Allows switching between accessible MCs
- Shows "All MCs" option for admins
- Persists selection across navigation
- Updates all data views on switch

### Loading States
- Use skeleton loaders for data fetching
- Show loading spinners for mutations
- Disable buttons during submission
- Use React Query's `isLoading`, `isFetching` states

### Notifications
- Use `sonner` toast library for notifications
- Show success messages for user actions
- Show error messages for failures
- Use consistent notification patterns

### Lists & Tables
- Implement pagination (20 items per page default)
- Add search functionality (Ctrl+K shortcut)
- Add advanced filters with saved filter support
- Show quick stats cards (filtered by current MC selection)
- Implement quick view modals
- Add keyboard shortcuts (Ctrl+N for new, Ctrl+R for refresh)
- Export to CSV functionality (respects MC filter)
- Show MC indicator on list items

### Accessibility
- Use proper semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Use proper form labels
- Test with screen readers

## Feature-Specific Patterns

### Loads
- Always assign `mcNumberId` when creating loads
- Use `LoadCompletionManager` for load completion workflow
- Use `LoadCostingManager` for cost calculations
- Use `LoadExpenseManager` for expense tracking
- Support load templates via `load-templates.ts`
- Track load status transitions
- Generate invoices automatically on delivery
- Filter by current MC selection in all views

### Drivers
- Drivers can be assigned to specific MC number(s)
- Track HOS (Hours of Service) compliance per MC
- Support driver advances via `DriverAdvanceManager`
- Generate settlements via `SettlementManager` (per MC)
- Track driver qualifications (DQF, CDL, Medical Cards, MVR)
- Support multiple pay types (PER_MILE, PER_LOAD, PERCENTAGE, HOURLY)

### Trucks
- Trucks assigned to specific MC number
- Track maintenance per truck/MC
- Monitor breakdowns and repairs
- Support fleet reassignment between MCs (with admin approval)

### Safety & Compliance
- Track DOT inspections per MC number
- Monitor CSA scores per MC
- Track incidents and violations per MC
- Support drug/alcohol testing programs per MC
- All compliance tied to MC number

### Accounting
- Settlements generated per MC number
- Invoicing per MC number
- Track revenue/expenses per MC
- Support IFTA reporting per MC
- Reconciliation per MC
- Net profit calculations per MC

### AI Features
- AI services analyze data respecting MC filters
- AI verification queue per MC
- Anomaly detection considers MC-specific patterns
- Recommendations consider MC context

### Integrations
- Samsara ELD integration (per MC if applicable)
- QuickBooks integration (per MC or consolidated)
- Load board APIs (post under correct MC)
- EDI support (per MC number)

## Authentication & Authorization

### NextAuth v5
- Use NextAuth v5 beta with JWT strategy
- Session includes: `companyId`, `role`, `mcAccess[]`
- `mcAccess` array contains MC IDs user can view
- Admins have `mcAccess: []` (empty = access to all)
- Use `auth()` from `@/app/api/auth/[...nextauth]/route`

### Permissions
- Use `hasPermission(session, 'resource:action')` from `@/lib/permissions`
- Check permissions in all API routes
- Use role-based access control (RBAC)
- Support department-level permissions (HR, Safety, Fleet, etc.)
- Check MC access: `canAccessMc(session, mcId)`

### Middleware
- Protect routes via `middleware.ts`
- Check session tokens for protected routes
- Redirect to login if not authenticated
- Handle public routes (/, /login, /register, /tracking)
- MC state persisted in cookies

## Performance

### Optimization
- Use React.memo for expensive components
- Implement pagination (20 items default, max 100)
- Use database indexes for queries (especially `mcNumberId`)
- Lazy load images and heavy components
- Debounce search inputs (300ms)
- Cache frequently accessed data
- Use React Query caching with MC-aware cache keys

### Database
- Add indexes: `[companyId, mcNumberId]` composite index on all MC-filtered tables
- Use Prisma connection pooling
- Avoid N+1 queries (use `include` or `select`)
- Use transactions for related operations

## Testing & Quality

### Code Quality
- Keep functions under 30-40 lines
- Keep components under 300 lines
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Follow single responsibility principle

### Testing MC Filtering
- Test with different MC selections
- Test admin "All MCs" view
- Test user with limited MC access
- Test MC switching functionality
- Verify data isolation between MCs

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `LoadList.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- API routes: `route.ts` in `app/api/[resource]/`
- Types: `PascalCase` interfaces in `types/` or co-located
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_LOAD_WEIGHT`)
- Managers: `PascalCaseManager.ts` (e.g., `SettlementManager.ts`)
- Services: `PascalCaseService.ts` (e.g., `AIService.ts`)
- Filters: `kebab-case.ts` (e.g., `mc-filter.ts`, `load-filter.ts`)

## Common Patterns

### Data Fetching with MC Filter
```typescript
// Server Component
const session = await auth();
const mcWhere = await buildMcNumberWhereClause(session);
const data = await prisma.load.findMany({ 
  where: { ...mcWhere, deletedAt: null } 
});

// Client Component
const { data, isLoading } = useQuery({
  queryKey: ['loads', currentMcSelection], // Include MC in cache key
  queryFn: () => fetch('/api/loads').then(r => r.json())
});
```

### Mutations with MC Assignment
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const session = await auth();
    const currentMc = await getCurrentMcState(session);
    
    return fetch('/api/loads', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        mcNumberId: currentMc.selectedMcId // Assign to current MC
      })
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['loads']);
    toast.success('Load created!');
  }
});
```

## Don't Do This

- ❌ Don't skip MC number filtering in queries
- ❌ Don't allow users to see MCs they don't have access to
- ❌ Don't forget to assign `mcNumberId` when creating records
- ❌ Don't use localStorage for MC state (use cookies + session)
- ❌ Don't fetch data in loops (batch requests)
- ❌ Don't bypass TypeScript with 'any' type
- ❌ Don't commit .env files
- ❌ Don't use inline styles (use Tailwind)
- ❌ Don't create deeply nested components (max 3 levels)
- ❌ Don't ignore error states in UI
- ❌ Don't hard delete records (use soft deletes)
- ❌ Don't skip authentication/authorization checks
- ❌ Don't expose sensitive fields in API responses
- ❌ Don't use raw SQL (use Prisma)
- ❌ Don't forget to add pagination to list endpoints
- ❌ Don't cache data without including MC selection in cache key

## When Creating New Features

1. Check these rules for project standards
2. Review existing similar features for patterns
3. Create/update Prisma schema (include `mcNumberId` if needed)
4. Create Zod validation schema
5. Build API route with: auth, permissions, MC filtering
6. Create UI components (Server Components first)
7. Add MC switcher awareness to UI
8. Add error handling and loading states
9. Test with different MC selections
10. Test with different user roles/access levels
11. Update documentation if needed

## Always Consider

- Company isolation (`companyId`)
- MC number filtering (`mcNumberId`)
- User's MC access permissions
- Admin "All MCs" view special case
- Role-based permissions
- Sensitive field filtering
- Driver experience (mobile-first)
- DOT compliance requirements per MC
- Real-time updates for dispatch
- Data accuracy for billing/settlements per MC
- Integration points with existing systems
- Scalability for 150+ trucks across multiple MCs
- Soft deletes for audit trail
- MC indicator in UI (show which MC a record belongs to)

## Reference Documents

- `PROJECT_RULES.md` - Complete project rules and standards
- `docs/COMPLETION_SUMMARY.md` - Feature completion status
- `prisma/schema.prisma` - Database schema (includes MC relationships)
- `lib/managers/` - Business logic managers
- `lib/services/` - Service classes
- `lib/validations/` - Zod validation schemas
- `lib/filters/` - MC filtering, role filtering, sensitive field filtering

## Key Libraries

- Next.js 16 (App Router)
- NextAuth v5 (authentication)
- Prisma (database ORM)
- React Query (data fetching)
- Zustand (global state)
- React Hook Form (forms)
- Zod (validation)
- TailwindCSS (styling)
- shadcn/ui (components)
- date-fns (date manipulation)
- Lucide React (icons)
- Sonner (toasts)
- Recharts (charts)