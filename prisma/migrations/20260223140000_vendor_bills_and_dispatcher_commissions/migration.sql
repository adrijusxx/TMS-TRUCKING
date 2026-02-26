-- CreateEnum
CREATE TYPE "VendorBillStatus" AS ENUM ('DRAFT', 'POSTED', 'PAID', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- AlterTable
ALTER TABLE "SalaryBatch" ADD COLUMN     "checkDate" TIMESTAMP(3),
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "payCompany" TEXT;

-- CreateTable
CREATE TABLE "VendorBillBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "postStatus" "BatchPostStatus" NOT NULL DEFAULT 'UNPOSTED',
    "mcNumber" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billCount" INTEGER NOT NULL DEFAULT 0,
    "vendorCount" INTEGER NOT NULL DEFAULT 0,
    "truckCount" INTEGER NOT NULL DEFAULT 0,
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBillBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBill" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorInvoiceNumber" TEXT,
    "status" "VendorBillStatus" NOT NULL DEFAULT 'DRAFT',
    "mcNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "paymentMethod" "PaymentMethod",
    "loadId" TEXT,
    "truckId" TEXT,
    "batchId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorBillId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorScheduledPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "DeductionFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "nextPaymentDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorScheduledPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatcherCommission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dispatcherId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "percentage" DOUBLE PRECISION,
    "flatAmount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "salaryBatchId" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatcherCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorBillBatch_companyId_idx" ON "VendorBillBatch"("companyId");

-- CreateIndex
CREATE INDEX "VendorBillBatch_postStatus_idx" ON "VendorBillBatch"("postStatus");

-- CreateIndex
CREATE INDEX "VendorBillBatch_periodStart_idx" ON "VendorBillBatch"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBillBatch_companyId_batchNumber_key" ON "VendorBillBatch"("companyId", "batchNumber");

-- CreateIndex
CREATE INDEX "VendorBill_companyId_idx" ON "VendorBill"("companyId");

-- CreateIndex
CREATE INDEX "VendorBill_vendorId_idx" ON "VendorBill"("vendorId");

-- CreateIndex
CREATE INDEX "VendorBill_status_idx" ON "VendorBill"("status");

-- CreateIndex
CREATE INDEX "VendorBill_batchId_idx" ON "VendorBill"("batchId");

-- CreateIndex
CREATE INDEX "VendorBill_dueDate_idx" ON "VendorBill"("dueDate");

-- CreateIndex
CREATE INDEX "VendorBill_loadId_idx" ON "VendorBill"("loadId");

-- CreateIndex
CREATE INDEX "VendorBill_truckId_idx" ON "VendorBill"("truckId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_companyId_billNumber_key" ON "VendorBill"("companyId", "billNumber");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorBillId_idx" ON "VendorPayment"("vendorBillId");

-- CreateIndex
CREATE INDEX "VendorPayment_companyId_idx" ON "VendorPayment"("companyId");

-- CreateIndex
CREATE INDEX "VendorScheduledPayment_companyId_idx" ON "VendorScheduledPayment"("companyId");

-- CreateIndex
CREATE INDEX "VendorScheduledPayment_vendorId_idx" ON "VendorScheduledPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorScheduledPayment_isActive_idx" ON "VendorScheduledPayment"("isActive");

-- CreateIndex
CREATE INDEX "DispatcherCommission_companyId_idx" ON "DispatcherCommission"("companyId");

-- CreateIndex
CREATE INDEX "DispatcherCommission_dispatcherId_idx" ON "DispatcherCommission"("dispatcherId");

-- CreateIndex
CREATE INDEX "DispatcherCommission_status_idx" ON "DispatcherCommission"("status");

-- CreateIndex
CREATE INDEX "DispatcherCommission_salaryBatchId_idx" ON "DispatcherCommission"("salaryBatchId");

-- CreateIndex
CREATE INDEX "DispatcherCommission_loadId_idx" ON "DispatcherCommission"("loadId");

-- AddForeignKey
ALTER TABLE "VendorBillBatch" ADD CONSTRAINT "VendorBillBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBillBatch" ADD CONSTRAINT "VendorBillBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "VendorBillBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorBillId_fkey" FOREIGN KEY ("vendorBillId") REFERENCES "VendorBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorScheduledPayment" ADD CONSTRAINT "VendorScheduledPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorScheduledPayment" ADD CONSTRAINT "VendorScheduledPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorScheduledPayment" ADD CONSTRAINT "VendorScheduledPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherCommission" ADD CONSTRAINT "DispatcherCommission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherCommission" ADD CONSTRAINT "DispatcherCommission_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherCommission" ADD CONSTRAINT "DispatcherCommission_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherCommission" ADD CONSTRAINT "DispatcherCommission_salaryBatchId_fkey" FOREIGN KEY ("salaryBatchId") REFERENCES "SalaryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherCommission" ADD CONSTRAINT "DispatcherCommission_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

