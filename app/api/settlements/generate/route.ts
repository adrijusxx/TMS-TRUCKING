import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notifySettlementGenerated } from '@/lib/notifications/triggers';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const generateSettlementSchema = z.object({
  driverId: z.string().cuid(),
  loadIds: z.array(z.string().cuid()).min(1, 'At least one load is required'),
  settlementNumber: z.string().optional(),
  deductions: z.number().min(0).default(0),
  advances: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Deduction item structure for creating SettlementDeduction records
interface DeductionItem {
  deductionType: string;
  description: string;
  amount: number;
  source: 'rule' | 'escrow' | 'manual';
  ruleId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = generateSettlementSchema.parse(body);

    // Verify driver belongs to company (with driverType for deduction rules)
    const driver = await prisma.driver.findFirst({
      where: {
        id: validated.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        driverNumber: true,
        driverType: true,
        payType: true,
        payRate: true,

        escrowBalance: true,
        escrowTargetAmount: true,
        escrowDeductionPerWeek: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    // Fetch loads
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        driverId: validated.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (loads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No valid loads found for settlement',
          },
        },
        { status: 404 }
      );
    }

    // ============================================
    // STEP 1: FETCH DEDUCTION RULES FOR DRIVER
    // ============================================
    // Note: startDate and endDate columns don't exist in database, so we skip date range filtering
    const deductionRules = await prisma.deductionRule.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        OR: [
          { driverType: null }, // Company-wide rules for all driver types
          { driverType: driver.driverType }, // Rules for this driver's type
        ],
      },
      select: {
        id: true,
        name: true,
        deductionType: true,
        calculationType: true,
        amount: true,
        percentage: true,
        perMileRate: true,
        frequency: true,
        minGrossPay: true,
        maxAmount: true,
        driverType: true,
        notes: true,
        isAddition: true, // CRITICAL: Needed to distinguish additions from deductions
      },
    });

    console.log(`[Settlement Generate] Found ${deductionRules.length} applicable deduction rules for driver ${driver.driverNumber}`);

    // ============================================
    // STEP 2: CALCULATE GROSS PAY FROM LOADS
    // ============================================
    let grossPay = 0;
    let totalMiles = 0;
    const loadBreakdown: Array<{ loadNumber: string; loadId: string; driverPay: number; source: string }> = [];

    for (const load of loads) {
      let loadDriverPay = 0;
      let paySource = 'calculated';

      // Check if load has stored driverPay
      let shouldUseStored = load.driverPay && load.driverPay > 0;

      // Heuristic: If stored pay equals revenue exactly, and driver is PER_MILE or HOURLY, 
      // it's likely an import default, so we should recalculate.
      if (shouldUseStored && load.driverPay === load.revenue && ['PER_MILE', 'HOURLY'].includes(driver.payType || '')) {
        console.log(`[Settlement Generate] Ignoring stored pay ($${load.driverPay}) because it matches revenue and driver is ${driver.payType}`);
        shouldUseStored = false;
      }

      if (shouldUseStored) {
        loadDriverPay = load.driverPay!;
        paySource = 'stored';
      } else if (driver.payType && driver.payRate !== null) {
        // Calculate from current driver pay rate
        if (driver.payType === 'PER_MILE') {
          const miles = load.totalMiles || load.loadedMiles || (load.emptyMiles || 0);
          if (miles > 0) {
            loadDriverPay = miles * driver.payRate;
          }
        } else if (driver.payType === 'PER_LOAD') {
          loadDriverPay = driver.payRate;
        } else if (driver.payType === 'PERCENTAGE') {
          loadDriverPay = (load.revenue || 0) * (driver.payRate / 100);
        } else if (driver.payType === 'HOURLY') {
          const miles = load.totalMiles || load.loadedMiles || (load.emptyMiles || 0);
          const estimatedHours = miles > 0 ? miles / 50 : 10;
          loadDriverPay = estimatedHours * driver.payRate;
        }
      }

      grossPay += loadDriverPay;
      loadBreakdown.push({
        loadNumber: load.loadNumber,
        loadId: load.id,
        driverPay: loadDriverPay,
        source: paySource,
      });

      // Track total miles for all loads
      const loadMiles = load.totalMiles || load.loadedMiles || (load.emptyMiles || 0);
      if (loadMiles > 0) {
        totalMiles += loadMiles;
      }
    }

    // ============================================
    // STEP 3: PER DIEM (REMOVED - use recurring transactions instead)
    // ============================================
    let perDiemAmount = 0;
    // Note: perDiem field has been removed from Driver model
    // Use recurring transactions with type REIMBURSEMENT for per diem payments

    console.log('[Settlement Generate] Load breakdown:', loadBreakdown);
    console.log('[Settlement Generate] Total gross pay (with per diem):', grossPay);

    // ============================================
    // STEP 4: CALCULATE AUTO-APPLIED DEDUCTIONS AND ADDITIONS
    // ============================================
    const autoAppliedDeductions: DeductionItem[] = [];
    let autoDeductionsTotal = 0;
    let autoAdditionsTotal = 0; // Track additions separately

    // Check for already applied deductions this week/month (for frequency checks)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get recent settlements for this driver to check if deductions were already applied
    const recentSettlements = await prisma.settlement.findMany({
      where: {
        driverId: driver.id,
        createdAt: { gte: startOfMonth }, // Get settlements from start of month
      },
      select: {
        id: true,
        settlementNumber: true,
        createdAt: true,
        deductionItems: {
          select: {
            deductionType: true,
            description: true,
          },
        },
      },
    });

    // Helper to check if a deduction was already applied this period
    const wasDeductionApplied = (ruleName: string, frequency: string | null): boolean => {
      if (!frequency) return false;

      const periodStart = frequency === 'WEEKLY' ? startOfWeek : startOfMonth;
      const settlementsInPeriod = recentSettlements.filter(s => s.createdAt >= periodStart);

      for (const settlement of settlementsInPeriod) {
        const found = settlement.deductionItems.some(d => d.description === ruleName);
        if (found) {
          console.log(`[Settlement Generate] Deduction "${ruleName}" found in existing settlement ${settlement.settlementNumber} (${settlement.id}) from ${settlement.createdAt.toISOString()}`);
          return true;
        }
      }
      return false;
    };

    for (const rule of deductionRules) {
      // Check frequency - skip if already applied this period
      if (rule.frequency) {
        if (wasDeductionApplied(rule.name, rule.frequency)) {
          console.log(`[Settlement Generate] Skipping deduction "${rule.name}" - already applied this ${rule.frequency.toLowerCase()}`);
          continue;
        }
      }

      // Check minimum gross pay requirement
      if (rule.minGrossPay && grossPay < rule.minGrossPay) {
        console.log(`[Settlement Generate] Skipping deduction "${rule.name}" - gross pay $${grossPay} below minimum $${rule.minGrossPay}`);
        continue;
      }

      // Calculate deduction amount based on calculation type
      let deductionAmount = 0;

      if (rule.calculationType === 'FIXED' && rule.amount) {
        deductionAmount = rule.amount;
      } else if (rule.calculationType === 'PERCENTAGE' && rule.percentage) {
        deductionAmount = grossPay * (rule.percentage / 100);
      } else if (rule.calculationType === 'PER_MILE' && rule.perMileRate) {
        deductionAmount = totalMiles * rule.perMileRate;
      }

      // Apply max amount cap if set
      if (rule.maxAmount && deductionAmount > rule.maxAmount) {
        deductionAmount = rule.maxAmount;
      }

      if (deductionAmount > 0) {
        // Check if this is an addition or deduction
        const isAddition = rule.isAddition === true;

        // If it's an addition, we must ensure the type is one of the allowed addition types
        // otherwise it will be categorized as a deduction in the UI/API.
        // We default to 'REIMBURSEMENT' for rule-based additions that use deduction types like 'INSURANCE'.
        let finalType = rule.deductionType;
        if (isAddition && !['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'].includes(finalType)) {
          finalType = 'REIMBURSEMENT';
        }

        autoAppliedDeductions.push({
          deductionType: finalType,
          description: rule.name, // Keep original name e.g. "Insurance"
          amount: deductionAmount, // Additions should be positive in the DB (TotalAdditions is summed)
          source: 'rule',
          ruleId: rule.id,
        });

        if (isAddition) {
          autoAdditionsTotal += deductionAmount;
          console.log(`[Settlement Generate] Applied addition "${rule.name}" as ${finalType}: +$${deductionAmount.toFixed(2)}`);
        } else {
          autoDeductionsTotal += deductionAmount;
          console.log(`[Settlement Generate] Applied deduction "${rule.name}": -$${deductionAmount.toFixed(2)}`);
        }
      }
    }

    // ============================================
    // STEP 5: APPLY ESCROW DEDUCTION
    // ============================================
    let escrowDeduction = 0;
    if (
      driver.escrowTargetAmount &&
      driver.escrowDeductionPerWeek &&
      (driver.escrowBalance || 0) < driver.escrowTargetAmount
    ) {
      // Apply escrow deduction (limited by remaining target)
      const remainingToTarget = driver.escrowTargetAmount - (driver.escrowBalance || 0);
      escrowDeduction = Math.min(driver.escrowDeductionPerWeek, remainingToTarget);

      if (escrowDeduction > 0) {
        autoAppliedDeductions.push({
          deductionType: 'ESCROW',
          description: 'Escrow Deduction',
          amount: escrowDeduction,
          source: 'escrow',
        });
        autoDeductionsTotal += escrowDeduction;
        console.log(`[Settlement Generate] Applied escrow deduction: $${escrowDeduction.toFixed(2)}`);
      }
    }

    // ============================================
    // STEP 6: CALCULATE TOTAL DEDUCTIONS AND NET PAY
    // ============================================
    const totalDeductions = validated.deductions + autoDeductionsTotal;
    const netPay = grossPay + autoAdditionsTotal - totalDeductions - validated.advances;

    console.log(`[Settlement Generate] Gross Pay: $${grossPay.toFixed(2)}`);
    console.log(`[Settlement Generate] Auto Additions: +$${autoAdditionsTotal.toFixed(2)}`);
    console.log(`[Settlement Generate] Auto Deductions: -$${autoDeductionsTotal.toFixed(2)}`);
    console.log(`[Settlement Generate] Manual Deductions: -$${validated.deductions.toFixed(2)}`);
    console.log(`[Settlement Generate] Advances: -$${validated.advances.toFixed(2)}`);
    console.log(`[Settlement Generate] Net Pay: $${netPay.toFixed(2)}`);

    // Warn if gross pay is 0
    if (grossPay === 0) {
      console.warn('[Settlement Generate] Warning: Gross pay is $0. Driver may be missing payType/payRate or loads have no revenue/miles.');
    }

    // Generate settlement number
    const settlementNumber =
      validated.settlementNumber ||
      `SET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Calculate period dates from loads
    const loadDates = loads
      .map((l) => l.deliveryDate || l.pickupDate)
      .filter((d): d is Date => d !== null && d instanceof Date);
    const periodStart = loadDates.length > 0
      ? new Date(Math.min(...loadDates.map((d) => d.getTime())))
      : new Date();
    const periodEnd = loadDates.length > 0
      ? new Date(Math.max(...loadDates.map((d) => d.getTime())))
      : new Date();

    // ============================================
    // STEP 7: CREATE SETTLEMENT WITH DEDUCTION ITEMS
    // ============================================
    const deductionItemsData: Prisma.SettlementDeductionCreateManySettlementInput[] = autoAppliedDeductions.map(d => ({
      deductionType: d.deductionType as any,
      description: d.description,
      amount: d.amount,
    }));

    // Add manual deduction if provided
    if (validated.deductions > 0) {
      deductionItemsData.push({
        deductionType: 'OTHER',
        description: 'Manual Deduction',
        amount: validated.deductions,
      });
    }

    const settlement = await prisma.settlement.create({
      data: {
        driverId: validated.driverId,
        settlementNumber,
        loadIds: validated.loadIds,
        grossPay,
        deductions: totalDeductions,
        advances: validated.advances,
        netPay,
        notes: validated.notes,
        status: 'PENDING',
        periodStart,
        periodEnd,
        // Create deduction items
        deductionItems: deductionItemsData.length > 0 ? {
          createMany: {
            data: deductionItemsData,
          },
        } : undefined,
      },
      include: {
        deductionItems: true,
      },
    });

    // ============================================
    // STEP 8: UPDATE DRIVER ESCROW BALANCE
    // ============================================
    if (escrowDeduction > 0) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          escrowBalance: {
            increment: escrowDeduction,
          },
        },
      });
      console.log(`[Settlement Generate] Updated driver escrow balance by +$${escrowDeduction.toFixed(2)}`);
    }

    // Send notification
    await notifySettlementGenerated(settlement.id);

    console.log(`[Settlement Generate] Settlement ${settlementNumber} created successfully`);

    return NextResponse.json(
      {
        success: true,
        data: settlement,
        message: 'Settlement generated successfully',
        meta: {
          loadBreakdown,
          payCalculation: {
            method: driver.payType || 'NONE',
            rate: driver.payRate || 0,
            totalMiles,
            perDiemAmount,
            grossPay,
            autoDeductionsTotal,
            manualDeductions: validated.deductions,
            totalDeductions,
            advances: validated.advances,
            netPay,
          },
          autoAppliedDeductions: autoAppliedDeductions.map(d => ({
            type: d.deductionType,
            description: d.description,
            amount: d.amount,
            source: d.source,
          })),
          escrowInfo: {
            escrowDeduction,
            previousBalance: driver.escrowBalance || 0,
            newBalance: (driver.escrowBalance || 0) + escrowDeduction,
            targetAmount: driver.escrowTargetAmount || 0,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Settlement generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

