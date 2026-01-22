/**
 * SettlementManager
 * 
 * Handles automated settlement generation with STRICT driver pay hierarchy:
 * 1. Gross Pay (CPM or Percentage with FSC exclusion)
 * 2. Additions (StopPay, DetentionPay, Reimbursements)
 * 3. Deductions (Advances, Recurring, Garnishments/Escrow)
 * 4. Negative Balance handling (create record, apply next week)
 */

import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from './DriverAdvanceManager';
import { LoadExpenseManager } from './LoadExpenseManager';
import { UsageManager } from './UsageManager';
import { LoadStatus } from '@prisma/client';

interface SettlementGenerationParams {
  driverId: string;
  periodStart: Date;
  periodEnd: Date;
  settlementNumber?: string;
  notes?: string;
  salaryBatchId?: string;
}

interface DeductionItem {
  type: string;
  description: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
}

interface AdditionItem {
  type: string;
  description: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface SettlementCalculatedValues {
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalAdditions: number;
  totalAdvances: number;
  additions: AdditionItem[];
  deductions: DeductionItem[];
  advances: any[];
  negativeBalanceDeduction: number;
  previousNegativeBalance: any | null;
}

export class SettlementManager {
  private advanceManager: DriverAdvanceManager;
  private expenseManager: LoadExpenseManager;

  constructor() {
    this.advanceManager = new DriverAdvanceManager();
    this.expenseManager = new LoadExpenseManager();
  }

  /**
   * Auto-generate settlement for a driver with STRICT pay hierarchy
   */
  async generateSettlement(
    params: SettlementGenerationParams
  ): Promise<any> {
    const { driverId, periodStart, periodEnd, salaryBatchId } = params;

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
    // CRITICAL: Do NOT filter by isBillingHold - settlement (AP) can proceed independently
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        deliveredAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: {
          in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'] as LoadStatus[],
        },
        readyForSettlement: true,
        deletedAt: null,
      },
      include: {
        accessorialCharges: {
          where: {
            status: { in: ['APPROVED', 'BILLED'] },
          },
        },
        loadExpenses: {
          where: {
            approvalStatus: 'APPROVED',
            expenseType: { in: ['TOLL', 'SCALE'] }, // Reimbursements only
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

    // 3. Calculate all settlement values (Preview)
    const {
      grossPay,
      netPay,
      totalDeductions,
      totalAdditions,
      totalAdvances,
      additions,
      deductions,
      advances,
      negativeBalanceDeduction,
      previousNegativeBalance,
    } = await this.calculateSettlementPreview(driverId, loads, periodStart, periodEnd);

    // 9. Generate settlement number
    const settlementNumber =
      params.settlementNumber ||
      `SET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // 10. Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        driverId,
        settlementNumber,
        loadIds: loads.map((l) => l.id),
        grossPay,
        deductions: totalDeductions + negativeBalanceDeduction, // Include negative balance in deductions
        advances: totalAdvances,
        netPay: netPay < 0 ? 0 : netPay, // Store 0 if negative (balance tracked separately)
        periodStart,
        periodEnd,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        calculatedAt: new Date(),
        notes: params.notes,
        salaryBatchId: salaryBatchId, // Link to batch if provided
      },
    });

    // 11. Handle negative balance (CRITICAL: Create record instead of error)
    // DO NOT throw error - create NegativeBalance record instead
    if (netPay < 0) {
      await prisma.driverNegativeBalance.create({
        data: {
          driverId,
          amount: Math.abs(netPay), // Store as positive amount
          originalSettlementId: settlement.id,
          notes: `Negative balance from settlement ${settlementNumber}. Will be applied to next week's settlement.`,
        },
      });

      // Mark previous negative balance as applied if it exists
      if (previousNegativeBalance) {
        await prisma.driverNegativeBalance.update({
          where: { id: previousNegativeBalance.id },
          data: {
            isApplied: true,
            appliedSettlementId: settlement.id,
            appliedAt: new Date(),
          },
        });
      }
    } else if (previousNegativeBalance) {
      // Apply previous negative balance to this settlement
      await (prisma as any).driverNegativeBalance.update({
        where: { id: previousNegativeBalance.id },
        data: {
          isApplied: true,
          appliedSettlementId: settlement.id,
          appliedAt: new Date(),
        },
      });

      // Add negative balance deduction item
      deductions.push({
        type: 'ESCROW',
        description: `Previous negative balance applied (Settlement ${previousNegativeBalance.originalSettlement?.settlementNumber || 'N/A'})`,
        amount: negativeBalanceDeduction,
        reference: `negative_balance_${previousNegativeBalance.id}`,
      });
    }

    // 12. Persist ADDITIONS (New Step)
    for (const addition of additions) {
      await prisma.settlementDeduction.create({
        data: {
          settlementId: settlement.id,
          deductionType: addition.type as any,
          category: 'addition',
          description: addition.description,
          amount: addition.amount,
          loadExpenseId: addition.reference?.startsWith('expense_')
            ? addition.reference.replace('expense_', '')
            : undefined,
          metadata: addition.metadata,
        },
      });
    }

    // 13. Persist DEDUCTIONS
    const additionTypes = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'];
    for (const deduction of deductions) {
      // Safety check: Never save addition types as deductions
      if (additionTypes.includes(deduction.type)) {
        console.warn(`[SettlementManager] Skipping addition type "${deduction.type}" from deductions - this should not happen!`);
        continue;
      }

      await prisma.settlementDeduction.create({
        data: {
          settlementId: settlement.id,
          deductionType: deduction.type as any,
          category: 'deduction',
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
          metadata: deduction.metadata,
        },
      });
    }

    // 14. Link advances to settlement (Priority 1 deductions)
    if (advances.length > 0) {
      await this.advanceManager.markAdvancesDeducted(
        advances.map((a) => a.id),
        settlement.id
      );
    }

    // 15. Create activity log
    await prisma.activityLog.create({
      data: {
        companyId: driver.companyId,
        action: 'SETTLEMENT_GENERATED',
        entityType: 'Settlement',
        entityId: settlement.id,
        description: `Settlement ${settlementNumber} generated for ${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}`,
        metadata: {
          grossPay,
          additions: totalAdditions,
          deductions: totalDeductions,
          advances: totalAdvances,
          negativeBalanceApplied: negativeBalanceDeduction,
          netPay,
          hasNegativeBalance: netPay < 0,
          loadCount: loads.length,
        },
      },
    });

    // 16. Track usage
    try {
      await UsageManager.trackUsage(driver.companyId, 'SETTLEMENTS_GENERATED');
    } catch (usageError) {
      console.error('[SettlementManager] Failed to track usage:', usageError);
    }

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
        // Note: negativeBalances relation may need Prisma client regeneration
        // Included via separate query if needed
      },
    });
  }

  /**
   * Calculate settlement values without persisting (Preview/Draft Mode)
   */
  async calculateSettlementPreview(
    driverId: string,
    loads: any[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<SettlementCalculatedValues> {
    // 1. Calculate gross pay
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true // Need user details for some logic potentially
      }
    });

    if (!driver) throw new Error('Driver not found');

    // Note: calculateGrossPay expects driver with payType/payRate
    const grossPay = await this.calculateGrossPay(driver, loads);

    // 2. Calculate additions
    const additions = await this.calculateAdditions(driverId, loads, grossPay, periodStart, periodEnd);
    const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

    // 3. Calculate advances
    const advances = await this.advanceManager.getAdvancesForSettlement(
      driverId,
      periodStart,
      periodEnd
    );
    const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

    // 4. Calculate deductions
    const deductions = await this.calculateDeductions(
      driverId,
      loads,
      grossPay,
      periodStart,
      periodEnd
    );
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // 5. Apply previous negative balance
    const previousNegativeBalance = await this.getPreviousNegativeBalance(driverId);
    const negativeBalanceDeduction = previousNegativeBalance ? previousNegativeBalance.amount : 0;

    // 6. Calculate net pay
    const netPay = grossPay + totalAdditions - totalDeductions - totalAdvances - negativeBalanceDeduction;

    return {
      grossPay,
      netPay,
      totalDeductions,
      totalAdditions,
      totalAdvances,
      additions,
      deductions,
      advances,
      negativeBalanceDeduction,
      previousNegativeBalance,
    };
  }

  /**
   * Calculate gross pay with STRICT hierarchy
   * 
   * CPM: (loadedMiles + emptyMiles) * Rate
   * Percentage: (TotalInvoice - FuelSurcharge) * Percentage (CRITICAL: Exclude FSC!)
   */
  private async calculateGrossPay(driver: any, loads: any[]): Promise<number> {
    let grossPay = 0;

    for (const load of loads) {
      if (load.driverPay && load.driverPay > 0) {
        // Use manually set driver pay (override)
        grossPay += load.driverPay;
      } else {
        // Calculate from driver pay rate
        switch (driver.payType) {
          case 'PER_MILE': {
            // STRICT: CPM = (loadedMiles + emptyMiles) * Rate
            // CRITICAL: Must use loadedMiles + emptyMiles, NOT totalMiles
            const loadedMiles = load.loadedMiles || 0;
            const emptyMiles = load.emptyMiles || 0;
            const totalMiles = loadedMiles + emptyMiles;
            if (totalMiles > 0) {
              grossPay += totalMiles * driver.payRate;
            }
            break;
          }

          case 'PERCENTAGE': {
            // STRICT: Percentage = (TotalInvoice - FuelSurcharge) * Percentage
            // Get invoice total for this load
            let invoiceTotal = 0;
            let fuelSurcharge = 0;

            // Find invoices that include this load
            const invoices = await prisma.invoice.findMany({
              where: {
                loadIds: {
                  has: load.id,
                },
              },
              include: {
                accessorialCharges: {
                  where: {
                    chargeType: 'FUEL_SURCHARGE',
                    status: { in: ['APPROVED', 'BILLED'] },
                  },
                  select: {
                    amount: true,
                  },
                },
              },
            });

            if (invoices.length > 0) {
              // Sum all invoice totals
              invoiceTotal = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

              // Sum all fuel surcharge accessorials from invoices
              fuelSurcharge = invoices.reduce((sum: number, inv: any) => {
                const fsc = inv.accessorialCharges?.reduce((fscSum: number, charge: any) =>
                  fscSum + (charge.amount || 0), 0) || 0;
                return sum + fsc;
              }, 0);
            } else {
              // Fallback: Use load revenue if no invoice
              invoiceTotal = load.revenue || 0;

              // Check accessorial charges on load for FSC
              const fscCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'FUEL_SURCHARGE') || [];
              fuelSurcharge = fscCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0);
            }

            // CRITICAL: Exclude Fuel Surcharge from calculation
            const baseAmount = invoiceTotal - fuelSurcharge;
            grossPay += baseAmount * (driver.payRate / 100);
            break;
          }

          case 'PER_LOAD': {
            grossPay += driver.payRate;
            break;
          }

          case 'HOURLY': {
            const totalMiles = (load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0;
            const estimatedHours = totalMiles > 0 ? totalMiles / 50 : 10;
            grossPay += estimatedHours * driver.payRate;
            break;
          }

          case 'WEEKLY': {
            // WEEKLY: Flat weekly rate - pay once regardless of loads
            // This is handled outside the loop, so we'll just track it
            break;
          }
        }
      }
    }

    // For WEEKLY pay type, add the weekly rate once (not per load)
    if (driver.payType === 'WEEKLY' && loads.length > 0) {
      grossPay = driver.payRate;
    }

    return grossPay;
  }

  /**
   * Calculate additions: StopPay, DetentionPay, Reimbursements, and Recurring Additions (Bonus, Overtime, Incentive)
   */
  private async calculateAdditions(
    driverId: string,
    loads: any[],
    grossPay: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AdditionItem[]> {
    const additions: AdditionItem[] = [];

    for (const load of loads) {
      // StopPay: Additional stop accessorials
      const stopCharges = load.accessorialCharges?.filter(
        (c: any) => c.chargeType === 'ADDITIONAL_STOP'
      ) || [];

      for (const charge of stopCharges) {
        additions.push({
          type: 'STOP_PAY',
          description: `Stop pay: ${charge.description || 'Additional stop'}`,
          amount: charge.amount || 0,
          reference: `accessorial_${charge.id}`,
        });
      }

      // DetentionPay: Detention accessorials
      const detentionCharges = load.accessorialCharges?.filter(
        (c: any) => c.chargeType === 'DETENTION'
      ) || [];

      for (const charge of detentionCharges) {
        additions.push({
          type: 'DETENTION_PAY',
          description: `Detention pay: ${charge.description || `${charge.detentionHours || 0} hours`}`,
          amount: charge.amount || 0,
          reference: `accessorial_${charge.id}`,
        });
      }

      // Reimbursements: Tolls and Scales (from LoadExpense)
      const reimbursements = load.loadExpenses?.filter(
        (e: any) => e.expenseType === 'TOLL' || e.expenseType === 'SCALE'
      ) || [];

      for (const expense of reimbursements) {
        additions.push({
          type: 'REIMBURSEMENT',
          description: `Reimbursement: ${expense.expenseType} - ${expense.description || expense.vendor || 'N/A'}`,
          amount: expense.amount || 0,
          reference: `expense_${expense.id}`,
        });
      }
    }

    // Recurring additions from DeductionRule (Bonus, Overtime, Incentive)
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        companyId: true,
        driverType: true,
        driverNumber: true,
      },
    });

    if (driver) {
      // Query for addition rules - CRITICAL FIX: use driverId filtering
      const additionRules = await prisma.deductionRule.findMany({
        where: {
          companyId: driver.companyId,
          isActive: true,
          isAddition: true,
          deductionType: {
            in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'],
          },
          OR: [
            // Company-wide rules (no driver type and no specific driver)
            { driverType: null, driverId: null },
            // Driver-type-specific rules (matching type, no specific driver)
            { driverType: driver.driverType, driverId: null },
            // Driver-specific rules (assigned to THIS driver only)
            { driverId },
          ],
        },
      });

      for (const rule of additionRules) {
        // Safety Check: Prevent "Ghost" rules (rules meant for other drivers but saved with null driverId)
        if (rule.name.startsWith('Driver ')) {
          if (driver.driverNumber && !rule.name.includes(driver.driverNumber)) {
            console.warn(`[SettlementManager] Skipping contamination addition rule "${rule.name}" for driver ${driver.driverNumber}`);
            continue;
          }
        }

        if (rule.minGrossPay && grossPay < rule.minGrossPay) {
          continue;
        }

        let additionAmount = 0;

        switch (rule.calculationType) {
          case 'FIXED':
            additionAmount = rule.amount || 0;
            break;
          case 'PERCENTAGE':
            additionAmount = grossPay * ((rule.percentage || 0) / 100);
            break;
          case 'PER_MILE':
            const totalMiles = loads.reduce(
              (sum, load) => sum + ((load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0),
              0
            );
            additionAmount = totalMiles * (rule.perMileRate || 0);
            break;
        }

        if (rule.maxAmount && additionAmount > rule.maxAmount) {
          additionAmount = rule.maxAmount;
        }

        if (additionAmount > 0) {
          additions.push({
            type: rule.deductionType,
            description: rule.name,
            amount: additionAmount,
            reference: `deduction_rule_${rule.id}`,
            metadata: { deductionRuleId: rule.id },
          });
        }
      }
    }

    return additions;
  }

  /**
   * Calculate deductions in STRICT priority order:
   * NOTE: Priority 1 (Advances) is handled separately in generateSettlement()
   * This method handles:
   * - Priority 2: Recurring (Insurance, ELD)
   * - Priority 3: Garnishments/Escrow
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
        driverNumber: true,
      },
    });

    if (!driver) return deductions;

    // NOTE: Fuel advances are handled via advanceManager.getAdvancesForSettlement()
    // Cash advances are also handled via advanceManager.getAdvancesForSettlement()
    // Both are Priority 1 and applied BEFORE these deductions

    // PRIORITY 2: Recurring (Insurance, ELD, etc.)
    // CRITICAL FIX: Filter by driverId to prevent cross-driver deductions
    const recurringRules = await prisma.deductionRule.findMany({
      where: {
        companyId: driver.companyId,
        isActive: true,
        isAddition: false,
        deductionType: {
          in: ['INSURANCE', 'OCCUPATIONAL_ACCIDENT', 'FUEL_CARD_FEE'],
        },
        NOT: {
          deductionType: {
            in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'],
          },
        },
        OR: [
          // Company-wide rules (no driver type and no specific driver)
          { driverType: null, driverId: null },
          // Driver-type-specific rules (matching type, no specific driver)
          { driverType: driver.driverType, driverId: null },
          // Driver-specific rules (assigned to THIS driver only)
          { driverId },
        ],
      },
    });

    for (const rule of recurringRules) {
      // Safety Check: Prevent "Ghost" rules (rules meant for other drivers but saved with null driverId or wrongly assigned)
      // Check if rule name contains ANY driver number pattern that doesn't match this driver
      const driverNumberPattern = /DRV-[A-Z]{2}-[A-Z]+-\d+/g;
      const matchedDriverNumbers = rule.name.match(driverNumberPattern);

      if (matchedDriverNumbers && matchedDriverNumbers.length > 0) {
        // If rule contains a driver number that doesn't match this driver, skip it
        const containsThisDriver = matchedDriverNumbers.some(num => num === driver.driverNumber);
        if (!containsThisDriver) {
          console.warn(`[SettlementManager] Skipping contamination rule "${rule.name}" for driver ${driver.driverNumber}`);
          continue;
        }
      }

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
            (sum, load) => sum + ((load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0),
            0
          );
          deductionAmount = totalMiles * (rule.perMileRate || 0);
          break;
      }

      if (rule.maxAmount && deductionAmount > rule.maxAmount) {
        deductionAmount = rule.maxAmount;
      }

      // Stop Limit Logic
      if (typeof rule.goalAmount === 'number' && rule.goalAmount > 0) {
        const currentBalance = rule.currentAmount || 0;

        // If goal met, skip
        if (currentBalance >= rule.goalAmount) {
          continue;
        }

        // Cap amount
        if (currentBalance + deductionAmount > rule.goalAmount) {
          deductionAmount = rule.goalAmount - currentBalance;
        }
      }

      if (deductionAmount > 0) {
        deductions.push({
          type: rule.deductionType,
          description: rule.name,
          amount: deductionAmount,
          metadata: { deductionRuleId: rule.id },
        });
      }
    }

    // PRIORITY 3: Garnishments/Escrow
    // CRITICAL FIX: Filter by driverId to prevent cross-driver deductions
    const garnishmentRules = await prisma.deductionRule.findMany({
      where: {
        companyId: driver.companyId,
        isActive: true,
        isAddition: false,
        deductionType: {
          in: ['ESCROW', 'OTHER'],
        },
        NOT: {
          deductionType: {
            in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'],
          },
        },
        OR: [
          // Company-wide rules (no driver type and no specific driver)
          { driverType: null, driverId: null },
          // Driver-type-specific rules (matching type, no specific driver)
          { driverType: driver.driverType, driverId: null },
          // Driver-specific rules (assigned to THIS driver only)
          { driverId },
        ],
      },
    });

    for (const rule of garnishmentRules) {
      // Safety Check: Prevent "Ghost" rules - same as recurring rules
      const driverNumberPattern = /DRV-[A-Z]{2}-[A-Z]+-\d+/g;
      const matchedDriverNumbers = rule.name.match(driverNumberPattern);

      if (matchedDriverNumbers && matchedDriverNumbers.length > 0) {
        const containsThisDriver = matchedDriverNumbers.some(num => num === driver.driverNumber);
        if (!containsThisDriver) {
          console.warn(`[SettlementManager] Skipping contamination rule "${rule.name}" for driver ${driver.driverNumber}`);
          continue;
        }
      }

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
            (sum, load) => sum + ((load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0),
            0
          );
          deductionAmount = totalMiles * (rule.perMileRate || 0);
          break;
      }

      if (rule.maxAmount && deductionAmount > rule.maxAmount) {
        deductionAmount = rule.maxAmount;
      }

      // Stop Limit Logic
      if (typeof rule.goalAmount === 'number' && rule.goalAmount > 0) {
        const currentBalance = rule.currentAmount || 0;

        // If goal met, skip
        if (currentBalance >= rule.goalAmount) {
          continue;
        }

        // Cap amount
        if (currentBalance + deductionAmount > rule.goalAmount) {
          deductionAmount = rule.goalAmount - currentBalance;
        }
      }

      if (deductionAmount > 0) {
        deductions.push({
          type: rule.deductionType,
          description: rule.name,
          amount: deductionAmount,
          metadata: { deductionRuleId: rule.id },
        });
      }
    }

    return deductions;
  }

  /**
   * Get previous negative balance that hasn't been applied
   */
  private async getPreviousNegativeBalance(driverId: string): Promise<any | null> {
    return await (prisma as any).driverNegativeBalance.findFirst({
      where: {
        driverId,
        isApplied: false,
      },
      include: {
        originalSettlement: {
          select: {
            settlementNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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

    // UPDATE STOP LIMIT BALANCES
    // ------------------------------------------------------------------
    const deductionItems = await prisma.settlementDeduction.findMany({
      where: { settlementId },
    });

    for (const item of deductionItems) {
      const meta = item.metadata as Record<string, any> | null;
      if (meta?.deductionRuleId) {
        // Increment currentAmount on the rule
        await prisma.deductionRule.update({
          where: { id: meta.deductionRuleId },
          data: {
            currentAmount: { increment: item.amount },
          },
        });
      }
    }
    // ------------------------------------------------------------------

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
        // Note: negativeBalances relation may need Prisma client regeneration
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
