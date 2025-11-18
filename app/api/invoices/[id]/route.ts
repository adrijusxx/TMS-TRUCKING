import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { notifyInvoicePaid } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Verify invoice belongs to company via customer
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        },
        { status: 404 }
      );
    }

    // Fetch loads separately
    const loads = invoice.loadIds && invoice.loadIds.length > 0
      ? await prisma.load.findMany({
          where: {
            id: { in: invoice.loadIds },
            companyId: session.user.companyId,
          },
          select: {
            id: true,
            loadNumber: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
            revenue: true,
          },
        })
      : [];

    return NextResponse.json({
      success: true,
      data: { ...invoice, loads },
    });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to edit invoices
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit invoices',
          },
        },
        { status: 403 }
      );
    }

    const updateData: any = {};
    const wasPaid = existingInvoice.status !== 'PAID' && status === 'PAID';
    
    if (status && Object.values(InvoiceStatus).includes(status)) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
      },
    });

    // Send notification if invoice was marked as paid
    if (wasPaid) {
      await notifyInvoicePaid(invoice.id);
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

