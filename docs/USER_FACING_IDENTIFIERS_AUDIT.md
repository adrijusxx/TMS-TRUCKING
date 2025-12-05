# User-Facing Identifiers Audit Report

## Executive Summary

This document outlines the complete audit of all database entities to ensure:
1. **Database UUIDs (`id`) are NEVER shown to users**
2. **All entities have user-facing identifiers with prefixes**

## Critical Principle

```
┌─────────────────────────────────────────────┐
│  Database ID vs User-Facing Number          │
├─────────────────────────────────────────────┤
│  id              → Database UUID (HIDDEN)   │
│  xxxNumber       → User Display (VISIBLE)   │
│                                             │
│  Example:                                   │
│  driver.id       = "clxyz123abc..."         │
│  driver.driverNumber = "D001"               │
└─────────────────────────────────────────────┘
```

---

## ✅ ENTITIES WITH PROPER USER-FACING IDENTIFIERS

| Entity | Field Name | Prefix | Example | Status |
|--------|------------|--------|---------|--------|
| **Driver** | `driverNumber` | D | `D001`, `D102` | ✅ Complete |
| **Truck** | `truckNumber` | T | `T001`, `T245` | ✅ Complete |
| **Trailer** | `trailerNumber` | TR | `TR001`, `TR050` | ✅ Complete |
| **Load** | `loadNumber` | L | `L2024-001`, `L2024-1543` | ✅ Complete |
| **Settlement** | `settlementNumber` | S | `S2024-W49-001` | ✅ Complete |
| **Invoice** | `invoiceNumber` | INV | `INV-2024-001` | ✅ Complete |
| **Payment** | `paymentNumber` | PAY | `PAY-2024-001` | ✅ Complete |
| **Customer** | `customerNumber` | C | `C001`, `CUST-TQL-001` | ✅ Complete |
| **Vendor** | `vendorNumber` | V | `V001`, `VEND-001` | ✅ Complete |
| **Inspection** | `inspectionNumber` | INSP | `INSP-2024-001` | ✅ Complete |
| **InventoryItem** | `itemNumber` | ITEM | `ITEM-001`, `PART-123` | ✅ Complete |
| **Breakdown** | `breakdownNumber` | BRK | `BRK-2024-001` | ✅ Complete |
| **SafetyIncident** | `incidentNumber` | INC | `INC-2024-001` | ✅ Complete |
| **Location** | `locationNumber` | LOC | `LOC-001` | ✅ Complete |

---

## ❌ ENTITIES MISSING USER-FACING IDENTIFIERS

### **High Priority (Customer/User Facing)**

| Entity | Current | **Needs** | Proposed Prefix | Example |
|--------|---------|-----------|-----------------|---------|
| **User** | Only has `id` | `employeeNumber` | EMP | `EMP-001` |
| **MaintenanceRecord** | Only has `id` | `maintenanceNumber` | MAINT | `MAINT-2024-001` |
| **FuelEntry** | Has `receiptNumber` (optional) | `fuelEntryNumber` | FUEL | `FUEL-2024-001` |
| **DriverAdvance** | Only has `id` | `advanceNumber` | ADV | `ADV-2024-001` |
| **LoadExpense** | Only has `id` | `expenseNumber` | EXP | `EXP-2024-001` |

### **Medium Priority (Internal Operations)**

| Entity | Current | **Needs** | Proposed Prefix | Example |
|--------|---------|-----------|-----------------|---------|
| **Communication** | Only has `id` | `ticketNumber` or `commNumber` | COMM | `COMM-2024-001` |
| **SettlementDeduction** | Only has `id` | `deductionNumber` | DED | `DED-001` |
| **Document** | Only has `id` | `documentNumber` | DOC | `DOC-2024-001` |

### **Low Priority (Reference Only)**

These entities typically don't need user-facing numbers as they're child records or internal tracking:
- **LoadStop** (part of Load)
- **LoadSegment** (part of Load)
- **DriverComment** (part of Driver)
- **HOSRecord** (ELD-generated, typically has external reference)
- **InvoiceBatch** (already has `batchNumber` ✅)
- **FactoringBatch** (child of factoring)
- **IFTAEntry** (reporting record)

---

## 🔧 REQUIRED CHANGES

### 1. Schema Changes (Migration Required)

```prisma
// User Model - Add employee number
model User {
  id             String  @id @default(cuid())
  employeeNumber String? @unique // NEW: EMP-001, EMP-002, etc.
  // ... rest of fields
}

// MaintenanceRecord Model - Add maintenance number
model MaintenanceRecord {
  id                String @id @default(cuid())
  maintenanceNumber String @unique // NEW: MAINT-2024-001
  // ... rest of fields
}

// FuelEntry Model - Add internal fuel entry number
model FuelEntry {
  id             String  @id @default(cuid())
  fuelEntryNumber String @unique // NEW: FUEL-2024-001
  receiptNumber  String? // Keep existing (vendor receipt)
  // ... rest of fields
}

// DriverAdvance Model - Add advance number
model DriverAdvance {
  id            String @id @default(cuid())
  advanceNumber String @unique // NEW: ADV-2024-001
  // ... rest of fields
}

// LoadExpense Model - Add expense number
model LoadExpense {
  id            String @id @default(cuid())
  expenseNumber String @unique // NEW: EXP-2024-001
  // ... rest of fields
}

// Communication Model - Add ticket/comm number
model Communication {
  id           String  @id @default(cuid())
  ticketNumber String? @unique // NEW: COMM-2024-001
  // ... rest of fields
}
```

### 2. UI Updates Required

All components must be updated to show user-facing numbers, not database IDs:

#### **Current Issues Found:**

```typescript
// ❌ BAD - Shows database UUID
<span>{driver.id}</span>

// ✅ GOOD - Shows user-facing number
<span>#{driver.driverNumber}</span>
```

#### **Components to Verify:**

- [ ] Settlements → Ensure showing `settlementNumber`, not `id`
- [ ] Driver references → Use `driverNumber`, never `id`
- [ ] Load references → Use `loadNumber`, never `id`
- [ ] Invoice displays → Use `invoiceNumber`, never `id`
- [ ] Error messages → Use numbers, not UUIDs
- [ ] API responses → Filter out `id` from user-facing responses where appropriate

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Schema Updates (Day 1)
- [ ] Create migration for new number fields
- [ ] Add `employeeNumber` to User model
- [ ] Add `maintenanceNumber` to MaintenanceRecord model
- [ ] Add `fuelEntryNumber` to FuelEntry model
- [ ] Add `advanceNumber` to DriverAdvance model
- [ ] Add `expenseNumber` to LoadExpense model
- [ ] Add `ticketNumber` to Communication model
- [ ] Run migration on development database

### Phase 2: API Updates (Day 2-3)
- [ ] Create auto-generation logic for new number fields
- [ ] Update all `POST` endpoints to generate numbers
- [ ] Update all `GET` responses to include numbers prominently
- [ ] Add middleware to strip `id` from certain user-facing responses

### Phase 3: UI Updates (Day 4-5)
- [ ] Scan all components for direct `id` displays
- [ ] Replace with appropriate `xxxNumber` fields
- [ ] Update table columns
- [ ] Update detail pages
- [ ] Update mobile views
- [ ] Update forms

### Phase 4: Testing (Day 6)
- [ ] Verify no UUIDs visible in UI
- [ ] Test search by number fields
- [ ] Test filtering by number fields
- [ ] Test sorting by number fields
- [ ] Test API responses

---

## 🎯 NAMING CONVENTIONS

### Prefix Standards

| Entity Type | Prefix | Format |
|-------------|--------|--------|
| People | `D`, `EMP` | Letter + Number |
| Assets | `T`, `TR` | Letter(s) + Number |
| Operations | `L`, `BRK`, `INSP` | Letter(s) + Year + Number |
| Financial | `INV`, `PAY`, `S` | Prefix + Year + Number |
| Admin | `COMM`, `DOC` | Prefix + Year + Number |

### Example Formats

```
Drivers:        D001, D102, D999
Employees:      EMP-001, EMP-102
Trucks:         T001, T245
Trailers:       TR001, TR050
Loads:          L2024-001, L2024-1543
Settlements:    S2024-W49-001, S2025-W01-042
Invoices:       INV-2024-001, INV-2024-9999
Payments:       PAY-2024-001
Breakdowns:     BRK-2024-001
Incidents:      INC-2024-001
Maintenance:    MAINT-2024-001
Fuel Entries:   FUEL-2024-001
Advances:       ADV-2024-001
Expenses:       EXP-2024-001
Communications: COMM-2024-001
```

---

## 🚫 CRITICAL RULES

### **NEVER DO THIS:**
```typescript
// ❌ Showing database UUID to users
console.log(`Driver ID: ${driver.id}`);
alert(`Load ID: ${load.id}`);
<span>{settlement.id}</span>
```

### **ALWAYS DO THIS:**
```typescript
// ✅ Show user-facing numbers
console.log(`Driver #${driver.driverNumber}`);
alert(`Load #${load.loadNumber}`);
<span>#{settlement.settlementNumber}</span>
```

### **Database Relations:**
```prisma
// ✅ CORRECT - Use id for database foreign keys
model Settlement {
  id       String @id @default(cuid())
  driverId String  // ← Foreign key uses id
  driver   Driver @relation(fields: [driverId], references: [id])
  
  settlementNumber String @unique  // ← User-facing identifier
}
```

---

## 📊 AUDIT STATUS

- **Total Entities Reviewed:** 50+
- **Entities With Numbers:** 14 ✅
- **Entities Missing Numbers:** 6 ❌ (High Priority)
- **Compliance Rate:** 70%
- **Target Compliance:** 100%

**Next Action:** Create migration and begin Phase 1 implementation.

---

*Generated: December 4, 2025*
*Auditor: AI Assistant*
*Status: PENDING IMPLEMENTATION*





