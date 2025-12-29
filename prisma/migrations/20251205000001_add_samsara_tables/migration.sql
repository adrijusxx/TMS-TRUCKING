-- CreateTable
CREATE TABLE IF NOT EXISTS "SamsaraDeviceQueue" (
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
CREATE TABLE IF NOT EXISTS "TruckFaultHistory" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "faultCode" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SAMSARA',
    "samsaraFaultId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifiedFleet" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckFaultHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SamsaraDeviceQueue_samsaraId_key" ON "SamsaraDeviceQueue"("samsaraId");
CREATE INDEX IF NOT EXISTS "SamsaraDeviceQueue_companyId_idx" ON "SamsaraDeviceQueue"("companyId");
CREATE INDEX IF NOT EXISTS "SamsaraDeviceQueue_status_idx" ON "SamsaraDeviceQueue"("status");
CREATE INDEX IF NOT EXISTS "SamsaraDeviceQueue_deviceType_idx" ON "SamsaraDeviceQueue"("deviceType");
CREATE INDEX IF NOT EXISTS "SamsaraDeviceQueue_samsaraId_idx" ON "SamsaraDeviceQueue"("samsaraId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_truckId_idx" ON "TruckFaultHistory"("truckId");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_companyId_idx" ON "TruckFaultHistory"("companyId");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_faultCode_idx" ON "TruckFaultHistory"("faultCode");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_isActive_idx" ON "TruckFaultHistory"("isActive");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_occurredAt_idx" ON "TruckFaultHistory"("occurredAt");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_severity_idx" ON "TruckFaultHistory"("severity");
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_truckId_isActive_idx" ON "TruckFaultHistory"("truckId", "isActive");

-- AddForeignKey
ALTER TABLE "SamsaraDeviceQueue" ADD CONSTRAINT "SamsaraDeviceQueue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SamsaraDeviceQueue" ADD CONSTRAINT "SamsaraDeviceQueue_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TruckFaultHistory" ADD CONSTRAINT "TruckFaultHistory_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;



