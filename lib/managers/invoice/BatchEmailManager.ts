/**
 * Batch Email Manager
 *
 * Orchestrates invoice batch validation, PDF generation, and email sending.
 * Validates that all invoices have required documents and valid recipient emails
 * before allowing a batch to be sent. Uses smart routing to determine if emails
 * go to customer billing contacts or factoring companies.
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';
import { InvoiceDocumentBuilder } from './InvoiceDocumentBuilder';

export interface BatchValidationResult {
  ready: boolean;
  invoiceCount: number;
  errors: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    issues: string[];
  }>;
}

export interface BatchSendResult {
  totalSent: number;
  totalFailed: number;
  results: Array<{
    invoiceId: string;
    invoiceNumber: string;
    status: 'SENT' | 'FAILED';
    recipientEmail?: string;
    error?: string;
  }>;
}

interface RecipientInfo {
  email: string;
  type: 'CUSTOMER' | 'FACTORING';
  name: string;
}

export class BatchEmailManager {
  /**
   * Validate that every invoice in a batch has required documents and a valid recipient email.
   */
  static async validateBatch(batchId: string): Promise<BatchValidationResult> {
    const batch = await prisma.invoiceBatch.findUnique({
      where: { id: batchId },
      include: {
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: { id: true, name: true, email: true, billingEmail: true, billingEmails: true },
                },
                factoringCompany: {
                  select: { id: true, name: true, contactEmail: true },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) throw new Error('Batch not found');

    const errors: BatchValidationResult['errors'] = [];

    for (const item of batch.items) {
      const invoice = item.invoice;
      const issues: string[] = [];

      // Check recipient email
      const recipient = this.resolveRecipientFromInvoice(invoice);
      if (!recipient) {
        const isFact = this.isFactored(invoice.factoringStatus);
        issues.push(
          isFact
            ? 'No factoring company email configured'
            : 'No customer billing email configured'
        );
      }

      // Check required documents
      const docValidation = await InvoiceDocumentBuilder.validateDocuments(
        invoice.id,
        invoice.loadIds
      );
      if (!docValidation.ready) {
        issues.push(...docValidation.missing);
      }

      if (issues.length > 0) {
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customer?.name || 'Unknown',
          issues,
        });
      }
    }

    return {
      ready: errors.length === 0,
      invoiceCount: batch.items.length,
      errors,
    };
  }

  /**
   * Send emails for all invoices in a batch.
   * Generates merged PDF packages and sends to the appropriate recipients.
   */
  static async sendBatch(
    batchId: string,
    companyId: string,
    userId: string
  ): Promise<BatchSendResult> {
    // Mark batch as SENDING
    await prisma.invoiceBatch.update({
      where: { id: batchId },
      data: { emailStatus: 'SENDING' },
    });

    const batch = await prisma.invoiceBatch.findUnique({
      where: { id: batchId },
      include: {
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: { id: true, name: true, email: true, billingEmail: true, billingEmails: true },
                },
                factoringCompany: {
                  select: { id: true, name: true, contactEmail: true },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) throw new Error('Batch not found');

    const results: BatchSendResult['results'] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const item of batch.items) {
      const invoice = item.invoice;
      const recipient = this.resolveRecipientFromInvoice(invoice);

      if (!recipient) {
        await this.createEmailLog(batchId, invoice.id, '', 'CUSTOMER', 'FAILED', 'No recipient email');
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: 'FAILED',
          error: 'No recipient email',
        });
        totalFailed++;
        continue;
      }

      try {
        // Build merged PDF package
        const pkg = await InvoiceDocumentBuilder.buildPackage(invoice.id, companyId);

        // Generate email HTML
        const html = this.generateEmailHtml(invoice, recipient);

        // Send via SES with attachment
        const emailResult = await EmailService.sendEmailWithAttachment({
          to: recipient.email,
          subject: `Invoice ${invoice.invoiceNumber} - ${invoice.customer?.name || 'Customer'}`,
          html,
          attachments: [{
            filename: pkg.filename,
            content: pkg.buffer,
            contentType: 'application/pdf',
          }],
        });

        if (emailResult.success) {
          await this.createEmailLog(
            batchId, invoice.id, recipient.email, recipient.type,
            'SENT', null, emailResult.messageId
          );

          // Update invoice status from DRAFT to SENT
          if (invoice.status === 'DRAFT') {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: 'SENT' },
            });
          }

          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: 'SENT',
            recipientEmail: recipient.email,
          });
          totalSent++;
        } else {
          await this.createEmailLog(
            batchId, invoice.id, recipient.email, recipient.type,
            'FAILED', emailResult.error
          );
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: 'FAILED',
            recipientEmail: recipient.email,
            error: emailResult.error,
          });
          totalFailed++;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        await this.createEmailLog(batchId, invoice.id, recipient.email, recipient.type, 'FAILED', errMsg);
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: 'FAILED',
          recipientEmail: recipient.email,
          error: errMsg,
        });
        totalFailed++;
      }
    }

    // Update batch status
    const emailStatus = totalFailed === 0 ? 'SENT' : totalSent === 0 ? 'FAILED' : 'PARTIAL';
    await prisma.invoiceBatch.update({
      where: { id: batchId },
      data: {
        emailStatus,
        postStatus: 'POSTED',
        sentAt: new Date(),
      },
    });

    return { totalSent, totalFailed, results };
  }

  /**
   * Smart routing: determine recipient based on factoring status.
   */
  private static resolveRecipientFromInvoice(invoice: any): RecipientInfo | null {
    if (this.isFactored(invoice.factoringStatus) && invoice.factoringCompany?.contactEmail) {
      return {
        email: invoice.factoringCompany.contactEmail,
        type: 'FACTORING',
        name: invoice.factoringCompany.name,
      };
    }

    // Customer billing email priority: billingEmail → billingEmails (first) → email
    const customer = invoice.customer;
    if (!customer) return null;

    const email =
      customer.billingEmail ||
      (customer.billingEmails ? customer.billingEmails.split(',')[0].trim() : null) ||
      customer.email;

    if (!email) return null;

    return { email, type: 'CUSTOMER', name: customer.name };
  }

  private static isFactored(factoringStatus: string | null): boolean {
    if (!factoringStatus || factoringStatus === 'NOT_FACTORED') return false;
    return true;
  }

  private static async createEmailLog(
    batchId: string,
    invoiceId: string,
    recipientEmail: string,
    recipientType: string,
    status: string,
    errorMessage?: string | null,
    messageId?: string
  ): Promise<void> {
    await prisma.batchEmailLog.create({
      data: {
        invoiceBatchId: batchId,
        invoiceId,
        recipientEmail,
        recipientType,
        status,
        errorMessage: errorMessage || null,
        messageId: messageId || null,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });
  }

  private static generateEmailHtml(invoice: any, recipient: RecipientInfo): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const customerName = invoice.customer?.name || 'Customer';
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${recipient.name},</p>
        <p>Please find attached the invoice package for your records.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Invoice #</td>
            <td style="padding: 10px;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Customer</td>
            <td style="padding: 10px;">${customerName}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Amount Due</td>
            <td style="padding: 10px; font-weight: bold; color: #166534;">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Due Date</td>
            <td style="padding: 10px;">${dueDate}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #666;">
          The attached PDF includes the invoice, rate confirmation, proof of delivery, and bill of lading.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} TMS Trucking. All rights reserved.</p>
      </div>
    `;
  }
}
