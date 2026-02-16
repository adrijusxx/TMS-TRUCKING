/*
  Warnings:

  - A unique constraint covering the columns `[safetyTrainingCertificateId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BreakdownType" AS ENUM ('ENGINE_FAILURE', 'TRANSMISSION_FAILURE', 'BRAKE_FAILURE', 'TIRE_FLAT', 'TIRE_BLOWOUT', 'ELECTRICAL_ISSUE', 'COOLING_SYSTEM', 'FUEL_SYSTEM', 'SUSPENSION', 'ACCIDENT_DAMAGE', 'WEATHER_RELATED', 'OTHER');

-- CreateEnum
CREATE TYPE "BreakdownPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BreakdownStatus" AS ENUM ('REPORTED', 'DISPATCHED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('DOT_ANNUAL', 'DOT_LEVEL_1', 'DOT_LEVEL_2', 'DOT_LEVEL_3', 'DOT_PRE_TRIP', 'DOT_POST_TRIP', 'STATE_INSPECTION', 'COMPANY_INSPECTION', 'PMI', 'SAFETY_INSPECTION');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED', 'CONDITIONAL', 'OUT_OF_SERVICE', 'PENDING');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIVED', 'ISSUED', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGE', 'THEFT');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('SUPPLIER', 'PARTS_VENDOR', 'SERVICE_PROVIDER', 'FUEL_VENDOR', 'REPAIR_SHOP', 'TIRE_SHOP', 'OTHER');

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

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "breakdownId" TEXT,
ADD COLUMN     "inspectionId" TEXT,
ADD COLUMN     "safetyIncidentId" TEXT,
ADD COLUMN     "safetyTrainingCertificateId" TEXT;

-- CreateTable
CREATE TABLE "Breakdown" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
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
    "breakdownType" "BreakdownType" NOT NULL,
    "priority" "BreakdownPriority" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "loadId" TEXT,
    "driverId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Breakdown_pkey" PRIMARY KEY ("id")
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
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
    "locationNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'PICKUP',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyTraining_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Breakdown_breakdownNumber_key" ON "Breakdown"("breakdownNumber");

-- CreateIndex
CREATE INDEX "Breakdown_companyId_idx" ON "Breakdown"("companyId");

-- CreateIndex
CREATE INDEX "Breakdown_truckId_idx" ON "Breakdown"("truckId");

-- CreateIndex
CREATE INDEX "Breakdown_loadId_idx" ON "Breakdown"("loadId");

-- CreateIndex
CREATE INDEX "Breakdown_driverId_idx" ON "Breakdown"("driverId");

-- CreateIndex
CREATE INDEX "Breakdown_status_idx" ON "Breakdown"("status");

-- CreateIndex
CREATE INDEX "Breakdown_breakdownType_idx" ON "Breakdown"("breakdownType");

-- CreateIndex
CREATE INDEX "Breakdown_reportedAt_idx" ON "Breakdown"("reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_inspectionNumber_key" ON "Inspection"("inspectionNumber");

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
CREATE UNIQUE INDEX "InventoryItem_itemNumber_key" ON "InventoryItem"("itemNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_companyId_idx" ON "InventoryItem"("companyId");

-- CreateIndex
CREATE INDEX "InventoryItem_itemNumber_idx" ON "InventoryItem"("itemNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryItemId_idx" ON "InventoryTransaction"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionType_idx" ON "InventoryTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "InventoryTransaction_transactionDate_idx" ON "InventoryTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorNumber_key" ON "Vendor"("vendorNumber");

-- CreateIndex
CREATE INDEX "Vendor_companyId_idx" ON "Vendor"("companyId");

-- CreateIndex
CREATE INDEX "Vendor_vendorNumber_idx" ON "Vendor"("vendorNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Location_locationNumber_key" ON "Location"("locationNumber");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Location_locationNumber_idx" ON "Location"("locationNumber");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_city_state_idx" ON "Location"("city", "state");

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
CREATE UNIQUE INDEX "Document_safetyTrainingCertificateId_key" ON "Document"("safetyTrainingCertificateId");

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_safetyIncidentId_fkey" FOREIGN KEY ("safetyIncidentId") REFERENCES "SafetyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_safetyTrainingCertificateId_fkey" FOREIGN KEY ("safetyTrainingCertificateId") REFERENCES "SafetyTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
