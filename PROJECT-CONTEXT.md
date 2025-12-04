# TMS Trucking - Project Context & Memory Bank

> **Living Document** - Updated regularly to reflect current project state  
> **Last Updated:** December 4, 2025  
> **Purpose:** Quick reference for AI assistants and developers to understand current project state

---

## 🎯 Current Goals & Priorities

### Immediate Focus (This Week)
- ✅ **COMPLETED:** Project cleanup and organization (Dec 4, 2025)
- 🔴 **CRITICAL:** Refactor oversized components (>1000 lines)
  - `LoadForm.tsx` (1,777 lines) → Split into wizard steps
  - `UserManagement.tsx` (1,503 lines) → Extract sub-components
  - `ImportDialog.tsx` (1,340 lines) → Split by entity type

### Short-Term Goals (This Month)
- **Code Quality:** Refactor all files exceeding 500 lines
- **Performance:** Optimize load list and driver list queries
- **Testing:** Implement pre-commit hooks for file size validation
- **Documentation:** Keep organization guidelines up to date

### Long-Term Vision
- **Phase 1 (Q1 2026):** Complete multi-MC system refinement
- **Phase 2 (Q2 2026):** Mobile driver app feature parity
- **Phase 3 (Q3 2026):** Advanced AI-powered dispatch optimization
- **Phase 4 (Q4 2026):** Full QuickBooks & factoring integrations

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js:** v16.0.3 (App Router, Server Components)
- **React:** v19.2.0 (with Server Components support)
- **TypeScript:** v5.9.3 (Strict mode enabled)
- **Node.js:** v18+ required

### Database & ORM
- **Database:** PostgreSQL (Neon.tech hosted)
- **ORM:** Prisma v6.19.0
- **Connection:** Pooled connection (PgBouncer)
- **Data Structure:** Multi-tenant (company isolation) + Multi-MC architecture

### Authentication & Authorization
- **Auth Library:** NextAuth v5.0.0-beta.30
- **Strategy:** JWT with session token
- **Password Hashing:** bcryptjs v3.0.3
- **Session Storage:** Server-side with secure cookies

### UI Framework & Styling
- **CSS Framework:** Tailwind CSS v3.4.18
- **Component Library:** shadcn/ui (built on Radix UI)
- **Icons:** Lucide React v0.553.0
- **Animations:** tailwindcss-animate v1.0.7
- **Dark Mode:** Supported via `next-themes` (class-based)

### State Management
- **Server State:** @tanstack/react-query v5.90.8
- **Form State:** react-hook-form v7.66.0
- **Global State:** Context API + Cookies (MC selection)

### Data & Forms
- **Validation:** Zod v4.1.12
- **Form Resolver:** @hookform/resolvers v5.2.2
- **Date Handling:** date-fns v4.1.0
- **Tables:** @tanstack/react-table v8.21.3
- **Charts:** Recharts v3.4.1

### File Handling
- **CSV:** papaparse v5.4.1
- **Excel:** xlsx v0.18.5
- **PDF:** @react-pdf/renderer v4.3.1, pdf-parse v1.1.4

### Notifications & UI Feedback
- **Toasts:** Sonner v2.0.7
- **Command Menu:** cmdk v1.1.1

### Testing
- **Test Framework:** Vitest v1.1.0
- **Testing Library:** @testing-library/react v14.1.2
- **Test DOM:** jsdom v23.0.1

### Development Tools
- **TypeScript Executor:** tsx v4.20.6
- **Code Quality:** ESLint (Next.js config)
- **Git Hooks:** (To be implemented)

---

## 🎨 Design System

### Color Palette
```css
/* Primary Colors (HSL variables) */
--primary: Custom per theme (Shadcn UI system)
--primary-foreground: Contrast color for primary

/* Semantic Colors */
--destructive: Red for errors/danger
--success: Green for success states
--warning: Yellow/Orange for warnings
--info: Blue for informational messages

/* Neutral Colors */
--background: Page background
--foreground: Text color
--muted: Muted text and backgrounds
--border: Border color
```

### Design Tokens
- **Font Family:** System font stack (default)
- **Border Radius:** 
  - `lg`: var(--radius)
  - `md`: calc(var(--radius) - 2px)
  - `sm`: calc(var(--radius) - 4px)
- **Spacing:** Tailwind default scale (4px base)
- **Breakpoints:**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1400px (custom)

### Component Library
- **Source:** shadcn/ui (copy-paste components)
- **Location:** `components/ui/`
- **Primitives:** Radix UI (headless, accessible)
- **Customization:** Via Tailwind classes and CSS variables

### Typography
- **Headings:** Font weight 600-700, tracking tight
- **Body:** Font weight 400, line height relaxed
- **Code:** Monospace font family
- **Links:** Underline on hover, primary color

### Accessibility
- **Focus States:** Visible focus rings (ring utility classes)
- **Color Contrast:** WCAG AA compliance
- **Screen Readers:** ARIA labels on all interactive elements
- **Keyboard Navigation:** Full keyboard support

### Icons
- **Library:** Lucide React
- **Size Standard:** 
  - Small: 16px (h-4 w-4)
  - Medium: 20px (h-5 w-5)
  - Large: 24px (h-6 w-6)
- **Usage:** Inline with text, buttons, navigation

---

## 🏗️ Architecture Overview

### Application Structure
```
TMS-TRUCKING/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   ├── (customer)/              # Customer portal
│   ├── (mobile)/                # Mobile driver app
│   ├── dashboard/               # Main dashboard (176 pages)
│   └── api/                     # API routes (319 files)
│
├── components/                   # React components (by domain)
│   ├── accounting/              # Financial operations
│   ├── drivers/                 # Driver management (24 files)
│   ├── loads/                   # Load operations (38 files)
│   ├── fleet/                   # Trucks & trailers
│   ├── safety/                  # Compliance (32 files)
│   ├── settings/                # Settings pages (37 files)
│   ├── ui/                      # Shadcn UI primitives (32 files)
│   └── [40+ more domains]
│
├── lib/                         # Business logic & utilities
│   ├── managers/                # Workflow managers (18 files)
│   ├── services/                # Service classes (34 files)
│   ├── validations/             # Zod schemas (9 files)
│   ├── filters/                 # Data filtering logic
│   ├── integrations/            # External APIs
│   ├── maps/                    # Google Maps integration
│   └── utils/                   # Utility functions (19 files)
│
├── hooks/                       # Custom React hooks (7 files)
├── types/                       # TypeScript types
├── prisma/                      # Database schema & migrations
├── docs/                        # Documentation (organized)
├── scripts/                     # Database & build scripts (55 files)
└── tests/                       # Test files
```

### Multi-MC (Motor Carrier) Architecture

**Key Concept:** Single company, multiple operating authorities (MC numbers)

```
Company
  ├── MC Number 1
  │   ├── Trucks
  │   ├── Drivers  
  │   └── Loads
  ├── MC Number 2
  │   ├── Trucks
  │   ├── Drivers
  │   └── Loads
  └── MC Number 3...

User Access Levels:
  ├── Admin → Can view "All MCs"
  ├── Manager → Can view assigned MCs
  └── Driver → Can view their MC only
```

### Data Isolation Strategy
1. **Company Level:** All data scoped to `companyId`
2. **MC Level:** Most entities have `mcNumberId`
3. **User Access:** `mcAccess[]` array in session
4. **Filtering:** Automatic via `buildMcNumberWhereClause()`

---

## 📊 Database Architecture

### Core Models (Prisma Schema)
- **Company:** Top-level tenant
- **McNumber:** Operating authorities
- **User:** System users (admins, dispatchers, etc.)
- **Driver:** Drivers (linked to User)
- **Truck:** Fleet vehicles
- **Trailer:** Trailers
- **Load:** Shipments/loads
- **Customer:** Brokers/shippers
- **Settlement:** Driver pay settlements
- **Invoice:** Billing to customers
- **Expense:** Operating expenses
- **Document:** File uploads
- **Compliance:** Safety records

### Key Relationships
```
Company 1-to-Many McNumber
Company 1-to-Many User
McNumber 1-to-Many Driver
McNumber 1-to-Many Truck
McNumber 1-to-Many Load
Load Many-to-One Customer
Load Many-to-One Driver
Load Many-to-One Truck
```

### Indexing Strategy
- Composite index: `[companyId, mcNumberId]` on all MC-filtered tables
- Index on foreign keys for performance
- Index on `deletedAt` for soft delete queries

---

## 🔐 Security & Permissions

### Authentication Flow
1. User logs in → NextAuth validates credentials
2. Session created with: `companyId`, `role`, `mcAccess[]`
3. JWT token stored in secure HTTP-only cookie
4. Session validated on every protected route

### Permission System
- **Format:** `resource:action` (e.g., `loads:read`, `drivers:write`)
- **Check:** `hasPermission(session, 'loads:read')`
- **Levels:**
  - `SUPER_ADMIN` → Full system access
  - `ADMIN` → Company-wide access
  - `DISPATCHER` → MC-level access
  - `DRIVER` → Self-access only
  - `CUSTOMER` → Read-only portal

### Data Security
- **Company Isolation:** Every query filtered by `companyId`
- **MC Filtering:** Applied via `buildMcNumberWhereClause()`
- **Sensitive Fields:** Filtered by role (profit, driver pay, etc.)
- **Soft Deletes:** `deletedAt` field (never hard delete)

---

## 🚀 Deployment & Infrastructure

### Hosting
- **Platform:** (To be specified - likely Vercel or custom VPS)
- **Database:** Neon.tech PostgreSQL
- **CDN:** Next.js automatic optimization
- **Domain:** (To be specified)

### Environment Variables
```bash
# Database
DATABASE_URL=          # Direct connection (migrations)
DATABASE_URL_POOLER=   # Pooled connection (runtime)

# Auth
NEXTAUTH_SECRET=       # Session encryption key
NEXTAUTH_URL=          # Application URL

# Integrations (if configured)
SAMSARA_API_KEY=       # ELD integration
GOOGLE_MAPS_API_KEY=   # Maps integration
QUICKBOOKS_CLIENT_ID=  # Accounting integration
```

### Build Process
1. `npm run db:generate` → Generate Prisma client
2. `npm run build` → Next.js production build
3. `npm run start` → Start production server

---

## 📈 Performance Targets

### Page Load Times
- **Dashboard:** < 2 seconds (first load)
- **List Pages:** < 1 second (with pagination)
- **Detail Pages:** < 500ms

### Database Queries
- **Max Query Time:** 100ms for standard queries
- **Pagination:** 20 items per page (default)
- **Connection Pool:** 10-20 connections

### Bundle Size
- **First Load JS:** < 200KB gzipped
- **Page JS:** < 50KB per route

---

## 🧪 Testing Strategy

### Current Status
- ✅ Basic Vitest setup
- ⚠️ Limited test coverage
- 🔴 Need integration tests

### Test Categories
1. **Unit Tests:** Utility functions, managers, services
2. **Integration Tests:** API routes, database operations
3. **E2E Tests:** (To be implemented)

### Test Commands
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # Vitest UI
```

---

## 📝 Recent Changes & Cleanup

### December 4, 2025 - Project Cleanup
**Completed:**
- ✅ Moved 31 markdown files from root to `docs/`
- ✅ Organized documentation into subdirectories
- ✅ Created `PROJECT_ORGANIZATION_GUIDELINES.md`
- ✅ Audited all files for size violations
- ✅ Identified 9 critical files needing refactoring

**Documentation Structure:**
```
docs/
├── setup/                    # Setup & deployment
├── implementation/           # Feature docs
│   └── mc-numbers/          # MC-specific docs
├── cleanup/                  # Cleanup logs
├── audit-reports/           # Audit reports
└── archive/                 # Historical docs
```

### Known Issues & Technical Debt
1. **Oversized Components:**
   - `LoadForm.tsx` (1,777 lines) - needs wizard split
   - `UserManagement.tsx` (1,503 lines) - needs component extraction
   - `ImportDialog.tsx` (1,340 lines) - needs entity-specific dialogs

2. **Performance:**
   - Load list query slow with >1000 loads
   - Driver list needs pagination optimization

3. **Testing:**
   - Low test coverage (<10%)
   - No E2E tests implemented

4. **Integrations:**
   - Samsara ELD partially implemented
   - QuickBooks integration planned
   - Factoring integration in progress

---

## 🎓 Key Patterns & Conventions

### Naming Conventions
- **Components:** PascalCase (e.g., `DriverList.tsx`)
- **Utilities:** camelCase (e.g., `formatCurrency.ts`)
- **Managers:** PascalCaseManager (e.g., `SettlementManager.ts`)
- **API Routes:** `route.ts` in feature folders
- **Constants:** UPPER_SNAKE_CASE

### File Size Limits
- ⚠️ **Warning:** 300 lines
- 🔴 **Critical:** 400 lines
- ❌ **Unacceptable:** 500+ lines
- **Exception:** Auto-generated files (e.g., `schema-reference.ts`)

### Code Organization
1. **Search Before Creating** - Check for similar functionality
2. **Merge, Don't Duplicate** - Extend existing components with props
3. **Extract Early** - Split files before they hit 300 lines
4. **Manager Pattern** - Complex workflows go in `lib/managers/`
5. **Service Pattern** - External integrations go in `lib/services/`

---

## 🔗 Important Links & Resources

### Internal Documentation
- `PROJECT_RULES.md` - Complete coding standards
- `docs/PROJECT_ORGANIZATION_GUIDELINES.md` - Organization rules
- `docs/cleanup/PROJECT_CLEANUP_SUMMARY_2025-12-04.md` - Latest cleanup report
- `docs/NEXT_STEPS.md` - Upcoming features
- `docs/REMAINING_ITEMS.md` - Backlog items

### External Resources
- **Next.js 16 Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Radix UI:** https://www.radix-ui.com
- **React Query:** https://tanstack.com/query

---

## 💡 Development Tips

### For AI Assistants (Like Me!)
- Always check `PROJECT_RULES.md` for coding standards
- Respect file size limits strictly
- Apply MC filtering in ALL queries
- Use existing managers/services before creating new ones
- Follow the "HIGHLANDER" rule - no duplicates!

### For Human Developers
- Read `PROJECT_RULES.md` first
- Use the MC Switcher to test different views
- Always test with different user roles
- Check oversized files before committing
- Update this document when making major changes

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # TypeScript check

# Database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Audit
npm run audit:schema     # Extract schema reference
npm run audit:full       # Full audit report
```

---

## 📞 Maintenance

**Document Owner:** System Architect  
**Review Cycle:** Update on major changes  
**Related Files:**
- `PROJECT_RULES.md` - Coding standards
- `docs/PROJECT_ORGANIZATION_GUIDELINES.md` - Organization guide
- `prisma/schema.prisma` - Database schema

---

**Status:** ✅ **ACTIVE - KEEP UPDATED**

> This document should be updated whenever:
> - Tech stack versions change
> - New major features are added
> - Architecture patterns change
> - Current goals/priorities shift
> - Major cleanup/refactoring occurs

