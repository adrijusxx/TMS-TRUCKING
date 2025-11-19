-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "coDriverId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deliveryCompany" TEXT,
ADD COLUMN     "dispatcherId" TEXT,
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "pickupCompany" TEXT,
ADD COLUMN     "revenuePerMile" DOUBLE PRECISION,
ADD COLUMN     "tripId" TEXT;

-- CreateIndex
CREATE INDEX "Load_coDriverId_idx" ON "Load"("coDriverId");

-- CreateIndex
CREATE INDEX "Load_dispatcherId_idx" ON "Load"("dispatcherId");

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_coDriverId_fkey" FOREIGN KEY ("coDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
