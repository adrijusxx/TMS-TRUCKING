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

    // Build MC filter for invoices
    const mcWhereWithId = await buildMcNumberWhereClause(session, request);
    const mcWhere = await convertMcNumberIdToMcNumberString(mcWhereWithId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Overdue Invoices (past due date with balance > 0)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: today },
        balance: { gt: 0 },
        ...(mcWhere.mcNumber && { mcNumber: mcWhere.mcNumber }),
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        balance: true,
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate days past due for each invoice
    const overdueInvoicesWithDays = overdueInvoices.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...invoice,
        daysPastDue,
        dueDate: invoice.dueDate.toISOString(),
      };
    });

    // 2. Unreconciled Payments (payments without reconciliation)
    const allPayments = await prisma.payment.findMany({
      where: {
        invoice: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        paymentDate: true,
        invoiceId: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balance: true,
          },
        },
      },
    });

    const reconciliations = await prisma.reconciliation.findMany({
      where: {
        paymentId: { in: allPayments.map((p) => p.id).filter((id): id is string => !!id) },
      },
      select: {
        paymentId: true,
      },
    });

    const reconciledPaymentIds = new Set(reconciliations.map((r) => r.paymentId).filter((id): id is string => !!id));
    const unreconciledPayments = allPayments
      .filter((p) => p.invoiceId && !reconciledPaymentIds.has(p.id))
      .map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amount: p.amount,
        paymentDate: p.paymentDate.toISOString(),
        invoice: p.invoice,
      }));

    // 3. Unposted Batches (batches with UNPOSTED status)
    const unpostedBatches = await prisma.invoiceBatch.findMany({
      where: {
        companyId: session.user.companyId,
        postStatus: 'UNPOSTED',
      },
      select: {
        id: true,
        batchNumber: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            invoice: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const batchesWithCounts = unpostedBatches.map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      totalAmount: batch.totalAmount,
      invoiceCount: batch.items.length,
      createdAt: batch.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        overdueInvoices: {
          count: overdueInvoicesWithDays.length,
          totalAmount: overdueInvoicesWithDays.reduce((sum, inv) => sum + (inv.balance || 0), 0),
          invoices: overdueInvoicesWithDays,
        },
        unreconciledPayments: {
          count: unreconciledPayments.length,
          totalAmount: unreconciledPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          payments: unreconciledPayments,
        },
        unpostedBatches: {
          count: batchesWithCounts.length,
          totalAmount: batchesWithCounts.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
          batches: batchesWithCounts,
        },
      },
    });
  } catch (error) {
    console.error('Watchdogs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

