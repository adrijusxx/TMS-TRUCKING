import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { notifyInvoicePaid } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';

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
    // Verify invoice belongs to company via customer
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: true,
        factoringCompany: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
          },
        },
        payments: {
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
        reconciliations: {
          include: {
            reconciledBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
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
    const { 
      status, 
      notes, 
      mcNumber, 
      subStatus, 
      reconciliationStatus, 
      invoiceNote, 
      paymentNote, 
      loadId,
      // New fields
      paymentMethod,
      factoringStatus,
      factoringCompanyId,
      shortPayAmount,
      shortPayReasonCode,
      shortPayReason,
      expectedPaymentDate,
      amountPaid,
      balance,
      disputedAt,
      disputedReason,
      writtenOffAt,
      writtenOffReason,
    } = body;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
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
    
    // If marking as paid, update amountPaid and balance
    if (status === 'PAID') {
      updateData.amountPaid = existingInvoice.total;
      updateData.balance = 0;
      updateData.paidDate = new Date();
      if (!updateData.subStatus) {
        updateData.subStatus = 'PAID';
      }
    }
    
    if (status && Object.values(InvoiceStatus).includes(status)) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (mcNumber !== undefined) {
      updateData.mcNumber = mcNumber;
    }
    if (subStatus !== undefined) {
      updateData.subStatus = subStatus;
    }
    if (reconciliationStatus !== undefined) {
      updateData.reconciliationStatus = reconciliationStatus;
    }
    if (invoiceNote !== undefined) {
      updateData.invoiceNote = invoiceNote;
    }
    if (paymentNote !== undefined) {
      updateData.paymentNote = paymentNote;
    }
    if (loadId !== undefined) {
      updateData.loadId = loadId;
    }
    // New fields
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }
    if (factoringStatus !== undefined) {
      updateData.factoringStatus = factoringStatus;
    }
    if (factoringCompanyId !== undefined) {
      updateData.factoringCompanyId = factoringCompanyId;
    }
    if (shortPayAmount !== undefined) {
      updateData.shortPayAmount = shortPayAmount;
    }
    if (shortPayReasonCode !== undefined) {
      updateData.shortPayReasonCode = shortPayReasonCode;
    }
    if (shortPayReason !== undefined) {
      updateData.shortPayReason = shortPayReason;
    }
    if (expectedPaymentDate !== undefined) {
      updateData.expectedPaymentDate = expectedPaymentDate ? new Date(expectedPaymentDate) : null;
    }
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
    }
    if (balance !== undefined) {
      updateData.balance = balance;
    }
    if (disputedAt !== undefined) {
      updateData.disputedAt = disputedAt ? new Date(disputedAt) : null;
    }
    if (disputedReason !== undefined) {
      updateData.disputedReason = disputedReason;
    }
    if (writtenOffAt !== undefined) {
      updateData.writtenOffAt = writtenOffAt ? new Date(writtenOffAt) : null;
    }
    if (writtenOffReason !== undefined) {
      updateData.writtenOffReason = writtenOffReason;
    }

    const invoice = await prisma.invoice.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
        factoringCompany: {
          select: {
            id: true,
            name: true,
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

