import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyInvoicePaid } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';
import {
  INVOICE_DETAIL_SELECT,
  InvoiceUpdateManager,
} from '@/lib/managers/InvoiceUpdateManager';

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

    const invoice = await prisma.invoice.findFirst({
      where: { id: resolvedParams.id, customer: { companyId: session.user.companyId } },
      select: INVOICE_DETAIL_SELECT,
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    const loads = await InvoiceUpdateManager.fetchInvoiceLoads(
      invoice.loadIds, session.user.companyId
    );

    return NextResponse.json({ success: true, data: { ...invoice, loads } });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: { customer: { select: { id: true, companyId: true, name: true } } },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    if (!existingInvoice.customer) {
      console.error('Invoice missing customer:', { invoiceId: resolvedParams.id });
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RECORD', message: 'Invoice is missing customer information.' } },
        { status: 400 }
      );
    }

    if (existingInvoice.customer.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Invoice does not belong to your company' } },
        { status: 403 }
      );
    }

    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to edit invoices' } },
        { status: 403 }
      );
    }

    const updateData = InvoiceUpdateManager.buildUpdateData(body, existingInvoice);
    const wasPaid = existingInvoice.status !== 'PAID' && body.status === 'PAID';

    const invoice = await prisma.invoice.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, customerNumber: true } },
        factoringCompany: { select: { id: true, name: true } },
      },
    });

    if (wasPaid) {
      await notifyInvoicePaid(invoice.id);
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to delete invoices' } },
        { status: 403 }
      );
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: resolvedParams.id, customer: { companyId: session.user.companyId } },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invoices cannot be deleted. They are financial records and must be preserved for accounting purposes. Use "Write Off" or "Dispute" status instead.',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Invoice deletion error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
