import { prisma } from '@/lib/prisma';
import type { Prisma, VendorBillStatus, PaymentMethod, BatchPostStatus } from '@prisma/client';

interface CreateBillInput {
  companyId: string;
  vendorId: string;
  vendorInvoiceNumber?: string;
  amount: number;
  billDate: Date;
  dueDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  description?: string;
  notes?: string;
  loadId?: string;
  truckId?: string;
  mcNumber?: string;
  createdById?: string;
}

interface RecordPaymentInput {
  amount: number;
  paymentDate: Date;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdById?: string;
}

export class VendorBillManager {
  /** Create a vendor bill with auto-generated bill number */
  static async createBill(data: CreateBillInput) {
    const billNumber = `VB-${Date.now()}`;
    return prisma.vendorBill.create({
      data: {
        companyId: data.companyId,
        billNumber,
        vendorId: data.vendorId,
        vendorInvoiceNumber: data.vendorInvoiceNumber,
        amount: data.amount,
        balance: data.amount,
        billDate: data.billDate,
        dueDate: data.dueDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        description: data.description,
        notes: data.notes,
        loadId: data.loadId,
        truckId: data.truckId,
        mcNumber: data.mcNumber,
        createdById: data.createdById,
      },
      include: { vendor: true },
    });
  }

  /** Create a bill batch grouping unbatched bills for a period */
  static async createBatch(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
    userId: string,
    mcNumber?: string
  ) {
    const batchNumber = `BB-${String(Date.now()).slice(-6)}`;

    return prisma.$transaction(async (tx) => {
      // Find unbatched bills in period
      const where: Prisma.VendorBillWhereInput = {
        companyId,
        batchId: null,
        billDate: { gte: periodStart, lte: periodEnd },
        status: { not: 'CANCELLED' },
      };
      if (mcNumber) where.mcNumber = mcNumber;

      const bills = await tx.vendorBill.findMany({
        where,
        include: { vendor: true, truck: true, load: true },
      });

      if (bills.length === 0) {
        throw new Error('No unbatched bills found for this period');
      }

      const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
      const vendorIds = new Set(bills.map((b) => b.vendorId));
      const truckIds = new Set(bills.filter((b) => b.truckId).map((b) => b.truckId));
      const tripCount = bills.filter((b) => b.loadId).length;

      const batch = await tx.vendorBillBatch.create({
        data: {
          companyId,
          batchNumber,
          periodStart,
          periodEnd,
          totalAmount,
          billCount: bills.length,
          vendorCount: vendorIds.size,
          truckCount: truckIds.size,
          tripCount,
          mcNumber,
          createdById: userId,
        },
      });

      // Assign bills to batch
      await tx.vendorBill.updateMany({
        where: { id: { in: bills.map((b) => b.id) } },
        data: { batchId: batch.id },
      });

      return { ...batch, bills };
    });
  }

  /** Update batch post status */
  static async postBatch(batchId: string) {
    return prisma.vendorBillBatch.update({
      where: { id: batchId },
      data: {
        postStatus: 'POSTED' as BatchPostStatus,
        postedAt: new Date(),
      },
    });
  }

  /** Record a payment against a vendor bill */
  static async recordPayment(
    billId: string,
    companyId: string,
    input: RecordPaymentInput
  ) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.vendorBill.findUniqueOrThrow({
        where: { id: billId },
      });

      const newAmountPaid = bill.amountPaid + input.amount;
      const newBalance = bill.amount - newAmountPaid;
      const newStatus: VendorBillStatus =
        newBalance <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIAL' : bill.status;

      await tx.vendorPayment.create({
        data: {
          companyId,
          vendorBillId: billId,
          amount: input.amount,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          createdById: input.createdById,
        },
      });

      return tx.vendorBill.update({
        where: { id: billId },
        data: {
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          paymentMethod: input.paymentMethod ?? bill.paymentMethod,
          paidDate: newBalance <= 0 ? new Date() : null,
        },
        include: { vendor: true, payments: true },
      });
    });
  }

  /** Get vendor balance summary (total unpaid across all bills) */
  static async getVendorBalance(vendorId: string, companyId: string) {
    const result = await prisma.vendorBill.aggregate({
      where: {
        vendorId,
        companyId,
        status: { in: ['DRAFT', 'POSTED', 'PARTIAL'] },
      },
      _sum: { balance: true, amount: true, amountPaid: true },
      _count: true,
    });
    return {
      totalDue: result._sum.balance ?? 0,
      totalBilled: result._sum.amount ?? 0,
      totalPaid: result._sum.amountPaid ?? 0,
      billCount: result._count,
    };
  }

  /** Get vendor statement — bills and payments for a date range */
  static async getVendorStatement(
    vendorId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const bills = await prisma.vendorBill.findMany({
      where: {
        vendorId,
        companyId,
        billDate: { gte: startDate, lte: endDate },
      },
      include: { payments: true, load: { select: { loadNumber: true } } },
      orderBy: { billDate: 'asc' },
    });

    const totalBilled = bills.reduce((s, b) => s + b.amount, 0);
    const totalPaid = bills.reduce((s, b) => s + b.amountPaid, 0);
    const balance = totalBilled - totalPaid;

    return { bills, totalBilled, totalPaid, balance };
  }

  /** Get all vendor balances for a company */
  static async getAllVendorBalances(companyId: string, mcNumber?: string) {
    const where: Prisma.VendorBillWhereInput = {
      companyId,
      status: { in: ['DRAFT', 'POSTED', 'PARTIAL'] },
    };
    if (mcNumber) where.mcNumber = mcNumber;

    const bills = await prisma.vendorBill.findMany({
      where,
      include: { vendor: { select: { id: true, name: true, vendorNumber: true } } },
    });

    // Group by vendor
    const byVendor = new Map<string, { vendor: any; totalDue: number; billCount: number }>();
    for (const bill of bills) {
      const existing = byVendor.get(bill.vendorId);
      if (existing) {
        existing.totalDue += bill.balance;
        existing.billCount += 1;
      } else {
        byVendor.set(bill.vendorId, {
          vendor: bill.vendor,
          totalDue: bill.balance,
          billCount: 1,
        });
      }
    }

    return Array.from(byVendor.values()).sort((a, b) => b.totalDue - a.totalDue);
  }
}
