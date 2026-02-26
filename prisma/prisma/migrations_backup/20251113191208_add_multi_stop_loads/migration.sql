-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'EN_ROUTE', 'ARRIVED', 'LOADING', 'UNLOADING', 'COMPLETED', 'SKIPPED', 'CANCELLED');

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoadStop_loadId_idx" ON "LoadStop"("loadId");

-- CreateIndex
CREATE INDEX "LoadStop_loadId_sequence_idx" ON "LoadStop"("loadId", "sequence");

-- CreateIndex
CREATE INDEX "LoadStop_status_idx" ON "LoadStop"("status");

-- AddForeignKey
ALTER TABLE "LoadStop" ADD CONSTRAINT "LoadStop_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;
