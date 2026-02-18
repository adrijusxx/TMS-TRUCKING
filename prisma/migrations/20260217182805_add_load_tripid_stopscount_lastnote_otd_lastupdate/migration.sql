-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "lastNote" TEXT,
ADD COLUMN     "lastUpdate" TIMESTAMP(3),
ADD COLUMN     "onTimeDelivery" TEXT,
ADD COLUMN     "stopsCount" INTEGER,
ADD COLUMN     "tripId" TEXT;
