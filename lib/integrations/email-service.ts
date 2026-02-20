/**
 * Email Service Integration
 *
 * Sends invoice emails with merged PDF packages (Invoice + Rate Con + POD + BOL)
 * via AWS SES. Used by the single-invoice resend endpoint and batch email flow.
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';
import { InvoiceDocumentBuilder } from '@/lib/managers/invoice/InvoiceDocumentBuilder';

/**
 * Send an invoice email with the merged document package attached.
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string | string[],
  options?: {
    includePdf?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { select: { name: true } },
        company: { select: { id: true } },
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const customerName = invoice.customer?.name || 'Customer';
    const subject = `Invoice ${invoice.invoiceNumber} - ${customerName}`;
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${customerName},</p>
        <p>Please find attached the invoice package for your records.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Invoice #</td>
            <td style="padding: 10px;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Amount Due</td>
            <td style="padding: 10px; font-weight: bold; color: #166534;">${amount}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Due Date</td>
            <td style="padding: 10px;">${dueDate}</td>
          </tr>
        </table>
        ${options?.notes ? `<p style="font-size: 14px; color: #666;">${options.notes}</p>` : ''}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} TMS Trucking. All rights reserved.</p>
      </div>
    `;

    if (options?.includePdf) {
      // Build merged PDF package (Invoice + Rate Con + POD + BOL)
      const pkg = await InvoiceDocumentBuilder.buildPackage(invoiceId, invoice.companyId);

      return EmailService.sendEmailWithAttachment({
        to: recipientEmail,
        subject,
        html,
        attachments: [{
          filename: pkg.filename,
          content: pkg.buffer,
          contentType: 'application/pdf',
        }],
      });
    }

    // Send without attachment
    const sent = await EmailService.sendEmail({ to: recipientEmail, subject, html });
    return { success: sent, messageId: sent ? `ses-${Date.now()}` : undefined };
  } catch (error) {
    console.error('[Email Service] Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
