-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DISPATCHER', 'DRIVER', 'CUSTOMER', 'ACCOUNTANT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoadType" AS ENUM ('FTL', 'LTL', 'PARTIAL', 'INTERMODAL');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('PER_MILE', 'PER_LOAD', 'PERCENTAGE', 'HOURLY');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GAS', 'DEF');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_SERVICE', 'INSPECTION', 'REPAIR', 'PMI', 'ENGINE', 'TRANSMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('DIRECT', 'BROKER', 'FREIGHT_FORWARDER', 'THIRD_PARTY_LOGISTICS');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOL', 'POD', 'INVOICE', 'RATE_CONFIRMATION', 'DRIVER_LICENSE', 'MEDICAL_CARD', 'INSURANCE', 'REGISTRATION', 'INSPECTION', 'LEASE_AGREEMENT', 'W9', 'COI', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOAD_ASSIGNED', 'LOAD_UPDATED', 'MAINTENANCE_DUE', 'HOS_VIOLATION', 'DOCUMENT_EXPIRING', 'INVOICE_PAID', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "loadNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "status" "LoadStatus" NOT NULL DEFAULT 'PENDING',
    "loadType" "LoadType" NOT NULL DEFAULT 'FTL',
    "equipmentType" "EquipmentType" NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupZip" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "pickupTimeStart" TIMESTAMP(3),
    "pickupTimeEnd" TIMESTAMP(3),
    "pickupContact" TEXT,
    "pickupPhone" TEXT,
    "pickupNotes" TEXT,
    "deliveryLocation" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL,
    "deliveryZip" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
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
    "loadedMiles" DOUBLE PRECISION,
    "emptyMiles" DOUBLE PRECISION,
    "totalMiles" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "invoicedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "dispatchNotes" TEXT,
    "driverNotes" TEXT,
    "ediSent" BOOLEAN NOT NULL DEFAULT false,
    "ediReceived" BOOLEAN NOT NULL DEFAULT false,
    "ediTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
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
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverNumber" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "medicalCardExpiry" TIMESTAMP(3) NOT NULL,
    "drugTestDate" TIMESTAMP(3),
    "backgroundCheck" TIMESTAMP(3),
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentTruckId" TEXT,
    "homeTerminal" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "rating" DOUBLE PRECISION,
    "totalLoads" INTEGER NOT NULL DEFAULT 0,
    "totalMiles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "payType" "PayType" NOT NULL DEFAULT 'PER_MILE',
    "payRate" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
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
    "equipmentType" "EquipmentType" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentDriverId" TEXT,
    "currentLocation" TEXT,
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "odometerReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "registrationExpiry" TIMESTAMP(3) NOT NULL,
    "insuranceExpiry" TIMESTAMP(3) NOT NULL,
    "inspectionExpiry" TIMESTAMP(3) NOT NULL,
    "eldInstalled" BOOLEAN NOT NULL DEFAULT false,
    "eldProvider" TEXT,
    "gpsInstalled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "vendor" TEXT,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'DIRECT',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZip" TEXT,
    "billingEmail" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditLimit" DOUBLE PRECISION,
    "scac" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "portalUserId" TEXT,
    "ediEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ediId" TEXT,
    "rating" DOUBLE PRECISION,
    "totalLoads" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

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
    "expiryDate" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
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
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_dotNumber_key" ON "Company"("dotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Load_loadNumber_key" ON "Load"("loadNumber");

-- CreateIndex
CREATE INDEX "Load_companyId_idx" ON "Load"("companyId");

-- CreateIndex
CREATE INDEX "Load_customerId_idx" ON "Load"("customerId");

-- CreateIndex
CREATE INDEX "Load_driverId_idx" ON "Load"("driverId");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Load_pickupDate_idx" ON "Load"("pickupDate");

-- CreateIndex
CREATE INDEX "Load_deliveryDate_idx" ON "Load"("deliveryDate");

-- CreateIndex
CREATE INDEX "Load_loadNumber_idx" ON "Load"("loadNumber");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_loadId_idx" ON "LoadStatusHistory"("loadId");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_createdAt_idx" ON "LoadStatusHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Route_loadId_key" ON "Route"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driverNumber_key" ON "Driver"("driverNumber");

-- CreateIndex
CREATE INDEX "Driver_companyId_idx" ON "Driver"("companyId");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_driverNumber_idx" ON "Driver"("driverNumber");

-- CreateIndex
CREATE INDEX "HOSRecord_driverId_idx" ON "HOSRecord"("driverId");

-- CreateIndex
CREATE INDEX "HOSRecord_date_idx" ON "HOSRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_truckNumber_key" ON "Truck"("truckNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_vin_key" ON "Truck"("vin");

-- CreateIndex
CREATE INDEX "Truck_companyId_idx" ON "Truck"("companyId");

-- CreateIndex
CREATE INDEX "Truck_status_idx" ON "Truck"("status");

-- CreateIndex
CREATE INDEX "Truck_truckNumber_idx" ON "Truck"("truckNumber");

-- CreateIndex
CREATE INDEX "FuelEntry_truckId_idx" ON "FuelEntry"("truckId");

-- CreateIndex
CREATE INDEX "FuelEntry_driverId_idx" ON "FuelEntry"("driverId");

-- CreateIndex
CREATE INDEX "FuelEntry_date_idx" ON "FuelEntry"("date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_truckId_idx" ON "MaintenanceRecord"("truckId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_scheduledDate_idx" ON "MaintenanceRecord"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerNumber_key" ON "Customer"("customerNumber");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_customerNumber_idx" ON "Customer"("customerNumber");

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
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_loadId_idx" ON "Document"("loadId");

-- CreateIndex
CREATE INDEX "Document_driverId_idx" ON "Document"("driverId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_settlementNumber_key" ON "Settlement"("settlementNumber");

-- CreateIndex
CREATE INDEX "Settlement_driverId_idx" ON "Settlement"("driverId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStatusHistory" ADD CONSTRAINT "LoadStatusHistory_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_currentTruckId_fkey" FOREIGN KEY ("currentTruckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSRecord" ADD CONSTRAINT "HOSRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
