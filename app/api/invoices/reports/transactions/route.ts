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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const skip = (page - 1) * limit;
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

    // Get all invoices and payments
    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          customer: {
            companyId: session.user.companyId,
          },
          ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          total: true,
          amountPaid: true,
          balance: true,
          status: true,
          customer: {
            select: {
              id: true,
              name: true,
              customerNumber: true,
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.payment.findMany({
        where: {
          invoice: {
            customer: {
              companyId: session.user.companyId,
            },
          },
          ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
        },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          referenceNumber: true,
          notes: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  customerNumber: true,
                },
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    // Combine and sort transactions
    const transactions = [
      ...invoices.map((inv) => ({
        type: 'INVOICE' as const,
        id: inv.id,
        number: inv.invoiceNumber,
        customerId: inv.customer.id,
        customerName: inv.customer.name,
        customerNumber: inv.customer.customerNumber || '',
        date: inv.invoiceDate,
        amount: inv.total,
        description: `Invoice ${inv.invoiceNumber}`,
      })),
      ...payments.filter((pay) => pay.invoice !== null).map((pay) => ({
        type: 'PAYMENT' as const,
        id: pay.id,
        number: pay.paymentNumber,
        customerId: pay.invoice!.customer.id,
        customerName: pay.invoice!.customer.name,
        customerNumber: pay.invoice!.customer.customerNumber || '',
        date: pay.paymentDate,
        amount: -pay.amount, // Negative for payments
        description: `Payment ${pay.paymentNumber} for ${pay.invoice!.invoiceNumber}`,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const paginatedTransactions = transactions.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      meta: {
        total: transactions.length,
        page,
        limit,
        totalPages: Math.ceil(transactions.length / limit),
      },
    });
  } catch (error) {
    console.error('Transactions report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

