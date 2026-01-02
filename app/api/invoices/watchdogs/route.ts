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
    // const mcWhere = await convertMcNumberIdToMcNumberString(mcWhereWithId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Overdue Invoices (past due date with balance > 0)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: today },
        balance: { gt: 0 },
        ...(mcWhereWithId),
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

    // 4. Missing Documents (Delivered but NO POD)
    const missingDocumentsLoads = await prisma.load.findMany({
      where: {
        deletedAt: null,
        status: 'DELIVERED',
        podUploadedAt: null, // Critical check
        ...(mcWhereWithId),
      },
      select: {
        id: true,
        loadNumber: true,
        deliveredAt: true,
        customer: { select: { name: true } },
        driver: {
          select: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        dispatcher: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // 5. Ready to Bill (Ready but NOT Invoiced)
    const readyToBillLoads = await prisma.load.findMany({
      where: {
        deletedAt: null,
        status: 'DELIVERED', // Must be delivered
        // readyForSettlement: true, // Optional: if you trust this flag
        podUploadedAt: { not: null }, // Must have POD
        invoicedAt: null, // NOT invoiced yet
        ...(mcWhereWithId),
      },
      select: {
        id: true,
        loadNumber: true,
        deliveredAt: true,
        revenue: true,
        customer: { select: { name: true } },
      },
      orderBy: { deliveredAt: 'asc' }, // Oldest first
    });

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
        missingDocuments: {
          count: missingDocumentsLoads.length,
          loads: missingDocumentsLoads.map(l => ({
            ...l,
            deliveredAt: l.deliveredAt?.toISOString(),
            driverName: l.driver?.user ? `${l.driver.user.firstName} ${l.driver.user.lastName}` : 'Unassigned',
            dispatcherEmail: l.dispatcher?.email,
            dispatcherName: l.dispatcher ? `${l.dispatcher.firstName} ${l.dispatcher.lastName}` : 'Unassigned',
          })),
        },
        readyToBill: {
          count: readyToBillLoads.length,
          totalAmount: readyToBillLoads.reduce((sum, l) => sum + (l.revenue || 0), 0),
          loads: readyToBillLoads.map(l => ({
            ...l,
            deliveredAt: l.deliveredAt?.toISOString(),
          })),
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

