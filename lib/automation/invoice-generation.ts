/**
 * Automated Invoice Generation
 * 
 * Automatically generate invoices for delivered loads that haven't been invoiced yet
 */

import { prisma } from '../prisma';
import { InvoiceStatus } from '@prisma/client';
import { createActivityLog } from '../activity-log';

/**
 * Generate invoices for delivered loads that are ready for invoicing
 */
export async function autoGenerateInvoices(companyId: string) {
  const results = {
    invoicesGenerated: 0,
    errors: [] as string[],
  };

  try {
    // Find delivered loads that haven't been invoiced
    const loadsReadyForInvoicing = await prisma.load.findMany({
      where: {
        companyId,
        status: 'DELIVERED',
        invoicedAt: null,
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    // Group by customer for batch processing
    const loadsByCustomer = new Map<string, typeof loadsReadyForInvoicing>();

    for (const load of loadsReadyForInvoicing) {
      const customerId = load.customerId;
      if (!loadsByCustomer.has(customerId)) {
        loadsByCustomer.set(customerId, []);
      }
      loadsByCustomer.get(customerId)!.push(load);
    }

    // Generate invoices for each customer
    for (const [customerId, customerLoads] of loadsByCustomer) {
      try {
        // Get customer details
        const customer = customerLoads[0].customer;

        // Generate invoice number
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        // Calculate totals
        const subtotal = customerLoads.reduce((sum, load) => sum + (load.revenue || 0), 0);
        const tax = subtotal * 0.08; // 8% tax (placeholder - should be configurable)
        const total = subtotal + tax;

        // Calculate due date (30 days from today)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            companyId,
            customerId,
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate,
            subtotal,
            tax,
            total,
            balance: total, // Balance starts equal to total
            status: InvoiceStatus.DRAFT,
            loadIds: customerLoads.map((l) => l.id),
          },
        });

        // Update loads to mark as invoiced
        await prisma.load.updateMany({
          where: {
            id: { in: customerLoads.map((l) => l.id) },
          },
          data: {
            invoicedAt: new Date(),
          },
        });

        results.invoicesGenerated++;

        // Log activity
        await createActivityLog({
          companyId,
          action: 'INVOICE_GENERATED',
          entityType: 'Invoice',
          entityId: invoice.id,
          description: `Automated invoice ${invoiceNumber} generated for ${customer.name} with ${customerLoads.length} load(s)`,
          metadata: {
            invoiceNumber,
            customerId,
            loadCount: customerLoads.length,
            total,
          },
        });
      } catch (error) {
        const errorMsg = `Error generating invoice for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: true,
      ...results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    };
  }
}

