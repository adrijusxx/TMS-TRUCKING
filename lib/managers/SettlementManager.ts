/**
 * SettlementManager
 * 
 * Handles automated settlement generation with configurable deduction rules,
 * approval workflow, and comprehensive deduction calculations.
 */

import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from './DriverAdvanceManager';
import { LoadExpenseManager } from './LoadExpenseManager';

export interface SettlementGenerationParams {
  driverId: string;
  periodStart: Date;
  periodEnd: Date;
  settlementNumber?: string;
  notes?: string;
}

export interface DeductionItem {
  type: string;
  description: string;
  amount: number;
  reference?: string;
}

export class SettlementManager {
  private advanceManager: DriverAdvanceManager;
  private expenseManager: LoadExpenseManager;

  constructor() {
    this.advanceManager = new DriverAdvanceManager();
    this.expenseManager = new LoadExpenseManager();
  }

  /**
   * Auto-generate settlement for a driver
   */
  async generateSettlement(
    params: SettlementGenerationParams
  ): Promise<any> {
    const { driverId, periodStart, periodEnd } = params;

    // 1. Fetch driver with deduction rules
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // 2. Fetch completed loads for the period
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        deliveredAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: {
          in: ['DELIVERED', 'INVOICED', 'PAID'],
        },
        readyForSettlement: true,
        deletedAt: null,
      },
      include: {
        loadExpenses: {
          where: {
            approvalStatus: 'APPROVED',
          },
        },
      },
      orderBy: {
        deliveredAt: 'asc',
      },
    });

    if (loads.length === 0) {
      throw new Error('No completed loads found for the settlement period');
    }

    // 3. Calculate gross pay
    const grossPay = await this.calculateGrossPay(driver, loads);

    // 4. Calculate all deductions
    const deductions = await this.calculateDeductions(
      driverId,
      loads,
      grossPay,
      periodStart,
      periodEnd
    );

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // 5. Calculate advances
    const advances = await this.advanceManager.getAdvancesForSettlement(
      driverId,
      periodStart,
      periodEnd
    );
    const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

    // 6. Calculate net pay
    const netPay = grossPay - totalDeductions - totalAdvances;

    // 7. Generate settlement number
    const settlementNumber =
      params.settlementNumber ||
      `SET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // 8. Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        driverId,
        settlementNumber,
        loadIds: loads.map((l) => l.id),
        grossPay,
        deductions: totalDeductions,
        advances: totalAdvances,
        netPay,
        periodStart,
        periodEnd,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        calculatedAt: new Date(),
        notes: params.notes,
      },
    });

    // 9. Create deduction items
    for (const deduction of deductions) {
      await prisma.settlementDeduction.create({
        data: {
          settlementId: settlement.id,
          deductionType: deduction.type as any,
          description: deduction.description,
          amount: deduction.amount,
          fuelEntryId: deduction.reference?.startsWith('fuel_')
            ? deduction.reference.replace('fuel_', '')
            : undefined,
          driverAdvanceId: deduction.reference?.startsWith('advance_')
            ? deduction.reference.replace('advance_', '')
            : undefined,
          loadExpenseId: deduction.reference?.startsWith('expense_')
            ? deduction.reference.replace('expense_', '')
            : undefined,
        },
      });
    }

    // 10. Link advances to settlement
    if (advances.length > 0) {
      await this.advanceManager.markAdvancesDeducted(
        advances.map((a) => a.id),
        settlement.id
      );
    }

    // 11. Create activity log
    await prisma.activityLog.create({
      data: {
        companyId: driver.companyId,
        action: 'SETTLEMENT_GENERATED',
        entityType: 'Settlement',
        entityId: settlement.id,
        description: `Settlement ${settlementNumber} generated for ${driver.user.firstName} ${driver.user.lastName}`,
        metadata: {
          grossPay,
          deductions: totalDeductions,
          advances: totalAdvances,
          netPay,
          loadCount: loads.length,
        },
      },
    });

    return await prisma.settlement.findUnique({
      where: { id: settlement.id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        deductionItems: true,
        driverAdvances: true,
      },
    });
  }

  /**
   * Calculate gross pay based on driver pay type
   */
  private async calculateGrossPay(driver: any, loads: any[]): Promise<number> {
    let grossPay = 0;

    for (const load of loads) {
      if (load.driverPay && load.driverPay > 0) {
        // Use manually set driver pay
        grossPay += load.driverPay;
      } else {
        // Calculate from driver pay rate
        switch (driver.payType) {
          case 'PER_MILE':
            const miles = load.totalMiles || load.loadedMiles || 0;
            grossPay += miles * driver.payRate;
            break;
          case 'PER_LOAD':
            grossPay += driver.payRate;
            break;
          case 'PERCENTAGE':
            grossPay += (load.revenue || 0) * (driver.payRate / 100);
            break;
          case 'HOURLY':
            const estimatedHours =
              (load.totalMiles || 0) > 0 ? (load.totalMiles || 0) / 50 : 10;
            grossPay += estimatedHours * driver.payRate;
            break;
        }
      }
    }

    return grossPay;
  }

  /**
   * Calculate all deductions using configurable rules
   */
  private async calculateDeductions(
    driverId: string,
    loads: any[],
    grossPay: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DeductionItem[]> {
    const deductions: DeductionItem[] = [];
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        companyId: true,
        driverType: true,
      },
    });

    if (!driver) return deductions;

    // 1. Get applicable deduction rules
    const rules = await prisma.deductionRule.findMany({
      where: {
        companyId: driver.companyId,
        isActive: true,
        OR: [
          { driverType: null },
          { driverType: driver.driverType },
        ],
      },
    });

    // 2. Apply each rule
    for (const rule of rules) {
      // Check minimum gross pay requirement
      if (rule.minGrossPay && grossPay < rule.minGrossPay) {
        continue;
      }

      let deductionAmount = 0;

      switch (rule.calculationType) {
        case 'FIXED':
          deductionAmount = rule.amount || 0;
          break;
        case 'PERCENTAGE':
          deductionAmount = grossPay * ((rule.percentage || 0) / 100);
          break;
        case 'PER_MILE':
          const totalMiles = loads.reduce(
            (sum, load) => sum + (load.totalMiles || 0),
            0
          );
          deductionAmount = totalMiles * (rule.perMileRate || 0);
          break;
      }

      // Apply max amount cap if specified
      if (rule.maxAmount && deductionAmount > rule.maxAmount) {
        deductionAmount = rule.maxAmount;
      }

      if (deductionAmount > 0) {
        deductions.push({
          type: rule.deductionType,
          description: rule.name,
          amount: deductionAmount,
        });
      }
    }

    // 3. Add fuel advances
    const fuelEntries = await prisma.fuelEntry.findMany({
      where: {
        driverId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    for (const entry of fuelEntries) {
      deductions.push({
        type: 'FUEL_ADVANCE',
        description: `Fuel advance on ${entry.date.toLocaleDateString()}`,
        amount: entry.totalCost,
        reference: `fuel_${entry.id}`,
      });
    }

    return deductions;
  }

  /**
   * Submit settlement for approval
   */
  async submitForApproval(settlementId: string): Promise<any> {
    return await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        approvalStatus: 'UNDER_REVIEW',
      },
    });
  }

  /**
   * Approve settlement
   */
  async approveSettlement(
    settlementId: string,
    approverId: string,
    notes?: string
  ): Promise<any> {
    const settlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
        status: 'APPROVED',
      },
    });

    // Create approval history
    await prisma.settlementApproval.create({
      data: {
        settlementId,
        status: 'APPROVED',
        approvedById: approverId,
        notes,
      },
    });

    return settlement;
  }

  /**
   * Reject settlement
   */
  async rejectSettlement(
    settlementId: string,
    approverId: string,
    reason: string
  ): Promise<any> {
    const settlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        approvalStatus: 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Create approval history
    await prisma.settlementApproval.create({
      data: {
        settlementId,
        status: 'REJECTED',
        approvedById: approverId,
        notes: reason,
      },
    });

    return settlement;
  }

  /**
   * Mark settlement as paid
   */
  async processPayment(
    settlementId: string,
    paymentMethod: string,
    paymentReference?: string
  ): Promise<any> {
    return await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod as any,
        paymentReference,
      },
    });
  }

  /**
   * Get settlements pending approval
   */
  async getPendingApprovals(companyId: string): Promise<any[]> {
    return await prisma.settlement.findMany({
      where: {
        driver: {
          companyId,
        },
        approvalStatus: {
          in: ['PENDING', 'UNDER_REVIEW'],
        },
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        deductionItems: true,
      },
      orderBy: {
        calculatedAt: 'asc',
      },
    });
  }

  /**
   * Get settlement breakdown
   */
  async getSettlementBreakdown(settlementId: string): Promise<any> {
    return await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        deductionItems: {
          include: {
            fuelEntry: true,
            driverAdvance: true,
            loadExpense: true,
          },
        },
        driverAdvances: true,
        loadExpenses: true,
        approvalHistory: {
          include: {
            approvedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }
}

