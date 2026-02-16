-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mcNumberId" TEXT;

-- CreateIndex
CREATE INDEX "User_mcNumberId_idx" ON "User"("mcNumberId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
