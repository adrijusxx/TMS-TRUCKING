import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadCostingManager } from '@/lib/managers/LoadCostingManager';

/**
 * Get accounting sync status and financial details for a load
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
    const loadId = resolvedParams.id;

    // Fetch load with accounting details
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        loadExpenses: {
          where: {
            approvalStatus: {
              in: ['APPROVED', 'PENDING'],
            },
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
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Get cost breakdown if load is completed
    let costBreakdown = null;
    if (load.status === 'DELIVERED' || load.status === 'INVOICED' || load.status === 'PAID') {
      try {
        const costingManager = new LoadCostingManager();
        costBreakdown = await costingManager.getCostBreakdown(loadId);
      } catch (error) {
        console.error('Error getting cost breakdown:', error);
      }
    }

    // Calculate pending items
    const pendingExpenses = load.loadExpenses.filter(
      (exp) => exp.approvalStatus === 'PENDING'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        loadId,
        loadNumber: load.loadNumber,
        status: load.status,
        accountingSyncStatus: load.accountingSyncStatus,
        accountingSyncedAt: load.accountingSyncedAt,
        podUploadedAt: load.podUploadedAt,
        readyForSettlement: load.readyForSettlement,
        financial: {
          revenue: load.revenue,
          driverPay: load.driverPay,
          totalExpenses: load.totalExpenses,
          netProfit: load.netProfit,
          fuelAdvance: load.fuelAdvance,
        },
        breakdown: costBreakdown,
        pendingItems: {
          expenses: pendingExpenses,
        },
        expenses: load.loadExpenses.map((exp) => ({
          id: exp.id,
          type: exp.expenseType,
          amount: exp.amount,
          approvalStatus: exp.approvalStatus,
          date: exp.date,
        })),
        advances: load.driverAdvances.map((adv) => ({
          id: adv.id,
          amount: adv.amount,
          requestDate: adv.requestDate,
          paidAt: adv.paidAt,
        })),
        accessorialCharges: load.accessorialCharges.map((charge) => ({
          id: charge.id,
          type: charge.chargeType,
          amount: charge.amount,
          status: charge.status,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error getting accounting status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get accounting status',
        },
      },
      { status: 500 }
    );
  }
}





