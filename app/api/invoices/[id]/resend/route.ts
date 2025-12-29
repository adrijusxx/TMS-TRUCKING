import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function POST(
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
    
    // Check permission
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to resend invoices',
          },
        },
        { status: 403 }
      );
    }

    // Verify invoice belongs to company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            billingEmail: true,
            billingEmails: true,
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

    // Determine recipient email(s)
    const recipientEmails = [
      invoice.customer.billingEmail || invoice.customer.email,
      ...(invoice.customer.billingEmails
        ? invoice.customer.billingEmails.split(',').map((e) => e.trim())
        : []),
    ].filter(Boolean) as string[];

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_RECIPIENT',
            message: 'No recipient email address found for this customer',
          },
        },
        { status: 400 }
      );
    }

    // Import email service
    const { sendInvoiceEmail } = await import('@/lib/integrations/email-service');

    // Send email
    const emailResult = await sendInvoiceEmail(invoice.id, recipientEmails, {
      includePdf: true,
      notes: `Invoice ${invoice.invoiceNumber} resent`,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ERROR',
            message: emailResult.error || 'Failed to send invoice email',
          },
        },
        { status: 500 }
      );
    }

    // Update invoice status if needed
    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'SENT' },
      });
    }

    // Log email send event
    const { createActivityLog } = await import('@/lib/activity-log');
    const requestHeaders = request.headers;
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'SEND',
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber} resent to ${recipientEmails.join(', ')}`,
      ipAddress: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || undefined,
      userAgent: requestHeaders.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Invoice ${invoice.invoiceNumber} has been resent to ${invoice.customer.name}`,
        invoiceId: invoice.id,
      },
    });
  } catch (error) {
    console.error('Invoice resend error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

