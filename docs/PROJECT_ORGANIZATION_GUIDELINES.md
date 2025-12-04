# TMS Trucking - Project Organization Guidelines

**Last Updated:** December 4, 2025

## 📋 Table of Contents
1. [Directory Structure](#directory-structure)
2. [File Organization Rules](#file-organization-rules)
3. [Component Architecture](#component-architecture)
4. [Code Size Limits](#code-size-limits)
5. [Naming Conventions](#naming-conventions)
6. [Documentation Standards](#documentation-standards)

---

## 🗂️ Directory Structure

### Root Level
```
TMS-TRUCKING/
├── app/                    # Next.js App Router (routes & API)
├── components/             # React components (organized by domain)
├── lib/                    # Business logic, utilities, services
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets
├── docs/                   # All documentation
├── scripts/                # Build & utility scripts
├── tests/                  # Test files
└── PROJECT_RULES.md        # The only MD file allowed at root
```

### Component Organization
Components MUST be organized by **business domain**:

```
components/
├── accounting/            # Financial operations
├── drivers/               # Driver management
├── loads/                 # Load/shipment operations
├── fleet/                 # Truck/trailer management
├── safety/                # Compliance & safety
├── settings/              # Application settings
├── ui/                    # Reusable UI primitives (shadcn)
├── data-table/            # Generic table components
├── layout/                # Layout components
└── providers/             # Context providers
```

### Lib Organization
Business logic MUST be separated by concern:

```
lib/
├── managers/              # Business logic managers (e.g., SettlementManager)
├── services/              # External services & AI services
├── utils/                 # Pure utility functions
├── validations/           # Zod schemas & validators
├── config/                # Configuration files
├── integrations/          # Third-party API integrations
├── maps/                  # Map & geolocation services
├── automation/            # Automated job logic
└── prisma.ts              # Prisma client singleton
```

### Documentation Organization
```
docs/
├── setup/                 # Setup & deployment guides
├── implementation/        # Feature implementation docs
│   └── mc-numbers/        # MC number specific docs
├── cleanup/               # Cleanup & refactoring logs
├── audit-reports/         # Audit reports
└── archive/               # Archived/historical docs
```

---

## 📏 File Organization Rules

### The "HIGHLANDER" Rule (Zero Duplication)
**There can be only ONE!**

1. **Search First:** Before creating ANY file, search `components/` and `lib/` to check if similar functionality exists
2. **Merge, Don't Copy:** If similar functionality exists, extend it with props (e.g., `mode="view" | "edit"`)
3. **No Shadow Pages:** Never create duplicate pages/components in different locations
4. **No Temporary Files:** Don't commit files with `temp`, `old`, `backup`, `copy`, or `test` in the name

### File Placement Decision Tree

```
Is it a React component?
├── YES → Does it render UI?
│   ├── YES → Is it reusable across domains?
│   │   ├── YES → components/ui/
│   │   └── NO → components/{domain}/
│   └── NO → Is it a custom hook?
│       └── YES → hooks/
└── NO → Is it business logic?
    ├── YES → Does it manage state/workflows?
    │   ├── YES → lib/managers/
    │   └── NO → lib/services/
    └── NO → lib/utils/
```

---

## 🏗️ Component Architecture

### Component Types

#### 1. **Domain Components** (`components/{domain}/`)
- Feature-specific UI components
- Can use hooks, managers, and services
- Example: `DriverList.tsx`, `LoadDetail.tsx`

#### 2. **UI Primitives** (`components/ui/`)
- Reusable, domain-agnostic components
- Typically from shadcn/ui
- Example: `Button.tsx`, `Card.tsx`, `Dialog.tsx`

#### 3. **Data Table Components** (`components/data-table/`)
- Generic table functionality
- Reusable across all entities
- Example: `DataTable.tsx`, `TableToolbar.tsx`

#### 4. **Layout Components** (`components/layout/`)
- Application shell components
- Example: `DashboardLayout.tsx`, `Navbar.tsx`

### Manager Pattern (lib/managers/)
Managers handle complex business workflows:

```typescript
// lib/managers/SettlementManager.ts
export class SettlementManager {
  // Encapsulates all settlement calculation logic
  static async calculateSettlement(driverId: string, period: DateRange) {
    // Complex business logic here
  }
}
```

**When to create a Manager:**
- Logic spans multiple database tables
- Calculations involve multiple steps
- Workflow has strict business rules
- Logic is reused in multiple places

### Service Pattern (lib/services/)
Services handle external integrations or isolated functionality:

```typescript
// lib/services/AIRouteOptimizer.ts
export class AIRouteOptimizer {
  // AI-powered route optimization
  static async optimizeRoute(stops: Stop[]): Promise<OptimizedRoute> {
    // AI service logic
  }
}
```

**When to create a Service:**
- External API integration
- AI/ML functionality
- Isolated, single-purpose logic
- Stateless operations

---

## 📐 Code Size Limits

### Strict Limits (MUST FOLLOW)

| Limit Type | Maximum | Action Required |
|------------|---------|-----------------|
| **File Length** | **400 lines** | Refactor if approaching |
| **Absolute Max** | **500 lines** | MUST refactor immediately |
| **NEVER EXCEED** | **1000 lines** | Completely unacceptable |
| **Function Length** | **30-40 lines** | Extract to helper functions |
| **Class Length** | **200 lines** | Split into multiple classes |

### Refactoring Strategy

#### When a component exceeds 300 lines:

1. **Extract Hooks:**
```typescript
// Before: All logic in component
function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  // 300+ lines...
}

// After: Extract to custom hook
function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  // Data fetching logic
  return { drivers, loading };
}

function DriverList() {
  const { drivers, loading } = useDrivers();
  // Only UI logic here
}
```

2. **Extract Sub-Components:**
```typescript
// Before: Monolithic component
function LoadDetail() {
  return (
    <div>
      {/* 400 lines of JSX */}
    </div>
  );
}

// After: Split into smaller components
function LoadDetail() {
  return (
    <div>
      <LoadHeader />
      <LoadStopsTable />
      <LoadFinancials />
      <LoadDocuments />
    </div>
  );
}
```

3. **Extract Business Logic to Managers:**
```typescript
// Before: Logic in component
function Settlement() {
  const calculatePay = () => {
    // 100 lines of calculation logic
  };
}

// After: Move to manager
import { SettlementManager } from '@/lib/managers/SettlementManager';

function Settlement() {
  const pay = SettlementManager.calculatePay(driver, loads);
}
```

### Current Oversized Files (NEEDS REFACTORING)

| File | Lines | Priority | Action Plan |
|------|-------|----------|-------------|
| `components/forms/LoadForm.tsx` | 1,777 | 🔴 CRITICAL | Split into wizard steps |
| `components/settings/UserManagement.tsx` | 1,503 | 🔴 CRITICAL | Extract sub-components |
| `components/import-export/ImportDialog.tsx` | 1,340 | 🔴 CRITICAL | Split by entity type |
| `components/safety/compliance/DriverComplianceEditor.tsx` | 1,263 | 🔴 CRITICAL | Extract form sections |
| `components/settlements/SettlementDetail.tsx` | 1,126 | 🔴 CRITICAL | Extract tabs as components |
| `lib/maps/live-map-service.ts` | 1,059 | 🔴 CRITICAL | Split by functionality |
| `lib/integrations/samsara.ts` | 1,046 | 🔴 CRITICAL | Split by endpoint groups |
| `components/map/LiveMap.tsx` | 1,038 | 🔴 CRITICAL | Extract map controls |

> **Note:** `lib/schema-reference.ts` (22,994 lines) is **auto-generated** and exempt from limits.

---

## 🏷️ Naming Conventions

### Files
- **Components:** PascalCase (e.g., `DriverList.tsx`)
- **Utilities:** camelCase (e.g., `calculateDriverPay.ts`)
- **Managers:** PascalCase (e.g., `SettlementManager.ts`)
- **Services:** PascalCase (e.g., `AIRouteOptimizer.ts`)
- **Hooks:** camelCase starting with `use` (e.g., `useDrivers.ts`)

### Exports
- **One primary export per file:** Use default export for main component/class
- **Named exports for utilities:** Multiple related utility functions can share a file

### Component File Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DriverManager } from '@/lib/managers/DriverManager';

// 2. Types/Interfaces
interface DriverListProps {
  departmentId?: string;
}

// 3. Component
export function DriverList({ departmentId }: DriverListProps) {
  // Component logic
}

// 4. Helper functions (if small, otherwise extract)
function formatDriverName(driver: Driver) {
  return `${driver.user.firstName} ${driver.user.lastName}`;
}
```

---

## 📚 Documentation Standards

### When to Create Documentation

| Documentation Type | Location | When to Create |
|-------------------|----------|----------------|
| **Project Rules** | `PROJECT_RULES.md` (root) | Once, updated as needed |
| **Setup Guides** | `docs/setup/` | Deployment, environment setup |
| **Implementation Docs** | `docs/implementation/` | Major feature implementation |
| **Cleanup Logs** | `docs/cleanup/` | After major refactoring |
| **Audit Reports** | `docs/audit-reports/` | Code audits, compliance checks |
| **Historical Docs** | `docs/archive/` | Outdated but preserved docs |

### Documentation That Belongs in Code
**Don't create docs for these - use code comments instead:**
- API endpoint documentation → Use JSDoc in route handlers
- Function documentation → Use JSDoc comments
- Type definitions → Use TypeScript interfaces with comments
- Component props → Use TypeScript interfaces with JSDoc

### Doc File Naming
- Use descriptive names: `DRIVER_COMPLIANCE_IMPLEMENTATION.md`
- Use CAPS_SNAKE_CASE for important docs
- Use lowercase-kebab-case for guides: `setup-local-environment.md`
- Never use dates in filenames (use git history instead)

---

## 🚀 Quick Reference Checklist

Before committing code, ask yourself:

- [ ] Is this file under 400 lines?
- [ ] Did I search for similar functionality before creating this?
- [ ] Is this file in the correct directory for its purpose?
- [ ] Are business logic and UI concerns properly separated?
- [ ] Did I use existing managers/services instead of duplicating logic?
- [ ] Are my function names descriptive and intention-revealing?
- [ ] Is documentation in the right place (code vs. docs/)?
- [ ] Did I follow the carrier-specific business rules?

---

## 🔄 Maintenance

This document should be updated when:
- New architectural patterns are introduced
- Directory structure changes
- File size limits are adjusted
- New refactoring strategies are adopted

**Reviewed By:** System Architect  
**Next Review:** Quarterly or when major changes occur

