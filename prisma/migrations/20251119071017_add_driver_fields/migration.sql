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

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DriverStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "DriverStatus" ADD VALUE 'DISPATCHED';

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "assignedDispatcherId" TEXT,
ADD COLUMN     "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'READY_TO_GO',
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "cdlExperience" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'United States',
ADD COLUMN     "currentTrailerId" TEXT,
ADD COLUMN     "dispatchPreferences" TEXT,
ADD COLUMN     "dispatchStatus" "DispatchStatus",
ADD COLUMN     "dlClass" TEXT,
ADD COLUMN     "driverFacingCamera" TEXT,
ADD COLUMN     "driverTags" TEXT[],
ADD COLUMN     "driverTariff" TEXT,
ADD COLUMN     "driverType" "DriverType" NOT NULL DEFAULT 'COMPANY_DRIVER',
ADD COLUMN     "emergencyContactAddress1" TEXT,
ADD COLUMN     "emergencyContactAddress2" TEXT,
ADD COLUMN     "emergencyContactCity" TEXT,
ADD COLUMN     "emergencyContactCountry" TEXT DEFAULT 'United States',
ADD COLUMN     "emergencyContactEmail" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "emergencyContactState" TEXT,
ADD COLUMN     "emergencyContactZip" TEXT,
ADD COLUMN     "employeeStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "endorsements" TEXT[],
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "hrManagerId" TEXT,
ADD COLUMN     "licenseIssueDate" TIMESTAMP(3),
ADD COLUMN     "localDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "otherId" TEXT,
ADD COLUMN     "payTo" TEXT,
ADD COLUMN     "restrictions" TEXT,
ADD COLUMN     "safetyManagerId" TEXT,
ADD COLUMN     "socialSecurityNumber" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "teamDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramNumber" TEXT,
ADD COLUMN     "tenure" TEXT,
ADD COLUMN     "terminationDate" TIMESTAMP(3),
ADD COLUMN     "thresholdAmount" DOUBLE PRECISION,
ADD COLUMN     "warnings" TEXT,
ADD COLUMN     "zipCode" TEXT;

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
CREATE INDEX "Driver_employeeStatus_idx" ON "Driver"("employeeStatus");

-- CreateIndex
CREATE INDEX "Driver_assignmentStatus_idx" ON "Driver"("assignmentStatus");

-- CreateIndex
CREATE INDEX "Driver_currentTruckId_idx" ON "Driver"("currentTruckId");

-- CreateIndex
CREATE INDEX "Driver_currentTrailerId_idx" ON "Driver"("currentTrailerId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_currentTrailerId_fkey" FOREIGN KEY ("currentTrailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_assignedDispatcherId_fkey" FOREIGN KEY ("assignedDispatcherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_hrManagerId_fkey" FOREIGN KEY ("hrManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_safetyManagerId_fkey" FOREIGN KEY ("safetyManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
