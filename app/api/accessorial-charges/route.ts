import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AccessorialChargeType, AccessorialChargeStatus } from '@prisma/client';
import { BillingHoldManager } from '@/lib/managers/BillingHoldManager';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const chargeType = searchParams.get('chargeType');
    const loadId = searchParams.get('loadId');
    const invoiceId = searchParams.get('invoiceId');
    const search = searchParams.get('search');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (chargeType) {
      where.chargeType = chargeType;
    }

    if (loadId) {
      where.loadId = loadId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { load: { loadNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [charges, total] = await Promise.all([
      prisma.accessorialCharge.findMany({
        where,
        include: {
          load: {
            select: {
              id: true,
              loadNumber: true,
              customer: {
                select: {
                  name: true,
                  customerNumber: true,
                },
              },
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accessorialCharge.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: charges,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Accessorial charges list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
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
    const {
      loadId,
      chargeType,
      description,
      amount,
      detentionHours,
      detentionRate,
      layoverDays,
      layoverRate,
      tonuReason,
      notes,
    } = body;

    // Validate required fields
    if (!loadId || !chargeType || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Load ID, charge type, and amount are required',
          },
        },
        { status: 400 }
      );
    }

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
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

    // Calculate amount for detention charges
    let finalAmount = amount;
    if (chargeType === 'DETENTION' && detentionHours && detentionRate) {
      finalAmount = detentionHours * detentionRate;
    } else if (chargeType === 'LAYOVER' && layoverDays && layoverRate) {
      finalAmount = layoverDays * layoverRate;
    }

    // Create accessorial charge
    const charge = await prisma.accessorialCharge.create({
      data: {
        companyId: session.user.companyId,
        loadId,
        chargeType,
        description: description || `${chargeType} charge`,
        amount: finalAmount,
        detentionHours,
        detentionRate,
        layoverDays,
        layoverRate,
        tonuReason,
        notes,
        status: AccessorialChargeStatus.PENDING,
      },
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            status: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 🔥 CRITICAL: Apply billing hold if charge type requires Rate Con update
    const billingHoldManager = new BillingHoldManager();
    let billingHoldResult = null;

    if (billingHoldManager.requiresBillingHold(chargeType)) {
      // Only apply hold if load is delivered (or ready to bill if that status exists)
      if (charge.load.status === 'DELIVERED') {
        const holdReason = `${chargeType} charge ($${finalAmount.toFixed(2)}) added - Rate Con update required`;
        billingHoldResult = await billingHoldManager.applyBillingHold(loadId, holdReason, charge.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: charge,
      billingHold: billingHoldResult,
    });
  } catch (error) {
    console.error('Create accessorial charge error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

