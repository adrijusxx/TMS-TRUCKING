import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get detailed settlement breakdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;

    // Get settlement with all details
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
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

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    // Fetch loads separately using loadIds
    const loads = settlement.loadIds.length > 0
      ? await prisma.load.findMany({
          where: {
            id: { in: settlement.loadIds },
          },
          include: {
            loadExpenses: {
              where: {
                approvalStatus: 'APPROVED',
              },
            },
            driverAdvances: {
              where: {
                approvalStatus: 'APPROVED',
              },
            },
            accessorialCharges: {
              where: {
                status: {
                  in: ['APPROVED', 'BILLED'],
                },
              },
            },
          },
        })
      : [];

    // Calculate breakdown by category
    const deductionsByType: Record<string, number> = {};
    settlement.deductionItems.forEach((deduction: any) => {
      const type = deduction.deductionType;
      deductionsByType[type] = (deductionsByType[type] || 0) + deduction.amount;
    });

    // Calculate total deductions
    const totalDeductions = settlement.deductionItems.reduce((sum: number, d: any) => sum + d.amount, 0);

    // Calculate load-level breakdown
    const loadBreakdown = loads.map((load: any) => {
      const expenses = (load.loadExpenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const advances = (load.driverAdvances || []).reduce((sum: number, adv: any) => sum + adv.amount, 0);
      const accessorials = (load.accessorialCharges || []).reduce((sum: number, charge: any) => sum + charge.amount, 0);

      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        revenue: load.revenue || 0,
        driverPay: load.driverPay || 0,
        fuelAdvance: load.fuelAdvance || 0,
        expenses,
        advances,
        accessorials,
        netPay: (load.driverPay || 0) - (load.fuelAdvance || 0) - expenses - advances,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        settlement: {
          id: settlement.id,
          settlementNumber: settlement.settlementNumber,
          periodStart: settlement.periodStart,
          periodEnd: settlement.periodEnd,
          status: settlement.status,
          approvalStatus: settlement.approvalStatus,
          grossPay: settlement.grossPay,
          totalDeductions,
          netPay: settlement.netPay,
          createdAt: settlement.createdAt,
          approvedAt: settlement.approvedAt,
          paidAt: settlement.paidDate,
        },
        driver: {
          id: settlement.driver.id,
          driverNumber: settlement.driver.driverNumber,
          name: `${settlement.driver.user?.firstName || ''} ${settlement.driver.user?.lastName || ''}`,
          email: settlement.driver.user?.email || '',
          driverType: settlement.driver.driverType,
        },
        loads: {
          count: loads.length,
          totalRevenue: loads.reduce((sum: number, l: any) => sum + (l.revenue || 0), 0),
          totalDriverPay: loads.reduce((sum: number, l: any) => sum + (l.driverPay || 0), 0),
          breakdown: loadBreakdown,
        },
        deductions: {
          total: totalDeductions,
          byType: deductionsByType,
          details: settlement.deductionItems.map((d: any) => ({
            id: d.id,
            type: d.deductionType,
            description: d.description,
            amount: d.amount,
            loadId: d.loadId,
          })),
        },
        approvalHistory: settlement.approvalHistory.map((approval: any) => ({
          id: approval.id,
          status: approval.status,
          notes: approval.notes,
          approver: approval.approvedBy
            ? `${approval.approvedBy.firstName} ${approval.approvedBy.lastName}`
            : null,
          createdAt: approval.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error getting settlement breakdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get settlement breakdown',
        },
      },
      { status: 500 }
    );
  }
}

