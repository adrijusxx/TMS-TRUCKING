# TMS-TRUCKING — Project Guide

## Overview

Transportation Management System for USA domestic trucking operations. Built on a **Straight Line Workflow** principle: Order → Dispatch → Delivery → Invoice → Settlement. The **Load** is the single source of truth for all financial and operational data.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TailwindCSS 3.4, Radix UI, TanStack Table |
| Language | TypeScript 5.9 (strict mode) |
| ORM | Prisma 6.19 with @prisma/adapter-pg |
| Database | PostgreSQL (Neon) |
| Auth | NextAuth v5 (credentials, JWT sessions, bcryptjs) |
| Validation | Zod 4.1 + React Hook Form 7.66 |
| Data Fetching | TanStack React Query 5.90 |
| AI | OpenAI SDK (GPT), DeepSeek (import formatting) |
| Testing | Vitest 4.0 + React Testing Library |
| Events | Inngest (event orchestration, cron jobs) |
| Deployment | AWS EC2 (standalone output), PM2, Neon PostgreSQL |

## Quick Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build (runs prisma generate first)
npm run type-check       # TypeScript compilation check
npm run lint             # ESLint
npm run test             # Run Vitest
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Coverage report
npm run db:migrate       # Prisma migrate dev
npm run db:migrate:deploy # Deploy migrations to production
npm run db:seed          # Seed database
npm run db:reset         # Reset database (destructive)
npm run db:studio        # Open Prisma Studio
```

## Project Structure

```
app/                     # Next.js App Router (30+ feature areas)
├── (auth)/              # Login, register
├── (customer)/          # Customer tracking portal
├── (mobile)/            # Driver mobile app
├── (dashboard)/         # Main app (loads, dispatch, fleet, accounting, etc.)
└── api/                 # 80+ API route groups
components/              # React components (domain-based, 40+ directories)
├── ui/                  # Radix-based primitives (shadcn style)
├── loads/, drivers/, trucks/, trailers/, customers/
├── settlements/, invoices/, accountings/
├── dispatch/, analytics/, safety/, fleet/
├── import-export/, data-table/, forms/, filters/
└── layout/, common/, theme/
lib/                     # Business logic
├── managers/            # Complex business workflows (50+)
│   ├── import/          # Entity importers (BaseImporter pattern)
│   ├── settlement/      # Settlement orchestrator, calculation, workflow
│   └── costing/         # Load cost calculator, profitability analyzer
├── services/            # External integrations & AI (25+ AI services)
├── validations/         # Zod schemas (per entity)
├── config/              # Column presets, status themes, navigation
├── utils/               # Pure helpers (calculateDriverPay, aging, distance, etc.)
├── filters/             # Soft delete, role-based, sensitive field filters
├── hooks/               # Custom React hooks
├── contexts/            # React contexts (McFilterContext)
├── auth.ts              # NextAuth configuration
├── permissions.ts       # ~200 permission definitions
├── prisma.ts            # Prisma client singleton
└── schema-reference.ts  # Database schema documentation
prisma/
├── schema.prisma        # 7,192 lines, 140+ models, 100+ enums
└── migrations/          # Database migrations
docs/                    # 150+ markdown documentation files
scripts/                 # DB audit, cleanup, and utility scripts
tests/                   # Vitest test files
```

## Architecture Principles

1. **Straight Line Workflow** — Unidirectional data flow. No backward edits without audit trails.
2. **Load-Centric** — All financial values (revenue, driverPay, expenses, profit) trace back to the Load entity.
3. **Manager Pattern** — Complex business logic in `lib/managers/`. Managers span multiple tables and enforce business rules.
4. **Service Pattern** — External integrations and AI in `lib/services/`. Stateless, single-purpose.
5. **Safety & Fleet Gates** — Pre-dispatch validation prevents non-compliant assignments.
6. **Multi-Tenancy** — MC number scoping throughout. Company-level settings. `McFilterContext` in UI.
7. **Soft Deletes** — `deletedAt` field on entities. Admin restore available.

## Code Conventions

### File Size Limits (STRICT)
- **Soft limit:** 400 lines
- **Hard limit:** 500 lines — MUST refactor
- **Never exceed:** 1,000 lines
- **Functions:** 30-40 lines max
- **Classes:** 200 lines max

### Naming
- **Components:** PascalCase (`DriverList.tsx`)
- **Utilities:** camelCase (`calculateDriverPay.ts`)
- **Managers/Services:** PascalCase (`SettlementManager.ts`)
- **Hooks:** camelCase with `use` prefix (`useDrivers.ts`)

### The "Highlander" Rule
**There can be only ONE.** Search before creating new files. Merge instead of copy. No shadow pages, no temporary files, no duplicate logic.

### Manager vs Service
- **Manager** → complex multi-table workflows, business rules, reused across app
- **Service** → external APIs, AI/ML, isolated single-purpose, stateless

### Import Pattern
All importers extend `BaseImporter` in `lib/managers/import/`. Best-effort parsing with warnings (not hard failures). Entity configs defined in `lib/import-export/entity-config.ts`.

## Key Entities & Financial Model

### Load Lifecycle
```
PENDING → DISPATCHED → IN_TRANSIT → DELIVERED → BILLED → READY_TO_SETTLE → SETTLED
                                                         (also: CANCELLED, DRAFT)
```

### Financial Fields (on Load)
```
revenue         = customer payment (line haul + fuel surcharge + accessorials)
driverPay       = calculated per pay profile (PER_MILE | PER_LOAD | PERCENTAGE | HOURLY)
totalExpenses   = aggregated from LoadExpense relation (FUEL, TOLL, DETENTION, etc.)
netProfit       = revenue - driverPay - totalExpenses
revenuePerMile  = revenue / totalMiles
```

**Financial Lock:** After READY_TO_BILL, `driverPay` and `revenue` are locked (admin override required).

### Settlement Calculation
1. Group DELIVERED loads by driverId
2. Calculate gross pay per driver pay type
3. Add: stop pay, reimbursements, recurring additions
4. Deduct: advances, recurring deductions, non-reimbursable expenses, escrow
5. Net Pay = grossPay + additions - deductions - advances

### Invoice Generation
Triggered at READY_TO_BILL when `isBillingHold = false`. Line items derived from Load revenue and AccessorialCharge records.

## Auth & Permissions

**Roles:** SUPER_ADMIN, ADMIN, DISPATCHER, DRIVER, CUSTOMER, ACCOUNTANT, HR, SAFETY, FLEET

**Permission system** (`lib/permissions.ts`): ~200 granular permissions organized by domain (loads.view, loads.create, drivers.manage_compliance, settlements.approve, etc.). Checked via `hasPermission()` utility.

## Required Environment Variables

```
DATABASE_URL              # PostgreSQL connection (Neon pooler)
NEXTAUTH_SECRET           # JWT signing secret
NEXTAUTH_URL              # App URL
OPENAI_API_KEY            # AI features
GOOGLE_MAPS_API_KEY       # Maps & geocoding
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
DEEPSEEK_API_KEY          # AI import formatting (optional)
SAMSARA_API_KEY           # Vehicle telematics (optional)
QUICKBOOKS_CLIENT_ID      # Accounting sync (optional)
QUICKBOOKS_CLIENT_SECRET
```

## External Integrations

- **Samsara** — Vehicle GPS, telematics, mileage (`lib/integrations/samsara.ts`)
- **Telegram** — Driver notifications, bot commands (`lib/services/Telegram*.ts`)
- **Stripe** — Subscription billing (`/api/stripe/`)
- **Google Maps** — Geocoding, route visualization, live map
- **QuickBooks** — Accounting sync (`lib/managers/AccountingSyncManager.ts`)
- **AWS** — Secrets Manager, SES email, EC2 hosting
- **Inngest** — Event orchestration, cron scheduling

## Known Oversized Files (> 1,000 lines — need refactoring)

| File | Lines | Suggested Action |
|------|-------|-----------------|
| `components/forms/LoadForm.tsx` | 1,777 | Split into wizard steps |
| `components/settings/UserManagement.tsx` | 1,503 | Extract sub-components |
| `components/import-export/ImportDialog.tsx` | 1,340 | Split by entity type |
| `components/safety/DriverComplianceEditor.tsx` | 1,263 | Extract form sections |
| `components/settlements/SettlementDetail.tsx` | 1,126 | Extract tab panels |
| `lib/maps/live-map-service.ts` | 1,059 | Split by functionality |
| `lib/integrations/samsara.ts` | 1,046 | Split by endpoint group |
| `components/map/LiveMap.tsx` | 1,038 | Extract map controls |

## Documentation

Extensive docs in `docs/` (150+ files). Key references:
- `docs/PRD.md` — Full product requirements
- `docs/PROJECT_ORGANIZATION_GUIDELINES.md` — Code conventions
- `docs/ACCOUNTING_DEPARTMENT_REQUIREMENTS.md` — Financial logic specs
- `docs/LOAD_STATUS_STATE_MACHINE_AUDIT.md` — Status transitions
- `docs/DRIVER_PAY_LOGIC_IMPLEMENTATION.md` — Pay calculation
