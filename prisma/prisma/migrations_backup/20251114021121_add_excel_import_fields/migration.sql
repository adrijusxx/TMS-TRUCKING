-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "billingEmails" TEXT,
ADD COLUMN     "billingType" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "creditRate" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "rateConfirmationRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referenceNumber" TEXT,
ADD COLUMN     "riskLevel" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "warning" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "lastNote" TEXT,
ADD COLUMN     "lastUpdate" TIMESTAMP(3),
ADD COLUMN     "onTimeDelivery" BOOLEAN,
ADD COLUMN     "shipmentId" TEXT,
ADD COLUMN     "stopsCount" INTEGER,
ADD COLUMN     "totalPay" DOUBLE PRECISION,
ADD COLUMN     "trailerId" TEXT;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "locationCompany" TEXT,
ALTER COLUMN "locationNumber" DROP NOT NULL,
ALTER COLUMN "zip" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "fleetStatus" TEXT,
ADD COLUMN     "fuelCard" TEXT,
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "ownership" TEXT,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "tollTagNumber" TEXT,
ADD COLUMN     "warnings" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "tag" TEXT;

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
    "mcNumber" TEXT,
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
    "tags" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Trailer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_trailerNumber_key" ON "Trailer"("trailerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_vin_key" ON "Trailer"("vin");

-- CreateIndex
CREATE INDEX "Trailer_companyId_idx" ON "Trailer"("companyId");

-- CreateIndex
CREATE INDEX "Trailer_trailerNumber_idx" ON "Trailer"("trailerNumber");

-- CreateIndex
CREATE INDEX "Trailer_assignedTruckId_idx" ON "Trailer"("assignedTruckId");

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_assignedTruckId_fkey" FOREIGN KEY ("assignedTruckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_operatorDriverId_fkey" FOREIGN KEY ("operatorDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
