# Import Mapping Audit Report

Generated: 2025-11-23T20:28:21.097Z

## Summary

- Total Entities Analyzed: 7
- Entities with Errors: 7
- Total Errors: 197
- Total Warnings: 414
- Missing Required Fields: 197

## Critical Issues - Missing Required Fields

⚠️ **These fields are REQUIRED by the database but are NOT imported. Import will FAIL without these fields.**

### loads (Load)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `customerId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `loadType`

- **Type**: enum:LoadType
- **Has Default**: Yes
- **Default Value**: FTL
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `equipmentType`

- **Type**: enum:EquipmentType
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `deliveryCompany`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `weight`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `hazmat`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `revenue`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `fuelAdvance`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `expenses`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `serviceFee`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `accountingSyncStatus`

- **Type**: enum:AccountingSyncStatus
- **Has Default**: Yes
- **Default Value**: NOT_SYNCED
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `totalExpenses`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `netProfit`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `readyForSettlement`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `revenuePerMile`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `lastNote`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `onTimeDelivery`

- **Type**: Boolean?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `stopsCount`

- **Type**: Int?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `totalPay`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `ediSent`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `ediReceived`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `documents`

- **Type**: Document
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `statusHistory`

- **Type**: LoadStatusHistory
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `stops`

- **Type**: LoadStop
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `breakdowns`

- **Type**: Breakdown
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `safetyIncidents`

- **Type**: SafetyIncident
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tags`

- **Type**: LoadTag
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `cargoClaims`

- **Type**: CargoClaim
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `accessorialCharges`

- **Type**: AccessorialCharge
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `segments`

- **Type**: LoadSegment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverAdvances`

- **Type**: DriverAdvance
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loadExpenses`

- **Type**: LoadExpense
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### drivers (Driver)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `userId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `driverNumber`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `licenseNumber`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `licenseExpiry`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tenure`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `localDriver`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `medicalCardExpiry`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `cdlExperience`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `dlClass`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverType`

- **Type**: enum:DriverType
- **Has Default**: Yes
- **Default Value**: COMPANY_DRIVER
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `endorsements`

- **Type**: String[]
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverFacingCamera`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `employeeStatus`

- **Type**: enum:EmployeeStatus
- **Has Default**: Yes
- **Default Value**: ACTIVE
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `assignmentStatus`

- **Type**: enum:AssignmentStatus
- **Has Default**: Yes
- **Default Value**: READY_TO_GO
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `mcNumberId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `teamDriver`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverTags`

- **Type**: String[]
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `totalLoads`

- **Type**: Int
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `totalMiles`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `onTimePercentage`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 100
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `payType`

- **Type**: enum:PayType
- **Has Default**: Yes
- **Default Value**: PER_MILE
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `payRate`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `escrowBalance`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `advanceLimit`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 1000
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `isActive`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: true
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loads`

- **Type**: Load
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loadSegments`

- **Type**: LoadSegment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `hosRecords`

- **Type**: HOSRecord
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `documents`

- **Type**: Document
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `settlements`

- **Type**: Settlement
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `fuelEntries`

- **Type**: FuelEntry
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `breakdowns`

- **Type**: Breakdown
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `inspections`

- **Type**: Inspection
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `safetyIncidents`

- **Type**: SafetyIncident
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `safetyTrainings`

- **Type**: SafetyTraining
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `truckHistory`

- **Type**: DriverTruckHistory
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `trailerHistory`

- **Type**: DriverTrailerHistory
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `comments`

- **Type**: DriverComment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tags`

- **Type**: DriverTag
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `communications`

- **Type**: Communication
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverAdvances`

- **Type**: DriverAdvance
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `medicalCards`

- **Type**: MedicalCard
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `mvrRecords`

- **Type**: MVRRecord
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `drugAlcoholTests`

- **Type**: DrugAlcoholTest
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `testingPoolDrivers`

- **Type**: TestingPoolDriver
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `randomSelectedDrivers`

- **Type**: RandomSelectedDriver
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `fmcsaclearinghouseQueries`

- **Type**: FMCSAClearinghouseQuery
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `hosViolations`

- **Type**: HOSViolation
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `annualReviews`

- **Type**: AnnualReview
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `dvirs`

- **Type**: DVIR
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `roadsideInspections`

- **Type**: RoadsideInspection
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `outOfServiceOrders`

- **Type**: OutOfServiceOrder
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `nearMisses`

- **Type**: NearMiss
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `propertyDamages`

- **Type**: PropertyDamage
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `meetingAttendance`

- **Type**: MeetingAttendance
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `policyAcknowledgments`

- **Type**: PolicyAcknowledgment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `campaignParticipants`

- **Type**: CampaignParticipant
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `safetyRecognitions`

- **Type**: SafetyRecognition
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `iftaEntries`

- **Type**: IFTAEntry
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### trucks (Truck)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `model`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `year`

- **Type**: Int
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `licensePlate`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `mcNumberId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `equipmentType`

- **Type**: enum:EquipmentType
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `capacity`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `ownership`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `odometerReading`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `registrationExpiry`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `insuranceExpiry`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `inspectionExpiry`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `eldInstalled`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `gpsInstalled`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `fuelCard`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `legacyTags`

- **Type**: Json?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `warnings`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `isActive`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: true
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loads`

- **Type**: Load
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loadSegments`

- **Type**: LoadSegment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `breakdowns`

- **Type**: Breakdown
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `documents`

- **Type**: Document
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `inspections`

- **Type**: Inspection
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `safetyIncidents`

- **Type**: SafetyIncident
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverTruckHistory`

- **Type**: DriverTruckHistory
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tags`

- **Type**: TruckTag
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `fuelEntries`

- **Type**: FuelEntry
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `dvirs`

- **Type**: DVIR
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `roadsideInspections`

- **Type**: RoadsideInspection
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `outOfServiceOrders`

- **Type**: OutOfServiceOrder
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `defects`

- **Type**: Defect
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `nearMisses`

- **Type**: NearMiss
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `propertyDamages`

- **Type**: PropertyDamage
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `maintenanceRecords`

- **Type**: MaintenanceRecord
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `iftaEntries`

- **Type**: IFTAEntry
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### trailers (Trailer)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `model`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `licensePlate`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `mcNumberId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `ownership`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `assignedTruckId`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `operatorDriverId`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `legacyTags`

- **Type**: Json?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `isActive`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: true
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loads`

- **Type**: Load
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `driverTrailerHistory`

- **Type**: DriverTrailerHistory
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `breakdowns`

- **Type**: Breakdown
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### customers (Customer)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `customerNumber`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `website`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `address`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `billingEmails`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `paymentTerms`

- **Type**: Int
- **Has Default**: Yes
- **Default Value**: 30
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `paymentTermsType`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `discountPercentage`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `discountDays`

- **Type**: Int?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `creditAlertThreshold`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 80
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `creditHold`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `creditRate`

- **Type**: Float?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `rateConfirmationRequired`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `legacyTags`

- **Type**: Json?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `comments`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `scac`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `portalEnabled`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `ediEnabled`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `totalLoads`

- **Type**: Int
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `totalRevenue`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `isActive`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: true
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `loads`

- **Type**: Load
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `invoices`

- **Type**: Invoice
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `contacts`

- **Type**: CustomerContact
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tags`

- **Type**: CustomerTag
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### invoices (Invoice)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `customerId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `invoiceNumber`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `loadIds`

- **Type**: String[]
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `subtotal`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `tax`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `total`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `amountPaid`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `balance`

- **Type**: Float
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `invoiceDate`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `dueDate`

- **Type**: DateTime
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `qbSynced`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `reconciliationStatus`

- **Type**: enum:ReconciliationStatus
- **Has Default**: Yes
- **Default Value**: NOT_RECONCILED
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `loadId`

- **Type**: String?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `expectedPaymentDate`

- **Type**: DateTime?
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `factoringStatus`

- **Type**: enum:FactoringStatus
- **Has Default**: Yes
- **Default Value**: NOT_FACTORED
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Enum fields require valid values - missing enum will cause validation errors

#### ❌ Missing Required Field: `shortPayAmount`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `shortPayApproved`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `payments`

- **Type**: Payment
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `batchItems`

- **Type**: InvoiceBatchItem
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `reconciliations`

- **Type**: Reconciliation
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `tags`

- **Type**: InvoiceTag
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `accessorialCharges`

- **Type**: AccessorialCharge
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

### vendors (Vendor)

**File**: `app/api/import-export/[entity]/route.ts`

#### ❌ Missing Required Field: `companyId`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `vendorNumber`

- **Type**: String
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - String fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `paymentTerms`

- **Type**: Int
- **Has Default**: Yes
- **Default Value**: 30
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `w9OnFile`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: false
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `totalOrders`

- **Type**: Int
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `totalSpent`

- **Type**: Float
- **Has Default**: Yes
- **Default Value**: 0
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field
  - Numeric fields without defaults will cause NULL constraint errors

#### ❌ Missing Required Field: `contacts`

- **Type**: VendorContact
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `inventoryItems`

- **Type**: InventoryItem
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `transactions`

- **Type**: InventoryTransaction
- **Has Default**: No
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

#### ❌ Missing Required Field: `isActive`

- **Type**: Boolean
- **Has Default**: Yes
- **Default Value**: true
- **Potential Issues**:
  - Database constraint violation - field is required but not imported
  - Import will fail when creating records without this field

## Import Field Mappings

### loads (Load)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| loadNumber | String | ✅ | Load ID, Load ID, load_id... | No | None |
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| customerId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| tripId | String? | ✅ | Trip ID, Trip Id, trip_id... | No | None |
| mcNumber | String? | ✅ | MC Number, mc_number, MC #... | No | None |
| status | enum:LoadStatus | ✅ | status, Status | Yes | None |
| loadType | enum:LoadType | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| equipmentType | enum:EquipmentType | ❌ | None | No | Database constraint violation - field is required but not imported |
| pickupCompany | String? | ✅ | Pickup company, Pickup Company, pickup_company... | No | None |
| deliveryCompany | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| weight | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| hazmat | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| revenue | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| fuelAdvance | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| expenses | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| serviceFee | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| accountingSyncStatus | enum:AccountingSyncStatus | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalExpenses | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| netProfit | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| readyForSettlement | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| revenuePerMile | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| lastNote | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| onTimeDelivery | Boolean? | ❌ | None | No | Database constraint violation - field is required but not imported |
| shipmentId | String? | ✅ | Shipment ID, Shipment ID, shipment_id | No | None |
| stopsCount | Int? | ❌ | None | No | Database constraint violation - field is required but not imported |
| totalPay | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| lastUpdate | DateTime? | ✅ | Last Update, last_update, Last update... | No | None |
| ediSent | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| ediReceived | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| documents | Document | ❌ | None | No | Database constraint violation - field is required but not imported |
| statusHistory | LoadStatusHistory | ❌ | None | No | Database constraint violation - field is required but not imported |
| stops | LoadStop | ❌ | None | No | Database constraint violation - field is required but not imported |
| breakdowns | Breakdown | ❌ | None | No | Database constraint violation - field is required but not imported |
| safetyIncidents | SafetyIncident | ❌ | None | No | Database constraint violation - field is required but not imported |
| tags | LoadTag | ❌ | None | No | Database constraint violation - field is required but not imported |
| cargoClaims | CargoClaim | ❌ | None | No | Database constraint violation - field is required but not imported |
| accessorialCharges | AccessorialCharge | ❌ | None | No | Database constraint violation - field is required but not imported |
| segments | LoadSegment | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverAdvances | DriverAdvance | ❌ | None | No | Database constraint violation - field is required but not imported |
| loadExpenses | LoadExpense | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'customerId' (String) is not imported
- ❌ Required field 'loadType' (enum:LoadType) is not imported
- ❌ Required field 'equipmentType' (enum:EquipmentType) is not imported
- ❌ Required field 'deliveryCompany' (String?) is not imported
- ❌ Required field 'weight' (Float) is not imported
- ❌ Required field 'hazmat' (Boolean) is not imported
- ❌ Required field 'revenue' (Float) is not imported
- ❌ Required field 'fuelAdvance' (Float) is not imported
- ❌ Required field 'expenses' (Float) is not imported
- ❌ Required field 'serviceFee' (Float?) is not imported
- ❌ Required field 'accountingSyncStatus' (enum:AccountingSyncStatus) is not imported
- ❌ Required field 'totalExpenses' (Float) is not imported
- ❌ Required field 'netProfit' (Float?) is not imported
- ❌ Required field 'readyForSettlement' (Boolean) is not imported
- ❌ Required field 'revenuePerMile' (Float?) is not imported
- ❌ Required field 'lastNote' (String?) is not imported
- ❌ Required field 'onTimeDelivery' (Boolean?) is not imported
- ❌ Required field 'stopsCount' (Int?) is not imported
- ❌ Required field 'totalPay' (Float?) is not imported
- ❌ Required field 'ediSent' (Boolean) is not imported
- ❌ Required field 'ediReceived' (Boolean) is not imported
- ❌ Required field 'documents' (Document) is not imported
- ❌ Required field 'statusHistory' (LoadStatusHistory) is not imported
- ❌ Required field 'stops' (LoadStop) is not imported
- ❌ Required field 'breakdowns' (Breakdown) is not imported
- ❌ Required field 'safetyIncidents' (SafetyIncident) is not imported
- ❌ Required field 'tags' (LoadTag) is not imported
- ❌ Required field 'cargoClaims' (CargoClaim) is not imported
- ❌ Required field 'accessorialCharges' (AccessorialCharge) is not imported
- ❌ Required field 'segments' (LoadSegment) is not imported
- ❌ Required field 'driverAdvances' (DriverAdvance) is not imported
- ❌ Required field 'loadExpenses' (LoadExpense) is not imported

#### Warnings

- ⚠️ Field 'name' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'city' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'zip' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'billingAddress' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'vin' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'make' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'state' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'fleetStatus' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'ownerName' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'notes' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'type' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'email' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Load'
- ⚠️ Field 'phone' is imported but doesn't exist in schema model 'Load'

### drivers (Driver)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| userId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverNumber | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| licenseNumber | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| licenseState | String | ✅ | License State, License State, license_state... | No | None |
| licenseExpiry | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| tenure | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| localDriver | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| medicalCardExpiry | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| cdlExperience | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| dlClass | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverType | enum:DriverType | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| endorsements | String[] | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverFacingCamera | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| status | enum:DriverStatus | ✅ | status, Status | Yes | None |
| employeeStatus | enum:EmployeeStatus | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| assignmentStatus | enum:AssignmentStatus | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| mcNumberId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| teamDriver | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| driverTags | String[] | ❌ | None | No | Database constraint violation - field is required but not imported |
| totalLoads | Int | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalMiles | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| onTimePercentage | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| payType | enum:PayType | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| payRate | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverTariff | String? | ✅ | Driver Tariff, Driver tariff, driver_tariff... | No | None |
| payTo | String? | ✅ | Pay to, Pay To, pay_to... | No | None |
| escrowBalance | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| advanceLimit | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| isActive | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| loads | Load | ❌ | None | No | Database constraint violation - field is required but not imported |
| loadSegments | LoadSegment | ❌ | None | No | Database constraint violation - field is required but not imported |
| hosRecords | HOSRecord | ❌ | None | No | Database constraint violation - field is required but not imported |
| documents | Document | ❌ | None | No | Database constraint violation - field is required but not imported |
| settlements | Settlement | ❌ | None | No | Database constraint violation - field is required but not imported |
| fuelEntries | FuelEntry | ❌ | None | No | Database constraint violation - field is required but not imported |
| breakdowns | Breakdown | ❌ | None | No | Database constraint violation - field is required but not imported |
| inspections | Inspection | ❌ | None | No | Database constraint violation - field is required but not imported |
| safetyIncidents | SafetyIncident | ❌ | None | No | Database constraint violation - field is required but not imported |
| safetyTrainings | SafetyTraining | ❌ | None | No | Database constraint violation - field is required but not imported |
| truckHistory | DriverTruckHistory | ❌ | None | No | Database constraint violation - field is required but not imported |
| trailerHistory | DriverTrailerHistory | ❌ | None | No | Database constraint violation - field is required but not imported |
| comments | DriverComment | ❌ | None | No | Database constraint violation - field is required but not imported |
| tags | DriverTag | ❌ | None | No | Database constraint violation - field is required but not imported |
| communications | Communication | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverAdvances | DriverAdvance | ❌ | None | No | Database constraint violation - field is required but not imported |
| medicalCards | MedicalCard | ❌ | None | No | Database constraint violation - field is required but not imported |
| mvrRecords | MVRRecord | ❌ | None | No | Database constraint violation - field is required but not imported |
| drugAlcoholTests | DrugAlcoholTest | ❌ | None | No | Database constraint violation - field is required but not imported |
| testingPoolDrivers | TestingPoolDriver | ❌ | None | No | Database constraint violation - field is required but not imported |
| randomSelectedDrivers | RandomSelectedDriver | ❌ | None | No | Database constraint violation - field is required but not imported |
| fmcsaclearinghouseQueries | FMCSAClearinghouseQuery | ❌ | None | No | Database constraint violation - field is required but not imported |
| hosViolations | HOSViolation | ❌ | None | No | Database constraint violation - field is required but not imported |
| annualReviews | AnnualReview | ❌ | None | No | Database constraint violation - field is required but not imported |
| dvirs | DVIR | ❌ | None | No | Database constraint violation - field is required but not imported |
| roadsideInspections | RoadsideInspection | ❌ | None | No | Database constraint violation - field is required but not imported |
| outOfServiceOrders | OutOfServiceOrder | ❌ | None | No | Database constraint violation - field is required but not imported |
| nearMisses | NearMiss | ❌ | None | No | Database constraint violation - field is required but not imported |
| propertyDamages | PropertyDamage | ❌ | None | No | Database constraint violation - field is required but not imported |
| meetingAttendance | MeetingAttendance | ❌ | None | No | Database constraint violation - field is required but not imported |
| policyAcknowledgments | PolicyAcknowledgment | ❌ | None | No | Database constraint violation - field is required but not imported |
| campaignParticipants | CampaignParticipant | ❌ | None | No | Database constraint violation - field is required but not imported |
| safetyRecognitions | SafetyRecognition | ❌ | None | No | Database constraint violation - field is required but not imported |
| iftaEntries | IFTAEntry | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'userId' (String) is not imported
- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'driverNumber' (String) is not imported
- ❌ Required field 'licenseNumber' (String) is not imported
- ❌ Required field 'licenseExpiry' (DateTime) is not imported
- ❌ Required field 'tenure' (String?) is not imported
- ❌ Required field 'localDriver' (Boolean) is not imported
- ❌ Required field 'medicalCardExpiry' (DateTime) is not imported
- ❌ Required field 'cdlExperience' (String?) is not imported
- ❌ Required field 'dlClass' (String?) is not imported
- ❌ Required field 'driverType' (enum:DriverType) is not imported
- ❌ Required field 'endorsements' (String[]) is not imported
- ❌ Required field 'driverFacingCamera' (String?) is not imported
- ❌ Required field 'employeeStatus' (enum:EmployeeStatus) is not imported
- ❌ Required field 'assignmentStatus' (enum:AssignmentStatus) is not imported
- ❌ Required field 'mcNumberId' (String) is not imported
- ❌ Required field 'teamDriver' (Boolean) is not imported
- ❌ Required field 'driverTags' (String[]) is not imported
- ❌ Required field 'totalLoads' (Int) is not imported
- ❌ Required field 'totalMiles' (Float) is not imported
- ❌ Required field 'onTimePercentage' (Float) is not imported
- ❌ Required field 'payType' (enum:PayType) is not imported
- ❌ Required field 'payRate' (Float) is not imported
- ❌ Required field 'escrowBalance' (Float) is not imported
- ❌ Required field 'advanceLimit' (Float) is not imported
- ❌ Required field 'isActive' (Boolean) is not imported
- ❌ Required field 'loads' (Load) is not imported
- ❌ Required field 'loadSegments' (LoadSegment) is not imported
- ❌ Required field 'hosRecords' (HOSRecord) is not imported
- ❌ Required field 'documents' (Document) is not imported
- ❌ Required field 'settlements' (Settlement) is not imported
- ❌ Required field 'fuelEntries' (FuelEntry) is not imported
- ❌ Required field 'breakdowns' (Breakdown) is not imported
- ❌ Required field 'inspections' (Inspection) is not imported
- ❌ Required field 'safetyIncidents' (SafetyIncident) is not imported
- ❌ Required field 'safetyTrainings' (SafetyTraining) is not imported
- ❌ Required field 'truckHistory' (DriverTruckHistory) is not imported
- ❌ Required field 'trailerHistory' (DriverTrailerHistory) is not imported
- ❌ Required field 'comments' (DriverComment) is not imported
- ❌ Required field 'tags' (DriverTag) is not imported
- ❌ Required field 'communications' (Communication) is not imported
- ❌ Required field 'driverAdvances' (DriverAdvance) is not imported
- ❌ Required field 'medicalCards' (MedicalCard) is not imported
- ❌ Required field 'mvrRecords' (MVRRecord) is not imported
- ❌ Required field 'drugAlcoholTests' (DrugAlcoholTest) is not imported
- ❌ Required field 'testingPoolDrivers' (TestingPoolDriver) is not imported
- ❌ Required field 'randomSelectedDrivers' (RandomSelectedDriver) is not imported
- ❌ Required field 'fmcsaclearinghouseQueries' (FMCSAClearinghouseQuery) is not imported
- ❌ Required field 'hosViolations' (HOSViolation) is not imported
- ❌ Required field 'annualReviews' (AnnualReview) is not imported
- ❌ Required field 'dvirs' (DVIR) is not imported
- ❌ Required field 'roadsideInspections' (RoadsideInspection) is not imported
- ❌ Required field 'outOfServiceOrders' (OutOfServiceOrder) is not imported
- ❌ Required field 'nearMisses' (NearMiss) is not imported
- ❌ Required field 'propertyDamages' (PropertyDamage) is not imported
- ❌ Required field 'meetingAttendance' (MeetingAttendance) is not imported
- ❌ Required field 'policyAcknowledgments' (PolicyAcknowledgment) is not imported
- ❌ Required field 'campaignParticipants' (CampaignParticipant) is not imported
- ❌ Required field 'safetyRecognitions' (SafetyRecognition) is not imported
- ❌ Required field 'iftaEntries' (IFTAEntry) is not imported

#### Warnings

- ⚠️ Field 'name' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'zip' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'billingAddress' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'vin' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'make' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'fleetStatus' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'ownerName' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'trailerNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'type' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'email' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Driver'
- ⚠️ Field 'phone' is imported but doesn't exist in schema model 'Driver'

### trucks (Truck)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| truckNumber | String | ✅ | Truck, truck, Truck Number... | No | None |
| vin | String | ✅ | vin, Vin, VIN | No | None |
| make | String | ✅ | make, Make | No | None |
| model | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| year | Int | ❌ | None | No | Database constraint violation - field is required but not imported |
| licensePlate | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| state | String | ✅ | state, State, license_state... | No | None |
| mcNumberId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| equipmentType | enum:EquipmentType | ❌ | None | No | Database constraint violation - field is required but not imported |
| capacity | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| status | enum:TruckStatus | ✅ | status, Status | Yes | None |
| fleetStatus | String? | ✅ | Fleet Status, Fleet Status, fleet_status | No | None |
| ownership | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| ownerName | String? | ✅ | owner_name, Owner name, Owner Name... | No | None |
| odometerReading | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| registrationExpiry | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| insuranceExpiry | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| inspectionExpiry | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| eldInstalled | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| gpsInstalled | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| tollTagNumber | String? | ✅ | Toll tag number, Toll Tag Number, toll_tag_number | No | None |
| fuelCard | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| legacyTags | Json? | ❌ | None | No | Database constraint violation - field is required but not imported |
| notes | String? | ✅ | Notes, notes | No | None |
| warnings | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| isActive | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| loads | Load | ❌ | None | No | Database constraint violation - field is required but not imported |
| loadSegments | LoadSegment | ❌ | None | No | Database constraint violation - field is required but not imported |
| breakdowns | Breakdown | ❌ | None | No | Database constraint violation - field is required but not imported |
| documents | Document | ❌ | None | No | Database constraint violation - field is required but not imported |
| inspections | Inspection | ❌ | None | No | Database constraint violation - field is required but not imported |
| safetyIncidents | SafetyIncident | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverTruckHistory | DriverTruckHistory | ❌ | None | No | Database constraint violation - field is required but not imported |
| tags | TruckTag | ❌ | None | No | Database constraint violation - field is required but not imported |
| fuelEntries | FuelEntry | ❌ | None | No | Database constraint violation - field is required but not imported |
| dvirs | DVIR | ❌ | None | No | Database constraint violation - field is required but not imported |
| roadsideInspections | RoadsideInspection | ❌ | None | No | Database constraint violation - field is required but not imported |
| outOfServiceOrders | OutOfServiceOrder | ❌ | None | No | Database constraint violation - field is required but not imported |
| defects | Defect | ❌ | None | No | Database constraint violation - field is required but not imported |
| nearMisses | NearMiss | ❌ | None | No | Database constraint violation - field is required but not imported |
| propertyDamages | PropertyDamage | ❌ | None | No | Database constraint violation - field is required but not imported |
| maintenanceRecords | MaintenanceRecord | ❌ | None | No | Database constraint violation - field is required but not imported |
| iftaEntries | IFTAEntry | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'model' (String) is not imported
- ❌ Required field 'year' (Int) is not imported
- ❌ Required field 'licensePlate' (String) is not imported
- ❌ Required field 'mcNumberId' (String) is not imported
- ❌ Required field 'equipmentType' (enum:EquipmentType) is not imported
- ❌ Required field 'capacity' (Float) is not imported
- ❌ Required field 'ownership' (String?) is not imported
- ❌ Required field 'odometerReading' (Float) is not imported
- ❌ Required field 'registrationExpiry' (DateTime) is not imported
- ❌ Required field 'insuranceExpiry' (DateTime) is not imported
- ❌ Required field 'inspectionExpiry' (DateTime) is not imported
- ❌ Required field 'eldInstalled' (Boolean) is not imported
- ❌ Required field 'gpsInstalled' (Boolean) is not imported
- ❌ Required field 'fuelCard' (String?) is not imported
- ❌ Required field 'legacyTags' (Json?) is not imported
- ❌ Required field 'warnings' (String?) is not imported
- ❌ Required field 'isActive' (Boolean) is not imported
- ❌ Required field 'loads' (Load) is not imported
- ❌ Required field 'loadSegments' (LoadSegment) is not imported
- ❌ Required field 'breakdowns' (Breakdown) is not imported
- ❌ Required field 'documents' (Document) is not imported
- ❌ Required field 'inspections' (Inspection) is not imported
- ❌ Required field 'safetyIncidents' (SafetyIncident) is not imported
- ❌ Required field 'driverTruckHistory' (DriverTruckHistory) is not imported
- ❌ Required field 'tags' (TruckTag) is not imported
- ❌ Required field 'fuelEntries' (FuelEntry) is not imported
- ❌ Required field 'dvirs' (DVIR) is not imported
- ❌ Required field 'roadsideInspections' (RoadsideInspection) is not imported
- ❌ Required field 'outOfServiceOrders' (OutOfServiceOrder) is not imported
- ❌ Required field 'defects' (Defect) is not imported
- ❌ Required field 'nearMisses' (NearMiss) is not imported
- ❌ Required field 'propertyDamages' (PropertyDamage) is not imported
- ❌ Required field 'maintenanceRecords' (MaintenanceRecord) is not imported
- ❌ Required field 'iftaEntries' (IFTAEntry) is not imported

#### Warnings

- ⚠️ Field 'name' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'city' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'zip' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'billingAddress' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'trailerNumber' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'type' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'email' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Truck'
- ⚠️ Field 'phone' is imported but doesn't exist in schema model 'Truck'

### trailers (Trailer)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| trailerNumber | String | ✅ | Trailer, trailer, Trailer Number... | No | None |
| make | String | ✅ | make, Make | No | None |
| model | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| licensePlate | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| mcNumberId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| type | String? | ✅ | type, Type | No | None |
| ownership | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| ownerName | String? | ✅ | owner_name, Owner name, Owner Name... | No | None |
| assignedTruckId | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| operatorDriverId | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| status | String? | ✅ | status, Status | No | None |
| fleetStatus | String? | ✅ | Fleet Status, Fleet Status, fleet_status | No | None |
| legacyTags | Json? | ❌ | None | No | Database constraint violation - field is required but not imported |
| isActive | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| loads | Load | ❌ | None | No | Database constraint violation - field is required but not imported |
| driverTrailerHistory | DriverTrailerHistory | ❌ | None | No | Database constraint violation - field is required but not imported |
| breakdowns | Breakdown | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'model' (String) is not imported
- ❌ Required field 'licensePlate' (String?) is not imported
- ❌ Required field 'mcNumberId' (String) is not imported
- ❌ Required field 'ownership' (String?) is not imported
- ❌ Required field 'assignedTruckId' (String?) is not imported
- ❌ Required field 'operatorDriverId' (String?) is not imported
- ❌ Required field 'legacyTags' (Json?) is not imported
- ❌ Required field 'isActive' (Boolean) is not imported
- ❌ Required field 'loads' (Load) is not imported
- ❌ Required field 'driverTrailerHistory' (DriverTrailerHistory) is not imported
- ❌ Required field 'breakdowns' (Breakdown) is not imported

#### Warnings

- ⚠️ Field 'name' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'city' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'zip' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'billingAddress' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'notes' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'email' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Trailer'
- ⚠️ Field 'phone' is imported but doesn't exist in schema model 'Trailer'

### customers (Customer)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| customerNumber | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| name | String | ✅ | Place name, Place Name, name | No | None |
| type | enum:CustomerType | ✅ | type, Type | Yes | None |
| mcNumber | String? | ✅ | MC Number, mc_number, MC #... | No | None |
| location | String? | ✅ | Location, location | No | None |
| website | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| referenceNumber | String? | ✅ | Reference number, Reference Number, reference_number | No | None |
| address | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| city | String | ✅ | City, city | No | None |
| state | String | ✅ | state, State, license_state... | No | None |
| zip | String | ✅ | ZIP, Zip, zip | No | None |
| phone | String | ✅ | Phone, phone, Phone Number... | No | None |
| contactNumber | String? | ✅ | Contact number, Contact Number, contact_number | No | None |
| email | String | ✅ | Email, email, Email Address... | No | None |
| billingAddress | String? | ✅ | Billing Address, Billing Address, billing_address | No | None |
| billingEmails | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| billingType | String? | ✅ | Billing type, Billing Type, billing_type | No | None |
| paymentTerms | Int | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| paymentTermsType | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| discountPercentage | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| discountDays | Int? | ❌ | None | No | Database constraint violation - field is required but not imported |
| creditAlertThreshold | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| creditHold | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| creditRate | Float? | ❌ | None | No | Database constraint violation - field is required but not imported |
| rateConfirmationRequired | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| status | String? | ✅ | status, Status | No | None |
| legacyTags | Json? | ❌ | None | No | Database constraint violation - field is required but not imported |
| warning | String? | ✅ | Warning, warning | No | None |
| riskLevel | String? | ✅ | Risk level, Risk Level, risk_level | No | None |
| comments | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| scac | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| portalEnabled | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| ediEnabled | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalLoads | Int | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalRevenue | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| isActive | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| loads | Load | ❌ | None | No | Database constraint violation - field is required but not imported |
| invoices | Invoice | ❌ | None | No | Database constraint violation - field is required but not imported |
| contacts | CustomerContact | ❌ | None | No | Database constraint violation - field is required but not imported |
| tags | CustomerTag | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'customerNumber' (String) is not imported
- ❌ Required field 'website' (String?) is not imported
- ❌ Required field 'address' (String) is not imported
- ❌ Required field 'billingEmails' (String?) is not imported
- ❌ Required field 'paymentTerms' (Int) is not imported
- ❌ Required field 'paymentTermsType' (String?) is not imported
- ❌ Required field 'discountPercentage' (Float?) is not imported
- ❌ Required field 'discountDays' (Int?) is not imported
- ❌ Required field 'creditAlertThreshold' (Float) is not imported
- ❌ Required field 'creditHold' (Boolean) is not imported
- ❌ Required field 'creditRate' (Float?) is not imported
- ❌ Required field 'rateConfirmationRequired' (Boolean) is not imported
- ❌ Required field 'legacyTags' (Json?) is not imported
- ❌ Required field 'comments' (String?) is not imported
- ❌ Required field 'scac' (String?) is not imported
- ❌ Required field 'portalEnabled' (Boolean) is not imported
- ❌ Required field 'ediEnabled' (Boolean) is not imported
- ❌ Required field 'totalLoads' (Int) is not imported
- ❌ Required field 'totalRevenue' (Float) is not imported
- ❌ Required field 'isActive' (Boolean) is not imported
- ❌ Required field 'loads' (Load) is not imported
- ❌ Required field 'invoices' (Invoice) is not imported
- ❌ Required field 'contacts' (CustomerContact) is not imported
- ❌ Required field 'tags' (CustomerTag) is not imported

#### Warnings

- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'vin' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'make' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'fleetStatus' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'ownerName' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'notes' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'trailerNumber' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Customer'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Customer'

### invoices (Invoice)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| customerId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| invoiceNumber | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| loadIds | String[] | ❌ | None | No | Database constraint violation - field is required but not imported |
| subtotal | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| tax | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| total | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| amountPaid | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| balance | Float | ❌ | None | No | Database constraint violation - field is required but not imported |
| status | enum:InvoiceStatus | ✅ | status, Status | Yes | None |
| invoiceDate | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| dueDate | DateTime | ❌ | None | No | Database constraint violation - field is required but not imported |
| qbSynced | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| reconciliationStatus | enum:ReconciliationStatus | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| loadId | String? | ❌ | None | No | Database constraint violation - field is required but not imported |
| expectedPaymentDate | DateTime? | ❌ | None | No | Database constraint violation - field is required but not imported |
| factoringStatus | enum:FactoringStatus | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| shortPayAmount | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| shortPayApproved | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| payments | Payment | ❌ | None | No | Database constraint violation - field is required but not imported |
| batchItems | InvoiceBatchItem | ❌ | None | No | Database constraint violation - field is required but not imported |
| reconciliations | Reconciliation | ❌ | None | No | Database constraint violation - field is required but not imported |
| tags | InvoiceTag | ❌ | None | No | Database constraint violation - field is required but not imported |
| accessorialCharges | AccessorialCharge | ❌ | None | No | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'customerId' (String) is not imported
- ❌ Required field 'invoiceNumber' (String) is not imported
- ❌ Required field 'loadIds' (String[]) is not imported
- ❌ Required field 'subtotal' (Float) is not imported
- ❌ Required field 'tax' (Float) is not imported
- ❌ Required field 'total' (Float) is not imported
- ❌ Required field 'amountPaid' (Float) is not imported
- ❌ Required field 'balance' (Float) is not imported
- ❌ Required field 'invoiceDate' (DateTime) is not imported
- ❌ Required field 'dueDate' (DateTime) is not imported
- ❌ Required field 'qbSynced' (Boolean) is not imported
- ❌ Required field 'reconciliationStatus' (enum:ReconciliationStatus) is not imported
- ❌ Required field 'loadId' (String?) is not imported
- ❌ Required field 'expectedPaymentDate' (DateTime?) is not imported
- ❌ Required field 'factoringStatus' (enum:FactoringStatus) is not imported
- ❌ Required field 'shortPayAmount' (Float) is not imported
- ❌ Required field 'shortPayApproved' (Boolean) is not imported
- ❌ Required field 'payments' (Payment) is not imported
- ❌ Required field 'batchItems' (InvoiceBatchItem) is not imported
- ❌ Required field 'reconciliations' (Reconciliation) is not imported
- ❌ Required field 'tags' (InvoiceTag) is not imported
- ❌ Required field 'accessorialCharges' (AccessorialCharge) is not imported

#### Warnings

- ⚠️ Field 'name' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'city' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'zip' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'billingAddress' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'vin' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'make' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'state' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'fleetStatus' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'ownerName' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'trailerNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'type' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'email' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'tag' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Invoice'
- ⚠️ Field 'phone' is imported but doesn't exist in schema model 'Invoice'

### vendors (Vendor)

**File**: `app/api/import-export/[entity]/route.ts`

#### Required Fields

| Field | Type | Imported | CSV Headers | Has Default | Issues |
|-------|------|----------|-------------|-------------|--------|
| companyId | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| vendorNumber | String | ❌ | None | No | Database constraint violation - field is required but not imported |
| name | String | ✅ | Place name, Place Name, name | No | None |
| type | enum:VendorType | ✅ | type, Type | Yes | None |
| paymentTerms | Int | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| w9OnFile | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalOrders | Int | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| totalSpent | Float | ❌ | None | Yes | Database constraint violation - field is required but not imported |
| tag | String? | ✅ | Tag, tag | No | None |
| contacts | VendorContact | ❌ | None | No | Database constraint violation - field is required but not imported |
| inventoryItems | InventoryItem | ❌ | None | No | Database constraint violation - field is required but not imported |
| transactions | InventoryTransaction | ❌ | None | No | Database constraint violation - field is required but not imported |
| isActive | Boolean | ❌ | None | Yes | Database constraint violation - field is required but not imported |

#### Errors

- ❌ Required field 'companyId' (String) is not imported
- ❌ Required field 'vendorNumber' (String) is not imported
- ❌ Required field 'paymentTerms' (Int) is not imported
- ❌ Required field 'w9OnFile' (Boolean) is not imported
- ❌ Required field 'totalOrders' (Int) is not imported
- ❌ Required field 'totalSpent' (Float) is not imported
- ❌ Required field 'contacts' (VendorContact) is not imported
- ❌ Required field 'inventoryItems' (InventoryItem) is not imported
- ❌ Required field 'transactions' (InventoryTransaction) is not imported
- ❌ Required field 'isActive' (Boolean) is not imported

#### Warnings

- ⚠️ Field 'rawType' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'csvMcValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'location' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'referenceNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'contactNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'billingType' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'status' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'warning' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'riskLevel' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'truckNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'vin' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'rawStatus' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'make' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'fleetStatus' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'ownerName' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'tollTagNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'notes' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'trailerNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'assignedTruckNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'operatorDriverValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'tagsValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'rawVendorType' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'locationCompany' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'customerName' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'coDriverValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'dispatcherValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'createdByValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupLocation' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupAddress' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupCompany' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'mcNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'tripId' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupTime' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupAppointment' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverCarrier' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverMc' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'createdDate' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'lastUpdate' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'loadNumber' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'shipmentId' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'eqType' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'pickupZip' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'deliveryZip' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'revenueValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'payValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'v' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'rpmValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'statusValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'lastName' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'licenseState' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'payTypeValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverTariff' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'payTo' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverTypeValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'assignmentStatusValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'dispatchStatusValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'driverStatusValue' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'homeTerminal' is imported but doesn't exist in schema model 'Vendor'
- ⚠️ Field 'emergencyPhone' is imported but doesn't exist in schema model 'Vendor'

