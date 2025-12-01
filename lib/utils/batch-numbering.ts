/**
 * Batch numbering utility
 * Generate batch numbers in IB-000XXX format
 */

import { prisma } from '../prisma';

/**
 * Generate the next batch number in IB-000XXX format
 */
export async function generateBatchNumber(companyId: string): Promise<string> {
  // Get the latest batch number for this company
  const latestBatch = await prisma.invoiceBatch.findFirst({
    where: {
      companyId,
      batchNumber: {
        startsWith: 'IB-',
      },
    },
    orderBy: {
      batchNumber: 'desc',
    },
  });

  let nextNumber = 1;

  if (latestBatch) {
    // Extract number from batch number (e.g., IB-000113 -> 113)
    const match = latestBatch.batchNumber.match(/IB-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as IB-000XXX (6 digits with leading zeros)
  const formattedNumber = String(nextNumber).padStart(6, '0');
  return `IB-${formattedNumber}`;
}


