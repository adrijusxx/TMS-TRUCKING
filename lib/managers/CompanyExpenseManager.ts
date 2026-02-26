/**
 * CompanyExpenseManager
 *
 * Manages standalone company-level expenses not tied to loads.
 * Handles expense number generation, approval workflow, and recurring chains.
 */

import { prisma } from '@/lib/prisma';
import { ApprovalStatus, ExpenseDepartment, RecurringFrequency } from '@prisma/client';
import { paymentInstrumentManager } from './PaymentInstrumentManager';

interface CreateExpenseData {
  companyId: string;
  mcNumberId?: string | null;
  amount: number;
  date: Date;
  description: string;
  expenseTypeId: string;
  department?: ExpenseDepartment;
  paymentInstrumentId?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  receiptUrl?: string | null;
  documentIds?: string[];
  hasReceipt?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency | null;
  recurringParentId?: string | null;
  notes?: string | null;
  createdById: string;
}

export class CompanyExpenseManager {
  /**
   * Generate next expense number: CE-YYYY-0001
   */
  async generateExpenseNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CE-${year}-`;

    const count = await prisma.companyExpense.count({
      where: {
        companyId,
        expenseNumber: { startsWith: prefix },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Create a new company expense
   */
  async createExpense(data: CreateExpenseData) {
    // Validate expense type belongs to company
    const expenseType = await prisma.companyExpenseType.findFirst({
      where: {
        id: data.expenseTypeId,
        companyId: data.companyId,
        isActive: true,
      },
    });
    if (!expenseType) throw new Error('Invalid expense type');

    // Validate payment instrument belongs to company (if provided)
    if (data.paymentInstrumentId) {
      const instrument = await prisma.paymentInstrument.findFirst({
        where: { id: data.paymentInstrumentId, companyId: data.companyId, deletedAt: null },
      });
      if (!instrument) throw new Error('Invalid payment instrument');
    }

    const expenseNumber = await this.generateExpenseNumber(data.companyId);

    const expense = await prisma.companyExpense.create({
      data: {
        companyId: data.companyId,
        mcNumberId: data.mcNumberId ?? null,
        expenseNumber,
        amount: data.amount,
        date: data.date,
        description: data.description,
        expenseTypeId: data.expenseTypeId,
        department: data.department ?? 'OTHER',
        paymentInstrumentId: data.paymentInstrumentId ?? null,
        vendorId: data.vendorId ?? null,
        vendorName: data.vendorName ?? null,
        receiptUrl: data.receiptUrl ?? null,
        documentIds: data.documentIds ?? [],
        hasReceipt: data.hasReceipt ?? false,
        isRecurring: data.isRecurring ?? false,
        recurringFrequency: data.recurringFrequency ?? null,
        recurringParentId: data.recurringParentId ?? null,
        notes: data.notes ?? null,
        createdById: data.createdById,
        approvalStatus: 'PENDING',
      },
      include: {
        expenseType: { select: { name: true, color: true } },
        paymentInstrument: { select: { name: true, color: true, lastFour: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Fire-and-forget spending alert check
    if (data.paymentInstrumentId) {
      paymentInstrumentManager
        .checkSpendingAlert(data.paymentInstrumentId, data.companyId)
        .catch(() => {/* non-critical */});
    }

    return expense;
  }

  /**
   * Approve or reject a company expense
   */
  async approveExpense(
    expenseId: string,
    approverId: string,
    companyId: string,
    approved: boolean,
    rejectionReason?: string | null,
  ) {
    const expense = await prisma.companyExpense.findFirst({
      where: { id: expenseId, companyId, deletedAt: null },
    });
    if (!expense) throw new Error('Expense not found');
    if (expense.approvalStatus !== 'PENDING' && expense.approvalStatus !== 'UNDER_REVIEW') {
      throw new Error('Expense is not pending approval');
    }

    return prisma.companyExpense.update({
      where: { id: expenseId },
      data: {
        approvalStatus: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason: !approved ? (rejectionReason ?? null) : null,
      },
    });
  }

  /**
   * Create a child recurring expense from a parent
   */
  async createRecurring(parentId: string): Promise<void> {
    const parent = await prisma.companyExpense.findUnique({
      where: { id: parentId },
    });
    if (!parent || !parent.isRecurring || !parent.recurringFrequency) return;

    // Find the most recent child to determine the next date
    const lastChild = await prisma.companyExpense.findFirst({
      where: { recurringParentId: parentId },
      orderBy: { date: 'desc' },
    });

    const baseDate = lastChild ? lastChild.date : parent.date;
    const nextDate = this.calculateNextDate(baseDate, parent.recurringFrequency);

    // Don't create future-dated entries more than 5 days early
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    if (nextDate > fiveDaysFromNow) return;

    const expenseNumber = await this.generateExpenseNumber(parent.companyId);

    await prisma.companyExpense.create({
      data: {
        companyId: parent.companyId,
        mcNumberId: parent.mcNumberId,
        expenseNumber,
        amount: parent.amount,
        date: nextDate,
        description: parent.description,
        expenseTypeId: parent.expenseTypeId,
        department: parent.department,
        paymentInstrumentId: parent.paymentInstrumentId,
        vendorId: parent.vendorId,
        vendorName: parent.vendorName,
        isRecurring: false, // Child entries are not themselves recurring
        recurringParentId: parentId,
        notes: parent.notes,
        hasReceipt: false,
        documentIds: [],
        approvalStatus: 'PENDING',
        createdById: parent.createdById,
      },
    });
  }

  /**
   * Get expenses missing receipts older than 48 hours (for nightly alert)
   */
  async getExpensesMissingReceipts(companyId: string) {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return prisma.companyExpense.findMany({
      where: {
        companyId,
        hasReceipt: false,
        date: { lt: cutoff },
        approvalStatus: { not: 'REJECTED' },
        deletedAt: null,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        expenseType: { select: { name: true } },
      },
    });
  }

  /**
   * Get all recurring parent expenses for a company (for cron job)
   */
  async getRecurringParents(companyId: string) {
    return prisma.companyExpense.findMany({
      where: {
        companyId,
        isRecurring: true,
        recurringParentId: null,
        deletedAt: null,
      },
    });
  }

  private calculateNextDate(baseDate: Date, frequency: RecurringFrequency): Date {
    const next = new Date(baseDate);
    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'ANNUAL':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}

export const companyExpenseManager = new CompanyExpenseManager();
