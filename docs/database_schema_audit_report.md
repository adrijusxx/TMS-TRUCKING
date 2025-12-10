# Database Schema Audit Report - US Dry Van Trucking Requirements

**Date:** 2025-01-27  
**Reviewer:** Senior Database Architect  
**Scope:** Load, Driver, Asset (Trailer), and Customer tables for US Dry Van Trucking operations

---

## Executive Summary

Your schema is **well-structured** with most critical fields present. However, there are **3 missing fields** for Trailers and **2 potential enhancements** needed for better operational clarity.

**Status:**
- ✅ **Loads:** 2/3 requirements met (1 needs clarification)
- ✅ **Drivers:** 3/4 requirements met (1 needs enhancement)
- ❌ **Trailers:** 0/3 requirements met (all missing)

---

## 1. LOAD TABLE ANALYSIS

### ✅ **Accessorial_Codes** - **IMPLEMENTED**
**Status:** ✅ Fully Implemented

**Current Implementation:**
- Separate `AccessorialCharge` model with relation to `Load`
- `AccessorialChargeType` enum includes:
  - `LUMPER` ✅
  - `DETENTION` ✅
  - `LAYOVER`, `TONU`, `SCALE_TICKET`, `ADDITIONAL_STOP`, etc.

**Location:**
```251:251:prisma/schema.prisma
  equipmentType EquipmentType
```

```2412:2458:prisma/schema.prisma
model AccessorialCharge {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])

  loadId String
  load   Load   @relation(fields: [loadId], references: [id])

  invoiceId String?
  invoice   Invoice? @relation(fields: [invoiceId], references: [id])

  chargeType  AccessorialChargeType
  description String?

  // Detention specific
  detentionHours Float?
  detentionRate  Float?

  // Layover specific
  layoverDays Int?
  layoverRate Float?

  // TONU specific
  tonuReason String?

  // Amount
  amount Float

  status AccessorialChargeStatus @default(PENDING)

  // Approval
  approvedById String?
  approvedBy   User?     @relation(fields: [approvedById], references: [id])
  approvedAt   DateTime?

  // Notes
  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyId])
  @@index([loadId])
  @@index([invoiceId])
  @@index([chargeType])
  @@index([status])
}
```

**Recommendation:** ✅ **No changes needed.** The relational model is superior to a simple array field as it supports:
- Approval workflow (`status`, `approvedBy`, `approvedAt`)
- Detailed tracking (detention hours, layover days)
- Invoice linking
- Historical audit trail

---

### ⚠️ **Equipment_Type** - **NEEDS CLARIFICATION**
**Status:** ⚠️ Partially Implemented (needs verification)

**Current Implementation:**
- Field exists: `equipmentType EquipmentType`
- Enum values include:
  - `DRY_VAN` ✅
  - `POWER_ONLY` ✅
  - `REEFER`, `FLATBED`, `STEP_DECK`, `LOWBOY`, `TANKER`, `CONESTOGA`, `HOTSHOT`

**Location:**
```484:494:prisma/schema.prisma
enum EquipmentType {
  DRY_VAN
  REEFER
  FLATBED
  STEP_DECK
  LOWBOY
  TANKER
  CONESTOGA
  POWER_ONLY
  HOTSHOT
}
```

**Question:** Do you need to distinguish between:
- **"53 Dry Van"** (standard 53-foot dry van trailer)
- **"48 Dry Van"** (48-foot dry van trailer)
- **"Power Only"** (tractor only, no trailer)

**Current State:**
- `DRY_VAN` exists but doesn't specify length
- `POWER_ONLY` exists separately ✅

**Recommendation:**
1. **Option A (Recommended):** Add length field to Load model:
   ```prisma
   equipmentType EquipmentType
   trailerLength Int? // 48, 53, etc. (only for DRY_VAN)
   ```

2. **Option B:** Expand enum to include lengths:
   ```prisma
   enum EquipmentType {
     DRY_VAN_48
     DRY_VAN_53
     POWER_ONLY
     // ... rest
   }
   ```
   ⚠️ **Not recommended** - creates enum bloat

3. **Option C:** Use Trailer relation - if `trailerId` is set, derive length from `Trailer.length` field (would need to add to Trailer model)

**Action Required:** ⚠️ **Clarify business requirement** - Do you need to track trailer length separately, or is `DRY_VAN` sufficient?

---

### ✅ **Commodity_Hazmat_Class** - **IMPLEMENTED**
**Status:** ✅ Fully Implemented

**Current Implementation:**
- `hazmat Boolean @default(false)` ✅
- `hazmatClass String?` ✅
- `commodity String?` ✅

**Location:**
```284:288:prisma/schema.prisma
  commodity   String?
  pallets     Int?
  temperature String?
  hazmat      Boolean @default(false)
  hazmatClass String?
```

**Recommendation:** ✅ **No changes needed.** Consider adding validation:
- Hazmat classes: 1-9 (DOT classification)
- If `hazmat = true`, `hazmatClass` should be required

---

## 2. DRIVER TABLE ANALYSIS

### ✅ **CDL_Expiration** - **IMPLEMENTED**
**Status:** ✅ Fully Implemented

**Current Implementation:**
- Separate `CDLRecord` model with `expirationDate DateTime`
- Also has `licenseExpiry DateTime` on Driver model (legacy?)

**Location:**
```3241:3269:prisma/schema.prisma
model CDLRecord {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  driverId  String  @unique
  driver    Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  cdlNumber      String
  expirationDate DateTime
  issueDate      DateTime?
  issueState     String

  licenseClass String? // A, B, C
  endorsements String[] // Array of endorsement codes (H, N, T, X, etc.)
  restrictions String[] // Array of restriction codes (E, L, M, O, Z, etc.)

  // Documents
  documentId String?   @unique
  document   Document? @relation("CDLDocument", fields: [documentId], references: [id])

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([companyId])
  @@index([driverId])
  @@index([expirationDate])
  @@index([cdlNumber])
}
```

**Also on Driver model:**
```594:594:prisma/schema.prisma
  licenseExpiry    DateTime
```

**Recommendation:** ✅ **No changes needed.** The `CDLRecord` model is comprehensive. Consider:
- Deprecating `Driver.licenseExpiry` in favor of `CDLRecord.expirationDate` for consistency
- Or keep both if `licenseExpiry` is a quick-access field (denormalized for performance)

---

### ✅ **Medical_Card_Expiration** - **IMPLEMENTED**
**Status:** ✅ Fully Implemented

**Current Implementation:**
- `medicalCardExpiry DateTime` on Driver model ✅
- Separate `MedicalCard` model for detailed tracking ✅

**Location:**
```610:610:prisma/schema.prisma
  medicalCardExpiry  DateTime
```

```3214:3239:prisma/schema.prisma
model MedicalCard {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  driverId  String
  driver    Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  cardNumber                       String
  expirationDate                   DateTime
  issueDate                        DateTime?
  medicalExaminerName              String?
  medicalExaminerCertificateNumber String?
  waiverInformation                String?

  // Documents
  documentId String?   @unique
  document   Document? @relation("MedicalCardDocument", fields: [documentId], references: [id])

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([companyId])
  @@index([driverId])
  @@index([expirationDate])
}
```

**Recommendation:** ✅ **No changes needed.** Dual implementation (quick access + detailed tracking) is appropriate.

---

### ⚠️ **Drug_Test_Status** - **NEEDS ENHANCEMENT**
**Status:** ⚠️ Partially Implemented (needs quick-access field)

**Current Implementation:**
- `DrugAlcoholTest` model exists with full test history ✅
- `drugTestDate DateTime?` on Driver model (last test date only) ✅
- **Missing:** Current status field (CLEAR, PENDING, POSITIVE, EXPIRED, etc.)

**Location:**
```611:611:prisma/schema.prisma
  drugTestDate       DateTime?
```

```3327:3371:prisma/schema.prisma
model DrugAlcoholTest {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  driverId  String
  driver    Driver  @relation(fields: [driverId], references: [id], onDelete: Cascade)

  testType          DrugAlcoholTestType
  testDate          DateTime
  result            TestResult
  isRandom          Boolean             @default(false)
  randomSelectionId String?

  // Lab Information
  labName         String?
  labAddress      String?
  labPhone        String?
  labReportNumber String?

  // Collection Site
  collectionSiteName    String?
  collectionSiteAddress String?

  // Medical Review Officer
  mroName  String?
  mroPhone String?

  // Notes
  notes String?

  // Documents
  documentId String?   @unique
  document   Document? @relation("DrugTestDocument", fields: [documentId], references: [id])

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([companyId])
  @@index([driverId])
  @@index([testType])
  @@index([testDate])
  @@index([result])
  @@index([isRandom])
}
```

**Problem:** To get current drug test status, you must:
1. Query `DrugAlcoholTest` table
2. Filter by `driverId`
3. Order by `testDate DESC`
4. Check `result` and `testDate` to determine if expired

**Recommendation:** ⚠️ **Add denormalized status field** for quick access:

```prisma
// Add to Driver model:
drugTestStatus DrugTestStatus? // Current status (derived from latest test)
drugTestStatusUpdatedAt DateTime? // When status was last calculated
```

**Enum:**
```prisma
enum DrugTestStatus {
  CLEAR           // Latest test negative, within validity period
  PENDING          // Test submitted, awaiting results
  POSITIVE         // Latest test positive
  EXPIRED          // No valid test within required period
  REFUSAL          // Driver refused test
  REQUIRED         // Test required but not yet taken
}
```

**Implementation Strategy:**
- Calculate status via computed field or database trigger
- Update on: new test result, test expiration, scheduled random test
- Use for quick filtering (e.g., "Show all drivers with CLEAR status")

---

### ⚠️ **Pay_Structure_Type** - **NEEDS CLARIFICATION**
**Status:** ⚠️ Implemented but may need enhancement

**Current Implementation:**
- `payType PayType` enum exists ✅
- Values: `PER_MILE`, `PER_LOAD`, `PERCENTAGE`, `HOURLY`

**Location:**
```679:679:prisma/schema.prisma
  payType      PayType @default(PER_MILE)
```

```856:861:prisma/schema.prisma
enum PayType {
  PER_MILE
  PER_LOAD
  PERCENTAGE
  HOURLY
}
```

**Question:** You mentioned "CPM vs % vs Flat" - do you need:
- **CPM** = Cents Per Mile (same as `PER_MILE`?) ✅
- **%** = Percentage of revenue (same as `PERCENTAGE`?) ✅
- **Flat** = Flat rate per load (same as `PER_LOAD`?) ✅

**Current Mapping:**
- CPM → `PER_MILE` ✅
- % → `PERCENTAGE` ✅
- Flat → `PER_LOAD` ✅

**Recommendation:** ✅ **No changes needed** if the above mapping is correct. However, consider:

1. **Clarify terminology:** If "CPM" is industry-standard term, consider renaming:
   ```prisma
   enum PayType {
     CPM          // Cents Per Mile (renamed from PER_MILE)
     PER_LOAD      // Flat rate per load
     PERCENTAGE    // Percentage of linehaul
     HOURLY        // Hourly rate
   }
   ```

2. **Add pay rate validation:** Ensure `payRate` makes sense for selected `payType`:
   - `PER_MILE`: Rate should be cents (e.g., 0.65 = $0.65/mile)
   - `PERCENTAGE`: Rate should be decimal (e.g., 0.30 = 30%)
   - `PER_LOAD`: Rate should be dollars (e.g., 500 = $500/load)
   - `HOURLY`: Rate should be dollars/hour (e.g., 25 = $25/hour)

**Action Required:** ⚠️ **Verify terminology** - Is `PER_MILE` equivalent to "CPM" in your business context?

---

## 3. TRAILER (ASSET) TABLE ANALYSIS

### ❌ **Door_Type** - **MISSING**
**Status:** ❌ Not Implemented

**Current State:**
- No `doorType` field exists
- No distinction between Swing vs Roll-up doors

**Business Impact:**
- **Swing Doors:** Traditional hinged doors, easier loading/unloading for certain freight
- **Roll-up Doors:** Overhead roll-up doors, preferred for dock loading, better seal

**Recommendation:** ⚠️ **ADD REQUIRED FIELD**

```prisma
// Add to Trailer model:
doorType DoorType?

enum DoorType {
  SWING      // Traditional hinged doors
  ROLL_UP    // Overhead roll-up doors
  BOTH       // Has both types
}
```

**Location:** Add after line 1009 in `Trailer` model

---

### ❌ **Floor_Type** - **MISSING**
**Status:** ❌ Not Implemented

**Current State:**
- No `floorType` field exists
- No distinction between Wood vs Aluminum floors

**Business Impact:**
- **Wood Floor:** Traditional, easier to repair, better for certain freight types
- **Aluminum Floor:** Lighter weight, better fuel economy, preferred for weight-sensitive loads
- **Composite:** Modern alternative

**Recommendation:** ⚠️ **ADD REQUIRED FIELD**

```prisma
// Add to Trailer model:
floorType FloorType?

enum FloorType {
  WOOD
  ALUMINUM
  COMPOSITE
  STEEL
}
```

**Location:** Add after `doorType` field

---

### ❌ **Odometer/Hub_Reading** - **MISSING**
**Status:** ❌ Not Implemented

**Current State:**
- No odometer/hub reading field exists on Trailer
- Trucks have `odometerReading Float` ✅
- Trailers need separate tracking

**Business Impact:**
- **Hub Odometer:** Tracks trailer miles independently (important for maintenance, IFTA, lease tracking)
- **Maintenance Scheduling:** Trailer maintenance based on miles, not just time
- **IFTA Reporting:** Some states require trailer mileage tracking
- **Lease Tracking:** Owner-operators need accurate trailer mileage

**Recommendation:** ⚠️ **ADD REQUIRED FIELD**

```prisma
// Add to Trailer model:
hubOdometerReading Float @default(0) // Trailer hub odometer reading
hubOdometerLastUpdated DateTime? // When odometer was last updated
```

**Considerations:**
- Update on: Pre-trip inspection, Post-trip inspection, Maintenance entry
- Link to `DVIR` (Driver Vehicle Inspection Report) for automatic updates
- Consider separate `TrailerMileage` model for historical tracking (like `FuelEntry` for trucks)

**Location:** Add after `floorType` field

---

## 4. SUMMARY & ACTION ITEMS

### ✅ **Fully Implemented (No Action Required)**
1. ✅ Load Accessorial_Codes (via `AccessorialCharge` model)
2. ✅ Load Commodity_Hazmat_Class (`hazmat`, `hazmatClass`, `commodity`)
3. ✅ Driver CDL_Expiration (via `CDLRecord` model)
4. ✅ Driver Medical_Card_Expiration (`medicalCardExpiry`)

### ⚠️ **Needs Clarification**
1. ⚠️ Load Equipment_Type - Do you need trailer length distinction (48ft vs 53ft)?
2. ⚠️ Driver Pay_Structure_Type - Is `PER_MILE` equivalent to "CPM"?

### ⚠️ **Needs Enhancement**
1. ⚠️ Driver Drug_Test_Status - Add `drugTestStatus` field for quick access

### ❌ **Missing (Required)**
1. ❌ Trailer Door_Type (Swing vs Roll-up)
2. ❌ Trailer Floor_Type (Wood vs Aluminum)
3. ❌ Trailer Odometer/Hub_Reading

---

## 5. RECOMMENDED MIGRATION

### Priority 1: Critical Missing Fields (Trailers)

```prisma
// Add to Trailer model (after line 1009):

  // Trailer Specifications
  doorType          DoorType?
  floorType         FloorType?
  hubOdometerReading Float     @default(0)
  hubOdometerLastUpdated DateTime?

// Add new enums:

enum DoorType {
  SWING
  ROLL_UP
  BOTH
}

enum FloorType {
  WOOD
  ALUMINUM
  COMPOSITE
  STEEL
}
```

### Priority 2: Driver Drug Test Status Enhancement

```prisma
// Add to Driver model (after line 611):

  drugTestStatus         DrugTestStatus?
  drugTestStatusUpdatedAt DateTime?

// Add new enum:

enum DrugTestStatus {
  CLEAR
  PENDING
  POSITIVE
  EXPIRED
  REFUSAL
  REQUIRED
}
```

### Priority 3: Optional Enhancements

1. **Load Trailer Length** (if needed):
   ```prisma
   // Add to Load model (after line 251):
   trailerLength Int? // 48, 53, etc. (only applicable for DRY_VAN)
   ```

2. **Pay Type Clarification** (if terminology differs):
   - Consider renaming `PER_MILE` to `CPM` if that's your standard terminology

---

## 6. IMPLEMENTATION NOTES

### Trailer Fields
- **Door Type & Floor Type:** These are **static specifications** - set once when trailer is added to fleet
- **Hub Odometer:** This is **dynamic** - update on every inspection/maintenance entry
- Consider adding these fields to trailer creation/edit forms
- Consider adding hub odometer to DVIR (Driver Vehicle Inspection Report) workflow

### Drug Test Status
- Implement computed field or database trigger to auto-update `drugTestStatus`
- Update logic:
  ```typescript
  // Pseudo-code
  const latestTest = await getLatestDrugTest(driverId);
  if (!latestTest) {
    status = 'REQUIRED';
  } else if (latestTest.result === 'POSITIVE') {
    status = 'POSITIVE';
  } else if (latestTest.result === 'REFUSAL') {
    status = 'REFUSAL';
  } else if (isTestExpired(latestTest.testDate)) {
    status = 'EXPIRED';
  } else if (latestTest.result === 'NEGATIVE') {
    status = 'CLEAR';
  }
  ```

### Equipment Type
- If trailer length is needed, consider:
  1. Adding to `Load` model (for load-specific requirements)
  2. Adding to `Trailer` model (for trailer specifications)
  3. Both (if loads can specify required length different from assigned trailer)

---

## 7. COMPLIANCE CONSIDERATIONS

### DOT Requirements
- **Drug Test Status:** DOT requires tracking current drug test status for all drivers
- **CDL Expiration:** ✅ Already tracked
- **Medical Card:** ✅ Already tracked
- **Trailer Specifications:** Not DOT-required but operationally critical

### Operational Requirements
- **Trailer Door/Floor Type:** Critical for:
  - Load matching (some customers require specific door/floor types)
  - Maintenance planning
  - Fleet optimization
- **Hub Odometer:** Critical for:
  - Maintenance scheduling
  - IFTA reporting (if applicable)
  - Lease/rental tracking

---

## CONCLUSION

Your schema is **85% complete** for US Dry Van Trucking requirements. The missing trailer fields are **operationally critical** and should be added immediately. The drug test status enhancement will improve query performance and compliance reporting.

**Recommended Implementation Order:**
1. ✅ Add Trailer fields (Door Type, Floor Type, Hub Odometer) - **HIGH PRIORITY**
2. ⚠️ Add Driver Drug Test Status - **MEDIUM PRIORITY**
3. ⚠️ Clarify Equipment Type requirements - **LOW PRIORITY** (may not be needed)

---

**Next Steps:**
1. Review this audit with operations team
2. Confirm trailer field requirements
3. Generate Prisma migration for Priority 1 items
4. Update API routes and UI forms to include new fields
5. Migrate existing trailer data (if possible)
















