/**
 * LoadExpenseManager
 * 
 * Tracks all load-related expenses, handles approvals, and calculates total costs.
 */

import { prisma } from '@/lib/prisma';
import { LoadExpenseType } from '@prisma/client';

interface ExpenseData {
  loadId: string;
  expenseType: LoadExpenseType | string;
  amount: number;
  vendorId?: string;
  description?: string;
  receiptUrl?: string;
  date?: Date;
}

interface ExpenseApproval {
  expenseId: string;
  approverId: string;
  approved: boolean;
  rejectionReason?: string;
}

export class LoadExpenseManager {
  /**
   * Add an expense to a load
   */
  async addExpense(expenseData: ExpenseData): Promise<any> {
    const load = await prisma.load.findUnique({
      where: {
        id: expenseData.loadId,
        deletedAt: null
      },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    const expense = await prisma.loadExpense.create({
      data: {
        loadId: expenseData.loadId,
        expenseType: expenseData.expenseType as LoadExpenseType,
        amount: expenseData.amount,
        ...(expenseData.vendorId && { vendorId: expenseData.vendorId }),
        ...(expenseData.description && { description: expenseData.description }),
        ...(expenseData.receiptUrl && { receiptUrl: expenseData.receiptUrl }),
        date: expenseData.date || new Date(),
        approvalStatus: 'PENDING',
      },
      include: {
        load: {
          select: {
            loadNumber: true,
            companyId: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        companyId: expense.load.companyId,
        action: 'EXPENSE_ADDED',
        entityType: 'LoadExpense',
        entityId: expense.id,
        description: `Expense added to load ${expense.load.loadNumber}: ${expenseData.expenseType} - $${expenseData.amount}`,
      },
    });

    return expense;
  }

  /**
   * Get all expenses for a load
   */
  async getLoadExpenses(loadId: string): Promise<any[]> {
    return await prisma.loadExpense.findMany({
      where: {
        loadId,
      },
      include: {
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Calculate total expenses for a load
   */
  async calculateTotalExpenses(loadId: string): Promise<number> {
    const expenses = await prisma.loadExpense.findMany({
      where: {
        loadId,
        approvalStatus: {
          in: ['APPROVED', 'PENDING'],
        },
      },
      select: {
        amount: true,
      },
    });

    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  /**
   * Approve or reject an expense
   */
  async approveExpense(approval: ExpenseApproval): Promise<any> {
    const expense = await prisma.loadExpense.findUnique({
      where: { id: approval.expenseId },
      include: {
        load: {
          select: {
            loadNumber: true,
            companyId: true,
          },
        },
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.approvalStatus !== 'PENDING') {
      throw new Error('Expense has already been processed');
    }

    const updatedExpense = await prisma.loadExpense.update({
      where: { id: approval.expenseId },
      data: {
        approvalStatus: approval.approved ? 'APPROVED' : 'REJECTED',
        approvedById: approval.approverId,
        approvedAt: new Date(),
        rejectionReason: approval.rejectionReason,
      },
      include: {
        load: {
          select: {
            loadNumber: true,
          },
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update load total expenses if approved
    if (approval.approved) {
      const totalExpenses = await this.calculateTotalExpenses(expense.loadId);
      await prisma.load.update({
        where: { id: expense.loadId },
        data: {
          totalExpenses,
        },
      });
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        companyId: expense.load.companyId,
        action: approval.approved ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
        entityType: 'LoadExpense',
        entityId: expense.id,
        description: `Expense ${approval.approved ? 'approved' : 'rejected'} for load ${expense.load.loadNumber}`,
      },
    });

    return updatedExpense;
  }

  /**
   * Get pending expenses for approval
   */
  async getPendingExpenses(mcWhere: Record<string, any>): Promise<any[]> {
    return await prisma.loadExpense.findMany({
      where: {
        load: {
          ...mcWhere,
          deletedAt: null,
        },
        approvalStatus: 'PENDING',
      },
      include: {
        load: {
          select: {
            loadNumber: true,
            driver: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get expenses by type for a date range
   */
  async getExpensesByType(
    mcWhere: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    [key: string]: { count: number; total: number };
  }> {
    const expenses = await prisma.loadExpense.findMany({
      where: {
        load: {
          ...mcWhere,
          deletedAt: null,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        approvalStatus: 'APPROVED',
      },
      select: {
        expenseType: true,
        amount: true,
      },
    });

    const summary: { [key: string]: { count: number; total: number } } = {};

    expenses.forEach((expense) => {
      const type = expense.expenseType;
      if (!summary[type]) {
        summary[type] = { count: 0, total: 0 };
      }
      summary[type].count++;
      summary[type].total += expense.amount;
    });

    return summary;
  }

  /**
   * Get expense statistics
   */
  async getExpenseStatistics(
    mcWhere: Record<string, any>,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalExpenses: number;
    averageExpensePerLoad: number;
    expenseCount: number;
    pendingApproval: number;
    byType: { [key: string]: number };
  }> {
    const where: any = {
      load: {
        ...mcWhere,
        deletedAt: null,
      },
      approvalStatus: 'APPROVED',
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [expenses, pendingCount] = await Promise.all([
      prisma.loadExpense.findMany({
        where,
        select: {
          amount: true,
          expenseType: true,
          loadId: true,
        },
      }),
      prisma.loadExpense.count({
        where: {
          load: {
            ...mcWhere,
            deletedAt: null,
          },
          approvalStatus: 'PENDING',
        },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const uniqueLoads = new Set(expenses.map((exp) => exp.loadId)).size;
    const averageExpensePerLoad = uniqueLoads > 0 ? totalExpenses / uniqueLoads : 0;

    const byType: { [key: string]: number } = {};
    expenses.forEach((expense) => {
      const type = expense.expenseType;
      byType[type] = (byType[type] || 0) + expense.amount;
    });

    return {
      totalExpenses,
      averageExpensePerLoad,
      expenseCount: expenses.length,
      pendingApproval: pendingCount,
      byType,
    };
  }

  /**
   * Update expense
   */
  async updateExpense(
    expenseId: string,
    updates: Partial<ExpenseData>
  ): Promise<any> {
    const expense = await prisma.loadExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.approvalStatus !== 'PENDING') {
      throw new Error('Cannot update approved or rejected expenses');
    }

    return await prisma.loadExpense.update({
      where: { id: expenseId },
      data: {
        ...(updates.expenseType && { expenseType: updates.expenseType as LoadExpenseType }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.vendorId !== undefined && { vendorId: updates.vendorId }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.receiptUrl !== undefined && { receiptUrl: updates.receiptUrl }),
        ...(updates.date !== undefined && { date: updates.date }),
      },
    });
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const expense = await prisma.loadExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.approvalStatus === 'APPROVED') {
      throw new Error('Cannot delete approved expenses');
    }

    await prisma.loadExpense.delete({
      where: { id: expenseId },
    });
  }
}





