import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    const invoiceId = searchParams.get('invoiceId');
    const paymentId = searchParams.get('paymentId');

    const where: any = {
      invoice: {
        customer: {
          companyId: session.user.companyId,
        },
      },
    };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (paymentId) {
      where.paymentId = paymentId;
    }

    const [reconciliations, total] = await Promise.all([
      prisma.reconciliation.findMany({
        where,
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  customerNumber: true,
                },
              },
            },
          },
          payment: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          reconciledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { reconciledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reconciliation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reconciliations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Reconciliation list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

