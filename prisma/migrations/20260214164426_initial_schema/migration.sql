-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'DRIVER', 'CUSTOMER', 'ACCOUNTANT', 'HR', 'SAFETY', 'FLEET');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'EN_ROUTE', 'ARRIVED', 'LOADING', 'UNLOADING', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoadDispatchStatus" AS ENUM ('BOOKED', 'ON_ROUTE_TO_PICKUP', 'AT_PICKUP', 'LOADED', 'ON_ROUTE_TO_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'PENDING_DISPATCH', 'NEEDS_DISPATCH', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AccountingSyncStatus" AS ENUM ('NOT_SYNCED', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "LoadType" AS ENUM ('FTL', 'LTL', 'PARTIAL', 'INTERMODAL');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT');

-- CreateEnum
CREATE TYPE "DetentionStartStrategy" AS ENUM ('ARRIVAL', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH', 'ON_LEAVE', 'INACTIVE', 'IN_TRANSIT', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'TERMINATED', 'APPLICANT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('READY_TO_GO', 'NOT_READY', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('DISPATCHED', 'ENROUTE', 'TERMINATION', 'REST', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "DriverType" AS ENUM ('COMPANY_DRIVER', 'LEASE', 'OWNER_OPERATOR');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('PER_MILE', 'PER_LOAD', 'PERCENTAGE', 'HOURLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GAS', 'DEF');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'MAINTENANCE_DUE', 'OUT_OF_SERVICE', 'INACTIVE', 'NEEDS_REPAIR');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PM_A', 'PM_B', 'TIRES', 'REPAIR');

-- CreateEnum
CREATE TYPE "MaintenanceRecordStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnCallShiftType" AS ENUM ('DAY', 'NIGHT', 'WEEKEND', 'HOLIDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BreakdownType" AS ENUM ('ENGINE_FAILURE', 'TRANSMISSION_FAILURE', 'BRAKE_FAILURE', 'TIRE_FLAT', 'TIRE_BLOWOUT', 'ELECTRICAL_ISSUE', 'COOLING_SYSTEM', 'FUEL_SYSTEM', 'SUSPENSION', 'ACCIDENT_DAMAGE', 'WEATHER_RELATED', 'OTHER');

-- CreateEnum
CREATE TYPE "BreakdownPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BreakdownStatus" AS ENUM ('REPORTED', 'DISPATCHED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('SIP', 'SMS', 'TELEGRAM', 'EMAIL', 'MOBILE_APP');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('CALL', 'SMS', 'MMS', 'TELEGRAM', 'EMAIL', 'VOICEMAIL', 'NOTE', 'MESSAGE', 'BREAKDOWN_REPORT');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('DIRECT', 'BROKER', 'FREIGHT_FORWARDER', 'THIRD_PARTY_LOGISTICS');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOL', 'POD', 'INVOICE', 'RATE_CONFIRMATION', 'DETENTION', 'LUMPER', 'DRIVER_LICENSE', 'MEDICAL_CARD', 'INSURANCE', 'REGISTRATION', 'INSPECTION', 'LEASE_AGREEMENT', 'W9', 'COI', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'INVOICED', 'POSTED');

-- CreateEnum
CREATE TYPE "SalaryBatchStatus" AS ENUM ('OPEN', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "LoadExpenseType" AS ENUM ('TOLL', 'SCALE', 'SCALE_TICKET', 'PERMIT', 'LUMPER', 'DETENTION', 'PARKING', 'REPAIR', 'TOWING', 'TIRE', 'FUEL_ADDITIVE', 'DEF', 'WASH', 'MEAL', 'LODGING', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('FIXED', 'PERCENTAGE', 'PER_MILE');

-- CreateEnum
CREATE TYPE "DeductionFrequency" AS ENUM ('PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "DeductionRuleType" AS ENUM ('LEASE', 'INSURANCE', 'ELD');

-- CreateEnum
CREATE TYPE "DeductionRuleFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "IFTAPeriodType" AS ENUM ('QUARTER', 'MONTH');

-- CreateEnum
CREATE TYPE "BatchPostStatus" AS ENUM ('UNPOSTED', 'POSTED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('INVOICE', 'FUEL', 'BREAKDOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER', 'FACTOR', 'QUICK_PAY', 'EFS', 'COMDATA', 'CASHAPP', 'ZELLE', 'VENMO');

-- CreateEnum
CREATE TYPE "FactoringStatus" AS ENUM ('NOT_FACTORED', 'SUBMITTED_TO_FACTOR', 'FUNDED', 'RESERVE_RELEASED');

-- CreateEnum
CREATE TYPE "InvoiceSubStatus" AS ENUM ('NOT_YET_DUE', 'DUE_SOON', 'OVERDUE', 'PARTIALLY_PAID', 'DISPUTED', 'WRITTEN_OFF', 'PAID');

-- CreateEnum
CREATE TYPE "AccessorialChargeType" AS ENUM ('DETENTION', 'LAYOVER', 'TONU', 'LUMPER', 'SCALE_TICKET', 'ADDITIONAL_STOP', 'FUEL_SURCHARGE', 'RECLASSIFICATION', 'REEFER_FUEL', 'DRIVER_ASSIST', 'SORT_SEGREGATE', 'INSIDE_DELIVERY', 'RESIDENTIAL_DELIVERY', 'SATURDAY_DELIVERY', 'AFTER_HOURS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessorialChargeStatus" AS ENUM ('PENDING', 'APPROVED', 'BILLED', 'PAID', 'DENIED');

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('FUEL_ADVANCE', 'CASH_ADVANCE', 'INSURANCE', 'OCCUPATIONAL_ACCIDENT', 'TRUCK_PAYMENT', 'TRUCK_LEASE', 'ESCROW', 'EQUIPMENT_RENTAL', 'MAINTENANCE', 'TOLLS', 'PERMITS', 'FUEL_CARD', 'FUEL_CARD_FEE', 'TRAILER_RENTAL', 'OTHER', 'BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('NOT_RECONCILED', 'PARTIALLY_RECONCILED', 'FULLY_RECONCILED');

-- CreateEnum
CREATE TYPE "ReconciliationMethod" AS ENUM ('AUTO', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "FactoringBatchStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOAD_ASSIGNED', 'LOAD_UPDATED', 'MAINTENANCE_DUE', 'HOS_VIOLATION', 'DOCUMENT_EXPIRING', 'INVOICE_PAID', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('QUICKBOOKS', 'SAMSARA', 'GOOGLE_MAPS', 'DAT', 'TRUCKSTOP');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('DOT_ANNUAL', 'DOT_LEVEL_1', 'DOT_LEVEL_2', 'DOT_LEVEL_3', 'DOT_PRE_TRIP', 'DOT_POST_TRIP', 'STATE_INSPECTION', 'COMPANY_INSPECTION', 'PMI', 'SAFETY_INSPECTION');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED', 'CONDITIONAL', 'OUT_OF_SERVICE', 'PENDING');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIVED', 'ISSUED', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGE', 'THEFT');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('SUPPLIER', 'PARTS_VENDOR', 'SERVICE_PROVIDER', 'FUEL_VENDOR', 'REPAIR_SHOP', 'TIRE_SHOP', 'FACTORING', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PICKUP', 'DELIVERY', 'TERMINAL', 'WAREHOUSE', 'CUSTOMER', 'VENDOR', 'REPAIR_SHOP', 'FUEL_STOP', 'REST_AREA', 'SCALE');

-- CreateEnum
CREATE TYPE "SafetyIncidentType" AS ENUM ('ACCIDENT', 'COLLISION', 'ROLLOVER', 'FIRE', 'SPILL', 'INJURY', 'FATALITY', 'HAZMAT_INCIDENT', 'EQUIPMENT_FAILURE', 'DRIVER_ERROR', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL', 'FATAL');

-- CreateEnum
CREATE TYPE "SafetyIncidentStatus" AS ENUM ('REPORTED', 'UNDER_INVESTIGATION', 'INVESTIGATION_COMPLETE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SafetyTrainingType" AS ENUM ('DEFENSIVE_DRIVING', 'HAZMAT', 'HOURS_OF_SERVICE', 'ELD_TRAINING', 'FIRST_AID', 'CPR', 'FIRE_SAFETY', 'BACKING_SAFETY', 'LOAD_SECUREMENT', 'DOCK_SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyTrainingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DQFStatus" AS ENUM ('COMPLETE', 'INCOMPLETE', 'EXPIRING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DQFDocumentType" AS ENUM ('APPLICATION', 'ROAD_TEST', 'PREVIOUS_EMPLOYMENT_VERIFICATION', 'ANNUAL_REVIEW', 'MEDICAL_EXAMINERS_CERTIFICATE', 'CDL_COPY', 'MVR_RECORD', 'DRUG_TEST_RESULT', 'ALCOHOL_TEST_RESULT', 'TRAINING_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DQFDocumentStatus" AS ENUM ('COMPLETE', 'MISSING', 'EXPIRING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DrugAlcoholTestType" AS ENUM ('PRE_EMPLOYMENT', 'RANDOM', 'POST_ACCIDENT', 'REASONABLE_SUSPICION', 'RETURN_TO_DUTY', 'FOLLOW_UP', 'PRE_DUTY');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('NEGATIVE', 'POSITIVE', 'REFUSAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoolType" AS ENUM ('DRUG', 'ALCOHOL');

-- CreateEnum
CREATE TYPE "ClearinghouseQueryType" AS ENUM ('PRE_EMPLOYMENT', 'ANNUAL', 'LIMITED');

-- CreateEnum
CREATE TYPE "ClearinghouseQueryResult" AS ENUM ('NO_VIOLATIONS', 'VIOLATIONS_FOUND', 'PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "HOSViolationType" AS ENUM ('FORM_AND_MANNER', 'UNASSIGNED_DRIVING', 'EXCEEDED_11_HOUR', 'EXCEEDED_14_HOUR', 'EXCEEDED_70_HOUR', 'MISSING_LOG', 'DATA_QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ELDProviderType" AS ENUM ('SAMSARA', 'KEEPTRUCKIN', 'VERIZON_CONNECT', 'GARMIN', 'RAND_MCNALLY', 'OTHER');

-- CreateEnum
CREATE TYPE "ELDSyncType" AS ENUM ('FULL', 'INCREMENTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ELDSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "AnnualReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DVIRType" AS ENUM ('PRE_TRIP', 'POST_TRIP');

-- CreateEnum
CREATE TYPE "DVIRStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DEFECT_REPORTED', 'REPAIRED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('CRITICAL', 'NON_CRITICAL');

-- CreateEnum
CREATE TYPE "InspectionLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_5', 'LEVEL_6');

-- CreateEnum
CREATE TYPE "CSABasicCategory" AS ENUM ('UNSAFE_DRIVING', 'CRASH_INDICATOR', 'HOS_COMPLIANCE', 'VEHICLE_MAINTENANCE', 'CONTROLLED_SUBSTANCES', 'HAZMAT_COMPLIANCE', 'DRIVER_FITNESS');

-- CreateEnum
CREATE TYPE "DataQStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OOSType" AS ENUM ('DRIVER', 'VEHICLE');

-- CreateEnum
CREATE TYPE "OOSStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DefectSourceType" AS ENUM ('DVIR', 'DOT_INSPECTION', 'ROADSIDE_INSPECTION', 'COMPANY_INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PreventableDecision" AS ENUM ('PREVENTABLE', 'NON_PREVENTABLE');

-- CreateEnum
CREATE TYPE "CSATrend" AS ENUM ('IMPROVING', 'DECLINING', 'STABLE');

-- CreateEnum
CREATE TYPE "SafetyRating" AS ENUM ('SATISFACTORY', 'CONDITIONAL', 'UNSATISFACTORY');

-- CreateEnum
CREATE TYPE "CompliancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplianceActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InsurancePolicyType" AS ENUM ('LIABILITY', 'PHYSICAL_DAMAGE', 'CARGO', 'GENERAL_LIABILITY');

-- CreateEnum
CREATE TYPE "InsuranceClaimType" AS ENUM ('ACCIDENT', 'CARGO', 'PROPERTY_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'DENIED');

-- CreateEnum
CREATE TYPE "CargoClaimStatus" AS ENUM ('OPEN', 'DENIED', 'SETTLED', 'PAID');

-- CreateEnum
CREATE TYPE "LossRunType" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SafetyPolicyCategory" AS ENUM ('ACCIDENT_PROCEDURES', 'DRUG_ALCOHOL_POLICY', 'VEHICLE_USE_POLICY', 'PERSONAL_CONDUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "AcknowledgmentStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SafetyCampaignType" AS ENUM ('MILLION_MILE_CLUB', 'NO_PREVENTABLE_ACCIDENTS', 'BEST_PRE_TRIP_INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyRecognitionType" AS ENUM ('YEARS_WITHOUT_ACCIDENT', 'MILESTONE_MILES', 'SAFETY_LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingMaterialCategory" AS ENUM ('DEFENSIVE_DRIVING', 'WINTER_DRIVING', 'CARGO_SECUREMENT', 'HOS_RULES', 'ELD_TRAINING', 'HAZMAT', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingMaterialType" AS ENUM ('VIDEO', 'POWERPOINT', 'HANDOUT', 'QUIZ', 'PDF');

-- CreateEnum
CREATE TYPE "ComplianceAlertType" AS ENUM ('EXPIRING_DOCUMENT', 'MISSED_DRUG_TEST', 'HOS_VIOLATION', 'OVERDUE_INSPECTION', 'HIGH_CSA_SCORE', 'NEW_VIOLATION', 'OOS_ORDER', 'OVERDUE_ANNUAL_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "McNumberType" AS ENUM ('CARRIER', 'BROKER');

-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('RATE_PER_MILE', 'RATE_PER_LOAD', 'RATE_PER_POUND', 'FLAT_RATE', 'PERCENTAGE', 'FUEL_SURCHARGE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('LOAD', 'DRIVER', 'TRUCK', 'TRAILER', 'INVOICE', 'CUSTOMER', 'VENDOR', 'SETTLEMENT', 'BREAKDOWN', 'INSPECTION', 'SAFETY_INCIDENT');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LOADS', 'DRIVERS', 'FINANCIAL', 'SAFETY', 'MAINTENANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'HTML');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('EQUIPMENT', 'COMMODITY', 'SERVICE_TYPE', 'CUSTOMER_SEGMENT', 'COST_CENTER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ApiCacheType" AS ENUM ('GEOCODE', 'REVERSE_GEOCODE', 'DISTANCE_MATRIX', 'DIRECTIONS');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL');

-- CreateEnum
CREATE TYPE "CustomFieldEntityType" AS ENUM ('LOAD', 'DRIVER', 'CUSTOMER', 'TRUCK', 'TRAILER', 'INVOICE');

-- CreateEnum
CREATE TYPE "AISuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'FREE', 'OWNER_OPERATOR', 'CORE_READONLY');

-- CreateEnum
CREATE TYPE "SubscriptionModule" AS ENUM ('FLEET', 'ACCOUNTING', 'SAFETY', 'INTEGRATIONS', 'AI_DISPATCH', 'ANALYTICS', 'HR');

-- CreateEnum
CREATE TYPE "ApiKeyScope" AS ENUM ('GLOBAL', 'COMPANY', 'MC');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('FACEBOOK', 'REFERRAL', 'DIRECT', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'SMS', 'EMAIL', 'NOTE', 'STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'ASSIGNMENT_CHANGE');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('LOADS_CREATED', 'INVOICES_GENERATED', 'SETTLEMENTS_GENERATED', 'DOCUMENTS_PROCESSED');

-- CreateEnum
CREATE TYPE "SettlementValidationMode" AS ENUM ('STRICT', 'FLEXIBLE', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tempPassword" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "nickname" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT NOT NULL,
    "mcAccess" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "voipConfig" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dotNumber" TEXT NOT NULL,
    "mcNumber" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "trialEndsAt" TIMESTAMP(3),
    "truckLimit" INTEGER NOT NULL DEFAULT 999,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "loadNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "coDriverId" TEXT,
    "truckId" TEXT,
    "trailerNumber" TEXT,
    "dispatcherId" TEXT,
    "createdById" TEXT,
    "tripId" TEXT,
    "mcNumberId" TEXT,
    "status" "LoadStatus" NOT NULL DEFAULT 'PENDING',
    "dispatchStatus" "LoadDispatchStatus",
    "loadType" "LoadType" NOT NULL DEFAULT 'FTL',
    "equipmentType" "EquipmentType" NOT NULL,
    "pickupLocation" TEXT,
    "pickupAddress" TEXT,
    "pickupCity" TEXT,
    "pickupState" TEXT,
    "pickupZip" TEXT,
    "pickupCompany" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTimeStart" TIMESTAMP(3),
    "pickupTimeEnd" TIMESTAMP(3),
    "pickupContact" TEXT,
    "pickupPhone" TEXT,
    "pickupNotes" TEXT,
    "deliveryLocation" TEXT,
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryState" TEXT,
    "deliveryZip" TEXT,
    "deliveryCompany" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTimeStart" TIMESTAMP(3),
    "deliveryTimeEnd" TIMESTAMP(3),
    "deliveryContact" TEXT,
    "deliveryPhone" TEXT,
    "deliveryNotes" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "pieces" INTEGER,
    "commodity" TEXT,
    "pallets" INTEGER,
    "temperature" TEXT,
    "hazmat" BOOLEAN NOT NULL DEFAULT false,
    "hazmatClass" TEXT,
    "revenue" DOUBLE PRECISION NOT NULL,
    "driverPay" DOUBLE PRECISION,
    "fuelAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profit" DOUBLE PRECISION,
    "serviceFee" DOUBLE PRECISION,
    "accountingSyncedAt" TIMESTAMP(3),
    "accountingSyncStatus" "AccountingSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION,
    "podUploadedAt" TIMESTAMP(3),
    "readyForSettlement" BOOLEAN NOT NULL DEFAULT false,
    "isBillingHold" BOOLEAN NOT NULL DEFAULT false,
    "billingHoldReason" TEXT,
    "detentionStartStrategy" "DetentionStartStrategy",
    "loadedMiles" DOUBLE PRECISION,
    "emptyMiles" DOUBLE PRECISION,
    "totalMiles" DOUBLE PRECISION,
    "revenuePerMile" DOUBLE PRECISION,
    "actualMiles" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "invoicedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "dispatchNotes" TEXT,
    "driverNotes" TEXT,
    "lastNote" TEXT,
    "onTimeDelivery" BOOLEAN,
    "shipmentId" TEXT,
    "stopsCount" INTEGER,
    "totalPay" DOUBLE PRECISION,
    "lastUpdate" TIMESTAMP(3),
    "ediSent" BOOLEAN NOT NULL DEFAULT false,
    "ediReceived" BOOLEAN NOT NULL DEFAULT false,
    "ediTransactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "trailerId" TEXT,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStop" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "stopType" "StopType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "company" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT,
    "earliestArrival" TIMESTAMP(3),
    "latestArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "billableDetentionMinutes" INTEGER DEFAULT 0,
    "detentionClockStart" TIMESTAMP(3),
    "contactName" TEXT,
    "contactPhone" TEXT,
    "items" JSONB,
    "totalPieces" INTEGER,
    "totalWeight" DOUBLE PRECISION,
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "specialInstructions" TEXT,
    "signature" TEXT,
    "signatureDate" TIMESTAMP(3),
    "proofOfDelivery" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStatusHistory" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "status" "LoadStatus" NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadSegment" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "startLocation" TEXT,
    "endLocation" TEXT,
    "startCity" TEXT,
    "startState" TEXT,
    "endCity" TEXT,
    "endState" TEXT,
    "startMiles" DOUBLE PRECISION,
    "endMiles" DOUBLE PRECISION,
    "segmentMiles" DOUBLE PRECISION NOT NULL,
    "loadedMiles" DOUBLE PRECISION DEFAULT 0,
    "emptyMiles" DOUBLE PRECISION DEFAULT 0,
    "actualMiles" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "isAutoCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "totalDistance" DOUBLE PRECISION NOT NULL,
    "estimatedTime" DOUBLE PRECISION NOT NULL,
    "fuelCost" DOUBLE PRECISION,
    "tollCost" DOUBLE PRECISION,
    "waypoints" JSONB NOT NULL,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "optimizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "driverNumber" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "licenseIssueDate" TIMESTAMP(3),
    "socialSecurityNumber" TEXT,
    "birthDate" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "tenure" TEXT,
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "localDriver" BOOLEAN NOT NULL DEFAULT false,
    "telegramNumber" TEXT,
    "thresholdAmount" DOUBLE PRECISION,
    "medicalCardExpiry" TIMESTAMP(3) NOT NULL,
    "drugTestDate" TIMESTAMP(3),
    "backgroundCheck" TIMESTAMP(3),
    "cdlExperience" TEXT,
    "restrictions" TEXT,
    "dlClass" TEXT,
    "driverType" "DriverType" NOT NULL DEFAULT 'COMPANY_DRIVER',
    "endorsements" TEXT[],
    "driverFacingCamera" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'United States',
    "dispatchPreferences" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "employeeStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'READY_TO_GO',
    "dispatchStatus" "DispatchStatus",
    "currentTruckId" TEXT,
    "currentTrailerId" TEXT,
    "homeTerminal" TEXT,
    "assignedDispatcherId" TEXT,
    "hrManagerId" TEXT,
    "safetyManagerId" TEXT,
    "mcNumberId" TEXT,
    "teamDriver" BOOLEAN NOT NULL DEFAULT false,
    "otherId" TEXT,
    "driverTags" TEXT[],
    "notes" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "emergencyContactAddress1" TEXT,
    "emergencyContactAddress2" TEXT,
    "emergencyContactCity" TEXT,
    "emergencyContactState" TEXT,
    "emergencyContactZip" TEXT,
    "emergencyContactCountry" TEXT DEFAULT 'United States',
    "emergencyContactPhone" TEXT,
    "emergencyContactEmail" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "rating" DOUBLE PRECISION,
    "totalLoads" INTEGER NOT NULL DEFAULT 0,
    "totalMiles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "payType" "PayType" NOT NULL DEFAULT 'PER_MILE',
    "payRate" DOUBLE PRECISION NOT NULL,
    "payTo" TEXT,
    "escrowBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escrowTargetAmount" DOUBLE PRECISION,
    "escrowDeductionPerWeek" DOUBLE PRECISION,
    "advanceLimit" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "warnings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "aiAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverTruckHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pickupDate" TIMESTAMP(3),
    "dropOffDate" TIMESTAMP(3),
    "pickupMile" DOUBLE PRECISION,
    "dropOffMile" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverTruckHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverTrailerHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "trailerId" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3),
    "dropOffDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverTrailerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverComment" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HOSRecord" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "DriverStatus" NOT NULL,
    "driveTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onDutyTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offDutyTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sleeperTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyDriveTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyOnDuty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "violations" JSONB,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "eldRecordId" TEXT,
    "eldProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HOSRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckNumber" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "equipmentType" "EquipmentType" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "fleetStatus" TEXT,
    "currentDriverId" TEXT,
    "currentLocation" TEXT,
    "ownership" TEXT,
    "ownerName" TEXT,
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "odometerReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextServiceOdometer" DOUBLE PRECISION,
    "registrationExpiry" TIMESTAMP(3) NOT NULL,
    "insuranceExpiry" TIMESTAMP(3) NOT NULL,
    "inspectionExpiry" TIMESTAMP(3) NOT NULL,
    "eldInstalled" BOOLEAN NOT NULL DEFAULT false,
    "eldProvider" TEXT,
    "gpsInstalled" BOOLEAN NOT NULL DEFAULT false,
    "tollTagNumber" TEXT,
    "fuelCard" TEXT,
    "samsaraId" TEXT,
    "samsaraSyncedAt" TIMESTAMP(3),
    "samsaraSyncStatus" TEXT,
    "lastOdometerReading" DOUBLE PRECISION,
    "lastOdometerUpdate" TIMESTAMP(3),
    "lastEngineHours" DOUBLE PRECISION,
    "legacyTags" JSONB,
    "notes" TEXT,
    "warnings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trailer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "trailerNumber" TEXT NOT NULL,
    "vin" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "licensePlate" TEXT,
    "state" TEXT,
    "mcNumberId" TEXT,
    "type" TEXT,
    "ownership" TEXT,
    "ownerName" TEXT,
    "assignedTruckId" TEXT,
    "operatorDriverId" TEXT,
    "status" TEXT,
    "fleetStatus" TEXT,
    "registrationExpiry" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3),
    "inspectionExpiry" TIMESTAMP(3),
    "samsaraId" TEXT,
    "samsaraSyncedAt" TIMESTAMP(3),
    "samsaraSyncStatus" TEXT,
    "legacyTags" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Trailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "fuelEntryNumber" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT,
    "mcNumberId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "gallons" DOUBLE PRECISION NOT NULL,
    "costPerGallon" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "odometer" INTEGER NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fuelType" "FuelType" NOT NULL DEFAULT 'DIESEL',
    "receiptNumber" TEXT,
    "notes" TEXT,
    "vendor" TEXT,
    "state" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "maintenanceNumber" TEXT,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "odometer" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextServiceDate" TIMESTAMP(3),
    "vendorId" TEXT,
    "invoiceNumber" TEXT,
    "status" "MaintenanceRecordStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "intervalMiles" INTEGER NOT NULL DEFAULT 0,
    "intervalMonths" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnCallShift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "shiftType" "OnCallShiftType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OnCallShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breakdown" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "breakdownNumber" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "odometerReading" DOUBLE PRECISION NOT NULL,
    "telematicsSnapshot" JSONB,
    "breakdownType" "BreakdownType" NOT NULL,
    "priority" "BreakdownPriority" NOT NULL DEFAULT 'MEDIUM',
    "problem" TEXT,
    "problemCategory" TEXT,
    "description" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
    "trailerId" TEXT,
    "status" "BreakdownStatus" NOT NULL DEFAULT 'REPORTED',
    "serviceProvider" TEXT,
    "serviceContact" TEXT,
    "serviceAddress" TEXT,
    "repairCost" DOUBLE PRECISION,
    "towingCost" DOUBLE PRECISION,
    "laborCost" DOUBLE PRECISION,
    "partsCost" DOUBLE PRECISION,
    "otherCosts" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dispatchedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "repairStartedAt" TIMESTAMP(3),
    "repairCompletedAt" TIMESTAMP(3),
    "truckReadyAt" TIMESTAMP(3),
    "downtimeHours" DOUBLE PRECISION,
    "resolution" TEXT,
    "repairNotes" TEXT,
    "technicianNotes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "isDriverChargeable" BOOLEAN NOT NULL DEFAULT false,
    "driverChargeNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakdownAssignment" (
    "id" TEXT NOT NULL,
    "breakdownId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakdownAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "companyId" TEXT NOT NULL,
    "breakdownId" TEXT,
    "driverId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "telegramId" TEXT,
    "telegramChatId" TEXT,
    "emailAddress" TEXT,
    "content" TEXT,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "mediaUrls" TEXT[],
    "location" JSONB,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "autoCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "externalId" TEXT,
    "providerMetadata" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramMessageId" INTEGER,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'DIRECT',
    "mcNumber" TEXT,
    "location" TEXT,
    "website" TEXT,
    "referenceNumber" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactNumber" TEXT,
    "email" TEXT NOT NULL,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZip" TEXT,
    "billingEmail" TEXT,
    "billingEmails" TEXT,
    "billingType" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTaxExempt" BOOLEAN NOT NULL DEFAULT false,
    "qbCustomerId" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "paymentTermsType" TEXT,
    "discountPercentage" DOUBLE PRECISION,
    "discountDays" INTEGER,
    "creditLimit" DOUBLE PRECISION,
    "creditAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "creditHold" BOOLEAN NOT NULL DEFAULT false,
    "creditHoldReason" TEXT,
    "creditHoldDate" TIMESTAMP(3),
    "creditRate" DOUBLE PRECISION,
    "creditLimitNotes" TEXT,
    "rateConfirmationRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "legacyTags" JSONB,
    "warning" TEXT,
    "riskLevel" TEXT,
    "comments" TEXT,
    "scac" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "portalUserId" TEXT,
    "ediEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ediId" TEXT,
    "rating" DOUBLE PRECISION,
    "totalLoads" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detentionFreeTimeHours" DOUBLE PRECISION,
    "detentionRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "factoringCompanyId" TEXT,
    "preferredPaymentMethod" "PaymentMethod",

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
    "truckId" TEXT,
    "breakdownId" TEXT,
    "inspectionId" TEXT,
    "safetyIncidentId" TEXT,
    "safetyTrainingCertificateId" TEXT,
    "expiryDate" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "loadIds" TEXT[],
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "qbSynced" BOOLEAN NOT NULL DEFAULT false,
    "qbInvoiceId" TEXT,
    "qbSyncedAt" TIMESTAMP(3),
    "qbSyncStatus" TEXT,
    "qbSyncError" TEXT,
    "qbCustomerId" TEXT,
    "mcNumber" TEXT,
    "mcNumberId" TEXT,
    "subStatus" "InvoiceSubStatus",
    "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'NOT_RECONCILED',
    "invoiceNote" TEXT,
    "paymentNote" TEXT,
    "loadId" TEXT,
    "totalAmount" DOUBLE PRECISION,
    "paymentMethod" "PaymentMethod",
    "expectedPaymentDate" TIMESTAMP(3),
    "factoringStatus" "FactoringStatus" NOT NULL DEFAULT 'NOT_FACTORED',
    "factoringCompanyId" TEXT,
    "submittedToFactorAt" TIMESTAMP(3),
    "factoringSubmittedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "reserveReleaseDate" TIMESTAMP(3),
    "factoringReserveReleasedAt" TIMESTAMP(3),
    "factoringFee" DOUBLE PRECISION,
    "reserveAmount" DOUBLE PRECISION,
    "advanceAmount" DOUBLE PRECISION,
    "shortPayAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shortPayReasonCode" TEXT,
    "shortPayReason" TEXT,
    "shortPayApproved" BOOLEAN NOT NULL DEFAULT false,
    "shortPayApprovedById" TEXT,
    "shortPayApprovedAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "disputedReason" TEXT,
    "writtenOffAt" TIMESTAMP(3),
    "writtenOffReason" TEXT,
    "writtenOffById" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "factoringBatchId" TEXT,
    "invoiceBatchId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "loadIds" TEXT[],
    "grossPay" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "calculatedAt" TIMESTAMP(3),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "is1099Eligible" BOOLEAN NOT NULL DEFAULT false,
    "year1099" INTEGER,
    "notes" TEXT,
    "calculationLog" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salaryBatchId" TEXT,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" "SalaryBatchStatus" NOT NULL DEFAULT 'OPEN',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settlementCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementDeduction" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "deductionType" "DeductionType" NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fuelEntryId" TEXT,
    "driverAdvanceId" TEXT,
    "loadExpenseId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAdvance" (
    "id" TEXT NOT NULL,
    "advanceNumber" TEXT,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "loadId" TEXT,
    "settlementId" TEXT,
    "deductedAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverNegativeBalance" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "originalSettlementId" TEXT,
    "appliedSettlementId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverNegativeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadExpense" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT,
    "loadId" TEXT NOT NULL,
    "expenseType" "LoadExpenseType" NOT NULL,
    "category" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendorId" TEXT,
    "receiptUrl" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reimbursable" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "settlementId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deductionType" "DeductionType" NOT NULL,
    "driverType" "DriverType",
    "isAddition" BOOLEAN NOT NULL DEFAULT false,
    "driverId" TEXT,
    "type" "DeductionRuleType",
    "amount" DOUBLE PRECISION,
    "frequency" "DeductionRuleFrequency",
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "calculationType" "CalculationType" NOT NULL,
    "percentage" DOUBLE PRECISION,
    "perMileRate" DOUBLE PRECISION,
    "deductionFrequency" "DeductionFrequency" NOT NULL DEFAULT 'PER_SETTLEMENT',
    "minGrossPay" DOUBLE PRECISION,
    "goalAmount" DOUBLE PRECISION,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionTypeTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementApproval" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "approvedById" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stateRates" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT,
    "periodType" "IFTAPeriodType" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodQuarter" INTEGER,
    "periodMonth" INTEGER,
    "totalMiles" DOUBLE PRECISION NOT NULL,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAStateMileage" (
    "id" TEXT NOT NULL,
    "iftaEntryId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "miles" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAStateMileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "postStatus" "BatchPostStatus" NOT NULL DEFAULT 'UNPOSTED',
    "customerId" TEXT,
    "mcNumber" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "sentToFactoringAt" TIMESTAMP(3),
    "factoringCompanyId" TEXT,
    "factoringCompanyName" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" "PaymentType" NOT NULL DEFAULT 'INVOICE',
    "fuelEntryId" TEXT,
    "breakdownId" TEXT,
    "mcNumberId" TEXT,
    "paymentNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "receiptNumber" TEXT,
    "invoiceNumber" TEXT,
    "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
    "hasInvoice" BOOLEAN NOT NULL DEFAULT false,
    "documentIds" TEXT[],
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "reconciledAmount" DOUBLE PRECISION NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL,
    "reconciledById" TEXT NOT NULL,
    "reconciliationMethod" "ReconciliationMethod" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringCompany" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "reservePercentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "reserveHoldDays" INTEGER NOT NULL DEFAULT 90,
    "apiProvider" TEXT,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "exportFormat" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "FactoringBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessorialCharge" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "chargeType" "AccessorialChargeType" NOT NULL,
    "description" TEXT,
    "detentionHours" DOUBLE PRECISION,
    "detentionRate" DOUBLE PRECISION,
    "layoverDays" INTEGER,
    "layoverRate" DOUBLE PRECISION,
    "tonuReason" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "AccessorialChargeStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessorialCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateConfirmation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "rateConfNumber" TEXT,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "fuelSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accessorialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRate" DOUBLE PRECISION NOT NULL,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "paymentMethod" TEXT,
    "documentId" TEXT,
    "matchedToInvoice" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchedById" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loadAssigned" BOOLEAN NOT NULL DEFAULT true,
    "loadUpdated" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceDue" BOOLEAN NOT NULL DEFAULT true,
    "hosViolation" BOOLEAN NOT NULL DEFAULT true,
    "documentExpiring" BOOLEAN NOT NULL DEFAULT true,
    "invoicePaid" BOOLEAN NOT NULL DEFAULT true,
    "systemAlert" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "realmId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT,
    "inspectionNumber" TEXT NOT NULL,
    "inspectionType" "InspectionType" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "performedBy" TEXT,
    "location" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PASSED',
    "defects" INTEGER NOT NULL DEFAULT 0,
    "defectDetails" TEXT,
    "metadata" JSONB,
    "defectsFound" BOOLEAN NOT NULL DEFAULT false,
    "defectsList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mechanicSignoff" BOOLEAN NOT NULL DEFAULT false,
    "oosStatus" BOOLEAN NOT NULL DEFAULT false,
    "oosItems" TEXT,
    "oosSeverity" TEXT,
    "odometerReading" DOUBLE PRECISION,
    "notes" TEXT,
    "inspectorNotes" TEXT,
    "nextInspectionDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "partNumber" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'EA',
    "quantityOnHand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderPoint" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxStock" DOUBLE PRECISION,
    "minStock" DOUBLE PRECISION,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "averageCost" DOUBLE PRECISION,
    "lastCost" DOUBLE PRECISION,
    "warehouseLocation" TEXT,
    "binLocation" TEXT,
    "preferredVendorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "transactionType" "InventoryTransactionType" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "referenceNumber" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "vendorId" TEXT,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL DEFAULT 'SUPPLIER',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZip" TEXT,
    "billingEmail" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditLimit" DOUBLE PRECISION,
    "taxId" TEXT,
    "w9OnFile" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tag" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "specialties" TEXT,
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorContact" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationNumber" TEXT,
    "name" TEXT NOT NULL,
    "locationCompany" TEXT,
    "type" "LocationType" NOT NULL DEFAULT 'PICKUP',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "operatingHours" JSONB,
    "notes" TEXT,
    "specialInstructions" TEXT,
    "pickupCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "loadId" TEXT,
    "incidentNumber" TEXT NOT NULL,
    "incidentType" "SafetyIncidentType" NOT NULL,
    "severity" "SafetySeverity" NOT NULL DEFAULT 'MINOR',
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "location" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "contributingFactors" TEXT,
    "weatherConditions" TEXT,
    "roadConditions" TEXT,
    "injuriesInvolved" BOOLEAN NOT NULL DEFAULT false,
    "fatalitiesInvolved" BOOLEAN NOT NULL DEFAULT false,
    "vehicleDamage" TEXT,
    "propertyDamage" TEXT,
    "status" "SafetyIncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "investigationStatus" TEXT,
    "investigatorId" TEXT,
    "investigationNotes" TEXT,
    "rootCause" TEXT,
    "correctiveActions" TEXT,
    "dotReportable" BOOLEAN NOT NULL DEFAULT false,
    "dotReportNumber" TEXT,
    "policeReportNumber" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "insuranceClaimNumber" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTraining" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "trainingType" "SafetyTrainingType" NOT NULL,
    "trainingName" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "provider" TEXT,
    "instructor" TEXT,
    "certificateNumber" TEXT,
    "status" "SafetyTrainingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN,
    "notes" TEXT,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverQualificationFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "DQFStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DriverQualificationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DQFDocument" (
    "id" TEXT NOT NULL,
    "dqfId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" "DQFDocumentType" NOT NULL,
    "status" "DQFDocumentStatus" NOT NULL DEFAULT 'MISSING',
    "expirationDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DQFDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCard" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3),
    "medicalExaminerName" TEXT,
    "medicalExaminerCertificateNumber" TEXT,
    "waiverInformation" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicalCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CDLRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "cdlNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3),
    "issueState" TEXT NOT NULL,
    "licenseClass" TEXT,
    "endorsements" TEXT[],
    "restrictions" TEXT[],
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CDLRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MVRRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pullDate" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "nextPullDueDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MVRRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MVRViolation" (
    "id" TEXT NOT NULL,
    "mvrRecordId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "violationDate" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "points" INTEGER,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MVRViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugAlcoholTest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "testType" "DrugAlcoholTestType" NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "result" "TestResult" NOT NULL,
    "isRandom" BOOLEAN NOT NULL DEFAULT false,
    "randomSelectionId" TEXT,
    "labName" TEXT,
    "labAddress" TEXT,
    "labPhone" TEXT,
    "labReportNumber" TEXT,
    "collectionSiteName" TEXT,
    "collectionSiteAddress" TEXT,
    "mroName" TEXT,
    "mroPhone" TEXT,
    "notes" TEXT,
    "documentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DrugAlcoholTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingPool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "poolType" "PoolType" NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingPoolDriver" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestingPoolDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomSelection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "selectionDate" TIMESTAMP(3) NOT NULL,
    "selectionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RandomSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomSelectedDriver" (
    "id" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "testCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomSelectedDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMCSAClearinghouseQuery" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "queryDate" TIMESTAMP(3) NOT NULL,
    "queryType" "ClearinghouseQueryType" NOT NULL,
    "result" "ClearinghouseQueryResult",
    "violationsFound" BOOLEAN NOT NULL DEFAULT false,
    "violationDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FMCSAClearinghouseQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HOSViolation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "violationDate" TIMESTAMP(3) NOT NULL,
    "violationType" "HOSViolationType" NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "hoursExceeded" DOUBLE PRECISION,
    "eldProvider" TEXT,
    "eldRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HOSViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ELDProvider" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" "ELDProviderType" NOT NULL,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ELDProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ELDSyncLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "syncDate" TIMESTAMP(3) NOT NULL,
    "syncType" "ELDSyncType" NOT NULL,
    "status" "ELDSyncStatus" NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ELDSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reviewYear" INTEGER NOT NULL,
    "mvrReviewed" BOOLEAN NOT NULL DEFAULT false,
    "violationReviewed" BOOLEAN NOT NULL DEFAULT false,
    "accidentReviewed" BOOLEAN NOT NULL DEFAULT false,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "performanceDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "performanceNotes" TEXT,
    "actionItems" TEXT,
    "driverSignedAt" TIMESTAMP(3),
    "reviewerSignedAt" TIMESTAMP(3),
    "status" "AnnualReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AnnualReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVIR" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "inspectionType" "DVIRType" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "brakesOk" BOOLEAN NOT NULL DEFAULT true,
    "tiresOk" BOOLEAN NOT NULL DEFAULT true,
    "lightsOk" BOOLEAN NOT NULL DEFAULT true,
    "couplingOk" BOOLEAN NOT NULL DEFAULT true,
    "steeringOk" BOOLEAN NOT NULL DEFAULT true,
    "suspensionOk" BOOLEAN NOT NULL DEFAULT true,
    "frameOk" BOOLEAN NOT NULL DEFAULT true,
    "cargoSecurementOk" BOOLEAN NOT NULL DEFAULT true,
    "emergencyEquipmentOk" BOOLEAN NOT NULL DEFAULT true,
    "driverSignedAt" TIMESTAMP(3),
    "driverSignature" TEXT,
    "mechanicSignedAt" TIMESTAMP(3),
    "mechanicSignature" TEXT,
    "status" "DVIRStatus" NOT NULL DEFAULT 'COMPLETED',
    "vehicleNeedsRepair" BOOLEAN NOT NULL DEFAULT false,
    "workOrderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DVIR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVIRDefect" (
    "id" TEXT NOT NULL,
    "dvirId" TEXT NOT NULL,
    "inspectionPoint" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "location" TEXT,
    "photoDocumentIds" TEXT[],
    "workOrderId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVIRDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadsideInspection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectionLocation" TEXT NOT NULL,
    "inspectionState" TEXT NOT NULL,
    "inspectionLevel" "InspectionLevel" NOT NULL,
    "inspectorName" TEXT,
    "inspectorBadgeNumber" TEXT,
    "violationsFound" BOOLEAN NOT NULL DEFAULT false,
    "outOfService" BOOLEAN NOT NULL DEFAULT false,
    "oosReason" TEXT,
    "dataQSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "dataQSubmissionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoadsideInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadsideViolation" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "severityWeight" DOUBLE PRECISION,
    "basicCategory" "CSABasicCategory",
    "dataQSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "dataQStatus" "DataQStatus",
    "dataQSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadsideViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutOfServiceOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "oosDate" TIMESTAMP(3) NOT NULL,
    "oosReason" TEXT NOT NULL,
    "oosType" "OOSType" NOT NULL,
    "requiredCorrectiveAction" TEXT,
    "inspectorName" TEXT,
    "inspectorBadgeNumber" TEXT,
    "inspectionId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "verificationDocumentId" TEXT,
    "status" "OOSStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OutOfServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT,
    "sourceType" "DefectSourceType" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "location" TEXT,
    "reportedDate" TIMESTAMP(3) NOT NULL,
    "workOrderId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "timeToRepair" INTEGER,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccidentPhoto" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccidentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "investigatorId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "driverInterviewed" BOOLEAN NOT NULL DEFAULT false,
    "eldDataReviewed" BOOLEAN NOT NULL DEFAULT false,
    "vehicleExamined" BOOLEAN NOT NULL DEFAULT false,
    "photosReviewed" BOOLEAN NOT NULL DEFAULT false,
    "witnessStatementsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "policeReportReviewed" BOOLEAN NOT NULL DEFAULT false,
    "contributingFactors" TEXT,
    "rootCause" TEXT,
    "findings" TEXT,
    "correctiveActions" TEXT,
    "recommendations" TEXT,
    "trainingScheduled" BOOLEAN NOT NULL DEFAULT false,
    "trainingId" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventableDetermination" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewCommitteeMembers" TEXT[],
    "determination" "PreventableDecision" NOT NULL,
    "justification" TEXT NOT NULL,
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "appealDate" TIMESTAMP(3),
    "appealReason" TEXT,
    "appealDecision" "PreventableDecision",
    "appealJustification" TEXT,
    "driverScoreImpact" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventableDetermination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventableVote" (
    "id" TEXT NOT NULL,
    "determinationId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "vote" "PreventableDecision" NOT NULL,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreventableVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NearMiss" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "contributingFactors" TEXT,
    "suggestions" TEXT,
    "patternIdentified" BOOLEAN NOT NULL DEFAULT false,
    "trainingNeeded" BOOLEAN NOT NULL DEFAULT false,
    "policyChangeNeeded" BOOLEAN NOT NULL DEFAULT false,
    "actionItems" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "reportedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NearMiss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "officerName" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "citedParty" TEXT,
    "violationsIssued" TEXT[],
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WitnessStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "witnessName" TEXT NOT NULL,
    "witnessPhone" TEXT,
    "witnessEmail" TEXT,
    "witnessAddress" TEXT,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "statement" TEXT NOT NULL,
    "documentId" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WitnessStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CSAScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "scoreDate" TIMESTAMP(3) NOT NULL,
    "basicCategory" "CSABasicCategory" NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION,
    "previousPercentile" DOUBLE PRECISION,
    "trend" "CSATrend",
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "violationDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CSAScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMCSACompliance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "safetyRating" "SafetyRating",
    "safetyRatingDate" TIMESTAMP(3),
    "safetyRatingReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FMCSACompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReview" (
    "id" TEXT NOT NULL,
    "complianceId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewType" TEXT NOT NULL,
    "findings" TEXT,
    "correctiveActions" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceActionItem" (
    "id" TEXT NOT NULL,
    "complianceId" TEXT NOT NULL,
    "actionItem" TEXT NOT NULL,
    "priority" "CompliancePriority" NOT NULL,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "status" "ComplianceActionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQSubmission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "violationId" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL,
    "fmcsatrackingNumber" TEXT NOT NULL,
    "violationChallenged" TEXT NOT NULL,
    "reasonForChallenge" TEXT NOT NULL,
    "supportingDocumentIds" TEXT[],
    "status" "DataQStatus" NOT NULL DEFAULT 'PENDING',
    "responseDate" TIMESTAMP(3),
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyType" "InsurancePolicyType" NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "agentName" TEXT,
    "agentPhone" TEXT,
    "agentEmail" TEXT,
    "coverageLimit" DOUBLE PRECISION,
    "deductible" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCertificate" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "certificateHolder" TEXT NOT NULL,
    "additionalInsured" BOOLEAN NOT NULL DEFAULT false,
    "expirationDate" TIMESTAMP(3),
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyId" TEXT,
    "incidentId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "claimType" "InsuranceClaimType" NOT NULL,
    "dateOfLoss" TIMESTAMP(3) NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "adjusterName" TEXT,
    "adjusterPhone" TEXT,
    "adjusterEmail" TEXT,
    "estimatedLoss" DOUBLE PRECISION,
    "reserveAmount" DOUBLE PRECISION,
    "paidAmount" DOUBLE PRECISION,
    "settlementAmount" DOUBLE PRECISION,
    "settlementDate" TIMESTAMP(3),
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoClaim" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "shipper" TEXT,
    "consignee" TEXT,
    "bolNumber" TEXT,
    "product" TEXT,
    "valueClaimed" DOUBLE PRECISION,
    "causeOfDamage" TEXT,
    "claimDate" TIMESTAMP(3) NOT NULL,
    "status" "CargoClaimStatus" NOT NULL DEFAULT 'OPEN',
    "denied" BOOLEAN NOT NULL DEFAULT false,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settlementAmount" DOUBLE PRECISION,
    "settlementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CargoClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyDamage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "damageType" TEXT NOT NULL,
    "damageDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "responsibility" TEXT,
    "customerAtFault" BOOLEAN NOT NULL DEFAULT false,
    "recoveryTracking" TEXT,
    "driverCoached" BOOLEAN NOT NULL DEFAULT false,
    "correctiveActions" TEXT,
    "preventionMeasures" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyDamage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LossRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportType" "LossRunType" NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "totalClaims" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReserve" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lossRatio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LossRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyMeeting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingTime" TEXT,
    "location" TEXT,
    "topic" TEXT NOT NULL,
    "agenda" TEXT,
    "handoutDocumentIds" TEXT[],
    "minutes" TEXT,
    "actionItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "signInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "category" "SafetyPolicyCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "supersededDate" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "signature" TEXT,
    "status" "AcknowledgmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCampaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignType" "SafetyCampaignType" NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignParticipant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "achievement" TEXT,
    "bonusAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyRecognition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "recognitionType" "SafetyRecognitionType" NOT NULL,
    "achievement" TEXT NOT NULL,
    "recognitionDate" TIMESTAMP(3) NOT NULL,
    "certificateDocumentId" TEXT,
    "awardAmount" DOUBLE PRECISION,
    "announced" BOOLEAN NOT NULL DEFAULT false,
    "announcementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "category" "TrainingMaterialCategory" NOT NULL,
    "materialType" "TrainingMaterialType" NOT NULL,
    "description" TEXT,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alertType" "ComplianceAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "assignedTo" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McNumber" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "type" "McNumberType" NOT NULL DEFAULT 'CARRIER',
    "companyPhone" TEXT,
    "owner" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usdot" TEXT,
    "notes" TEXT,
    "number" TEXT NOT NULL,
    "logoUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "email" TEXT,
    "website" TEXT,
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "McNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadTag" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverTag" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckTag" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruckTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTag" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "defaultAmount" DOUBLE PRECISION,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT true,
    "requiresReceipt" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "type" "TariffType" NOT NULL DEFAULT 'RATE_PER_MILE',
    "rate" DOUBLE PRECISION NOT NULL,
    "minimumRate" DOUBLE PRECISION,
    "perStop" DOUBLE PRECISION,
    "perPound" DOUBLE PRECISION,
    "perMile" DOUBLE PRECISION,
    "fuelSurcharge" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "originZip" TEXT,
    "destinationZip" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffRule" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "paymentType" TEXT NOT NULL,
    "defaultMethod" "PaymentMethod",
    "defaultTerms" INTEGER,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "approvalThreshold" DOUBLE PRECISION,
    "requiresPO" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPaymentType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "terms" INTEGER,
    "requiresPO" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OrderPaymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnomaly" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicStatus" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "entityType" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workflowRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DynamicStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DefaultConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "category" TEXT,
    "defaultPriority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "description" TEXT,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "template" JSONB NOT NULL,
    "fields" JSONB,
    "filters" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportConstructor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "layout" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "filters" JSONB,
    "grouping" JSONB,
    "sorting" JSONB,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportConstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetProfitFormula" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NetProfitFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "ClassificationType" NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Classification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "apiType" "ApiCacheType" NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "generalSettings" JSONB,
    "notificationSettings" JSONB,
    "appearanceSettings" JSONB,
    "securitySettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "defaultDetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "defaultFreeTimeMinutes" INTEGER NOT NULL DEFAULT 120,
    "standardTonuFee" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "factoringActive" BOOLEAN NOT NULL DEFAULT false,
    "factoringCompanyName" TEXT,
    "factoringCompanyAddress" TEXT,
    "payDriverOnFuelSurcharge" BOOLEAN NOT NULL DEFAULT false,
    "companyFuelTaxRate" DOUBLE PRECISION,
    "averageFuelPrice" DOUBLE PRECISION DEFAULT 3.65,
    "averageMpg" DOUBLE PRECISION DEFAULT 6.5,
    "maintenanceCpm" DOUBLE PRECISION DEFAULT 0.18,
    "fixedCostPerDay" DOUBLE PRECISION DEFAULT 85,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "googleServiceAccountEmail" TEXT,
    "googleServiceAccountPrivateKey" TEXT,
    "googleSheetsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "entityType" "CustomFieldEntityType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "options" JSONB,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "aiConfidence" DOUBLE PRECISION NOT NULL,
    "aiReasoning" TEXT NOT NULL,
    "suggestedValue" JSONB NOT NULL,
    "originalValue" JSONB,
    "status" "AISuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approved" BOOLEAN,
    "rejectionReason" TEXT,
    "appliedAt" TIMESTAMP(3),
    "appliedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserColumnPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "columnPreferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserColumnPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamsaraDeviceQueue" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "samsaraId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vin" TEXT,
    "licensePlate" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "matchedRecordId" TEXT,
    "matchedType" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SamsaraDeviceQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckFaultHistory" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "faultCode" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT,
    "category" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SAMSARA',
    "samsaraFaultId" TEXT,
    "samsaraVehicleId" TEXT,
    "spnId" INTEGER,
    "fmiId" INTEGER,
    "checkEngineLight" BOOLEAN NOT NULL DEFAULT false,
    "mileageAtOccur" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifiedFleet" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckFaultHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCodeReference" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "spnId" INTEGER,
    "fmiId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "commonCauses" TEXT[],
    "troubleshooting" TEXT[],
    "estimatedCost" TEXT,
    "urgency" TEXT NOT NULL,
    "vehicleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticCodeReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" TEXT NOT NULL,
    "sessionData" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastConnected" TIMESTAMP(3),
    "connectionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramDriverMapping" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "aiAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "phoneNumber" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TelegramDriverMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResponseLog" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT,
    "messageContent" TEXT NOT NULL,
    "aiAnalysis" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "wasAutoSent" BOOLEAN NOT NULL DEFAULT false,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "responseContent" TEXT,
    "actualResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIResponseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "autoCreateCases" BOOLEAN NOT NULL DEFAULT true,
    "aiAutoResponse" BOOLEAN NOT NULL DEFAULT false,
    "requireStaffApproval" BOOLEAN NOT NULL DEFAULT true,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "aiProvider" TEXT NOT NULL DEFAULT 'OPENAI',
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "emergencyKeywords" TEXT[] DEFAULT ARRAY['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt']::TEXT[],
    "adminChatId" TEXT,
    "autoAckMessage" TEXT DEFAULT 'We received your message. Our team will respond shortly.',
    "caseCreatedMessage" TEXT DEFAULT 'Case #{caseNumber} created. We''ll contact you soon.',
    "afterHoursMessage" TEXT DEFAULT 'We received your message after hours. On-call staff will respond within 15 minutes.',
    "emergencyContactNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamsaraSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "autoSyncDrivers" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncVehicles" BOOLEAN NOT NULL DEFAULT false,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SamsaraSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickBooksSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "qboEnvironment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "autoSyncInvoices" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncCustomers" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "manualModules" "SubscriptionModule"[] DEFAULT ARRAY[]::"SubscriptionModule"[],
    "usageBased" BOOLEAN NOT NULL DEFAULT true,
    "loadsLimit" INTEGER,
    "invoicesLimit" INTEGER,
    "settlementsLimit" INTEGER,
    "documentsLimit" INTEGER,
    "driversLimit" INTEGER,
    "trucksLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionAddOn" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "module" "SubscriptionModule" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeSubscriptionItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scope" "ApiKeyScope" NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "mcNumberId" TEXT,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmIntegration" (
    "id" TEXT NOT NULL,
    "mcNumberId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GOOGLE_SHEETS',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "cdlNumber" TEXT,
    "cdlClass" TEXT,
    "cdlExpiration" TIMESTAMP(3),
    "endorsements" TEXT[],
    "yearsExperience" INTEGER,
    "previousEmployers" TEXT,
    "freightTypes" TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'WARM',
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "assignedToId" TEXT,
    "tags" TEXT[],
    "aiScore" DOUBLE PRECISION,
    "aiScoreSummary" TEXT,
    "aiScoreUpdatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDocument" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "loadsCreated" INTEGER NOT NULL DEFAULT 0,
    "invoicesGenerated" INTEGER NOT NULL DEFAULT 0,
    "settlementsGenerated" INTEGER NOT NULL DEFAULT 0,
    "documentsProcessed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "settlementValidationMode" "SettlementValidationMode" NOT NULL DEFAULT 'FLEXIBLE',
    "requirePodUploaded" BOOLEAN NOT NULL DEFAULT false,
    "requireReadyForSettlementFlag" BOOLEAN NOT NULL DEFAULT false,
    "requireDeliveredDate" BOOLEAN NOT NULL DEFAULT true,
    "requireMcNumberMatch" BOOLEAN NOT NULL DEFAULT true,
    "warnOnMissingPod" BOOLEAN NOT NULL DEFAULT true,
    "warnOnMissingBol" BOOLEAN NOT NULL DEFAULT true,
    "warnOnOldDeliveryDate" BOOLEAN NOT NULL DEFAULT true,
    "oldDeliveryThresholdDays" INTEGER NOT NULL DEFAULT 30,
    "requirePodForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "requireBolForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "allowPartialBatches" BOOLEAN NOT NULL DEFAULT true,
    "autoMarkReadyForSettlement" BOOLEAN NOT NULL DEFAULT false,
    "autoMarkReadyForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToInvestigation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToInvestigation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToRoadsideInspection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToRoadsideInspection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToInsuranceClaim" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToInsuranceClaim_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AnnualReviewToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AnnualReviewToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DVIRToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DVIRToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ComplianceReviewToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComplianceReviewToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CargoClaimToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CargoClaimToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_mcNumberId_idx" ON "User"("mcNumberId");

-- CreateIndex
CREATE INDEX "User_employeeNumber_idx" ON "User"("employeeNumber");

-- CreateIndex
CREATE INDEX "UserCompany_userId_idx" ON "UserCompany"("userId");

-- CreateIndex
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "RolePermission_permission_idx" ON "RolePermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "Company_dotNumber_key" ON "Company"("dotNumber");

-- CreateIndex
CREATE INDEX "Load_companyId_idx" ON "Load"("companyId");

-- CreateIndex
CREATE INDEX "Load_customerId_idx" ON "Load"("customerId");

-- CreateIndex
CREATE INDEX "Load_driverId_idx" ON "Load"("driverId");

-- CreateIndex
CREATE INDEX "Load_coDriverId_idx" ON "Load"("coDriverId");

-- CreateIndex
CREATE INDEX "Load_dispatcherId_idx" ON "Load"("dispatcherId");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Load_dispatchStatus_idx" ON "Load"("dispatchStatus");

-- CreateIndex
CREATE INDEX "Load_pickupDate_idx" ON "Load"("pickupDate");

-- CreateIndex
CREATE INDEX "Load_deliveryDate_idx" ON "Load"("deliveryDate");

-- CreateIndex
CREATE INDEX "Load_loadNumber_idx" ON "Load"("loadNumber");

-- CreateIndex
CREATE INDEX "Load_mcNumberId_idx" ON "Load"("mcNumberId");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_idx" ON "Load"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_status_idx" ON "Load"("companyId", "mcNumberId", "status");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_createdAt_idx" ON "Load"("companyId", "mcNumberId", "createdAt");

-- CreateIndex
CREATE INDEX "Load_companyId_driverId_status_idx" ON "Load"("companyId", "driverId", "status");

-- CreateIndex
CREATE INDEX "Load_companyId_status_createdAt_idx" ON "Load"("companyId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Load_companyId_loadNumber_key" ON "Load"("companyId", "loadNumber");

-- CreateIndex
CREATE INDEX "LoadStop_loadId_idx" ON "LoadStop"("loadId");

-- CreateIndex
CREATE INDEX "LoadStop_loadId_sequence_idx" ON "LoadStop"("loadId", "sequence");

-- CreateIndex
CREATE INDEX "LoadStop_status_idx" ON "LoadStop"("status");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_loadId_idx" ON "LoadStatusHistory"("loadId");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_createdAt_idx" ON "LoadStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LoadSegment_loadId_idx" ON "LoadSegment"("loadId");

-- CreateIndex
CREATE INDEX "LoadSegment_driverId_idx" ON "LoadSegment"("driverId");

-- CreateIndex
CREATE INDEX "LoadSegment_truckId_idx" ON "LoadSegment"("truckId");

-- CreateIndex
CREATE INDEX "LoadSegment_loadId_sequence_idx" ON "LoadSegment"("loadId", "sequence");

-- CreateIndex
CREATE INDEX "LoadSegment_startDate_idx" ON "LoadSegment"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Route_loadId_key" ON "Route"("loadId");

-- CreateIndex
CREATE INDEX "Driver_companyId_idx" ON "Driver"("companyId");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_employeeStatus_idx" ON "Driver"("employeeStatus");

-- CreateIndex
CREATE INDEX "Driver_assignmentStatus_idx" ON "Driver"("assignmentStatus");

-- CreateIndex
CREATE INDEX "Driver_driverNumber_idx" ON "Driver"("driverNumber");

-- CreateIndex
CREATE INDEX "Driver_currentTruckId_idx" ON "Driver"("currentTruckId");

-- CreateIndex
CREATE INDEX "Driver_currentTrailerId_idx" ON "Driver"("currentTrailerId");

-- CreateIndex
CREATE INDEX "Driver_mcNumberId_idx" ON "Driver"("mcNumberId");

-- CreateIndex
CREATE INDEX "Driver_companyId_mcNumberId_idx" ON "Driver"("companyId", "mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_companyId_key" ON "Driver"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_companyId_driverNumber_key" ON "Driver"("companyId", "driverNumber");

-- CreateIndex
CREATE INDEX "DriverTruckHistory_driverId_idx" ON "DriverTruckHistory"("driverId");

-- CreateIndex
CREATE INDEX "DriverTruckHistory_truckId_idx" ON "DriverTruckHistory"("truckId");

-- CreateIndex
CREATE INDEX "DriverTruckHistory_date_idx" ON "DriverTruckHistory"("date");

-- CreateIndex
CREATE INDEX "DriverTrailerHistory_driverId_idx" ON "DriverTrailerHistory"("driverId");

-- CreateIndex
CREATE INDEX "DriverTrailerHistory_trailerId_idx" ON "DriverTrailerHistory"("trailerId");

-- CreateIndex
CREATE INDEX "DriverComment_driverId_idx" ON "DriverComment"("driverId");

-- CreateIndex
CREATE INDEX "DriverComment_createdAt_idx" ON "DriverComment"("createdAt");

-- CreateIndex
CREATE INDEX "HOSRecord_driverId_idx" ON "HOSRecord"("driverId");

-- CreateIndex
CREATE INDEX "HOSRecord_date_idx" ON "HOSRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_samsaraId_key" ON "Truck"("samsaraId");

-- CreateIndex
CREATE INDEX "Truck_companyId_idx" ON "Truck"("companyId");

-- CreateIndex
CREATE INDEX "Truck_status_idx" ON "Truck"("status");

-- CreateIndex
CREATE INDEX "Truck_truckNumber_idx" ON "Truck"("truckNumber");

-- CreateIndex
CREATE INDEX "Truck_mcNumberId_idx" ON "Truck"("mcNumberId");

-- CreateIndex
CREATE INDEX "Truck_companyId_mcNumberId_idx" ON "Truck"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Truck_samsaraId_idx" ON "Truck"("samsaraId");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_companyId_truckNumber_key" ON "Truck"("companyId", "truckNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_companyId_vin_key" ON "Truck"("companyId", "vin");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_samsaraId_key" ON "Trailer"("samsaraId");

-- CreateIndex
CREATE INDEX "Trailer_companyId_idx" ON "Trailer"("companyId");

-- CreateIndex
CREATE INDEX "Trailer_trailerNumber_idx" ON "Trailer"("trailerNumber");

-- CreateIndex
CREATE INDEX "Trailer_assignedTruckId_idx" ON "Trailer"("assignedTruckId");

-- CreateIndex
CREATE INDEX "Trailer_mcNumberId_idx" ON "Trailer"("mcNumberId");

-- CreateIndex
CREATE INDEX "Trailer_companyId_mcNumberId_idx" ON "Trailer"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Trailer_samsaraId_idx" ON "Trailer"("samsaraId");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_companyId_trailerNumber_key" ON "Trailer"("companyId", "trailerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_companyId_vin_key" ON "Trailer"("companyId", "vin");

-- CreateIndex
CREATE UNIQUE INDEX "FuelEntry_fuelEntryNumber_key" ON "FuelEntry"("fuelEntryNumber");

-- CreateIndex
CREATE INDEX "FuelEntry_truckId_idx" ON "FuelEntry"("truckId");

-- CreateIndex
CREATE INDEX "FuelEntry_driverId_idx" ON "FuelEntry"("driverId");

-- CreateIndex
CREATE INDEX "FuelEntry_mcNumberId_idx" ON "FuelEntry"("mcNumberId");

-- CreateIndex
CREATE INDEX "FuelEntry_date_idx" ON "FuelEntry"("date");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelEntryNumber_idx" ON "FuelEntry"("fuelEntryNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_truckId_idx" ON "MaintenanceRecord"("truckId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_nextServiceDate_idx" ON "MaintenanceRecord"("nextServiceDate");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_companyId_idx" ON "MaintenanceRecord"("companyId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vendorId_idx" ON "MaintenanceRecord"("vendorId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_maintenanceNumber_idx" ON "MaintenanceRecord"("maintenanceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRecord_companyId_maintenanceNumber_key" ON "MaintenanceRecord"("companyId", "maintenanceNumber");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_truckId_idx" ON "MaintenanceSchedule"("truckId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_companyId_idx" ON "MaintenanceSchedule"("companyId");

-- CreateIndex
CREATE INDEX "OnCallShift_companyId_idx" ON "OnCallShift"("companyId");

-- CreateIndex
CREATE INDEX "OnCallShift_assignedToId_idx" ON "OnCallShift"("assignedToId");

-- CreateIndex
CREATE INDEX "OnCallShift_startDate_idx" ON "OnCallShift"("startDate");

-- CreateIndex
CREATE INDEX "OnCallShift_endDate_idx" ON "OnCallShift"("endDate");

-- CreateIndex
CREATE INDEX "Breakdown_companyId_idx" ON "Breakdown"("companyId");

-- CreateIndex
CREATE INDEX "Breakdown_truckId_idx" ON "Breakdown"("truckId");

-- CreateIndex
CREATE INDEX "Breakdown_loadId_idx" ON "Breakdown"("loadId");

-- CreateIndex
CREATE INDEX "Breakdown_driverId_idx" ON "Breakdown"("driverId");

-- CreateIndex
CREATE INDEX "Breakdown_trailerId_idx" ON "Breakdown"("trailerId");

-- CreateIndex
CREATE INDEX "Breakdown_mcNumberId_idx" ON "Breakdown"("mcNumberId");

-- CreateIndex
CREATE INDEX "Breakdown_status_idx" ON "Breakdown"("status");

-- CreateIndex
CREATE INDEX "Breakdown_breakdownType_idx" ON "Breakdown"("breakdownType");

-- CreateIndex
CREATE INDEX "Breakdown_reportedAt_idx" ON "Breakdown"("reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Breakdown_companyId_breakdownNumber_key" ON "Breakdown"("companyId", "breakdownNumber");

-- CreateIndex
CREATE INDEX "BreakdownAssignment_breakdownId_idx" ON "BreakdownAssignment"("breakdownId");

-- CreateIndex
CREATE INDEX "BreakdownAssignment_userId_idx" ON "BreakdownAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BreakdownAssignment_breakdownId_userId_key" ON "BreakdownAssignment"("breakdownId", "userId");

-- CreateIndex
CREATE INDEX "Communication_companyId_idx" ON "Communication"("companyId");

-- CreateIndex
CREATE INDEX "Communication_breakdownId_idx" ON "Communication"("breakdownId");

-- CreateIndex
CREATE INDEX "Communication_driverId_idx" ON "Communication"("driverId");

-- CreateIndex
CREATE INDEX "Communication_channel_idx" ON "Communication"("channel");

-- CreateIndex
CREATE INDEX "Communication_type_idx" ON "Communication"("type");

-- CreateIndex
CREATE INDEX "Communication_direction_idx" ON "Communication"("direction");

-- CreateIndex
CREATE INDEX "Communication_createdAt_idx" ON "Communication"("createdAt");

-- CreateIndex
CREATE INDEX "Communication_telegramChatId_idx" ON "Communication"("telegramChatId");

-- CreateIndex
CREATE INDEX "Communication_ticketNumber_idx" ON "Communication"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_companyId_ticketNumber_key" ON "Communication"("companyId", "ticketNumber");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_customerNumber_idx" ON "Customer"("customerNumber");

-- CreateIndex
CREATE INDEX "Customer_creditHold_idx" ON "Customer"("creditHold");

-- CreateIndex
CREATE INDEX "Customer_factoringCompanyId_idx" ON "Customer"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "Customer_mcNumber_idx" ON "Customer"("mcNumber");

-- CreateIndex
CREATE INDEX "Customer_companyId_mcNumber_idx" ON "Customer"("companyId", "mcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_customerNumber_key" ON "Customer"("companyId", "customerNumber");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_idx" ON "ActivityLog"("companyId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_safetyTrainingCertificateId_key" ON "Document"("safetyTrainingCertificateId");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_loadId_idx" ON "Document"("loadId");

-- CreateIndex
CREATE INDEX "Document_driverId_idx" ON "Document"("driverId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_mcNumber_idx" ON "Invoice"("mcNumber");

-- CreateIndex
CREATE INDEX "Invoice_mcNumberId_idx" ON "Invoice"("mcNumberId");

-- CreateIndex
CREATE INDEX "Invoice_reconciliationStatus_idx" ON "Invoice"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "Invoice_factoringStatus_idx" ON "Invoice"("factoringStatus");

-- CreateIndex
CREATE INDEX "Invoice_factoringCompanyId_idx" ON "Invoice"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "Invoice_paymentMethod_idx" ON "Invoice"("paymentMethod");

-- CreateIndex
CREATE INDEX "Invoice_subStatus_idx" ON "Invoice"("subStatus");

-- CreateIndex
CREATE INDEX "Invoice_factoringBatchId_idx" ON "Invoice"("factoringBatchId");

-- CreateIndex
CREATE INDEX "Invoice_loadId_idx" ON "Invoice"("loadId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceBatchId_idx" ON "Invoice"("invoiceBatchId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_idx" ON "Invoice"("customerId", "status");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_createdAt_idx" ON "Invoice"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_status_createdAt_idx" ON "Invoice"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_mcNumber_status_idx" ON "Invoice"("mcNumber", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_settlementNumber_key" ON "Settlement"("settlementNumber");

-- CreateIndex
CREATE INDEX "Settlement_driverId_idx" ON "Settlement"("driverId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_approvalStatus_idx" ON "Settlement"("approvalStatus");

-- CreateIndex
CREATE INDEX "Settlement_approvedById_idx" ON "Settlement"("approvedById");

-- CreateIndex
CREATE INDEX "Settlement_periodStart_idx" ON "Settlement"("periodStart");

-- CreateIndex
CREATE INDEX "Settlement_periodEnd_idx" ON "Settlement"("periodEnd");

-- CreateIndex
CREATE INDEX "Settlement_driverId_status_idx" ON "Settlement"("driverId", "status");

-- CreateIndex
CREATE INDEX "Settlement_driverId_status_createdAt_idx" ON "Settlement"("driverId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_driverId_createdAt_idx" ON "Settlement"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_status_createdAt_idx" ON "Settlement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_salaryBatchId_idx" ON "Settlement"("salaryBatchId");

-- CreateIndex
CREATE INDEX "SalaryBatch_companyId_idx" ON "SalaryBatch"("companyId");

-- CreateIndex
CREATE INDEX "SalaryBatch_status_idx" ON "SalaryBatch"("status");

-- CreateIndex
CREATE INDEX "SalaryBatch_periodStart_idx" ON "SalaryBatch"("periodStart");

-- CreateIndex
CREATE INDEX "SalaryBatch_periodEnd_idx" ON "SalaryBatch"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryBatch_companyId_batchNumber_key" ON "SalaryBatch"("companyId", "batchNumber");

-- CreateIndex
CREATE INDEX "SettlementDeduction_settlementId_idx" ON "SettlementDeduction"("settlementId");

-- CreateIndex
CREATE INDEX "SettlementDeduction_deductionType_idx" ON "SettlementDeduction"("deductionType");

-- CreateIndex
CREATE INDEX "SettlementDeduction_fuelEntryId_idx" ON "SettlementDeduction"("fuelEntryId");

-- CreateIndex
CREATE INDEX "SettlementDeduction_driverAdvanceId_idx" ON "SettlementDeduction"("driverAdvanceId");

-- CreateIndex
CREATE INDEX "SettlementDeduction_loadExpenseId_idx" ON "SettlementDeduction"("loadExpenseId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverAdvance_advanceNumber_key" ON "DriverAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "DriverAdvance_driverId_idx" ON "DriverAdvance"("driverId");

-- CreateIndex
CREATE INDEX "DriverAdvance_loadId_idx" ON "DriverAdvance"("loadId");

-- CreateIndex
CREATE INDEX "DriverAdvance_settlementId_idx" ON "DriverAdvance"("settlementId");

-- CreateIndex
CREATE INDEX "DriverAdvance_advanceNumber_idx" ON "DriverAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_driverId_idx" ON "DriverNegativeBalance"("driverId");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_isApplied_idx" ON "DriverNegativeBalance"("isApplied");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_originalSettlementId_idx" ON "DriverNegativeBalance"("originalSettlementId");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_appliedSettlementId_idx" ON "DriverNegativeBalance"("appliedSettlementId");

-- CreateIndex
CREATE UNIQUE INDEX "LoadExpense_expenseNumber_key" ON "LoadExpense"("expenseNumber");

-- CreateIndex
CREATE INDEX "LoadExpense_loadId_idx" ON "LoadExpense"("loadId");

-- CreateIndex
CREATE INDEX "LoadExpense_expenseType_idx" ON "LoadExpense"("expenseType");

-- CreateIndex
CREATE INDEX "LoadExpense_vendorId_idx" ON "LoadExpense"("vendorId");

-- CreateIndex
CREATE INDEX "LoadExpense_settlementId_idx" ON "LoadExpense"("settlementId");

-- CreateIndex
CREATE INDEX "LoadExpense_approvalStatus_idx" ON "LoadExpense"("approvalStatus");

-- CreateIndex
CREATE INDEX "LoadExpense_approvedById_idx" ON "LoadExpense"("approvedById");

-- CreateIndex
CREATE INDEX "LoadExpense_date_idx" ON "LoadExpense"("date");

-- CreateIndex
CREATE INDEX "LoadExpense_expenseNumber_idx" ON "LoadExpense"("expenseNumber");

-- CreateIndex
CREATE INDEX "DeductionRule_companyId_idx" ON "DeductionRule"("companyId");

-- CreateIndex
CREATE INDEX "DeductionRule_deductionType_idx" ON "DeductionRule"("deductionType");

-- CreateIndex
CREATE INDEX "DeductionRule_driverType_idx" ON "DeductionRule"("driverType");

-- CreateIndex
CREATE INDEX "DeductionRule_driverId_idx" ON "DeductionRule"("driverId");

-- CreateIndex
CREATE INDEX "DeductionRule_isActive_idx" ON "DeductionRule"("isActive");

-- CreateIndex
CREATE INDEX "DeductionRule_isAddition_idx" ON "DeductionRule"("isAddition");

-- CreateIndex
CREATE INDEX "DeductionRule_startDate_idx" ON "DeductionRule"("startDate");

-- CreateIndex
CREATE INDEX "DeductionRule_endDate_idx" ON "DeductionRule"("endDate");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_companyId_idx" ON "DeductionTypeTemplate"("companyId");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_category_idx" ON "DeductionTypeTemplate"("category");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_isActive_idx" ON "DeductionTypeTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionTypeTemplate_companyId_name_key" ON "DeductionTypeTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "SettlementApproval_settlementId_idx" ON "SettlementApproval"("settlementId");

-- CreateIndex
CREATE INDEX "SettlementApproval_approvedById_idx" ON "SettlementApproval"("approvedById");

-- CreateIndex
CREATE INDEX "SettlementApproval_status_idx" ON "SettlementApproval"("status");

-- CreateIndex
CREATE INDEX "SettlementApproval_createdAt_idx" ON "SettlementApproval"("createdAt");

-- CreateIndex
CREATE INDEX "IFTAConfig_companyId_idx" ON "IFTAConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IFTAConfig_companyId_key" ON "IFTAConfig"("companyId");

-- CreateIndex
CREATE INDEX "IFTAEntry_companyId_idx" ON "IFTAEntry"("companyId");

-- CreateIndex
CREATE INDEX "IFTAEntry_driverId_idx" ON "IFTAEntry"("driverId");

-- CreateIndex
CREATE INDEX "IFTAEntry_truckId_idx" ON "IFTAEntry"("truckId");

-- CreateIndex
CREATE INDEX "IFTAEntry_loadId_idx" ON "IFTAEntry"("loadId");

-- CreateIndex
CREATE INDEX "IFTAEntry_periodYear_periodQuarter_periodMonth_idx" ON "IFTAEntry"("periodYear", "periodQuarter", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "IFTAEntry_loadId_key" ON "IFTAEntry"("loadId");

-- CreateIndex
CREATE INDEX "IFTAStateMileage_iftaEntryId_idx" ON "IFTAStateMileage"("iftaEntryId");

-- CreateIndex
CREATE INDEX "IFTAStateMileage_state_idx" ON "IFTAStateMileage"("state");

-- CreateIndex
CREATE INDEX "InvoiceBatch_companyId_idx" ON "InvoiceBatch"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceBatch_postStatus_idx" ON "InvoiceBatch"("postStatus");

-- CreateIndex
CREATE INDEX "InvoiceBatch_batchNumber_idx" ON "InvoiceBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InvoiceBatch_createdById_idx" ON "InvoiceBatch"("createdById");

-- CreateIndex
CREATE INDEX "InvoiceBatch_factoringCompanyId_idx" ON "InvoiceBatch"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "InvoiceBatch_customerId_idx" ON "InvoiceBatch"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_companyId_batchNumber_key" ON "InvoiceBatch"("companyId", "batchNumber");

-- CreateIndex
CREATE INDEX "InvoiceBatchItem_batchId_idx" ON "InvoiceBatchItem"("batchId");

-- CreateIndex
CREATE INDEX "InvoiceBatchItem_invoiceId_idx" ON "InvoiceBatchItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatchItem_batchId_invoiceId_key" ON "InvoiceBatchItem"("batchId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_fuelEntryId_idx" ON "Payment"("fuelEntryId");

-- CreateIndex
CREATE INDEX "Payment_breakdownId_idx" ON "Payment"("breakdownId");

-- CreateIndex
CREATE INDEX "Payment_mcNumberId_idx" ON "Payment"("mcNumberId");

-- CreateIndex
CREATE INDEX "Payment_paymentNumber_idx" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_createdById_idx" ON "Payment"("createdById");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "Payment"("type");

-- CreateIndex
CREATE INDEX "Reconciliation_invoiceId_idx" ON "Reconciliation"("invoiceId");

-- CreateIndex
CREATE INDEX "Reconciliation_paymentId_idx" ON "Reconciliation"("paymentId");

-- CreateIndex
CREATE INDEX "Reconciliation_reconciledAt_idx" ON "Reconciliation"("reconciledAt");

-- CreateIndex
CREATE INDEX "Reconciliation_reconciledById_idx" ON "Reconciliation"("reconciledById");

-- CreateIndex
CREATE INDEX "FactoringCompany_companyId_idx" ON "FactoringCompany"("companyId");

-- CreateIndex
CREATE INDEX "FactoringCompany_isActive_idx" ON "FactoringCompany"("isActive");

-- CreateIndex
CREATE INDEX "FactoringBatch_companyId_idx" ON "FactoringBatch"("companyId");

-- CreateIndex
CREATE INDEX "FactoringBatch_vendorId_idx" ON "FactoringBatch"("vendorId");

-- CreateIndex
CREATE INDEX "FactoringBatch_status_idx" ON "FactoringBatch"("status");

-- CreateIndex
CREATE INDEX "AccessorialCharge_companyId_idx" ON "AccessorialCharge"("companyId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_loadId_idx" ON "AccessorialCharge"("loadId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_invoiceId_idx" ON "AccessorialCharge"("invoiceId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_chargeType_idx" ON "AccessorialCharge"("chargeType");

-- CreateIndex
CREATE INDEX "AccessorialCharge_status_idx" ON "AccessorialCharge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_documentId_key" ON "RateConfirmation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_invoiceId_key" ON "RateConfirmation"("invoiceId");

-- CreateIndex
CREATE INDEX "RateConfirmation_companyId_idx" ON "RateConfirmation"("companyId");

-- CreateIndex
CREATE INDEX "RateConfirmation_loadId_idx" ON "RateConfirmation"("loadId");

-- CreateIndex
CREATE INDEX "RateConfirmation_invoiceId_idx" ON "RateConfirmation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_loadId_key" ON "RateConfirmation"("loadId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "Integration_companyId_idx" ON "Integration"("companyId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE INDEX "Integration_isActive_idx" ON "Integration"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_companyId_provider_key" ON "Integration"("companyId", "provider");

-- CreateIndex
CREATE INDEX "Inspection_companyId_idx" ON "Inspection"("companyId");

-- CreateIndex
CREATE INDEX "Inspection_truckId_idx" ON "Inspection"("truckId");

-- CreateIndex
CREATE INDEX "Inspection_driverId_idx" ON "Inspection"("driverId");

-- CreateIndex
CREATE INDEX "Inspection_inspectionType_idx" ON "Inspection"("inspectionType");

-- CreateIndex
CREATE INDEX "Inspection_inspectionDate_idx" ON "Inspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_companyId_inspectionNumber_key" ON "Inspection"("companyId", "inspectionNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_companyId_idx" ON "InventoryItem"("companyId");

-- CreateIndex
CREATE INDEX "InventoryItem_itemNumber_idx" ON "InventoryItem"("itemNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_companyId_itemNumber_key" ON "InventoryItem"("companyId", "itemNumber");

-- CreateIndex
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryItemId_idx" ON "InventoryTransaction"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionType_idx" ON "InventoryTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionDate_idx" ON "InventoryTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "Vendor_companyId_idx" ON "Vendor"("companyId");

-- CreateIndex
CREATE INDEX "Vendor_vendorNumber_idx" ON "Vendor"("vendorNumber");

-- CreateIndex
CREATE INDEX "Vendor_createdById_idx" ON "Vendor"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_companyId_vendorNumber_key" ON "Vendor"("companyId", "vendorNumber");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Location_locationNumber_idx" ON "Location"("locationNumber");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_city_state_idx" ON "Location"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Location_companyId_locationNumber_key" ON "Location"("companyId", "locationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyIncident_incidentNumber_key" ON "SafetyIncident"("incidentNumber");

-- CreateIndex
CREATE INDEX "SafetyIncident_companyId_idx" ON "SafetyIncident"("companyId");

-- CreateIndex
CREATE INDEX "SafetyIncident_driverId_idx" ON "SafetyIncident"("driverId");

-- CreateIndex
CREATE INDEX "SafetyIncident_truckId_idx" ON "SafetyIncident"("truckId");

-- CreateIndex
CREATE INDEX "SafetyIncident_loadId_idx" ON "SafetyIncident"("loadId");

-- CreateIndex
CREATE INDEX "SafetyIncident_incidentType_idx" ON "SafetyIncident"("incidentType");

-- CreateIndex
CREATE INDEX "SafetyIncident_severity_idx" ON "SafetyIncident"("severity");

-- CreateIndex
CREATE INDEX "SafetyIncident_date_idx" ON "SafetyIncident"("date");

-- CreateIndex
CREATE INDEX "SafetyIncident_status_idx" ON "SafetyIncident"("status");

-- CreateIndex
CREATE INDEX "SafetyTraining_companyId_idx" ON "SafetyTraining"("companyId");

-- CreateIndex
CREATE INDEX "SafetyTraining_driverId_idx" ON "SafetyTraining"("driverId");

-- CreateIndex
CREATE INDEX "SafetyTraining_trainingType_idx" ON "SafetyTraining"("trainingType");

-- CreateIndex
CREATE INDEX "SafetyTraining_trainingDate_idx" ON "SafetyTraining"("trainingDate");

-- CreateIndex
CREATE INDEX "SafetyTraining_expiryDate_idx" ON "SafetyTraining"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DriverQualificationFile_driverId_key" ON "DriverQualificationFile"("driverId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_companyId_idx" ON "DriverQualificationFile"("companyId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_driverId_idx" ON "DriverQualificationFile"("driverId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_status_idx" ON "DriverQualificationFile"("status");

-- CreateIndex
CREATE INDEX "DQFDocument_dqfId_idx" ON "DQFDocument"("dqfId");

-- CreateIndex
CREATE INDEX "DQFDocument_documentType_idx" ON "DQFDocument"("documentType");

-- CreateIndex
CREATE INDEX "DQFDocument_status_idx" ON "DQFDocument"("status");

-- CreateIndex
CREATE INDEX "DQFDocument_expirationDate_idx" ON "DQFDocument"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "DQFDocument_dqfId_documentType_key" ON "DQFDocument"("dqfId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCard_documentId_key" ON "MedicalCard"("documentId");

-- CreateIndex
CREATE INDEX "MedicalCard_companyId_idx" ON "MedicalCard"("companyId");

-- CreateIndex
CREATE INDEX "MedicalCard_driverId_idx" ON "MedicalCard"("driverId");

-- CreateIndex
CREATE INDEX "MedicalCard_expirationDate_idx" ON "MedicalCard"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "CDLRecord_driverId_key" ON "CDLRecord"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "CDLRecord_documentId_key" ON "CDLRecord"("documentId");

-- CreateIndex
CREATE INDEX "CDLRecord_companyId_idx" ON "CDLRecord"("companyId");

-- CreateIndex
CREATE INDEX "CDLRecord_driverId_idx" ON "CDLRecord"("driverId");

-- CreateIndex
CREATE INDEX "CDLRecord_expirationDate_idx" ON "CDLRecord"("expirationDate");

-- CreateIndex
CREATE INDEX "CDLRecord_cdlNumber_idx" ON "CDLRecord"("cdlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MVRRecord_documentId_key" ON "MVRRecord"("documentId");

-- CreateIndex
CREATE INDEX "MVRRecord_companyId_idx" ON "MVRRecord"("companyId");

-- CreateIndex
CREATE INDEX "MVRRecord_driverId_idx" ON "MVRRecord"("driverId");

-- CreateIndex
CREATE INDEX "MVRRecord_pullDate_idx" ON "MVRRecord"("pullDate");

-- CreateIndex
CREATE INDEX "MVRRecord_nextPullDueDate_idx" ON "MVRRecord"("nextPullDueDate");

-- CreateIndex
CREATE INDEX "MVRViolation_mvrRecordId_idx" ON "MVRViolation"("mvrRecordId");

-- CreateIndex
CREATE INDEX "MVRViolation_violationDate_idx" ON "MVRViolation"("violationDate");

-- CreateIndex
CREATE INDEX "MVRViolation_isNew_idx" ON "MVRViolation"("isNew");

-- CreateIndex
CREATE UNIQUE INDEX "DrugAlcoholTest_documentId_key" ON "DrugAlcoholTest"("documentId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_companyId_idx" ON "DrugAlcoholTest"("companyId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_driverId_idx" ON "DrugAlcoholTest"("driverId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_testType_idx" ON "DrugAlcoholTest"("testType");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_testDate_idx" ON "DrugAlcoholTest"("testDate");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_result_idx" ON "DrugAlcoholTest"("result");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_isRandom_idx" ON "DrugAlcoholTest"("isRandom");

-- CreateIndex
CREATE INDEX "TestingPool_companyId_idx" ON "TestingPool"("companyId");

-- CreateIndex
CREATE INDEX "TestingPool_year_quarter_idx" ON "TestingPool"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "TestingPool_companyId_poolType_quarter_year_key" ON "TestingPool"("companyId", "poolType", "quarter", "year");

-- CreateIndex
CREATE INDEX "TestingPoolDriver_poolId_idx" ON "TestingPoolDriver"("poolId");

-- CreateIndex
CREATE INDEX "TestingPoolDriver_driverId_idx" ON "TestingPoolDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "TestingPoolDriver_poolId_driverId_key" ON "TestingPoolDriver"("poolId", "driverId");

-- CreateIndex
CREATE INDEX "RandomSelection_companyId_idx" ON "RandomSelection"("companyId");

-- CreateIndex
CREATE INDEX "RandomSelection_poolId_idx" ON "RandomSelection"("poolId");

-- CreateIndex
CREATE INDEX "RandomSelection_selectionDate_idx" ON "RandomSelection"("selectionDate");

-- CreateIndex
CREATE INDEX "RandomSelectedDriver_selectionId_idx" ON "RandomSelectedDriver"("selectionId");

-- CreateIndex
CREATE INDEX "RandomSelectedDriver_driverId_idx" ON "RandomSelectedDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "RandomSelectedDriver_selectionId_driverId_key" ON "RandomSelectedDriver"("selectionId", "driverId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_companyId_idx" ON "FMCSAClearinghouseQuery"("companyId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_driverId_idx" ON "FMCSAClearinghouseQuery"("driverId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_queryDate_idx" ON "FMCSAClearinghouseQuery"("queryDate");

-- CreateIndex
CREATE INDEX "HOSViolation_companyId_idx" ON "HOSViolation"("companyId");

-- CreateIndex
CREATE INDEX "HOSViolation_driverId_idx" ON "HOSViolation"("driverId");

-- CreateIndex
CREATE INDEX "HOSViolation_violationDate_idx" ON "HOSViolation"("violationDate");

-- CreateIndex
CREATE INDEX "HOSViolation_violationType_idx" ON "HOSViolation"("violationType");

-- CreateIndex
CREATE INDEX "ELDProvider_companyId_idx" ON "ELDProvider"("companyId");

-- CreateIndex
CREATE INDEX "ELDProvider_providerName_idx" ON "ELDProvider"("providerName");

-- CreateIndex
CREATE INDEX "ELDSyncLog_providerId_idx" ON "ELDSyncLog"("providerId");

-- CreateIndex
CREATE INDEX "ELDSyncLog_syncDate_idx" ON "ELDSyncLog"("syncDate");

-- CreateIndex
CREATE INDEX "ELDSyncLog_status_idx" ON "ELDSyncLog"("status");

-- CreateIndex
CREATE INDEX "AnnualReview_companyId_idx" ON "AnnualReview"("companyId");

-- CreateIndex
CREATE INDEX "AnnualReview_driverId_idx" ON "AnnualReview"("driverId");

-- CreateIndex
CREATE INDEX "AnnualReview_reviewDate_idx" ON "AnnualReview"("reviewDate");

-- CreateIndex
CREATE INDEX "AnnualReview_dueDate_idx" ON "AnnualReview"("dueDate");

-- CreateIndex
CREATE INDEX "AnnualReview_status_idx" ON "AnnualReview"("status");

-- CreateIndex
CREATE INDEX "DVIR_companyId_idx" ON "DVIR"("companyId");

-- CreateIndex
CREATE INDEX "DVIR_driverId_idx" ON "DVIR"("driverId");

-- CreateIndex
CREATE INDEX "DVIR_truckId_idx" ON "DVIR"("truckId");

-- CreateIndex
CREATE INDEX "DVIR_inspectionDate_idx" ON "DVIR"("inspectionDate");

-- CreateIndex
CREATE INDEX "DVIR_status_idx" ON "DVIR"("status");

-- CreateIndex
CREATE INDEX "DVIRDefect_dvirId_idx" ON "DVIRDefect"("dvirId");

-- CreateIndex
CREATE INDEX "DVIRDefect_severity_idx" ON "DVIRDefect"("severity");

-- CreateIndex
CREATE INDEX "DVIRDefect_workOrderId_idx" ON "DVIRDefect"("workOrderId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_companyId_idx" ON "RoadsideInspection"("companyId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_driverId_idx" ON "RoadsideInspection"("driverId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_truckId_idx" ON "RoadsideInspection"("truckId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_inspectionDate_idx" ON "RoadsideInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "RoadsideInspection_inspectionLevel_idx" ON "RoadsideInspection"("inspectionLevel");

-- CreateIndex
CREATE INDEX "RoadsideInspection_outOfService_idx" ON "RoadsideInspection"("outOfService");

-- CreateIndex
CREATE INDEX "RoadsideViolation_inspectionId_idx" ON "RoadsideViolation"("inspectionId");

-- CreateIndex
CREATE INDEX "RoadsideViolation_violationCode_idx" ON "RoadsideViolation"("violationCode");

-- CreateIndex
CREATE INDEX "RoadsideViolation_basicCategory_idx" ON "RoadsideViolation"("basicCategory");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_companyId_idx" ON "OutOfServiceOrder"("companyId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_driverId_idx" ON "OutOfServiceOrder"("driverId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_truckId_idx" ON "OutOfServiceOrder"("truckId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_oosDate_idx" ON "OutOfServiceOrder"("oosDate");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_status_idx" ON "OutOfServiceOrder"("status");

-- CreateIndex
CREATE INDEX "Defect_companyId_idx" ON "Defect"("companyId");

-- CreateIndex
CREATE INDEX "Defect_truckId_idx" ON "Defect"("truckId");

-- CreateIndex
CREATE INDEX "Defect_severity_idx" ON "Defect"("severity");

-- CreateIndex
CREATE INDEX "Defect_status_idx" ON "Defect"("status");

-- CreateIndex
CREATE INDEX "Defect_reportedDate_idx" ON "Defect"("reportedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_incidentId_key" ON "Investigation"("incidentId");

-- CreateIndex
CREATE INDEX "Investigation_companyId_idx" ON "Investigation"("companyId");

-- CreateIndex
CREATE INDEX "Investigation_incidentId_idx" ON "Investigation"("incidentId");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_dueDate_idx" ON "Investigation"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreventableDetermination_incidentId_key" ON "PreventableDetermination"("incidentId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_companyId_idx" ON "PreventableDetermination"("companyId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_incidentId_idx" ON "PreventableDetermination"("incidentId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_determination_idx" ON "PreventableDetermination"("determination");

-- CreateIndex
CREATE INDEX "PreventableVote_determinationId_idx" ON "PreventableVote"("determinationId");

-- CreateIndex
CREATE UNIQUE INDEX "PreventableVote_determinationId_voterId_key" ON "PreventableVote"("determinationId", "voterId");

-- CreateIndex
CREATE INDEX "NearMiss_companyId_idx" ON "NearMiss"("companyId");

-- CreateIndex
CREATE INDEX "NearMiss_driverId_idx" ON "NearMiss"("driverId");

-- CreateIndex
CREATE INDEX "NearMiss_reportDate_idx" ON "NearMiss"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceReport_documentId_key" ON "PoliceReport"("documentId");

-- CreateIndex
CREATE INDEX "PoliceReport_companyId_idx" ON "PoliceReport"("companyId");

-- CreateIndex
CREATE INDEX "PoliceReport_incidentId_idx" ON "PoliceReport"("incidentId");

-- CreateIndex
CREATE INDEX "PoliceReport_reportNumber_idx" ON "PoliceReport"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WitnessStatement_documentId_key" ON "WitnessStatement"("documentId");

-- CreateIndex
CREATE INDEX "WitnessStatement_companyId_idx" ON "WitnessStatement"("companyId");

-- CreateIndex
CREATE INDEX "WitnessStatement_incidentId_idx" ON "WitnessStatement"("incidentId");

-- CreateIndex
CREATE INDEX "CSAScore_companyId_idx" ON "CSAScore"("companyId");

-- CreateIndex
CREATE INDEX "CSAScore_scoreDate_idx" ON "CSAScore"("scoreDate");

-- CreateIndex
CREATE INDEX "CSAScore_basicCategory_idx" ON "CSAScore"("basicCategory");

-- CreateIndex
CREATE UNIQUE INDEX "FMCSACompliance_companyId_key" ON "FMCSACompliance"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceReview_complianceId_idx" ON "ComplianceReview"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceReview_reviewDate_idx" ON "ComplianceReview"("reviewDate");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_complianceId_idx" ON "ComplianceActionItem"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_status_idx" ON "ComplianceActionItem"("status");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_dueDate_idx" ON "ComplianceActionItem"("dueDate");

-- CreateIndex
CREATE INDEX "DataQSubmission_companyId_idx" ON "DataQSubmission"("companyId");

-- CreateIndex
CREATE INDEX "DataQSubmission_violationId_idx" ON "DataQSubmission"("violationId");

-- CreateIndex
CREATE INDEX "DataQSubmission_status_idx" ON "DataQSubmission"("status");

-- CreateIndex
CREATE INDEX "DataQSubmission_submissionDate_idx" ON "DataQSubmission"("submissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_documentId_key" ON "InsurancePolicy"("documentId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_companyId_idx" ON "InsurancePolicy"("companyId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_policyType_idx" ON "InsurancePolicy"("policyType");

-- CreateIndex
CREATE INDEX "InsurancePolicy_renewalDate_idx" ON "InsurancePolicy"("renewalDate");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCertificate_documentId_key" ON "InsuranceCertificate"("documentId");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_policyId_idx" ON "InsuranceCertificate"("policyId");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_expirationDate_idx" ON "InsuranceCertificate"("expirationDate");

-- CreateIndex
CREATE INDEX "InsuranceClaim_companyId_idx" ON "InsuranceClaim"("companyId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_policyId_idx" ON "InsuranceClaim"("policyId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_incidentId_idx" ON "InsuranceClaim"("incidentId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_status_idx" ON "InsuranceClaim"("status");

-- CreateIndex
CREATE INDEX "InsuranceClaim_dateOfLoss_idx" ON "InsuranceClaim"("dateOfLoss");

-- CreateIndex
CREATE INDEX "CargoClaim_companyId_idx" ON "CargoClaim"("companyId");

-- CreateIndex
CREATE INDEX "CargoClaim_loadId_idx" ON "CargoClaim"("loadId");

-- CreateIndex
CREATE INDEX "CargoClaim_status_idx" ON "CargoClaim"("status");

-- CreateIndex
CREATE INDEX "CargoClaim_claimDate_idx" ON "CargoClaim"("claimDate");

-- CreateIndex
CREATE INDEX "PropertyDamage_companyId_idx" ON "PropertyDamage"("companyId");

-- CreateIndex
CREATE INDEX "PropertyDamage_driverId_idx" ON "PropertyDamage"("driverId");

-- CreateIndex
CREATE INDEX "PropertyDamage_damageDate_idx" ON "PropertyDamage"("damageDate");

-- CreateIndex
CREATE UNIQUE INDEX "LossRun_documentId_key" ON "LossRun"("documentId");

-- CreateIndex
CREATE INDEX "LossRun_companyId_idx" ON "LossRun"("companyId");

-- CreateIndex
CREATE INDEX "LossRun_reportType_idx" ON "LossRun"("reportType");

-- CreateIndex
CREATE INDEX "LossRun_reportDate_idx" ON "LossRun"("reportDate");

-- CreateIndex
CREATE INDEX "SafetyMeeting_companyId_idx" ON "SafetyMeeting"("companyId");

-- CreateIndex
CREATE INDEX "SafetyMeeting_meetingDate_idx" ON "SafetyMeeting"("meetingDate");

-- CreateIndex
CREATE INDEX "MeetingAttendance_meetingId_idx" ON "MeetingAttendance"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_driverId_idx" ON "MeetingAttendance"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meetingId_driverId_key" ON "MeetingAttendance"("meetingId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPolicy_documentId_key" ON "SafetyPolicy"("documentId");

-- CreateIndex
CREATE INDEX "SafetyPolicy_companyId_idx" ON "SafetyPolicy"("companyId");

-- CreateIndex
CREATE INDEX "SafetyPolicy_category_idx" ON "SafetyPolicy"("category");

-- CreateIndex
CREATE INDEX "SafetyPolicy_effectiveDate_idx" ON "SafetyPolicy"("effectiveDate");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_policyId_idx" ON "PolicyAcknowledgment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_driverId_idx" ON "PolicyAcknowledgment"("driverId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_status_idx" ON "PolicyAcknowledgment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcknowledgment_policyId_driverId_key" ON "PolicyAcknowledgment"("policyId", "driverId");

-- CreateIndex
CREATE INDEX "SafetyCampaign_companyId_idx" ON "SafetyCampaign"("companyId");

-- CreateIndex
CREATE INDEX "SafetyCampaign_startDate_idx" ON "SafetyCampaign"("startDate");

-- CreateIndex
CREATE INDEX "SafetyCampaign_endDate_idx" ON "SafetyCampaign"("endDate");

-- CreateIndex
CREATE INDEX "CampaignParticipant_campaignId_idx" ON "CampaignParticipant"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_driverId_idx" ON "CampaignParticipant"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignParticipant_campaignId_driverId_key" ON "CampaignParticipant"("campaignId", "driverId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_companyId_idx" ON "SafetyRecognition"("companyId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_driverId_idx" ON "SafetyRecognition"("driverId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_recognitionDate_idx" ON "SafetyRecognition"("recognitionDate");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMaterial_documentId_key" ON "TrainingMaterial"("documentId");

-- CreateIndex
CREATE INDEX "TrainingMaterial_companyId_idx" ON "TrainingMaterial"("companyId");

-- CreateIndex
CREATE INDEX "TrainingMaterial_category_idx" ON "TrainingMaterial"("category");

-- CreateIndex
CREATE INDEX "TrainingMaterial_materialType_idx" ON "TrainingMaterial"("materialType");

-- CreateIndex
CREATE INDEX "ComplianceAlert_companyId_idx" ON "ComplianceAlert"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceAlert_alertType_idx" ON "ComplianceAlert"("alertType");

-- CreateIndex
CREATE INDEX "ComplianceAlert_status_idx" ON "ComplianceAlert"("status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_assignedTo_idx" ON "ComplianceAlert"("assignedTo");

-- CreateIndex
CREATE INDEX "ComplianceAlert_createdAt_idx" ON "ComplianceAlert"("createdAt");

-- CreateIndex
CREATE INDEX "McNumber_companyId_idx" ON "McNumber"("companyId");

-- CreateIndex
CREATE INDEX "McNumber_number_idx" ON "McNumber"("number");

-- CreateIndex
CREATE INDEX "McNumber_isDefault_idx" ON "McNumber"("isDefault");

-- CreateIndex
CREATE INDEX "McNumber_companyId_isDefault_idx" ON "McNumber"("companyId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "McNumber_companyId_number_key" ON "McNumber"("companyId", "number");

-- CreateIndex
CREATE INDEX "Tag_companyId_idx" ON "Tag"("companyId");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_companyId_name_key" ON "Tag"("companyId", "name");

-- CreateIndex
CREATE INDEX "LoadTag_loadId_idx" ON "LoadTag"("loadId");

-- CreateIndex
CREATE INDEX "LoadTag_tagId_idx" ON "LoadTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "LoadTag_loadId_tagId_key" ON "LoadTag"("loadId", "tagId");

-- CreateIndex
CREATE INDEX "DriverTag_driverId_idx" ON "DriverTag"("driverId");

-- CreateIndex
CREATE INDEX "DriverTag_tagId_idx" ON "DriverTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverTag_driverId_tagId_key" ON "DriverTag"("driverId", "tagId");

-- CreateIndex
CREATE INDEX "TruckTag_truckId_idx" ON "TruckTag"("truckId");

-- CreateIndex
CREATE INDEX "TruckTag_tagId_idx" ON "TruckTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TruckTag_truckId_tagId_key" ON "TruckTag"("truckId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_tagId_idx" ON "CustomerTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_customerId_tagId_key" ON "CustomerTag"("customerId", "tagId");

-- CreateIndex
CREATE INDEX "InvoiceTag_invoiceId_idx" ON "InvoiceTag"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceTag_tagId_idx" ON "InvoiceTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceTag_invoiceId_tagId_key" ON "InvoiceTag"("invoiceId", "tagId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_companyId_idx" ON "ExpenseCategory"("companyId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_mcNumberId_idx" ON "ExpenseCategory"("mcNumberId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_parentId_idx" ON "ExpenseCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_companyId_mcNumberId_name_key" ON "ExpenseCategory"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "ExpenseType_companyId_idx" ON "ExpenseType"("companyId");

-- CreateIndex
CREATE INDEX "ExpenseType_mcNumberId_idx" ON "ExpenseType"("mcNumberId");

-- CreateIndex
CREATE INDEX "ExpenseType_categoryId_idx" ON "ExpenseType"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_companyId_mcNumberId_name_key" ON "ExpenseType"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "Tariff_companyId_idx" ON "Tariff"("companyId");

-- CreateIndex
CREATE INDEX "Tariff_customerId_idx" ON "Tariff"("customerId");

-- CreateIndex
CREATE INDEX "Tariff_mcNumberId_idx" ON "Tariff"("mcNumberId");

-- CreateIndex
CREATE INDEX "Tariff_type_idx" ON "Tariff"("type");

-- CreateIndex
CREATE INDEX "Tariff_isDefault_idx" ON "Tariff"("isDefault");

-- CreateIndex
CREATE INDEX "Tariff_originZip_destinationZip_idx" ON "Tariff"("originZip", "destinationZip");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_companyId_mcNumberId_name_key" ON "Tariff"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "TariffRule_tariffId_idx" ON "TariffRule"("tariffId");

-- CreateIndex
CREATE INDEX "TariffRule_priority_idx" ON "TariffRule"("priority");

-- CreateIndex
CREATE INDEX "PaymentConfiguration_companyId_idx" ON "PaymentConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "PaymentConfiguration_mcNumberId_idx" ON "PaymentConfiguration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfiguration_companyId_mcNumberId_paymentType_key" ON "PaymentConfiguration"("companyId", "mcNumberId", "paymentType");

-- CreateIndex
CREATE INDEX "OrderPaymentType_companyId_idx" ON "OrderPaymentType"("companyId");

-- CreateIndex
CREATE INDEX "OrderPaymentType_mcNumberId_idx" ON "OrderPaymentType"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPaymentType_companyId_mcNumberId_name_key" ON "OrderPaymentType"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "AIAnomaly_companyId_idx" ON "AIAnomaly"("companyId");

-- CreateIndex
CREATE INDEX "AIAnomaly_type_idx" ON "AIAnomaly"("type");

-- CreateIndex
CREATE INDEX "AIAnomaly_status_idx" ON "AIAnomaly"("status");

-- CreateIndex
CREATE INDEX "AIAnomaly_createdAt_idx" ON "AIAnomaly"("createdAt");

-- CreateIndex
CREATE INDEX "DynamicStatus_companyId_idx" ON "DynamicStatus"("companyId");

-- CreateIndex
CREATE INDEX "DynamicStatus_mcNumberId_idx" ON "DynamicStatus"("mcNumberId");

-- CreateIndex
CREATE INDEX "DynamicStatus_entityType_idx" ON "DynamicStatus"("entityType");

-- CreateIndex
CREATE INDEX "DynamicStatus_order_idx" ON "DynamicStatus"("order");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicStatus_companyId_mcNumberId_entityType_name_key" ON "DynamicStatus"("companyId", "mcNumberId", "entityType", "name");

-- CreateIndex
CREATE INDEX "DocumentTemplate_companyId_idx" ON "DocumentTemplate"("companyId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_mcNumberId_idx" ON "DocumentTemplate"("mcNumberId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_companyId_mcNumberId_name_key" ON "DocumentTemplate"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_companyId_idx" ON "DefaultConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_mcNumberId_idx" ON "DefaultConfiguration"("mcNumberId");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_category_idx" ON "DefaultConfiguration"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultConfiguration_companyId_mcNumberId_category_key_key" ON "DefaultConfiguration"("companyId", "mcNumberId", "category", "key");

-- CreateIndex
CREATE INDEX "WorkOrderType_companyId_idx" ON "WorkOrderType"("companyId");

-- CreateIndex
CREATE INDEX "WorkOrderType_mcNumberId_idx" ON "WorkOrderType"("mcNumberId");

-- CreateIndex
CREATE INDEX "WorkOrderType_category_idx" ON "WorkOrderType"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_companyId_mcNumberId_name_key" ON "WorkOrderType"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_companyId_idx" ON "SafetyConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_mcNumberId_idx" ON "SafetyConfiguration"("mcNumberId");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_category_idx" ON "SafetyConfiguration"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyConfiguration_companyId_mcNumberId_category_key_key" ON "SafetyConfiguration"("companyId", "mcNumberId", "category", "key");

-- CreateIndex
CREATE INDEX "ReportTemplate_companyId_idx" ON "ReportTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ReportTemplate_mcNumberId_idx" ON "ReportTemplate"("mcNumberId");

-- CreateIndex
CREATE INDEX "ReportTemplate_type_idx" ON "ReportTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_companyId_mcNumberId_name_key" ON "ReportTemplate"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "ReportConstructor_companyId_idx" ON "ReportConstructor"("companyId");

-- CreateIndex
CREATE INDEX "ReportConstructor_mcNumberId_idx" ON "ReportConstructor"("mcNumberId");

-- CreateIndex
CREATE INDEX "ReportConstructor_entityType_idx" ON "ReportConstructor"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "ReportConstructor_companyId_mcNumberId_name_key" ON "ReportConstructor"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_assignedToId_idx" ON "Project"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_name_key" ON "Project"("companyId", "name");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "NetProfitFormula_companyId_idx" ON "NetProfitFormula"("companyId");

-- CreateIndex
CREATE INDEX "NetProfitFormula_mcNumberId_idx" ON "NetProfitFormula"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "NetProfitFormula_companyId_mcNumberId_name_key" ON "NetProfitFormula"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "Classification_companyId_idx" ON "Classification"("companyId");

-- CreateIndex
CREATE INDEX "Classification_mcNumberId_idx" ON "Classification"("mcNumberId");

-- CreateIndex
CREATE INDEX "Classification_type_idx" ON "Classification"("type");

-- CreateIndex
CREATE INDEX "Classification_parentId_idx" ON "Classification"("parentId");

-- CreateIndex
CREATE INDEX "Classification_order_idx" ON "Classification"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Classification_companyId_mcNumberId_type_name_key" ON "Classification"("companyId", "mcNumberId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCache_cacheKey_key" ON "ApiCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ApiCache_cacheKey_idx" ON "ApiCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ApiCache_apiType_idx" ON "ApiCache"("apiType");

-- CreateIndex
CREATE INDEX "ApiCache_expiresAt_idx" ON "ApiCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CompanySettings_companyId_idx" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_companyId_key" ON "SystemConfig"("companyId");

-- CreateIndex
CREATE INDEX "SystemConfig_companyId_idx" ON "SystemConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSettings_companyId_key" ON "IntegrationSettings"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationSettings_companyId_idx" ON "IntegrationSettings"("companyId");

-- CreateIndex
CREATE INDEX "CustomField_companyId_idx" ON "CustomField"("companyId");

-- CreateIndex
CREATE INDEX "CustomField_entityType_idx" ON "CustomField"("entityType");

-- CreateIndex
CREATE INDEX "CustomField_isActive_idx" ON "CustomField"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_companyId_name_entityType_key" ON "CustomField"("companyId", "name", "entityType");

-- CreateIndex
CREATE INDEX "AISuggestion_companyId_idx" ON "AISuggestion"("companyId");

-- CreateIndex
CREATE INDEX "AISuggestion_status_idx" ON "AISuggestion"("status");

-- CreateIndex
CREATE INDEX "AISuggestion_suggestionType_idx" ON "AISuggestion"("suggestionType");

-- CreateIndex
CREATE INDEX "AISuggestion_entityType_entityId_idx" ON "AISuggestion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AISuggestion_reviewedById_idx" ON "AISuggestion"("reviewedById");

-- CreateIndex
CREATE INDEX "AISuggestion_appliedById_idx" ON "AISuggestion"("appliedById");

-- CreateIndex
CREATE INDEX "UserColumnPreference_userId_idx" ON "UserColumnPreference"("userId");

-- CreateIndex
CREATE INDEX "UserColumnPreference_entityType_idx" ON "UserColumnPreference"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "UserColumnPreference_userId_entityType_key" ON "UserColumnPreference"("userId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "SamsaraDeviceQueue_samsaraId_key" ON "SamsaraDeviceQueue"("samsaraId");

-- CreateIndex
CREATE INDEX "SamsaraDeviceQueue_companyId_idx" ON "SamsaraDeviceQueue"("companyId");

-- CreateIndex
CREATE INDEX "SamsaraDeviceQueue_status_idx" ON "SamsaraDeviceQueue"("status");

-- CreateIndex
CREATE INDEX "SamsaraDeviceQueue_deviceType_idx" ON "SamsaraDeviceQueue"("deviceType");

-- CreateIndex
CREATE INDEX "SamsaraDeviceQueue_samsaraId_idx" ON "SamsaraDeviceQueue"("samsaraId");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_truckId_idx" ON "TruckFaultHistory"("truckId");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_companyId_idx" ON "TruckFaultHistory"("companyId");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_faultCode_idx" ON "TruckFaultHistory"("faultCode");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_isActive_idx" ON "TruckFaultHistory"("isActive");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_occurredAt_idx" ON "TruckFaultHistory"("occurredAt");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_severity_idx" ON "TruckFaultHistory"("severity");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_category_idx" ON "TruckFaultHistory"("category");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_truckId_isActive_idx" ON "TruckFaultHistory"("truckId", "isActive");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_companyId_isActive_idx" ON "TruckFaultHistory"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_companyId_category_idx" ON "TruckFaultHistory"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "TruckFaultHistory_truckId_faultCode_occurredAt_key" ON "TruckFaultHistory"("truckId", "faultCode", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticCodeReference_code_key" ON "DiagnosticCodeReference"("code");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_category_idx" ON "DiagnosticCodeReference"("category");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_severity_idx" ON "DiagnosticCodeReference"("severity");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_spnId_idx" ON "DiagnosticCodeReference"("spnId");

-- CreateIndex
CREATE INDEX "TelegramSession_isActive_idx" ON "TelegramSession"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramDriverMapping_driverId_key" ON "TelegramDriverMapping"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramDriverMapping_telegramId_key" ON "TelegramDriverMapping"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_driverId_idx" ON "TelegramDriverMapping"("driverId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_telegramId_idx" ON "TelegramDriverMapping"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_phoneNumber_idx" ON "TelegramDriverMapping"("phoneNumber");

-- CreateIndex
CREATE INDEX "AIResponseLog_communicationId_idx" ON "AIResponseLog"("communicationId");

-- CreateIndex
CREATE INDEX "AIResponseLog_wasAutoSent_idx" ON "AIResponseLog"("wasAutoSent");

-- CreateIndex
CREATE INDEX "AIResponseLog_requiresReview_idx" ON "AIResponseLog"("requiresReview");

-- CreateIndex
CREATE INDEX "AIResponseLog_createdAt_idx" ON "AIResponseLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSettings_companyId_key" ON "TelegramSettings"("companyId");

-- CreateIndex
CREATE INDEX "TelegramSettings_companyId_idx" ON "TelegramSettings"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseDocument_companyId_idx" ON "KnowledgeBaseDocument"("companyId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SamsaraSettings_companyId_key" ON "SamsaraSettings"("companyId");

-- CreateIndex
CREATE INDEX "SamsaraSettings_companyId_idx" ON "SamsaraSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksSettings_companyId_key" ON "QuickBooksSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksSettings_realmId_key" ON "QuickBooksSettings"("realmId");

-- CreateIndex
CREATE INDEX "QuickBooksSettings_companyId_idx" ON "QuickBooksSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_companyId_key" ON "Subscription"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_companyId_idx" ON "Subscription"("companyId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "SubscriptionAddOn_subscriptionId_idx" ON "SubscriptionAddOn"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAddOn_subscriptionId_module_key" ON "SubscriptionAddOn"("subscriptionId", "module");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_provider_idx" ON "ApiKeyConfig"("provider");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_scope_idx" ON "ApiKeyConfig"("scope");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_companyId_idx" ON "ApiKeyConfig"("companyId");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_mcNumberId_idx" ON "ApiKeyConfig"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeyConfig_provider_scope_companyId_mcNumberId_configKey_key" ON "ApiKeyConfig"("provider", "scope", "companyId", "mcNumberId", "configKey");

-- CreateIndex
CREATE INDEX "CrmIntegration_mcNumberId_idx" ON "CrmIntegration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmIntegration_mcNumberId_type_key" ON "CrmIntegration"("mcNumberId", "type");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_mcNumberId_idx" ON "Lead"("mcNumberId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_companyId_mcNumberId_idx" ON "Lead"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Lead_companyId_mcNumberId_status_idx" ON "Lead"("companyId", "mcNumberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_companyId_leadNumber_key" ON "Lead"("companyId", "leadNumber");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "LeadNote_createdAt_idx" ON "LeadNote"("createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "LeadActivity"("type");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadDocument_leadId_idx" ON "LeadDocument"("leadId");

-- CreateIndex
CREATE INDEX "LeadDocument_documentType_idx" ON "LeadDocument"("documentType");

-- CreateIndex
CREATE INDEX "UsageRecord_subscriptionId_idx" ON "UsageRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "UsageRecord_periodStart_idx" ON "UsageRecord"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_subscriptionId_periodStart_key" ON "UsageRecord"("subscriptionId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingSettings_companyId_key" ON "AccountingSettings"("companyId");

-- CreateIndex
CREATE INDEX "AccountingSettings_companyId_idx" ON "AccountingSettings"("companyId");

-- CreateIndex
CREATE INDEX "_DocumentToInvestigation_B_index" ON "_DocumentToInvestigation"("B");

-- CreateIndex
CREATE INDEX "_DocumentToRoadsideInspection_B_index" ON "_DocumentToRoadsideInspection"("B");

-- CreateIndex
CREATE INDEX "_DocumentToInsuranceClaim_B_index" ON "_DocumentToInsuranceClaim"("B");

-- CreateIndex
CREATE INDEX "_AnnualReviewToDocument_B_index" ON "_AnnualReviewToDocument"("B");

-- CreateIndex
CREATE INDEX "_DVIRToDocument_B_index" ON "_DVIRToDocument"("B");

-- CreateIndex
CREATE INDEX "_ComplianceReviewToDocument_B_index" ON "_ComplianceReviewToDocument"("B");

-- CreateIndex
CREATE INDEX "_CargoClaimToDocument_B_index" ON "_CargoClaimToDocument"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_coDriverId_fkey" FOREIGN KEY ("coDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStop" ADD CONSTRAINT "LoadStop_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStatusHistory" ADD CONSTRAINT "LoadStatusHistory_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_currentTruckId_fkey" FOREIGN KEY ("currentTruckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_currentTrailerId_fkey" FOREIGN KEY ("currentTrailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_assignedDispatcherId_fkey" FOREIGN KEY ("assignedDispatcherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_hrManagerId_fkey" FOREIGN KEY ("hrManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_safetyManagerId_fkey" FOREIGN KEY ("safetyManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTruckHistory" ADD CONSTRAINT "DriverTruckHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTruckHistory" ADD CONSTRAINT "DriverTruckHistory_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTrailerHistory" ADD CONSTRAINT "DriverTrailerHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTrailerHistory" ADD CONSTRAINT "DriverTrailerHistory_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverComment" ADD CONSTRAINT "DriverComment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverComment" ADD CONSTRAINT "DriverComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSRecord" ADD CONSTRAINT "HOSRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_assignedTruckId_fkey" FOREIGN KEY ("assignedTruckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_operatorDriverId_fkey" FOREIGN KEY ("operatorDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownAssignment" ADD CONSTRAINT "BreakdownAssignment_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownAssignment" ADD CONSTRAINT "BreakdownAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_safetyIncidentId_fkey" FOREIGN KEY ("safetyIncidentId") REFERENCES "SafetyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_safetyTrainingCertificateId_fkey" FOREIGN KEY ("safetyTrainingCertificateId") REFERENCES "SafetyTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shortPayApprovedById_fkey" FOREIGN KEY ("shortPayApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_writtenOffById_fkey" FOREIGN KEY ("writtenOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_factoringBatchId_fkey" FOREIGN KEY ("factoringBatchId") REFERENCES "FactoringBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceBatchId_fkey" FOREIGN KEY ("invoiceBatchId") REFERENCES "InvoiceBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_salaryBatchId_fkey" FOREIGN KEY ("salaryBatchId") REFERENCES "SalaryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryBatch" ADD CONSTRAINT "SalaryBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryBatch" ADD CONSTRAINT "SalaryBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_driverAdvanceId_fkey" FOREIGN KEY ("driverAdvanceId") REFERENCES "DriverAdvance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_loadExpenseId_fkey" FOREIGN KEY ("loadExpenseId") REFERENCES "LoadExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_originalSettlementId_fkey" FOREIGN KEY ("originalSettlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_appliedSettlementId_fkey" FOREIGN KEY ("appliedSettlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionRule" ADD CONSTRAINT "DeductionRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionRule" ADD CONSTRAINT "DeductionRule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionTypeTemplate" ADD CONSTRAINT "DeductionTypeTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAConfig" ADD CONSTRAINT "IFTAConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAStateMileage" ADD CONSTRAINT "IFTAStateMileage_iftaEntryId_fkey" FOREIGN KEY ("iftaEntryId") REFERENCES "IFTAEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatchItem" ADD CONSTRAINT "InvoiceBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InvoiceBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatchItem" ADD CONSTRAINT "InvoiceBatchItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringCompany" ADD CONSTRAINT "FactoringCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringBatch" ADD CONSTRAINT "FactoringBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringBatch" ADD CONSTRAINT "FactoringBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_matchedById_fkey" FOREIGN KEY ("matchedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContact" ADD CONSTRAINT "VendorContact_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTraining" ADD CONSTRAINT "SafetyTraining_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTraining" ADD CONSTRAINT "SafetyTraining_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationFile" ADD CONSTRAINT "DriverQualificationFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationFile" ADD CONSTRAINT "DriverQualificationFile_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DQFDocument" ADD CONSTRAINT "DQFDocument_dqfId_fkey" FOREIGN KEY ("dqfId") REFERENCES "DriverQualificationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DQFDocument" ADD CONSTRAINT "DQFDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRViolation" ADD CONSTRAINT "MVRViolation_mvrRecordId_fkey" FOREIGN KEY ("mvrRecordId") REFERENCES "MVRRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPool" ADD CONSTRAINT "TestingPool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPoolDriver" ADD CONSTRAINT "TestingPoolDriver_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "TestingPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPoolDriver" ADD CONSTRAINT "TestingPoolDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelection" ADD CONSTRAINT "RandomSelection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelection" ADD CONSTRAINT "RandomSelection_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "TestingPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelectedDriver" ADD CONSTRAINT "RandomSelectedDriver_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "RandomSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelectedDriver" ADD CONSTRAINT "RandomSelectedDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSAClearinghouseQuery" ADD CONSTRAINT "FMCSAClearinghouseQuery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSAClearinghouseQuery" ADD CONSTRAINT "FMCSAClearinghouseQuery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSViolation" ADD CONSTRAINT "HOSViolation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSViolation" ADD CONSTRAINT "HOSViolation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ELDProvider" ADD CONSTRAINT "ELDProvider_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ELDSyncLog" ADD CONSTRAINT "ELDSyncLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ELDProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIRDefect" ADD CONSTRAINT "DVIRDefect_dvirId_fkey" FOREIGN KEY ("dvirId") REFERENCES "DVIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideViolation" ADD CONSTRAINT "RoadsideViolation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "RoadsideInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentPhoto" ADD CONSTRAINT "AccidentPhoto_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentPhoto" ADD CONSTRAINT "AccidentPhoto_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableDetermination" ADD CONSTRAINT "PreventableDetermination_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableDetermination" ADD CONSTRAINT "PreventableDetermination_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableVote" ADD CONSTRAINT "PreventableVote_determinationId_fkey" FOREIGN KEY ("determinationId") REFERENCES "PreventableDetermination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CSAScore" ADD CONSTRAINT "CSAScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSACompliance" ADD CONSTRAINT "FMCSACompliance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceReview" ADD CONSTRAINT "ComplianceReview_complianceId_fkey" FOREIGN KEY ("complianceId") REFERENCES "FMCSACompliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceActionItem" ADD CONSTRAINT "ComplianceActionItem_complianceId_fkey" FOREIGN KEY ("complianceId") REFERENCES "FMCSACompliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQSubmission" ADD CONSTRAINT "DataQSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQSubmission" ADD CONSTRAINT "DataQSubmission_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "RoadsideViolation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCertificate" ADD CONSTRAINT "InsuranceCertificate_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCertificate" ADD CONSTRAINT "InsuranceCertificate_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoClaim" ADD CONSTRAINT "CargoClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoClaim" ADD CONSTRAINT "CargoClaim_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LossRun" ADD CONSTRAINT "LossRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LossRun" ADD CONSTRAINT "LossRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyMeeting" ADD CONSTRAINT "SafetyMeeting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SafetyMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicy" ADD CONSTRAINT "SafetyPolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicy" ADD CONSTRAINT "SafetyPolicy_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "SafetyPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCampaign" ADD CONSTRAINT "SafetyCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SafetyCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyRecognition" ADD CONSTRAINT "SafetyRecognition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyRecognition" ADD CONSTRAINT "SafetyRecognition_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMaterial" ADD CONSTRAINT "TrainingMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMaterial" ADD CONSTRAINT "TrainingMaterial_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McNumber" ADD CONSTRAINT "McNumber_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTag" ADD CONSTRAINT "LoadTag_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTag" ADD CONSTRAINT "LoadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTag" ADD CONSTRAINT "DriverTag_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTag" ADD CONSTRAINT "DriverTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckTag" ADD CONSTRAINT "TruckTag_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckTag" ADD CONSTRAINT "TruckTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTag" ADD CONSTRAINT "InvoiceTag_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTag" ADD CONSTRAINT "InvoiceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfiguration" ADD CONSTRAINT "PaymentConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfiguration" ADD CONSTRAINT "PaymentConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentType" ADD CONSTRAINT "OrderPaymentType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentType" ADD CONSTRAINT "OrderPaymentType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnomaly" ADD CONSTRAINT "AIAnomaly_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnomaly" ADD CONSTRAINT "AIAnomaly_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicStatus" ADD CONSTRAINT "DynamicStatus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicStatus" ADD CONSTRAINT "DynamicStatus_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultConfiguration" ADD CONSTRAINT "DefaultConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultConfiguration" ADD CONSTRAINT "DefaultConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderType" ADD CONSTRAINT "WorkOrderType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderType" ADD CONSTRAINT "WorkOrderType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyConfiguration" ADD CONSTRAINT "SafetyConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyConfiguration" ADD CONSTRAINT "SafetyConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportConstructor" ADD CONSTRAINT "ReportConstructor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportConstructor" ADD CONSTRAINT "ReportConstructor_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetProfitFormula" ADD CONSTRAINT "NetProfitFormula_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetProfitFormula" ADD CONSTRAINT "NetProfitFormula_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Classification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSettings" ADD CONSTRAINT "IntegrationSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserColumnPreference" ADD CONSTRAINT "UserColumnPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamsaraDeviceQueue" ADD CONSTRAINT "SamsaraDeviceQueue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamsaraDeviceQueue" ADD CONSTRAINT "SamsaraDeviceQueue_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramDriverMapping" ADD CONSTRAINT "TelegramDriverMapping_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponseLog" ADD CONSTRAINT "AIResponseLog_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeBaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamsaraSettings" ADD CONSTRAINT "SamsaraSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickBooksSettings" ADD CONSTRAINT "QuickBooksSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAddOn" ADD CONSTRAINT "SubscriptionAddOn_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyConfig" ADD CONSTRAINT "ApiKeyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyConfig" ADD CONSTRAINT "ApiKeyConfig_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmIntegration" ADD CONSTRAINT "CrmIntegration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingSettings" ADD CONSTRAINT "AccountingSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInvestigation" ADD CONSTRAINT "_DocumentToInvestigation_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInvestigation" ADD CONSTRAINT "_DocumentToInvestigation_B_fkey" FOREIGN KEY ("B") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToRoadsideInspection" ADD CONSTRAINT "_DocumentToRoadsideInspection_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToRoadsideInspection" ADD CONSTRAINT "_DocumentToRoadsideInspection_B_fkey" FOREIGN KEY ("B") REFERENCES "RoadsideInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInsuranceClaim" ADD CONSTRAINT "_DocumentToInsuranceClaim_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInsuranceClaim" ADD CONSTRAINT "_DocumentToInsuranceClaim_B_fkey" FOREIGN KEY ("B") REFERENCES "InsuranceClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnualReviewToDocument" ADD CONSTRAINT "_AnnualReviewToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "AnnualReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnualReviewToDocument" ADD CONSTRAINT "_AnnualReviewToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVIRToDocument" ADD CONSTRAINT "_DVIRToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "DVIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVIRToDocument" ADD CONSTRAINT "_DVIRToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplianceReviewToDocument" ADD CONSTRAINT "_ComplianceReviewToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "ComplianceReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplianceReviewToDocument" ADD CONSTRAINT "_ComplianceReviewToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CargoClaimToDocument" ADD CONSTRAINT "_CargoClaimToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "CargoClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CargoClaimToDocument" ADD CONSTRAINT "_CargoClaimToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
