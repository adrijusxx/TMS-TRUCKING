-- CreateEnum
CREATE TYPE "McNumberType" AS ENUM ('CARRIER', 'BROKER');

-- CreateTable
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McNumber" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "type" "McNumberType" NOT NULL DEFAULT 'CARRIER',
    "companyPhone" TEXT,
    "owner" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usdot" TEXT,
    "notes" TEXT,
    "number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "McNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCompany_userId_idx" ON "UserCompany"("userId");

-- CreateIndex
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- CreateIndex
CREATE INDEX "McNumber_companyId_idx" ON "McNumber"("companyId");

-- CreateIndex
CREATE INDEX "McNumber_number_idx" ON "McNumber"("number");

-- CreateIndex
CREATE INDEX "McNumber_isDefault_idx" ON "McNumber"("isDefault");

-- CreateIndex
CREATE INDEX "McNumber_companyId_isDefault_idx" ON "McNumber"("companyId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "McNumber_companyId_number_key" ON "McNumber"("companyId", "number");

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McNumber" ADD CONSTRAINT "McNumber_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
