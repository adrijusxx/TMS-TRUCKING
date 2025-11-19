/**
 * Batch Manager
 * Business logic for invoice batch operations
 */

import { prisma } from '../prisma';
import { generateBatchNumber } from '../utils/batch-numbering';
import { BatchPostStatus } from '@prisma/client';

export class BatchManager {
  /**
   * Create a new batch with invoices
   */
  static async createBatch(data: {
    companyId: string;
    createdById: string;
    invoiceIds: string[];
    mcNumber?: string;
    notes?: string;
    batchNumber?: string;
  }) {
    // Verify all invoices belong to the company
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: data.invoiceIds },
        customer: {
          companyId: data.companyId,
        },
      },
    });

    if (invoices.length !== data.invoiceIds.length) {
      throw new Error('Some invoices not found or do not belong to your company');
    }

    // Check if invoices are already in a batch
    const existingBatchItems = await prisma.invoiceBatchItem.findMany({
      where: {
        invoiceId: { in: data.invoiceIds },
      },
    });

    if (existingBatchItems.length > 0) {
      throw new Error('Some invoices are already in a batch');
    }

    // Generate batch number if not provided
    const batchNumber = data.batchNumber || (await generateBatchNumber(data.companyId));

    // Calculate total amount
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Get MC number from first invoice or use provided
    const mcNumber = data.mcNumber || invoices[0]?.mcNumber || null;

    // Create batch with items
    return await prisma.invoiceBatch.create({
      data: {
        batchNumber,
        companyId: data.companyId,
        createdById: data.createdById,
        mcNumber,
        totalAmount,
        notes: data.notes,
        items: {
          create: data.invoiceIds.map((invoiceId) => ({
            invoiceId,
          })),
        },
      },
      include: {
        createdBy: true,
        items: {
          include: {
            invoice: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Send batch to factoring company
   */
  static async sendBatch(
    batchId: string,
    data: {
      factoringCompany?: string;
      notes?: string;
    }
  ) {
    const batch = await prisma.invoiceBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (batch.postStatus === 'PAID') {
      throw new Error('Cannot send a PAID batch');
    }

    return await prisma.invoiceBatch.update({
      where: { id: batchId },
      data: {
        postStatus: 'POSTED',
        sentToFactoringAt: new Date(),
        factoringCompany: data.factoringCompany || null,
        notes: data.notes || batch.notes,
      },
    });
  }

  /**
   * Update batch status
   */
  static async updateStatus(batchId: string, postStatus: BatchPostStatus) {
    return await prisma.invoiceBatch.update({
      where: { id: batchId },
      data: { postStatus },
    });
  }
}

