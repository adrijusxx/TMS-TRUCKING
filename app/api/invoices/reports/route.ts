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
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build date filter
    const dateFilter: any = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }

    // Get all invoices for the company within date range
    const invoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: session.user.companyId,
        },
        ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
        payments: true,
      },
      orderBy: {
        customer: {
          name: 'asc',
        },
      },
    });

    // Group by customer and calculate totals
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      customerNumber: string;
      beginningBalance: number;
      accrual: number;
      paid: number;
      endingBalance: number;
    }>();

    // Initialize beginning balances (would need historical data - for now set to 0)
    invoices.forEach((invoice) => {
      const customerId = invoice.customerId;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: invoice.customer.name,
          customerNumber: invoice.customer.customerNumber || '',
          beginningBalance: 0, // Would need to calculate from previous period
          accrual: 0,
          paid: 0,
          endingBalance: 0,
        });
      }

      const customer = customerMap.get(customerId)!;
      customer.accrual += invoice.total;
      customer.paid += invoice.amountPaid || 0;
    });

    // Calculate ending balances
    customerMap.forEach((customer) => {
      customer.endingBalance = customer.beginningBalance + customer.accrual - customer.paid;
    });

    const customerSummaries = Array.from(customerMap.values())
      .sort((a, b) => a.customerName.localeCompare(b.customerName));

    // Calculate totals
    const totals = customerSummaries.reduce(
      (acc, customer) => ({
        beginningBalance: acc.beginningBalance + customer.beginningBalance,
        accrual: acc.accrual + customer.accrual,
        paid: acc.paid + customer.paid,
        endingBalance: acc.endingBalance + customer.endingBalance,
      }),
      {
        beginningBalance: 0,
        accrual: 0,
        paid: 0,
        endingBalance: 0,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        customers: customerSummaries,
        totals,
        period: {
          fromDate: fromDate || null,
          toDate: toDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Invoice reports error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

