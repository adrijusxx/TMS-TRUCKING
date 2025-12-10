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
      select: {
        id: true,
        companyId: true,
        customerId: true,
        invoiceNumber: true,
        loadIds: true,
        subtotal: true,
        tax: true,
        total: true,
        amountPaid: true,
        balance: true,
        status: true,
        invoiceDate: true,
        dueDate: true,
        paidDate: true,
        qbSynced: true,
        qbInvoiceId: true,
        qbSyncedAt: true,
        qbSyncStatus: true,
        qbSyncError: true,
        qbCustomerId: true,
        mcNumber: true,
        subStatus: true,
        reconciliationStatus: true,
        invoiceNote: true,
        paymentNote: true,
        loadId: true,
        totalAmount: true,
        paymentMethod: true,
        expectedPaymentDate: true,
        factoringStatus: true,
        factoringCompanyId: true,
        submittedToFactorAt: true,
        factoringSubmittedAt: true,
        fundedAt: true,
        reserveReleaseDate: true,
        factoringReserveReleasedAt: true,
        factoringFee: true,
        reserveAmount: true,
        advanceAmount: true,
        shortPayAmount: true,
        shortPayReasonCode: true,
        shortPayReason: true,
        shortPayApproved: true,
        shortPayApprovedById: true,
        shortPayApprovedAt: true,
        disputedAt: true,
        disputedReason: true,
          writtenOffAt: true,
          writtenOffReason: true,
          writtenOffById: true,
          notes: true,
          factoringBatchId: true,
          invoiceBatchId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            phone: true,
            email: true,
            paymentTerms: true,
            creditLimit: true,
            isActive: true,
          },
        },
        factoringCompany: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            referenceNumber: true,
            notes: true,
            createdAt: true,
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
          select: {
            id: true,
            reconciledAmount: true,
            reconciledAt: true,
            notes: true,
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

    // First check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: resolvedParams.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyId: true,
            name: true,
          },
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

    // Verify invoice belongs to user's company through customer
    if (!existingInvoice.customer) {
      console.error('Invoice missing customer:', {
        invoiceId: resolvedParams.id,
        invoiceNumber: existingInvoice.invoiceNumber,
      });
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'INVALID_RECORD', 
            message: 'Invoice is missing customer information. Please contact support.' 
          },
        },
        { status: 400 }
      );
    }

    if (existingInvoice.customer.companyId !== session.user.companyId) {
      console.error('Invoice access denied - company mismatch:', {
        invoiceId: resolvedParams.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        customerId: existingInvoice.customer.id,
        customerCompanyId: existingInvoice.customer.companyId,
        userCompanyId: session.user.companyId,
      });
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'FORBIDDEN', 
            message: 'Invoice does not belong to your company' 
          },
        },
        { status: 403 }
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
    
    // Check permission to delete invoices
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete invoices',
          },
        },
        { status: 403 }
      );
    }

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

    // Invoices are financial records - they should NOT be deleted
    // Instead, mark them as written off or disputed
    // For accounting compliance, invoices must be preserved
    
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
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

