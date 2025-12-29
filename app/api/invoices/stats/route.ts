import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get invoice statistics
 */
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

    // Get all customers for this company
    const customers = await prisma.customer.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    const customerIds = customers.map((c) => c.id);

    // Build where clause from filters
    const where: any = {
      customerId: { in: customerIds },
    };

    // Apply filters
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      where.status = status;
    }

    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get stats
    const [totalInvoices, paidInvoices, draftInvoices, totalAmount] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({
        where: {
          ...where,
          status: 'PAID',
        },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: 'DRAFT',
        },
      }),
      prisma.invoice.aggregate({
        where,
        _sum: {
          total: true,
        },
      }),
    ]);

    const amount = totalAmount._sum.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        draftInvoices,
        totalAmount: amount,
      },
    });
  } catch (error) {
    console.error('Invoice stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

