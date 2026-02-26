import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Build MC filter for invoices (Invoice uses mcNumber string)
    const mcWhereWithId = await buildMcNumberWhereClause(session, request);
    const mcWhere = await convertMcNumberIdToMcNumberString(mcWhereWithId);

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const invoiceWhere: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      status: { in: ['SENT', 'PARTIAL'] },
      ...(mcWhere.mcNumber && { mcNumber: mcWhere.mcNumber }),
    };

    if (fromDate || toDate) {
      invoiceWhere.invoiceDate = {};
      if (fromDate) invoiceWhere.invoiceDate.gte = new Date(fromDate);
      if (toDate) invoiceWhere.invoiceDate.lte = new Date(toDate);
    }

    // Detail view — flat table of individual invoices
    if (view === 'detail') {
      const invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          id: true, invoiceNumber: true, invoiceDate: true, dueDate: true,
          total: true, amountPaid: true, balance: true,
          status: true, subStatus: true, reconciliationStatus: true,
          mcNumber: true, invoiceNote: true, paymentNote: true,
          loadId: true,
          customer: { select: { id: true, name: true } },
          load: { select: { loadNumber: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rows = invoices.map((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const agingDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          ...inv,
          invoiceDate: inv.invoiceDate.toISOString(),
          dueDate: inv.dueDate.toISOString(),
          agingDays,
          isOverdue: agingDays > 0,
        };
      });

      const totals = rows.reduce((acc, r) => ({
        total: acc.total + r.total,
        amountPaid: acc.amountPaid + r.amountPaid,
        balance: acc.balance + r.balance,
      }), { total: 0, amountPaid: 0, balance: 0 });

      return NextResponse.json({
        success: true,
        data: { invoices: rows, totals, count: rows.length },
      });
    }

    // Get all unpaid invoices with proper filtering
    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        invoiceNumber: true,
        customerId: true,
        invoiceDate: true,
        dueDate: true,
        total: true,
        amountPaid: true,
        balance: true,
        status: true,
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Categorize by aging buckets
    const agingBuckets = {
      current: { invoices: [] as any[], total: 0 },
      '1-30': { invoices: [] as any[], total: 0 },
      '31-60': { invoices: [] as any[], total: 0 },
      '61-90': { invoices: [] as any[], total: 0 },
      '90+': { invoices: [] as any[], total: 0 },
    };

    invoices.forEach((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const invoiceData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        invoiceDate: invoice.invoiceDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
        daysPastDue,
      };

      if (daysPastDue <= 0) {
        agingBuckets.current.invoices.push(invoiceData);
        agingBuckets.current.total += invoice.balance;
      } else if (daysPastDue <= 30) {
        agingBuckets['1-30'].invoices.push(invoiceData);
        agingBuckets['1-30'].total += invoice.balance;
      } else if (daysPastDue <= 60) {
        agingBuckets['31-60'].invoices.push(invoiceData);
        agingBuckets['31-60'].total += invoice.balance;
      } else if (daysPastDue <= 90) {
        agingBuckets['61-90'].invoices.push(invoiceData);
        agingBuckets['61-90'].total += invoice.balance;
      } else {
        agingBuckets['90+'].invoices.push(invoiceData);
        agingBuckets['90+'].total += invoice.balance;
      }
    });

    const totalOutstanding = Object.values(agingBuckets).reduce(
      (sum, bucket) => sum + bucket.total,
      0
    );

    // Summary by customer
    const customerSummary: Record<string, any> = {};
    invoices.forEach((invoice) => {
      const customerId = invoice.customerId;
      if (!customerSummary[customerId]) {
        customerSummary[customerId] = {
          customerId,
          customerName: invoice.customer.name,
          customerNumber: invoice.customer.customerNumber,
          customerEmail: (invoice.customer as any).email ?? null,
          totalOutstanding: 0,
          invoiceCount: 0,
          oldestInvoice: invoice.dueDate,
        };
      }
      customerSummary[customerId].totalOutstanding += invoice.balance;
      customerSummary[customerId].invoiceCount += 1;
      if (new Date(invoice.dueDate) < new Date(customerSummary[customerId].oldestInvoice)) {
        customerSummary[customerId].oldestInvoice = invoice.dueDate;
      }
    });

    const customerSummaryArray = Object.values(customerSummary)
      .map((customer: any) => {
        const oldestDate = new Date(customer.oldestInvoice);
        const daysPastDue = Math.floor((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...customer,
          totalOutstanding: parseFloat(customer.totalOutstanding.toFixed(2)),
          oldestInvoice: customer.oldestInvoice.toISOString(),
          daysPastDue: Math.max(0, daysPastDue),
        };
      })
      .sort((a: any, b: any) => b.totalOutstanding - a.totalOutstanding);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
          totalInvoices: invoices.length,
          current: parseFloat(agingBuckets.current.total.toFixed(2)),
          '1-30': parseFloat(agingBuckets['1-30'].total.toFixed(2)),
          '31-60': parseFloat(agingBuckets['31-60'].total.toFixed(2)),
          '61-90': parseFloat(agingBuckets['61-90'].total.toFixed(2)),
          '90+': parseFloat(agingBuckets['90+'].total.toFixed(2)),
        },
        agingBuckets: {
          current: {
            ...agingBuckets.current,
            total: parseFloat(agingBuckets.current.total.toFixed(2)),
            invoices: agingBuckets.current.invoices.map((inv) => ({
              ...inv,
              total: parseFloat(inv.total.toFixed(2)),
              amountPaid: parseFloat(inv.amountPaid.toFixed(2)),
              balance: parseFloat(inv.balance.toFixed(2)),
            })),
          },
          '1-30': {
            ...agingBuckets['1-30'],
            total: parseFloat(agingBuckets['1-30'].total.toFixed(2)),
            invoices: agingBuckets['1-30'].invoices.map((inv) => ({
              ...inv,
              total: parseFloat(inv.total.toFixed(2)),
              amountPaid: parseFloat(inv.amountPaid.toFixed(2)),
              balance: parseFloat(inv.balance.toFixed(2)),
            })),
          },
          '31-60': {
            ...agingBuckets['31-60'],
            total: parseFloat(agingBuckets['31-60'].total.toFixed(2)),
            invoices: agingBuckets['31-60'].invoices.map((inv) => ({
              ...inv,
              total: parseFloat(inv.total.toFixed(2)),
              amountPaid: parseFloat(inv.amountPaid.toFixed(2)),
              balance: parseFloat(inv.balance.toFixed(2)),
            })),
          },
          '61-90': {
            ...agingBuckets['61-90'],
            total: parseFloat(agingBuckets['61-90'].total.toFixed(2)),
            invoices: agingBuckets['61-90'].invoices.map((inv) => ({
              ...inv,
              total: parseFloat(inv.total.toFixed(2)),
              amountPaid: parseFloat(inv.amountPaid.toFixed(2)),
              balance: parseFloat(inv.balance.toFixed(2)),
            })),
          },
          '90+': {
            ...agingBuckets['90+'],
            total: parseFloat(agingBuckets['90+'].total.toFixed(2)),
            invoices: agingBuckets['90+'].invoices.map((inv) => ({
              ...inv,
              total: parseFloat(inv.total.toFixed(2)),
              amountPaid: parseFloat(inv.amountPaid.toFixed(2)),
              balance: parseFloat(inv.balance.toFixed(2)),
            })),
          },
        },
        byCustomer: customerSummaryArray,
      },
    });
  } catch (error) {
    console.error('Aging report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

