/*
  Warnings:

  - You are about to drop the column `deliveryContact` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryNotes` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryPhone` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTimeEnd` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTimeStart` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `expenses` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `lastNote` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdate` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `onTimeDelivery` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupContact` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupNotes` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupPhone` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTimeEnd` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTimeStart` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `stopsCount` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `totalPay` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `tripId` on the `Load` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicTrackingToken]` on the table `Load` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('ON_TIME', 'DELAYED', 'EARLY');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FactoringStatus" ADD VALUE 'PENDING';
ALTER TYPE "FactoringStatus" ADD VALUE 'APPROVED';
ALTER TYPE "FactoringStatus" ADD VALUE 'DECLINED';

-- AlterTable
ALTER TABLE "Load" DROP COLUMN "deliveryContact",
DROP COLUMN "deliveryNotes",
DROP COLUMN "deliveryPhone",
DROP COLUMN "deliveryTimeEnd",
DROP COLUMN "deliveryTimeStart",
DROP COLUMN "expenses",
DROP COLUMN "lastNote",
DROP COLUMN "lastUpdate",
DROP COLUMN "onTimeDelivery",
DROP COLUMN "pickupContact",
DROP COLUMN "pickupNotes",
DROP COLUMN "pickupPhone",
DROP COLUMN "pickupTimeEnd",
DROP COLUMN "pickupTimeStart",
DROP COLUMN "profit",
DROP COLUMN "serviceFee",
DROP COLUMN "stopsCount",
DROP COLUMN "totalPay",
DROP COLUMN "tripId",
ADD COLUMN     "driverFeedback" TEXT,
ADD COLUMN     "driverRating" INTEGER,
ADD COLUMN     "eta" TIMESTAMP(3),
ADD COLUMN     "factoringStatus" "FactoringStatus",
ADD COLUMN     "publicTrackingToken" TEXT,
ADD COLUMN     "quickPayFee" DOUBLE PRECISION,
ADD COLUMN     "specialHandling" JSONB,
ADD COLUMN     "trackingStatus" "TrackingStatus",
ADD COLUMN     "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE UNIQUE INDEX "Load_publicTrackingToken_key" ON "Load"("publicTrackingToken");
