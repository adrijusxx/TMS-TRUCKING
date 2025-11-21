# Safety Management System - Integration Plan

## Overview

This document provides a detailed, phase-by-phase integration plan for implementing the complete Safety Management System. Each feature is broken down into implementable tasks following modular, OOP design principles with single responsibility.

**Total Estimated Timeline**: 12-16 weeks (depending on team size)

---

## Phase 1: Foundation & Core Infrastructure (Weeks 1-2)

### 1.1 Database Schema Updates

**Priority**: Critical  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Driver Qualification File Models**
   - `DriverQualificationFile` model
   - `DQFDocument` model
   - `DQFDocumentType` enum
   - `DQFStatus` enum
   - Relationships to Driver

2. **Create Medical Card & CDL Models**
   - `MedicalCard` model
   - `CDLRecord` model
   - `Endorsement` enum
   - `Restriction` enum
   - Relationships to Driver

3. **Create MVR Models**
   - `MVRRecord` model
   - `MVRViolation` model
   - `ViolationType` enum
   - Historical tracking

4. **Create Drug & Alcohol Testing Models**
   - `DrugAlcoholTest` model
   - `TestType` enum
   - `TestResult` enum
   - `TestingPool` model
   - `RandomSelection` model
   - FMCSA Clearinghouse integration fields

5. **Create HOS Monitoring Models**
   - `HOSStatus` model (extend existing)
   - `HOSViolation` model
   - `ELDProvider` model
   - `ELDSyncLog` model

6. **Create Training Models** (extend existing SafetyTraining)
   - Add missing fields
   - `TrainingMaterial` model
   - `TrainingCategory` enum

7. **Create Annual Review Models**
   - `AnnualReview` model
   - `ReviewChecklist` model
   - `ReviewStatus` enum

8. **Create DVIR Models**
   - `DVIR` model
   - `DVIRDefect` model
   - `InspectionPoint` enum
   - `DefectSeverity` enum

9. **Create DOT Inspection Models** (extend existing Inspection)
   - Add missing fields
   - `InspectionViolation` model
   - `DataQSubmission` model

10. **Create Roadside Inspection Models**
    - `RoadsideInspection` model
    - `RoadsideViolation` model
    - `InspectionLevel` enum

11. **Create Maintenance Compliance Models**
    - `MaintenanceSchedule` model
    - `MaintenanceRecord` model
    - `SafetyMaintenanceType` enum

12. **Create OOS Models**
    - `OutOfServiceOrder` model
    - `OOSReason` enum
    - `OOSStatus` enum

13. **Create Defect Management Models**
    - `Defect` model (consolidate from DVIR and inspections)
    - `DefectPriority` enum

14. **Create Accident/Incident Models** (extend existing SafetyIncident)
    - Add missing fields
    - `AccidentPhoto` model
    - `AccidentDocument` model
    - `Investigation` model
    - `PreventableDetermination` model
    - `NearMiss` model

15. **Create CSA/FMCSA Models**
    - `CSAScore` model
    - `BASICCategory` enum
    - `FMCSACompliance` model
    - `ComplianceReview` model

16. **Create Insurance & Claims Models**
    - `InsurancePolicy` model
    - `InsuranceClaim` model
    - `CargoClaim` model
    - `PropertyDamage` model
    - `LossRun` model

17. **Create Safety Program Models**
    - `SafetyMeeting` model
    - `MeetingAttendance` model
    - `SafetyPolicy` model
    - `PolicyAcknowledgment` model
    - `SafetyCampaign` model
    - `SafetyRecognition` model

18. **Create Document Management Models** (extend existing Document)
    - Add missing fields
    - `DocumentCategory` enum
    - `DocumentVersion` model
    - `DocumentTag` model

19. **Create Work Order Models** (extend existing WorkOrder)
    - Add safety-specific fields
    - `WorkOrderDefect` relation
    - `MechanicSignOff` model

20. **Create Alert/Notification Models**
    - `ComplianceAlert` model
    - `AlertType` enum
    - `AlertStatus` enum
    - `NotificationPreference` model

**Deliverables**:
- Updated `prisma/schema.prisma`
- Migration scripts
- Seed data for enums

---

### 1.2 Core Services & Managers

**Priority**: Critical  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Base Service Classes**
   - `BaseSafetyService` abstract class
   - `BaseComplianceService` abstract class
   - Common error handling
   - Common validation

2. **Create Document Service**
   - `DocumentService` class
   - Upload/download methods
   - Version control
   - Access control

3. **Create Alert Service**
   - `AlertService` class
   - Alert generation
   - Notification delivery (email/SMS/in-app)
   - Escalation logic

4. **Create Expiration Tracking Service**
   - `ExpirationTrackingService` class
   - Daily expiration checks
   - Alert generation
   - Status updates

5. **Create Compliance Calculator Service**
   - `ComplianceCalculatorService` class
   - CSA score calculation
   - Compliance percentage calculation
   - Violation weight calculation

**File Structure**:
```
lib/services/safety/
  - BaseSafetyService.ts
  - BaseComplianceService.ts
  - DocumentService.ts
  - AlertService.ts
  - ExpirationTrackingService.ts
  - ComplianceCalculatorService.ts
```

---

### 1.3 API Route Structure

**Priority**: Critical  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Base API Routes**
   - `/api/safety/dashboard` - Dashboard metrics
   - `/api/safety/alerts` - Alert management
   - `/api/safety/documents` - Document management

2. **Create Driver Compliance Routes**
   - `/api/safety/drivers/[driverId]/dqf` - DQF management
   - `/api/safety/drivers/[driverId]/medical-cards` - Medical cards
   - `/api/safety/drivers/[driverId]/cdl` - CDL records
   - `/api/safety/drivers/[driverId]/mvr` - MVR records
   - `/api/safety/drivers/[driverId]/drug-tests` - Drug/alcohol tests
   - `/api/safety/drivers/[driverId]/hos` - HOS monitoring
   - `/api/safety/drivers/[driverId]/training` - Training records
   - `/api/safety/drivers/[driverId]/annual-review` - Annual reviews

3. **Create Vehicle Safety Routes**
   - `/api/safety/vehicles/[vehicleId]/dvir` - DVIR management
   - `/api/safety/vehicles/[vehicleId]/inspections` - DOT inspections
   - `/api/safety/vehicles/[vehicleId]/roadside-inspections` - Roadside inspections
   - `/api/safety/vehicles/[vehicleId]/maintenance` - Maintenance compliance
   - `/api/safety/vehicles/[vehicleId]/defects` - Defect management
   - `/api/safety/vehicles/[vehicleId]/oos` - OOS orders

4. **Create Incident Routes** (extend existing)
   - `/api/safety/incidents` - Incident management
   - `/api/safety/incidents/[id]/investigation` - Investigation tools
   - `/api/safety/incidents/[id]/preventable-determination` - Preventable determination
   - `/api/safety/near-misses` - Near-miss reporting

5. **Create Compliance Routes**
   - `/api/safety/compliance/csa-scores` - CSA scores
   - `/api/safety/compliance/fmcsa` - FMCSA compliance
   - `/api/safety/compliance/dataq` - DataQ management
   - `/api/safety/compliance/roadside-inspections` - Roadside inspections
   - `/api/safety/compliance/audit-prep` - Audit preparation

6. **Create Insurance Routes**
   - `/api/safety/insurance/policies` - Insurance policies
   - `/api/safety/insurance/claims` - Claims management
   - `/api/safety/insurance/cargo-claims` - Cargo claims
   - `/api/safety/insurance/loss-runs` - Loss runs
   - `/api/safety/insurance/property-damage` - Property damage

7. **Create Safety Program Routes**
   - `/api/safety/programs/meetings` - Safety meetings
   - `/api/safety/programs/training-materials` - Training materials
   - `/api/safety/programs/policies` - Safety policies
   - `/api/safety/programs/acknowledgments` - Acknowledgments
   - `/api/safety/programs/campaigns` - Safety campaigns
   - `/api/safety/programs/recognition` - Recognition programs

8. **Create Work Order Routes** (extend existing)
   - `/api/safety/work-orders` - Work order management
   - `/api/safety/work-orders/[id]/sign-off` - Mechanic sign-off

9. **Create Report Routes**
   - `/api/safety/reports/dashboard` - Dashboard data
   - `/api/safety/reports/accidents` - Accident analysis
   - `/api/safety/reports/violations` - Violation trends
   - `/api/safety/reports/driver-scorecards` - Driver scorecards
   - `/api/safety/reports/compliance` - Compliance reports
   - `/api/safety/reports/custom` - Custom report builder

**File Structure**:
```
app/api/safety/
  - dashboard/route.ts
  - alerts/route.ts
  - documents/route.ts
  - drivers/[driverId]/
    - dqf/route.ts
    - medical-cards/route.ts
    - cdl/route.ts
    - mvr/route.ts
    - drug-tests/route.ts
    - hos/route.ts
    - training/route.ts
    - annual-review/route.ts
  - vehicles/[vehicleId]/
    - dvir/route.ts
    - inspections/route.ts
    - roadside-inspections/route.ts
    - maintenance/route.ts
    - defects/route.ts
    - oos/route.ts
  - incidents/
    - route.ts
    - [id]/investigation/route.ts
    - [id]/preventable-determination/route.ts
  - near-misses/route.ts
  - compliance/
    - csa-scores/route.ts
    - fmcsa/route.ts
    - dataq/route.ts
    - roadside-inspections/route.ts
    - audit-prep/route.ts
  - insurance/
    - policies/route.ts
    - claims/route.ts
    - cargo-claims/route.ts
    - loss-runs/route.ts
    - property-damage/route.ts
  - programs/
    - meetings/route.ts
    - training-materials/route.ts
    - policies/route.ts
    - acknowledgments/route.ts
    - campaigns/route.ts
    - recognition/route.ts
  - work-orders/
    - route.ts
    - [id]/sign-off/route.ts
  - reports/
    - dashboard/route.ts
    - accidents/route.ts
    - violations/route.ts
    - driver-scorecards/route.ts
    - compliance/route.ts
    - custom/route.ts
```

---

### 1.4 Scheduled Jobs (Cron)

**Priority**: Critical  
**Estimated Time**: 2 days

#### Tasks:
1. **Create Cron Job Infrastructure**
   - Set up cron job system (node-cron or similar)
   - Job scheduling configuration
   - Job logging and monitoring

2. **Create Daily Jobs**
   - Expiration check job (documents, medical cards, CDL, etc.)
   - HOS violation check job
   - Alert generation job
   - CSA score sync job (monthly, but check daily)

3. **Create Weekly Jobs**
   - Compliance report generation
   - Training expiration checks
   - Maintenance due date checks

4. **Create Monthly Jobs**
   - CSA score sync from FMCSA
   - MVR due date checks
   - Annual review due date checks

5. **Create Quarterly Jobs**
   - Random drug/alcohol test selection
   - Safety meeting scheduling

**File Structure**:
```
scripts/cron/
  - index.ts
  - jobs/
    - daily-expiration-check.ts
    - daily-hos-violation-check.ts
    - daily-alert-generation.ts
    - weekly-compliance-report.ts
    - weekly-training-expiration-check.ts
    - weekly-maintenance-due-check.ts
    - monthly-csa-sync.ts
    - monthly-mvr-due-check.ts
    - monthly-annual-review-due-check.ts
    - quarterly-drug-test-selection.ts
    - quarterly-safety-meeting-schedule.ts
```

---

## Phase 2: Dashboard & Driver Compliance (Weeks 3-4)

### 2.1 Safety Dashboard

**Priority**: High  
**Estimated Time**: 5-6 days

#### Tasks:
1. **Create Dashboard Service**
   - `SafetyDashboardService` class
   - Aggregate metrics from all sources
   - Real-time data calculation
   - Caching strategy

2. **Create Dashboard API**
   - `/api/safety/dashboard` GET endpoint
   - Metrics aggregation
   - Performance optimization

3. **Create Dashboard Component**
   - `SafetyDashboard.tsx` component
   - Metric tiles with color coding
   - Drill-down functionality
   - Real-time updates (WebSocket or polling)

4. **Create Metric Tile Components**
   - `ActiveDriversTile.tsx`
   - `ActiveVehiclesTile.tsx`
   - `DaysSinceAccidentTile.tsx`
   - `OpenViolationsTile.tsx`
   - `ExpiringDocumentsTile.tsx`
   - `CSAScoresTile.tsx`

5. **Create Dashboard Page**
   - `/app/dashboard/safety/page.tsx` (update existing)
   - Layout and styling
   - Responsive design

**File Structure**:
```
lib/services/safety/
  - SafetyDashboardService.ts

components/safety/dashboard/
  - SafetyDashboard.tsx
  - ActiveDriversTile.tsx
  - ActiveVehiclesTile.tsx
  - DaysSinceAccidentTile.tsx
  - OpenViolationsTile.tsx
  - ExpiringDocumentsTile.tsx
  - CSAScoresTile.tsx
```

---

### 2.2 Driver Qualification Files (DQF)

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create DQF Service**
   - `DQFService` class
   - Document management
   - Checklist validation
   - Status calculation

2. **Create DQF API**
   - GET `/api/safety/drivers/[driverId]/dqf` - Get DQF
   - POST `/api/safety/drivers/[driverId]/dqf/documents` - Upload document
   - DELETE `/api/safety/drivers/[driverId]/dqf/documents/[docId]` - Delete document
   - GET `/api/safety/drivers/[driverId]/dqf/checklist` - Get checklist status

3. **Create DQF Components**
   - `DQFManager.tsx` - Main DQF view
   - `DQFChecklist.tsx` - Checklist component
   - `DQFDocumentUpload.tsx` - Document upload
   - `DQFDocumentList.tsx` - Document list
   - `DQFStatusIndicator.tsx` - Status display

4. **Create DQF Page**
   - `/app/dashboard/safety/drivers/[driverId]/dqf/page.tsx`
   - Full DQF management interface

**File Structure**:
```
lib/services/safety/
  - DQFService.ts

components/safety/dqf/
  - DQFManager.tsx
  - DQFChecklist.tsx
  - DQFDocumentUpload.tsx
  - DQFDocumentList.tsx
  - DQFStatusIndicator.tsx
```

---

### 2.3 Medical Cards & CDL Tracking

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Medical Card Service**
   - `MedicalCardService` class
   - Expiration tracking
   - Alert generation
   - Status management

2. **Create CDL Service**
   - `CDLService` class
   - CDL record management
   - Endorsement tracking
   - Restriction tracking

3. **Create Medical Card & CDL API**
   - GET/POST `/api/safety/drivers/[driverId]/medical-cards` - Medical card CRUD
   - GET/POST `/api/safety/drivers/[driverId]/cdl` - CDL CRUD
   - GET `/api/safety/drivers/[driverId]/medical-cards/expiring` - Expiring cards
   - GET `/api/safety/drivers/[driverId]/cdl/expiring` - Expiring CDLs

4. **Create Medical Card Components**
   - `MedicalCardManager.tsx` - Medical card management
   - `MedicalCardForm.tsx` - Medical card form
   - `MedicalCardList.tsx` - Medical card list
   - `ExpiringMedicalCardsList.tsx` - Expiring cards list

5. **Create CDL Components**
   - `CDLManager.tsx` - CDL management
   - `CDLForm.tsx` - CDL form
   - `CDLDetails.tsx` - CDL details view
   - `EndorsementsList.tsx` - Endorsements display
   - `RestrictionsList.tsx` - Restrictions display

6. **Create Pages**
   - `/app/dashboard/safety/drivers/[driverId]/medical-cards/page.tsx`
   - `/app/dashboard/safety/drivers/[driverId]/cdl/page.tsx`

**File Structure**:
```
lib/services/safety/
  - MedicalCardService.ts
  - CDLService.ts

components/safety/medical-cards/
  - MedicalCardManager.tsx
  - MedicalCardForm.tsx
  - MedicalCardList.tsx
  - ExpiringMedicalCardsList.tsx

components/safety/cdl/
  - CDLManager.tsx
  - CDLForm.tsx
  - CDLDetails.tsx
  - EndorsementsList.tsx
  - RestrictionsList.tsx
```

---

### 2.4 MVR Monitoring

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create MVR Service**
   - `MVRService` class
   - MVR upload and storage
   - Violation parsing
   - Comparison logic
   - Due date tracking

2. **Create MVR API**
   - GET/POST `/api/safety/drivers/[driverId]/mvr` - MVR CRUD
   - POST `/api/safety/drivers/[driverId]/mvr/upload` - Upload MVR
   - GET `/api/safety/drivers/[driverId]/mvr/compare` - Compare MVRs
   - GET `/api/safety/drivers/[driverId]/mvr/violations` - Get violations

3. **Create MVR Components**
   - `MVRManager.tsx` - MVR management
   - `MVRUpload.tsx` - MVR upload
   - `MVRList.tsx` - MVR history
   - `MVRComparison.tsx` - MVR comparison view
   - `MVRViolationsList.tsx` - Violations list

4. **Create MVR Page**
   - `/app/dashboard/safety/drivers/[driverId]/mvr/page.tsx`

**File Structure**:
```
lib/services/safety/
  - MVRService.ts

components/safety/mvr/
  - MVRManager.tsx
  - MVRUpload.tsx
  - MVRList.tsx
  - MVRComparison.tsx
  - MVRViolationsList.tsx
```

---

### 2.5 Drug & Alcohol Testing

**Priority**: High  
**Estimated Time**: 5-6 days

#### Tasks:
1. **Create Drug Test Service**
   - `DrugAlcoholTestService` class
   - Testing pool management
   - Random selection algorithm
   - Test record management
   - FMCSA Clearinghouse integration

2. **Create Drug Test API**
   - GET/POST `/api/safety/drivers/[driverId]/drug-tests` - Test CRUD
   - POST `/api/safety/drug-tests/random-selection` - Generate random selection
   - GET `/api/safety/drug-tests/pool` - Get testing pool
   - POST `/api/safety/drug-tests/clearinghouse-query` - Query Clearinghouse
   - GET `/api/safety/drug-tests/compliance` - Compliance report

3. **Create FMCSA Clearinghouse Integration**
   - `FMCSAClearinghouseService` class
   - API integration
   - Query management
   - Report management

4. **Create Drug Test Components**
   - `DrugTestManager.tsx` - Test management
   - `DrugTestForm.tsx` - Test form
   - `DrugTestList.tsx` - Test history
   - `RandomSelectionGenerator.tsx` - Random selection UI
   - `TestingPoolManager.tsx` - Pool management
   - `ClearinghouseQuery.tsx` - Clearinghouse integration UI

5. **Create Drug Test Page**
   - `/app/dashboard/safety/drug-tests/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DrugAlcoholTestService.ts
  - FMCSAClearinghouseService.ts

components/safety/drug-tests/
  - DrugTestManager.tsx
  - DrugTestForm.tsx
  - DrugTestList.tsx
  - RandomSelectionGenerator.tsx
  - TestingPoolManager.tsx
  - ClearinghouseQuery.tsx
```

---

### 2.6 HOS Monitoring

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create HOS Service** (extend existing)
   - `HOSMonitoringService` class
   - ELD integration
   - Violation detection
   - Available hours calculation

2. **Create ELD Integration Service**
   - `ELDIntegrationService` abstract class
   - Provider-specific implementations
   - Data synchronization
   - Error handling

3. **Create HOS API** (extend existing)
   - GET `/api/safety/drivers/[driverId]/hos/status` - HOS status
   - GET `/api/safety/drivers/[driverId]/hos/violations` - Violations
   - GET `/api/safety/drivers/[driverId]/hos/available-hours` - Available hours
   - POST `/api/safety/hos/sync` - Sync with ELD

4. **Create HOS Components** (extend existing)
   - `HOSStatusCard.tsx` - Status display
   - `HOSViolationsList.tsx` - Violations list
   - `HOSAvailableHours.tsx` - Available hours display
   - `HOSCalendar.tsx` - Calendar view
   - `HOSComplianceReport.tsx` - Compliance report

5. **Create HOS Page**
   - `/app/dashboard/safety/hos/page.tsx`

**File Structure**:
```
lib/services/safety/
  - HOSMonitoringService.ts
  - ELDIntegrationService.ts
  - providers/
    - ELDProviderA.ts
    - ELDProviderB.ts

components/safety/hos/
  - HOSStatusCard.tsx
  - HOSViolationsList.tsx
  - HOSAvailableHours.tsx
  - HOSCalendar.tsx
  - HOSComplianceReport.tsx
```

---

### 2.7 Driver Training Records

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Training Service** (extend existing)
   - `TrainingService` class
   - Training record management
   - Expiration tracking
   - Certificate management

2. **Create Training API** (extend existing)
   - GET/POST `/api/safety/drivers/[driverId]/training` - Training CRUD
   - GET `/api/safety/drivers/[driverId]/training/expiring` - Expiring training
   - POST `/api/safety/drivers/[driverId]/training/certificate` - Upload certificate

3. **Create Training Components** (extend existing)
   - `TrainingManager.tsx` - Training management
   - `TrainingForm.tsx` - Training form
   - `TrainingList.tsx` - Training history
   - `TrainingCertificateUpload.tsx` - Certificate upload
   - `ExpiringTrainingList.tsx` - Expiring training list

4. **Create Training Page**
   - `/app/dashboard/safety/drivers/[driverId]/training/page.tsx`

**File Structure**:
```
lib/services/safety/
  - TrainingService.ts

components/safety/training/
  - TrainingManager.tsx
  - TrainingForm.tsx
  - TrainingList.tsx
  - TrainingCertificateUpload.tsx
  - ExpiringTrainingList.tsx
```

---

### 2.8 Annual Reviews

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Annual Review Service**
   - `AnnualReviewService` class
   - Review scheduling
   - Checklist management
   - Electronic signature

2. **Create Annual Review API**
   - GET/POST `/api/safety/drivers/[driverId]/annual-review` - Review CRUD
   - GET `/api/safety/drivers/[driverId]/annual-review/checklist` - Get checklist
   - POST `/api/safety/drivers/[driverId]/annual-review/sign` - Electronic signature
   - GET `/api/safety/annual-reviews/due` - Due reviews

3. **Create Annual Review Components**
   - `AnnualReviewManager.tsx` - Review management
   - `AnnualReviewForm.tsx` - Review form
   - `AnnualReviewChecklist.tsx` - Checklist component
   - `AnnualReviewSignature.tsx` - Signature component
   - `DueReviewsList.tsx` - Due reviews list

4. **Create Annual Review Page**
   - `/app/dashboard/safety/drivers/[driverId]/annual-review/page.tsx`

**File Structure**:
```
lib/services/safety/
  - AnnualReviewService.ts

components/safety/annual-reviews/
  - AnnualReviewManager.tsx
  - AnnualReviewForm.tsx
  - AnnualReviewChecklist.tsx
  - AnnualReviewSignature.tsx
  - DueReviewsList.tsx
```

---

## Phase 3: Vehicle Safety (Weeks 5-6)

### 3.1 DVIR (Driver Vehicle Inspection Reports)

**Priority**: High  
**Estimated Time**: 5-6 days

#### Tasks:
1. **Create DVIR Service**
   - `DVIRService` class
   - DVIR creation and management
   - Defect detection
   - Work order creation
   - Electronic signature

2. **Create DVIR API**
   - GET/POST `/api/safety/vehicles/[vehicleId]/dvir` - DVIR CRUD
   - POST `/api/safety/vehicles/[vehicleId]/dvir/pre-trip` - Pre-trip inspection
   - POST `/api/safety/vehicles/[vehicleId]/dvir/post-trip` - Post-trip inspection
   - POST `/api/safety/vehicles/[vehicleId]/dvir/sign` - Electronic signature
   - GET `/api/safety/vehicles/[vehicleId]/dvir/history` - DVIR history

3. **Create DVIR Components**
   - `DVIRForm.tsx` - DVIR form
   - `DVIRInspectionPoints.tsx` - Inspection points checklist
   - `DVIRDefectReport.tsx` - Defect reporting
   - `DVIRPhotoUpload.tsx` - Photo upload
   - `DVIRSignature.tsx` - Electronic signature
   - `DVIRList.tsx` - DVIR history
   - `DVIRMobileForm.tsx` - Mobile-optimized form

4. **Create DVIR Pages**
   - `/app/dashboard/safety/vehicles/[vehicleId]/dvir/page.tsx`
   - `/app/dashboard/safety/vehicles/[vehicleId]/dvir/new/page.tsx`
   - `/app/dashboard/safety/vehicles/[vehicleId]/dvir/[id]/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DVIRService.ts

components/safety/dvir/
  - DVIRForm.tsx
  - DVIRInspectionPoints.tsx
  - DVIRDefectReport.tsx
  - DVIRPhotoUpload.tsx
  - DVIRSignature.tsx
  - DVIRList.tsx
  - DVIRMobileForm.tsx
```

---

### 3.2 Annual DOT Inspections

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create DOT Inspection Service** (extend existing Inspection)
   - `DOTInspectionService` class
   - Inspection scheduling
   - Certificate management
   - Due date tracking

2. **Create DOT Inspection API** (extend existing)
   - GET/POST `/api/safety/vehicles/[vehicleId]/inspections` - Inspection CRUD
   - GET `/api/safety/vehicles/[vehicleId]/inspections/due` - Due inspections
   - POST `/api/safety/vehicles/[vehicleId]/inspections/certificate` - Upload certificate

3. **Create DOT Inspection Components** (extend existing)
   - `DOTInspectionManager.tsx` - Inspection management
   - `DOTInspectionForm.tsx` - Inspection form
   - `DOTInspectionList.tsx` - Inspection history
   - `DueInspectionsList.tsx` - Due inspections list

4. **Create DOT Inspection Page**
   - `/app/dashboard/safety/vehicles/[vehicleId]/inspections/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DOTInspectionService.ts

components/safety/inspections/
  - DOTInspectionManager.tsx
  - DOTInspectionForm.tsx
  - DOTInspectionList.tsx
  - DueInspectionsList.tsx
```

---

### 3.3 Roadside Inspection History

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Roadside Inspection Service**
   - `RoadsideInspectionService` class
   - Inspection import (FMCSA SMS)
   - Manual entry
   - Violation tracking
   - DataQ management

2. **Create FMCSA SMS Integration Service**
   - `FMCSASMSService` class
   - API integration
   - Data import
   - Sync scheduling

3. **Create Roadside Inspection API**
   - GET/POST `/api/safety/vehicles/[vehicleId]/roadside-inspections` - Inspection CRUD
   - POST `/api/safety/roadside-inspections/import` - Import from FMCSA
   - GET `/api/safety/roadside-inspections/violations` - Get violations
   - POST `/api/safety/roadside-inspections/[id]/dataq` - Submit DataQ

4. **Create Roadside Inspection Components**
   - `RoadsideInspectionManager.tsx` - Inspection management
   - `RoadsideInspectionForm.tsx` - Inspection form
   - `RoadsideInspectionList.tsx` - Inspection history
   - `RoadsideViolationsList.tsx` - Violations list
   - `DataQSubmission.tsx` - DataQ submission form
   - `FMCSAImport.tsx` - FMCSA import UI

5. **Create Roadside Inspection Page**
   - `/app/dashboard/safety/roadside-inspections/page.tsx`

**File Structure**:
```
lib/services/safety/
  - RoadsideInspectionService.ts
  - FMCSASMSService.ts

components/safety/roadside-inspections/
  - RoadsideInspectionManager.tsx
  - RoadsideInspectionForm.tsx
  - RoadsideInspectionList.tsx
  - RoadsideViolationsList.tsx
  - DataQSubmission.tsx
  - FMCSAImport.tsx
```

---

### 3.4 Vehicle Maintenance Compliance

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Maintenance Compliance Service**
   - `MaintenanceComplianceService` class
   - Maintenance scheduling
   - Work order integration
   - Compliance tracking

2. **Create Maintenance Compliance API**
   - GET/POST `/api/safety/vehicles/[vehicleId]/maintenance` - Maintenance CRUD
   - GET `/api/safety/vehicles/[vehicleId]/maintenance/schedule` - Maintenance schedule
   - GET `/api/safety/vehicles/[vehicleId]/maintenance/due` - Due maintenance

3. **Create Maintenance Compliance Components**
   - `MaintenanceComplianceManager.tsx` - Maintenance management
   - `MaintenanceSchedule.tsx` - Schedule calendar
   - `DueMaintenanceList.tsx` - Due maintenance list
   - `MaintenanceRecord.tsx` - Maintenance record

4. **Create Maintenance Compliance Page**
   - `/app/dashboard/safety/vehicles/[vehicleId]/maintenance/page.tsx`

**File Structure**:
```
lib/services/safety/
  - MaintenanceComplianceService.ts

components/safety/maintenance/
  - MaintenanceComplianceManager.tsx
  - MaintenanceSchedule.tsx
  - DueMaintenanceList.tsx
  - MaintenanceRecord.tsx
```

---

### 3.5 Out-of-Service Orders

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create OOS Service**
   - `OOSService` class
   - OOS recording
   - Status management
   - Resolution tracking
   - Metrics calculation

2. **Create OOS API**
   - GET/POST `/api/safety/vehicles/[vehicleId]/oos` - OOS CRUD
   - POST `/api/safety/vehicles/[vehicleId]/oos/resolve` - Resolve OOS
   - GET `/api/safety/oos/active` - Active OOS orders
   - GET `/api/safety/oos/metrics` - OOS metrics

3. **Create OOS Components**
   - `OOSManager.tsx` - OOS management
   - `OOSForm.tsx` - OOS form
   - `OOSList.tsx` - OOS history
   - `OOSMetrics.tsx` - OOS metrics display

4. **Create OOS Page**
   - `/app/dashboard/safety/oos/page.tsx`

**File Structure**:
```
lib/services/safety/
  - OOSService.ts

components/safety/oos/
  - OOSManager.tsx
  - OOSForm.tsx
  - OOSList.tsx
  - OOSMetrics.tsx
```

---

### 3.6 Defect Management

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Defect Service**
   - `DefectService` class
   - Defect aggregation
   - Priority management
   - Work order integration
   - Time tracking

2. **Create Defect API**
   - GET `/api/safety/defects` - Get all defects
   - GET `/api/safety/defects/open` - Open defects
   - GET `/api/safety/defects/critical` - Critical defects
   - GET `/api/safety/defects/[id]` - Get defect details
   - POST `/api/safety/defects/[id]/resolve` - Resolve defect

3. **Create Defect Components**
   - `DefectDashboard.tsx` - Defect dashboard
   - `DefectList.tsx` - Defect list
   - `DefectCard.tsx` - Defect card
   - `DefectDetails.tsx` - Defect details
   - `DefectMetrics.tsx` - Defect metrics

4. **Create Defect Page**
   - `/app/dashboard/safety/defects/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DefectService.ts

components/safety/defects/
  - DefectDashboard.tsx
  - DefectList.tsx
  - DefectCard.tsx
  - DefectDetails.tsx
  - DefectMetrics.tsx
```

---

## Phase 4: Incidents & Accidents (Week 7)

### 4.1 Accident Register

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Accident Service** (extend existing SafetyIncident)
   - `AccidentService` class
   - Accident recording
   - Photo/document management
   - Cost tracking
   - Classification

2. **Create Accident API** (extend existing)
   - GET/POST `/api/safety/incidents` - Accident CRUD
   - POST `/api/safety/incidents/[id]/photos` - Upload photos
   - POST `/api/safety/incidents/[id]/documents` - Upload documents
   - GET `/api/safety/incidents/[id]/costs` - Cost tracking

3. **Create Accident Components** (extend existing)
   - `AccidentManager.tsx` - Accident management
   - `AccidentForm.tsx` - Accident form
   - `AccidentList.tsx` - Accident list
   - `AccidentDetails.tsx` - Accident details
   - `AccidentPhotoGallery.tsx` - Photo gallery
   - `AccidentDocumentViewer.tsx` - Document viewer
   - `AccidentCostTracker.tsx` - Cost tracking

4. **Create Accident Pages** (extend existing)
   - `/app/dashboard/safety/incidents/page.tsx` (update)
   - `/app/dashboard/safety/incidents/new/page.tsx`
   - `/app/dashboard/safety/incidents/[id]/page.tsx`

**File Structure**:
```
lib/services/safety/
  - AccidentService.ts

components/safety/accidents/
  - AccidentManager.tsx
  - AccidentForm.tsx
  - AccidentList.tsx
  - AccidentDetails.tsx
  - AccidentPhotoGallery.tsx
  - AccidentDocumentViewer.tsx
  - AccidentCostTracker.tsx
```

---

### 4.2 Incident Investigation Tools

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Investigation Service**
   - `InvestigationService` class
   - Investigation workflow
   - Evidence gathering
   - Report generation

2. **Create Investigation API**
   - GET/POST `/api/safety/incidents/[id]/investigation` - Investigation CRUD
   - POST `/api/safety/incidents/[id]/investigation/assign` - Assign investigator
   - POST `/api/safety/incidents/[id]/investigation/complete` - Complete investigation
   - GET `/api/safety/incidents/[id]/investigation/report` - Generate report

3. **Create Investigation Components**
   - `InvestigationWorkflow.tsx` - Investigation workflow
   - `InvestigationChecklist.tsx` - Investigation checklist
   - `InvestigationForm.tsx` - Investigation form
   - `InvestigationReport.tsx` - Investigation report
   - `EvidenceGathering.tsx` - Evidence gathering UI

4. **Create Investigation Page**
   - `/app/dashboard/safety/incidents/[id]/investigation/page.tsx`

**File Structure**:
```
lib/services/safety/
  - InvestigationService.ts

components/safety/investigations/
  - InvestigationWorkflow.tsx
  - InvestigationChecklist.tsx
  - InvestigationForm.tsx
  - InvestigationReport.tsx
  - EvidenceGathering.tsx
```

---

### 4.3 Preventable Determination

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Preventable Determination Service**
   - `PreventableDeterminationService` class
   - Review process
   - Voting system
   - Appeals process
   - Driver score integration

2. **Create Preventable Determination API**
   - GET/POST `/api/safety/incidents/[id]/preventable-determination` - Determination CRUD
   - POST `/api/safety/incidents/[id]/preventable-determination/vote` - Submit vote
   - POST `/api/safety/incidents/[id]/preventable-determination/appeal` - Submit appeal

3. **Create Preventable Determination Components**
   - `PreventableDeterminationManager.tsx` - Determination management
   - `PreventableDeterminationForm.tsx` - Determination form
   - `ReviewCommittee.tsx` - Review committee UI
   - `VotingInterface.tsx` - Voting interface
   - `AppealForm.tsx` - Appeal form

4. **Create Preventable Determination Page**
   - `/app/dashboard/safety/incidents/[id]/preventable-determination/page.tsx`

**File Structure**:
```
lib/services/safety/
  - PreventableDeterminationService.ts

components/safety/preventable-determination/
  - PreventableDeterminationManager.tsx
  - PreventableDeterminationForm.tsx
  - ReviewCommittee.tsx
  - VotingInterface.tsx
  - AppealForm.tsx
```

---

### 4.4 Photos and Documentation Storage

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Photo/Document Service** (extend DocumentService)
   - Photo upload and storage
   - Document organization
   - Tagging system
   - Search functionality

2. **Create Photo/Document API** (extend existing)
   - POST `/api/safety/incidents/[id]/photos` - Upload photos
   - POST `/api/safety/incidents/[id]/documents` - Upload documents
   - GET `/api/safety/incidents/[id]/photos` - Get photos
   - GET `/api/safety/incidents/[id]/documents` - Get documents
   - DELETE `/api/safety/incidents/[id]/photos/[photoId]` - Delete photo

3. **Create Photo/Document Components**
   - `PhotoUpload.tsx` - Photo upload
   - `PhotoGallery.tsx` - Photo gallery
   - `DocumentUpload.tsx` - Document upload
   - `DocumentViewer.tsx` - Document viewer
   - `PhotoTagging.tsx` - Photo tagging

**File Structure**:
```
components/safety/documents/
  - PhotoUpload.tsx
  - PhotoGallery.tsx
  - DocumentUpload.tsx
  - DocumentViewer.tsx
  - PhotoTagging.tsx
```

---

### 4.5 Police Reports and Witness Statements

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Police Report Service**
   - `PoliceReportService` class
   - Report upload
   - Information extraction (OCR)
   - Link to accidents

2. **Create Witness Statement Service**
   - `WitnessStatementService` class
   - Contact management
   - Statement recording
   - Follow-up tracking

3. **Create Police Report/Witness API**
   - POST `/api/safety/incidents/[id]/police-report` - Upload police report
   - POST `/api/safety/incidents/[id]/witness-statements` - Add witness statement
   - GET `/api/safety/incidents/[id]/police-report` - Get police report
   - GET `/api/safety/incidents/[id]/witness-statements` - Get witness statements

4. **Create Police Report/Witness Components**
   - `PoliceReportUpload.tsx` - Police report upload
   - `PoliceReportViewer.tsx` - Police report viewer
   - `WitnessStatementForm.tsx` - Witness statement form
   - `WitnessStatementList.tsx` - Witness statements list

**File Structure**:
```
lib/services/safety/
  - PoliceReportService.ts
  - WitnessStatementService.ts

components/safety/police-reports/
  - PoliceReportUpload.tsx
  - PoliceReportViewer.tsx
  - WitnessStatementForm.tsx
  - WitnessStatementList.tsx
```

---

### 4.6 Near-Miss Reporting

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Near-Miss Service**
   - `NearMissService` class
   - Near-miss recording
   - Pattern analysis
   - Action item generation

2. **Create Near-Miss API**
   - GET/POST `/api/safety/near-misses` - Near-miss CRUD
   - GET `/api/safety/near-misses/patterns` - Pattern analysis
   - POST `/api/safety/near-misses/[id]/action-items` - Generate action items

3. **Create Near-Miss Components**
   - `NearMissForm.tsx` - Near-miss form
   - `NearMissList.tsx` - Near-miss list
   - `NearMissAnalysis.tsx` - Pattern analysis
   - `NearMissActionItems.tsx` - Action items

4. **Create Near-Miss Page**
   - `/app/dashboard/safety/near-misses/page.tsx`

**File Structure**:
```
lib/services/safety/
  - NearMissService.ts

components/safety/near-misses/
  - NearMissForm.tsx
  - NearMissList.tsx
  - NearMissAnalysis.tsx
  - NearMissActionItems.tsx
```

---

## Phase 5: DOT Compliance (Week 8)

### 5.1 CSA BASIC Scores Monitoring

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create CSA Score Service**
   - `CSAScoreService` class
   - FMCSA SMS integration
   - Score calculation
   - Trend analysis
   - Alert generation

2. **Create FMCSA SMS Integration Service** (extend existing)
   - API integration
   - Data sync
   - Score retrieval

3. **Create CSA Score API**
   - GET `/api/safety/compliance/csa-scores` - Get CSA scores
   - POST `/api/safety/compliance/csa-scores/sync` - Sync from FMCSA
   - GET `/api/safety/compliance/csa-scores/trends` - Score trends
   - GET `/api/safety/compliance/csa-scores/violations` - Violation analysis

4. **Create CSA Score Components**
   - `CSAScoreDashboard.tsx` - CSA score dashboard
   - `CSAScoreCard.tsx` - Score card for each BASIC
   - `CSAScoreTrends.tsx` - Trend charts
   - `CSAViolationAnalysis.tsx` - Violation analysis
   - `CSAScoreAlerts.tsx` - Score alerts

5. **Create CSA Score Page**
   - `/app/dashboard/safety/compliance/csa-scores/page.tsx`

**File Structure**:
```
lib/services/safety/
  - CSAScoreService.ts

components/safety/csa-scores/
  - CSAScoreDashboard.tsx
  - CSAScoreCard.tsx
  - CSAScoreTrends.tsx
  - CSAViolationAnalysis.tsx
  - CSAScoreAlerts.tsx
```

---

### 5.2 FMCSA Compliance Tracking

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create FMCSA Compliance Service**
   - `FMCSAComplianceService` class
   - Safety rating tracking
   - Compliance review tracking
   - Intervention monitoring
   - Action item management

2. **Create FMCSA Compliance API**
   - GET `/api/safety/compliance/fmcsa` - Get compliance status
   - GET `/api/safety/compliance/fmcsa/safety-rating` - Get safety rating
   - GET `/api/safety/compliance/fmcsa/reviews` - Get compliance reviews
   - POST `/api/safety/compliance/fmcsa/action-items` - Create action items

3. **Create FMCSA Compliance Components**
   - `FMCSAComplianceDashboard.tsx` - Compliance dashboard
   - `SafetyRatingDisplay.tsx` - Safety rating display
   - `ComplianceReviewList.tsx` - Review list
   - `ActionItemManager.tsx` - Action item management

4. **Create FMCSA Compliance Page**
   - `/app/dashboard/safety/compliance/fmcsa/page.tsx`

**File Structure**:
```
lib/services/safety/
  - FMCSAComplianceService.ts

components/safety/compliance/
  - FMCSAComplianceDashboard.tsx
  - SafetyRatingDisplay.tsx
  - ComplianceReviewList.tsx
  - ActionItemManager.tsx
```

---

### 5.3 DataQs Management

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create DataQ Service**
   - `DataQService` class
   - DataQ submission
   - Status tracking
   - Success management
   - CSA score recalculation

2. **Create DataQ API**
   - GET/POST `/api/safety/compliance/dataq` - DataQ CRUD
   - POST `/api/safety/compliance/dataq/submit` - Submit DataQ
   - GET `/api/safety/compliance/dataq/status` - Get DataQ status
   - GET `/api/safety/compliance/dataq/statistics` - Get statistics

3. **Create DataQ Components**
   - `DataQManager.tsx` - DataQ management
   - `DataQForm.tsx` - DataQ submission form
   - `DataQList.tsx` - DataQ list
   - `DataQStatus.tsx` - Status tracking
   - `DataQStatistics.tsx` - Statistics display

4. **Create DataQ Page**
   - `/app/dashboard/safety/compliance/dataq/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DataQService.ts

components/safety/dataq/
  - DataQManager.tsx
  - DataQForm.tsx
  - DataQList.tsx
  - DataQStatus.tsx
  - DataQStatistics.tsx
```

---

### 5.4 Roadside Inspection Results

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Roadside Inspection Dashboard Service**
   - Aggregate inspection data
   - Analysis calculations
   - Filtering logic

2. **Create Roadside Inspection Dashboard API**
   - GET `/api/safety/compliance/roadside-inspections` - Get inspections
   - GET `/api/safety/compliance/roadside-inspections/analysis` - Get analysis
   - GET `/api/safety/compliance/roadside-inspections/filters` - Get filter options

3. **Create Roadside Inspection Dashboard Components**
   - `RoadsideInspectionDashboard.tsx` - Dashboard
   - `InspectionStatistics.tsx` - Statistics
   - `ViolationHeatMap.tsx` - Heat map
   - `InspectionFilters.tsx` - Filters

4. **Create Roadside Inspection Dashboard Page**
   - `/app/dashboard/safety/compliance/roadside-inspections/page.tsx`

**File Structure**:
```
components/safety/roadside-inspections/
  - RoadsideInspectionDashboard.tsx
  - InspectionStatistics.tsx
  - ViolationHeatMap.tsx
  - InspectionFilters.tsx
```

---

### 5.5 DOT Audit Preparation

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Audit Preparation Service**
   - `AuditPreparationService` class
   - Checklist management
   - Document aggregation
   - Compliance verification
   - Report generation

2. **Create Audit Preparation API**
   - GET `/api/safety/compliance/audit-prep` - Get audit checklist
   - POST `/api/safety/compliance/audit-prep/run-audit` - Run internal audit
   - GET `/api/safety/compliance/audit-prep/document-package` - Generate document package
   - GET `/api/safety/compliance/audit-prep/findings` - Get findings

3. **Create Audit Preparation Components**
   - `AuditPreparationManager.tsx` - Audit preparation
   - `AuditChecklist.tsx` - Audit checklist
   - `InternalAudit.tsx` - Internal audit UI
   - `DocumentPackage.tsx` - Document package generator
   - `AuditFindings.tsx` - Findings display

4. **Create Audit Preparation Page**
   - `/app/dashboard/safety/compliance/audit-prep/page.tsx`

**File Structure**:
```
lib/services/safety/
  - AuditPreparationService.ts

components/safety/audit-prep/
  - AuditPreparationManager.tsx
  - AuditChecklist.tsx
  - InternalAudit.tsx
  - DocumentPackage.tsx
  - AuditFindings.tsx
```

---

### 5.6 Compliance Alerts and Notifications

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Compliance Alert Service** (extend AlertService)
   - Alert generation
   - Threshold management
   - Escalation logic
   - Multi-channel notifications

2. **Create Compliance Alert API** (extend existing)
   - GET `/api/safety/alerts` - Get alerts
   - POST `/api/safety/alerts/[id]/acknowledge` - Acknowledge alert
   - GET `/api/safety/alerts/thresholds` - Get thresholds
   - POST `/api/safety/alerts/thresholds` - Update thresholds

3. **Create Compliance Alert Components** (extend existing)
   - `ComplianceAlertManager.tsx` - Alert management
   - `AlertList.tsx` - Alert list
   - `AlertThresholds.tsx` - Threshold configuration
   - `AlertNotifications.tsx` - Notification settings

4. **Create Compliance Alert Page**
   - `/app/dashboard/safety/alerts/page.tsx`

**File Structure**:
```
components/safety/alerts/
  - ComplianceAlertManager.tsx
  - AlertList.tsx
  - AlertThresholds.tsx
  - AlertNotifications.tsx
```

---

## Phase 6: Insurance & Claims (Week 9)

### 6.1 Insurance Certificates

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Insurance Service**
   - `InsuranceService` class
   - Policy management
   - Certificate generation
   - Renewal tracking

2. **Create Insurance API**
   - GET/POST `/api/safety/insurance/policies` - Policy CRUD
   - GET `/api/safety/insurance/policies/expiring` - Expiring policies
   - POST `/api/safety/insurance/policies/[id]/certificate` - Generate certificate
   - GET/POST `/api/safety/insurance/policies/[id]/additional-insured` - Additional insured

3. **Create Insurance Components**
   - `InsuranceManager.tsx` - Insurance management
   - `InsurancePolicyForm.tsx` - Policy form
   - `InsurancePolicyList.tsx` - Policy list
   - `CertificateGenerator.tsx` - Certificate generator
   - `ExpiringPoliciesList.tsx` - Expiring policies

4. **Create Insurance Page**
   - `/app/dashboard/safety/insurance/policies/page.tsx`

**File Structure**:
```
lib/services/safety/
  - InsuranceService.ts

components/safety/insurance/
  - InsuranceManager.tsx
  - InsurancePolicyForm.tsx
  - InsurancePolicyList.tsx
  - CertificateGenerator.tsx
  - ExpiringPoliciesList.tsx
```

---

### 6.2 Claims Management and Tracking

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Claim Service**
   - `ClaimService` class
   - Claim recording
   - Status tracking
   - Financial tracking
   - Document management

2. **Create Claim API**
   - GET/POST `/api/safety/insurance/claims` - Claim CRUD
   - POST `/api/safety/insurance/claims/[id]/update-status` - Update status
   - GET `/api/safety/insurance/claims/[id]/financials` - Get financials
   - POST `/api/safety/insurance/claims/[id]/documents` - Upload documents

3. **Create Claim Components**
   - `ClaimManager.tsx` - Claim management
   - `ClaimForm.tsx` - Claim form
   - `ClaimList.tsx` - Claim list
   - `ClaimDetails.tsx` - Claim details
   - `ClaimFinancials.tsx` - Financial tracking

4. **Create Claim Page**
   - `/app/dashboard/safety/insurance/claims/page.tsx`

**File Structure**:
```
lib/services/safety/
  - ClaimService.ts

components/safety/insurance/claims/
  - ClaimManager.tsx
  - ClaimForm.tsx
  - ClaimList.tsx
  - ClaimDetails.tsx
  - ClaimFinancials.tsx
```

---

### 6.3 Loss Runs

**Priority**: Low  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Loss Run Service**
   - `LossRunService` class
   - Loss run storage
   - Data extraction (if possible)
   - Analysis

2. **Create Loss Run API**
   - GET/POST `/api/safety/insurance/loss-runs` - Loss run CRUD
   - POST `/api/safety/insurance/loss-runs/upload` - Upload loss run
   - GET `/api/safety/insurance/loss-runs/analysis` - Get analysis

3. **Create Loss Run Components**
   - `LossRunManager.tsx` - Loss run management
   - `LossRunUpload.tsx` - Loss run upload
   - `LossRunList.tsx` - Loss run list
   - `LossRunAnalysis.tsx` - Analysis display

4. **Create Loss Run Page**
   - `/app/dashboard/safety/insurance/loss-runs/page.tsx`

**File Structure**:
```
lib/services/safety/
  - LossRunService.ts

components/safety/insurance/loss-runs/
  - LossRunManager.tsx
  - LossRunUpload.tsx
  - LossRunList.tsx
  - LossRunAnalysis.tsx
```

---

### 6.4 Cargo Claims

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Cargo Claim Service**
   - `CargoClaimService` class
   - Cargo claim recording
   - Resolution tracking
   - Analysis

2. **Create Cargo Claim API**
   - GET/POST `/api/safety/insurance/cargo-claims` - Cargo claim CRUD
   - POST `/api/safety/insurance/cargo-claims/[id]/resolve` - Resolve claim
   - GET `/api/safety/insurance/cargo-claims/analysis` - Get analysis

3. **Create Cargo Claim Components**
   - `CargoClaimManager.tsx` - Cargo claim management
   - `CargoClaimForm.tsx` - Cargo claim form
   - `CargoClaimList.tsx` - Cargo claim list
   - `CargoClaimAnalysis.tsx` - Analysis display

4. **Create Cargo Claim Page**
   - `/app/dashboard/safety/insurance/cargo-claims/page.tsx`

**File Structure**:
```
lib/services/safety/
  - CargoClaimService.ts

components/safety/insurance/cargo-claims/
  - CargoClaimManager.tsx
  - CargoClaimForm.tsx
  - CargoClaimList.tsx
  - CargoClaimAnalysis.tsx
```

---

### 6.5 Property Damage Reports

**Priority**: Low  
**Estimated Time**: 2 days

#### Tasks:
1. **Create Property Damage Service**
   - `PropertyDamageService` class
   - Damage recording
   - Cost tracking
   - Responsibility tracking

2. **Create Property Damage API**
   - GET/POST `/api/safety/insurance/property-damage` - Property damage CRUD
   - GET `/api/safety/insurance/property-damage/analysis` - Get analysis

3. **Create Property Damage Components**
   - `PropertyDamageManager.tsx` - Property damage management
   - `PropertyDamageForm.tsx` - Property damage form
   - `PropertyDamageList.tsx` - Property damage list
   - `PropertyDamageAnalysis.tsx` - Analysis display

4. **Create Property Damage Page**
   - `/app/dashboard/safety/insurance/property-damage/page.tsx`

**File Structure**:
```
lib/services/safety/
  - PropertyDamageService.ts

components/safety/insurance/property-damage/
  - PropertyDamageManager.tsx
  - PropertyDamageForm.tsx
  - PropertyDamageList.tsx
  - PropertyDamageAnalysis.tsx
```

---

## Phase 7: Safety Programs (Week 10)

### 7.1 Safety Meeting Schedules and Attendance

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Safety Meeting Service**
   - `SafetyMeetingService` class
   - Meeting scheduling
   - Attendance tracking
   - Compliance tracking

2. **Create Safety Meeting API**
   - GET/POST `/api/safety/programs/meetings` - Meeting CRUD
   - POST `/api/safety/programs/meetings/[id]/attendance` - Record attendance
   - GET `/api/safety/programs/meetings/[id]/attendance` - Get attendance
   - GET `/api/safety/programs/meetings/calendar` - Get calendar

3. **Create Safety Meeting Components**
   - `SafetyMeetingManager.tsx` - Meeting management
   - `SafetyMeetingForm.tsx` - Meeting form
   - `SafetyMeetingCalendar.tsx` - Meeting calendar
   - `AttendanceTracker.tsx` - Attendance tracking
   - `MeetingMinutes.tsx` - Meeting minutes

4. **Create Safety Meeting Page**
   - `/app/dashboard/safety/programs/meetings/page.tsx`

**File Structure**:
```
lib/services/safety/
  - SafetyMeetingService.ts

components/safety/programs/meetings/
  - SafetyMeetingManager.tsx
  - SafetyMeetingForm.tsx
  - SafetyMeetingCalendar.tsx
  - AttendanceTracker.tsx
  - MeetingMinutes.tsx
```

---

### 7.2 Training Materials Library

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Training Material Service**
   - `TrainingMaterialService` class
   - Material storage
   - Version control
   - Access control
   - Search functionality

2. **Create Training Material API**
   - GET/POST `/api/safety/programs/training-materials` - Material CRUD
   - POST `/api/safety/programs/training-materials/upload` - Upload material
   - GET `/api/safety/programs/training-materials/search` - Search materials
   - GET `/api/safety/programs/training-materials/[id]/versions` - Get versions

3. **Create Training Material Components**
   - `TrainingMaterialLibrary.tsx` - Material library
   - `TrainingMaterialUpload.tsx` - Material upload
   - `TrainingMaterialViewer.tsx` - Material viewer
   - `TrainingMaterialSearch.tsx` - Material search
   - `TrainingMaterialCategories.tsx` - Categories

4. **Create Training Material Page**
   - `/app/dashboard/safety/programs/training-materials/page.tsx`

**File Structure**:
```
lib/services/safety/
  - TrainingMaterialService.ts

components/safety/programs/training-materials/
  - TrainingMaterialLibrary.tsx
  - TrainingMaterialUpload.tsx
  - TrainingMaterialViewer.tsx
  - TrainingMaterialSearch.tsx
  - TrainingMaterialCategories.tsx
```

---

### 7.3 Safety Policies and Procedures

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Safety Policy Service**
   - `SafetyPolicyService` class
   - Policy storage
   - Version control
   - Distribution tracking

2. **Create Safety Policy API**
   - GET/POST `/api/safety/programs/policies` - Policy CRUD
   - POST `/api/safety/programs/policies/[id]/version` - Create new version
   - GET `/api/safety/programs/policies/[id]/versions` - Get versions
   - GET `/api/safety/programs/policies/[id]/distribution` - Get distribution

3. **Create Safety Policy Components**
   - `SafetyPolicyManager.tsx` - Policy management
   - `SafetyPolicyForm.tsx` - Policy form
   - `SafetyPolicyViewer.tsx` - Policy viewer
   - `SafetyPolicyVersions.tsx` - Version history
   - `SafetyPolicyDistribution.tsx` - Distribution tracking

4. **Create Safety Policy Page**
   - `/app/dashboard/safety/programs/policies/page.tsx`

**File Structure**:
```
lib/services/safety/
  - SafetyPolicyService.ts

components/safety/programs/policies/
  - SafetyPolicyManager.tsx
  - SafetyPolicyForm.tsx
  - SafetyPolicyViewer.tsx
  - SafetyPolicyVersions.tsx
  - SafetyPolicyDistribution.tsx
```

---

### 7.4 Driver Acknowledgment Tracking

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Acknowledgment Service**
   - `AcknowledgmentService` class
   - Acknowledgment generation
   - Tracking
   - Reminder system
   - Electronic signature

2. **Create Acknowledgment API**
   - GET/POST `/api/safety/programs/acknowledgments` - Acknowledgment CRUD
   - POST `/api/safety/programs/acknowledgments/generate` - Generate acknowledgments
   - POST `/api/safety/programs/acknowledgments/[id]/sign` - Sign acknowledgment
   - GET `/api/safety/programs/acknowledgments/compliance` - Get compliance

3. **Create Acknowledgment Components**
   - `AcknowledgmentManager.tsx` - Acknowledgment management
   - `AcknowledgmentList.tsx` - Acknowledgment list
   - `AcknowledgmentForm.tsx` - Acknowledgment form
   - `AcknowledgmentCompliance.tsx` - Compliance display

4. **Create Acknowledgment Page**
   - `/app/dashboard/safety/programs/acknowledgments/page.tsx`

**File Structure**:
```
lib/services/safety/
  - AcknowledgmentService.ts

components/safety/programs/acknowledgments/
  - AcknowledgmentManager.tsx
  - AcknowledgmentList.tsx
  - AcknowledgmentForm.tsx
  - AcknowledgmentCompliance.tsx
```

---

### 7.5 Safety Campaigns and Incentives

**Priority**: Low  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Safety Campaign Service**
   - `SafetyCampaignService` class
   - Campaign creation
   - Participation tracking
   - Achievement tracking
   - Points/bonus system

2. **Create Safety Campaign API**
   - GET/POST `/api/safety/programs/campaigns` - Campaign CRUD
   - POST `/api/safety/programs/campaigns/[id]/participate` - Participate in campaign
   - GET `/api/safety/programs/campaigns/[id]/leaderboard` - Get leaderboard
   - GET `/api/safety/programs/campaigns/[id]/results` - Get results

3. **Create Safety Campaign Components**
   - `SafetyCampaignManager.tsx` - Campaign management
   - `SafetyCampaignForm.tsx` - Campaign form
   - `SafetyCampaignList.tsx` - Campaign list
   - `CampaignLeaderboard.tsx` - Leaderboard
   - `CampaignResults.tsx` - Results display

4. **Create Safety Campaign Page**
   - `/app/dashboard/safety/programs/campaigns/page.tsx`

**File Structure**:
```
lib/services/safety/
  - SafetyCampaignService.ts

components/safety/programs/campaigns/
  - SafetyCampaignManager.tsx
  - SafetyCampaignForm.tsx
  - SafetyCampaignList.tsx
  - CampaignLeaderboard.tsx
  - CampaignResults.tsx
```

---

### 7.6 Recognition Programs

**Priority**: Low  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Create Recognition Service**
   - `RecognitionService` class
   - Achievement recording
   - Certificate generation
   - Announcement system

2. **Create Recognition API**
   - GET/POST `/api/safety/programs/recognition` - Recognition CRUD
   - POST `/api/safety/programs/recognition/[id]/certificate` - Generate certificate
   - GET `/api/safety/programs/recognition/driver/[driverId]` - Get driver recognitions

3. **Create Recognition Components**
   - `RecognitionManager.tsx` - Recognition management
   - `RecognitionForm.tsx` - Recognition form
   - `RecognitionList.tsx` - Recognition list
   - `RecognitionCertificate.tsx` - Certificate display

4. **Create Recognition Page**
   - `/app/dashboard/safety/programs/recognition/page.tsx`

**File Structure**:
```
lib/services/safety/
  - RecognitionService.ts

components/safety/programs/recognition/
  - RecognitionManager.tsx
  - RecognitionForm.tsx
  - RecognitionList.tsx
  - RecognitionCertificate.tsx
```

---

## Phase 8: Documents & Work Orders (Week 11)

### 8.1 Document Management System

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Document Service** (extend existing)
   - Enhanced document management
   - Categorization
   - Tagging
   - Version control
   - Expiration tracking
   - Search functionality

2. **Create Document API** (extend existing)
   - Enhanced document endpoints
   - Search endpoint
   - Version management
   - Tag management

3. **Create Document Components** (extend existing)
   - `DocumentManager.tsx` - Enhanced document management
   - `DocumentUpload.tsx` - Enhanced upload
   - `DocumentSearch.tsx` - Search interface
   - `DocumentCategories.tsx` - Category management
   - `DocumentTags.tsx` - Tag management
   - `DocumentVersions.tsx` - Version history
   - `ExpiringDocumentsList.tsx` - Expiring documents

4. **Create Document Pages** (extend existing)
   - `/app/dashboard/safety/documents/page.tsx` (update)

**File Structure**:
```
lib/services/safety/
  - DocumentService.ts (enhanced)

components/safety/documents/
  - DocumentManager.tsx (enhanced)
  - DocumentUpload.tsx (enhanced)
  - DocumentSearch.tsx
  - DocumentCategories.tsx
  - DocumentTags.tsx
  - DocumentVersions.tsx
  - ExpiringDocumentsList.tsx
```

---

### 8.2 Work Orders (Safety-Related)

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Safety Work Order Service** (extend existing)
   - Safety work order creation
   - Defect integration
   - Mechanic sign-off
   - Compliance integration

2. **Create Safety Work Order API** (extend existing)
   - Enhanced work order endpoints
   - Sign-off endpoint
   - Defect linking

3. **Create Safety Work Order Components** (extend existing)
   - `SafetyWorkOrderManager.tsx` - Work order management
   - `SafetyWorkOrderForm.tsx` - Work order form
   - `MechanicSignOff.tsx` - Sign-off interface
   - `DriverVerification.tsx` - Driver verification
   - `WorkOrderDefectLink.tsx` - Defect linking

4. **Create Safety Work Order Page** (extend existing)
   - `/app/dashboard/safety/work-orders/page.tsx` (update)

**File Structure**:
```
lib/services/safety/
  - SafetyWorkOrderService.ts

components/safety/work-orders/
  - SafetyWorkOrderManager.tsx
  - SafetyWorkOrderForm.tsx
  - MechanicSignOff.tsx
  - DriverVerification.tsx
  - WorkOrderDefectLink.tsx
```

---

## Phase 9: Reports & Analytics (Week 12)

### 9.1 Safety Performance Dashboards

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Dashboard Service** (extend existing)
   - Enhanced dashboard metrics
   - Real-time updates
   - Chart data generation

2. **Create Dashboard API** (extend existing)
   - Enhanced dashboard endpoint
   - Chart data endpoints

3. **Create Dashboard Components** (extend existing)
   - Enhanced dashboard components
   - Chart components
   - Drill-down functionality

4. **Create Dashboard Page** (extend existing)
   - `/app/dashboard/safety/page.tsx` (update)

**File Structure**:
```
components/safety/dashboard/
  - (enhanced existing components)
  - charts/
    - AccidentFrequencyChart.tsx
    - CSAScoreTrendChart.tsx
    - ViolationCountChart.tsx
```

---

### 9.2 Accident Analysis Reports

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Accident Analysis Service**
   - `AccidentAnalysisService` class
   - Report generation
   - Analysis calculations
   - Comparative analysis

2. **Create Accident Analysis API**
   - GET `/api/safety/reports/accidents` - Get accident analysis
   - GET `/api/safety/reports/accidents/summary` - Get summary
   - GET `/api/safety/reports/accidents/comparison` - Get comparison

3. **Create Accident Analysis Components**
   - `AccidentAnalysisReport.tsx` - Analysis report
   - `AccidentSummary.tsx` - Summary display
   - `AccidentComparison.tsx` - Comparison charts
   - `AccidentCostAnalysis.tsx` - Cost analysis

4. **Create Accident Analysis Page**
   - `/app/dashboard/safety/reports/accidents/page.tsx`

**File Structure**:
```
lib/services/safety/
  - AccidentAnalysisService.ts

components/safety/reports/accidents/
  - AccidentAnalysisReport.tsx
  - AccidentSummary.tsx
  - AccidentComparison.tsx
  - AccidentCostAnalysis.tsx
```

---

### 9.3 Violation Trends

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Violation Trend Service**
   - `ViolationTrendService` class
   - Trend analysis
   - Heat map generation
   - Pattern identification

2. **Create Violation Trend API**
   - GET `/api/safety/reports/violations` - Get violation trends
   - GET `/api/safety/reports/violations/heat-map` - Get heat map data

3. **Create Violation Trend Components**
   - `ViolationTrendReport.tsx` - Trend report
   - `ViolationHeatMap.tsx` - Heat map
   - `ViolationPatterns.tsx` - Pattern analysis

4. **Create Violation Trend Page**
   - `/app/dashboard/safety/reports/violations/page.tsx`

**File Structure**:
```
lib/services/safety/
  - ViolationTrendService.ts

components/safety/reports/violations/
  - ViolationTrendReport.tsx
  - ViolationHeatMap.tsx
  - ViolationPatterns.tsx
```

---

### 9.4 Driver Scorecards

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Driver Scorecard Service**
   - `DriverScorecardService` class
   - Score calculation
   - Ranking system
   - Performance analysis

2. **Create Driver Scorecard API**
   - GET `/api/safety/reports/driver-scorecards` - Get scorecards
   - GET `/api/safety/reports/driver-scorecards/[driverId]` - Get driver scorecard
   - GET `/api/safety/reports/driver-scorecards/rankings` - Get rankings

3. **Create Driver Scorecard Components**
   - `DriverScorecardReport.tsx` - Scorecard report
   - `DriverScorecardCard.tsx` - Individual scorecard
   - `DriverRankings.tsx` - Rankings display

4. **Create Driver Scorecard Page**
   - `/app/dashboard/safety/reports/driver-scorecards/page.tsx`

**File Structure**:
```
lib/services/safety/
  - DriverScorecardService.ts

components/safety/reports/driver-scorecards/
  - DriverScorecardReport.tsx
  - DriverScorecardCard.tsx
  - DriverRankings.tsx
```

---

### 9.5 Compliance Reports

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Create Compliance Report Service**
   - `ComplianceReportService` class
   - Report generation
   - PDF/Excel export
   - Scheduling

2. **Create Compliance Report API**
   - GET `/api/safety/reports/compliance` - Get compliance reports
   - POST `/api/safety/reports/compliance/generate` - Generate report
   - GET `/api/safety/reports/compliance/export` - Export report

3. **Create Compliance Report Components**
   - `ComplianceReportManager.tsx` - Report management
   - `ComplianceReportViewer.tsx` - Report viewer
   - `ComplianceReportScheduler.tsx` - Report scheduler

4. **Create Compliance Report Page**
   - `/app/dashboard/safety/reports/compliance/page.tsx`

**File Structure**:
```
lib/services/safety/
  - ComplianceReportService.ts

components/safety/reports/compliance/
  - ComplianceReportManager.tsx
  - ComplianceReportViewer.tsx
  - ComplianceReportScheduler.tsx
```

---

### 9.6 Custom Report Builder

**Priority**: Medium  
**Estimated Time**: 4-5 days

#### Tasks:
1. **Create Custom Report Service**
   - `CustomReportService` class
   - Query builder
   - Report generation
   - Report saving

2. **Create Custom Report API**
   - GET/POST `/api/safety/reports/custom` - Custom report CRUD
   - POST `/api/safety/reports/custom/generate` - Generate report
   - GET `/api/safety/reports/custom/fields` - Get available fields

3. **Create Custom Report Components**
   - `CustomReportBuilder.tsx` - Report builder UI
   - `FieldSelector.tsx` - Field selection
   - `FilterBuilder.tsx` - Filter builder
   - `ReportPreview.tsx` - Report preview
   - `ReportSaver.tsx` - Report saving

4. **Create Custom Report Page**
   - `/app/dashboard/safety/reports/custom/page.tsx`

**File Structure**:
```
lib/services/safety/
  - CustomReportService.ts

components/safety/reports/custom/
  - CustomReportBuilder.tsx
  - FieldSelector.tsx
  - FilterBuilder.tsx
  - ReportPreview.tsx
  - ReportSaver.tsx
```

---

## Phase 10: Integration & Testing (Weeks 13-14)

### 10.1 External Integrations

**Priority**: High  
**Estimated Time**: 5-6 days

#### Tasks:
1. **ELD Provider Integration**
   - Implement ELD provider interfaces
   - Provider-specific adapters
   - Data synchronization
   - Error handling

2. **FMCSA SMS Integration**
   - API integration
   - Data sync
   - Error handling

3. **FMCSA Clearinghouse Integration**
   - API integration
   - Query management
   - Report management

4. **Email Service Integration**
   - SendGrid/AWS SES setup
   - Email templates
   - Delivery tracking

5. **SMS Service Integration**
   - Twilio setup
   - SMS templates
   - Delivery tracking

6. **Document Storage Integration**
   - S3-compatible storage setup
   - Upload/download
   - Access control

7. **OCR Service Integration**
   - OCR service setup
   - Document processing
   - Text extraction

**File Structure**:
```
lib/integrations/
  - eld/
    - ELDProviderInterface.ts
    - providers/
      - ProviderA.ts
      - ProviderB.ts
  - fmcsa/
    - FMCSASMSService.ts
    - FMCSAClearinghouseService.ts
  - email/
    - EmailService.ts
  - sms/
    - SMSService.ts
  - storage/
    - DocumentStorageService.ts
  - ocr/
    - OCRService.ts
```

---

### 10.2 Mobile App Integration

**Priority**: High  
**Estimated Time**: 4-5 days

#### Tasks:
1. **DVIR Mobile Forms**
   - Mobile-optimized DVIR forms
   - Offline capability
   - Photo capture
   - GPS integration

2. **Training Access**
   - Mobile training material access
   - Certificate viewing

3. **Driver Portal**
   - Driver dashboard
   - Document access
   - Training history
   - HOS status

**File Structure**:
```
app/(mobile)/driver/safety/
  - dvir/
    - page.tsx
    - new/page.tsx
  - training/
    - page.tsx
  - documents/
    - page.tsx
```

---

### 10.3 Testing

**Priority**: Critical  
**Estimated Time**: 5-6 days

#### Tasks:
1. **Unit Tests**
   - Service tests
   - Utility function tests
   - Component tests

2. **Integration Tests**
   - API endpoint tests
   - Database integration tests
   - External service integration tests

3. **E2E Tests**
   - Critical user flows
   - Safety workflows
   - Compliance workflows

4. **Compliance Testing**
   - DOT compliance verification
   - Data accuracy verification
   - Audit trail verification

**File Structure**:
```
__tests__/
  - unit/
    - services/
    - utils/
    - components/
  - integration/
    - api/
    - database/
    - integrations/
  - e2e/
    - safety/
    - compliance/
```

---

### 10.4 Performance Optimization

**Priority**: High  
**Estimated Time**: 3-4 days

#### Tasks:
1. **Database Optimization**
   - Index optimization
   - Query optimization
   - Connection pooling

2. **Caching Strategy**
   - Redis setup
   - Cache invalidation
   - Cache warming

3. **API Optimization**
   - Response caching
   - Pagination
   - Lazy loading

4. **Frontend Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization

---

## Phase 11: Documentation & Training (Week 15)

### 11.1 User Documentation

**Priority**: Medium  
**Estimated Time**: 3-4 days

#### Tasks:
1. **User Guides**
   - Dashboard guide
   - Driver compliance guide
   - Vehicle safety guide
   - Incident reporting guide
   - Compliance guide
   - Reports guide

2. **Video Tutorials**
   - Feature walkthroughs
   - Common workflows
   - Best practices

3. **FAQ**
   - Common questions
   - Troubleshooting
   - Support contacts

---

### 11.2 Admin Documentation

**Priority**: Medium  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Admin Guides**
   - System configuration
   - User management
   - Permission setup
   - Integration setup

2. **Technical Documentation**
   - API documentation
   - Database schema
   - Architecture overview
   - Deployment guide

---

## Phase 12: Deployment & Go-Live (Week 16)

### 12.1 Pre-Deployment

**Priority**: Critical  
**Estimated Time**: 2-3 days

#### Tasks:
1. **Environment Setup**
   - Production environment
   - Database setup
   - External service configuration
   - Security configuration

2. **Data Migration**
   - Historical data import
   - Data validation
   - Data cleanup

3. **User Training**
   - Safety department training
   - Driver training
   - Admin training

---

### 12.2 Deployment

**Priority**: Critical  
**Estimated Time**: 1-2 days

#### Tasks:
1. **Deployment Process**
   - Code deployment
   - Database migration
   - Service verification
   - Rollback plan

2. **Post-Deployment**
   - System monitoring
   - Issue resolution
   - Performance monitoring
   - User support

---

## Success Metrics

### Phase Completion Criteria

Each phase must meet these criteria before moving to the next:

1. **Functionality**: All features working as specified
2. **Testing**: All tests passing
3. **Documentation**: User and technical documentation complete
4. **Performance**: Meets performance requirements
5. **Security**: Security review passed
6. **Compliance**: DOT compliance verified

### Final Acceptance Criteria

1. **100% Feature Completion**: All features from specification implemented
2. **Zero Critical Bugs**: No blocking issues
3. **Performance**: All pages load in < 2 seconds
4. **Uptime**: 99.9% availability
5. **User Satisfaction**: Safety department approval
6. **Compliance**: DOT audit ready

---

## Risk Management

### Identified Risks

1. **External API Dependencies**
   - Risk: FMCSA/ELD provider API changes
   - Mitigation: Abstract interfaces, fallback mechanisms

2. **Data Migration Complexity**
   - Risk: Historical data import issues
   - Mitigation: Phased migration, validation tools

3. **Performance at Scale**
   - Risk: System slow with large datasets
   - Mitigation: Performance testing, optimization

4. **Integration Failures**
   - Risk: External service outages
   - Mitigation: Retry logic, fallback mechanisms

5. **Compliance Gaps**
   - Risk: Missing DOT requirements
   - Mitigation: Compliance review, expert consultation

---

## Resource Requirements

### Team Composition

- **Backend Developers**: 2-3
- **Frontend Developers**: 2-3
- **Full-Stack Developers**: 1-2
- **QA Engineers**: 1-2
- **DevOps Engineer**: 1
- **Safety Compliance Expert**: 1 (consultant)

### Technology Stack

- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **Frontend**: React, Next.js, Tailwind CSS
- **External Services**: SendGrid, Twilio, S3, OCR service
- **Infrastructure**: AWS/Vercel, Redis, Cron jobs

---

## Timeline Summary

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Foundation | 2 weeks | Critical |
| Phase 2: Dashboard & Driver Compliance | 2 weeks | High |
| Phase 3: Vehicle Safety | 2 weeks | High |
| Phase 4: Incidents & Accidents | 1 week | High |
| Phase 5: DOT Compliance | 1 week | High |
| Phase 6: Insurance & Claims | 1 week | Medium |
| Phase 7: Safety Programs | 1 week | Medium |
| Phase 8: Documents & Work Orders | 1 week | High |
| Phase 9: Reports & Analytics | 1 week | High |
| Phase 10: Integration & Testing | 2 weeks | Critical |
| Phase 11: Documentation & Training | 1 week | Medium |
| Phase 12: Deployment & Go-Live | 1 week | Critical |
| **Total** | **16 weeks** | |

---

## Next Steps

1. **Review and Approve Plan**: Stakeholder review of integration plan
2. **Resource Allocation**: Assign team members to phases
3. **Kickoff Meeting**: Team alignment and phase 1 start
4. **Daily Standups**: Daily progress tracking
5. **Weekly Reviews**: Phase completion reviews
6. **Continuous Testing**: Test as you build
7. **User Feedback**: Early and often feedback from safety department

---

## Conclusion

This integration plan provides a comprehensive, phase-by-phase approach to implementing the complete Safety Management System. Each phase builds upon the previous, ensuring a solid foundation and systematic implementation of all features. The plan emphasizes modular design, single responsibility, and thorough testing to ensure 100% functionality for the safety department.

