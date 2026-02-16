-- CreateEnum
CREATE TYPE "LoadDispatchStatus" AS ENUM ('BOOKED', 'ON_ROUTE_TO_PICKUP', 'AT_PICKUP', 'LOADED', 'ON_ROUTE_TO_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'PENDING_DISPATCH', 'DISPATCHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "dispatchStatus" "LoadDispatchStatus";

-- CreateIndex
CREATE INDEX "Load_dispatchStatus_idx" ON "Load"("dispatchStatus");






























