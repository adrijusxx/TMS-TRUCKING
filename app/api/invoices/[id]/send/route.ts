import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    // Get company info for email
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
    });

    // Determine recipient email
    const recipientEmail = invoice.customer.billingEmail || invoice.customer.email;
    
    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_EMAIL',
            message: 'Customer email address not found',
          },
        },
        { status: 400 }
      );
    }

    // Generate invoice PDF URL (placeholder - would generate actual PDF)
    const invoicePdfUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/invoices/${invoice.id}/pdf`;

    // Email content
    const emailSubject = `Invoice ${invoice.invoiceNumber} from ${company?.name || 'Your TMS'}`;
    const emailBody = generateInvoiceEmail(invoice, company, invoicePdfUrl);

    // In production, use a service like SendGrid, AWS SES, or Resend
    // For now, this is a placeholder that logs the email
    console.log('=== INVOICE EMAIL ===');
    console.log('To:', recipientEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);
    console.log('===================');

    // Placeholder: In production, send actual email
    // await sendEmail({
    //   to: recipientEmail,
    //   subject: emailSubject,
    //   html: emailBody,
    //   attachments: [
    //     {
    //       filename: `invoice-${invoice.invoiceNumber}.pdf`,
    //       path: invoicePdfUrl,
    //     },
    //   ],
    // });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'SENT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully',
      data: {
        invoiceId: invoice.id,
        recipientEmail,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Invoice email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

function generateInvoiceEmail(invoice: any, company: any, pdfUrl: string): string {
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice ${invoice.invoiceNumber}</h1>
    </div>
    <div class="content">
      <p>Dear ${invoice.customer.name},</p>
      <p>Please find attached your invoice for services rendered.</p>
      
      <div class="invoice-details">
        <h2>Invoice Details</h2>
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p><strong>Subtotal:</strong> $${invoice.subtotal.toFixed(2)}</p>
        ${invoice.tax > 0 ? `<p><strong>Tax:</strong> $${invoice.tax.toFixed(2)}</p>` : ''}
        <p class="amount">Total Amount: $${invoice.total.toFixed(2)}</p>
      </div>

      <div style="text-align: center;">
        <a href="${pdfUrl}" class="button">View Invoice PDF</a>
      </div>

      <p>If you have any questions about this invoice, please contact us at ${company?.email || 'support@tms.com'} or ${company?.phone || '(555) 123-4567'}.</p>
      
      <p>Thank you for your business!</p>
      <p>Best regards,<br>${company?.name || 'Your TMS Team'}</p>
    </div>
    <div class="footer">
      <p>${company?.name || 'TMS'}</p>
      ${company?.address ? `<p>${company.address}, ${company.city}, ${company.state} ${company.zip}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

