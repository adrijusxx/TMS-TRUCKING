import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { PayType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check role: Only ADMIN or ACCOUNTANT can update pay rates
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (role !== 'ADMIN' && role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and accountants can update driver pay rates',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { payRate, payType, driverIds } = body;

    if (!payRate || typeof payRate !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Pay rate is required and must be a number',
          },
        },
        { status: 400 }
      );
    }

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    // If specific driver IDs are provided, only update those
    if (driverIds && Array.isArray(driverIds) && driverIds.length > 0) {
      where.id = { in: driverIds };
    }

    const updateData: any = {
      payRate,
    };

    if (payType && Object.values(PayType).includes(payType)) {
      updateData.payType = payType;
    }

    // Calculate and update driver tariff
    const { calculateDriverTariff } = await import('@/lib/utils/driverTariff');
    const tariff = calculateDriverTariff({
      payType: (payType as PayType) || PayType.PER_MILE,
      payRate,
      loads: [], // Base tariff, not from loads
    });
    updateData.driverTariff = tariff;

    // Update all matching drivers
    const result = await prisma.driver.updateMany({
      where,
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} driver(s)`,
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk update pay error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

