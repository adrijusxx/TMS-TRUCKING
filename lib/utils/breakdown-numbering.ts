/**
 * Breakdown case number utility
 * Generate breakdown case numbers in BD-YYYY-XXXX format
 */

import { prisma } from '../prisma';

/**
 * Generate the next breakdown case number in BD-YYYY-XXXX format
 * Format: BD-2024-1234
 */
export async function generateBreakdownCaseNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the latest breakdown case number for this company and year
  const latestBreakdown = await prisma.breakdown.findFirst({
    where: {
      companyId,
      breakdownNumber: {
        startsWith: `BD-${year}-`,
      },
    },
    orderBy: {
      breakdownNumber: 'desc',
    },
  });

  let nextNumber = 1;

  if (latestBreakdown) {
    // Extract number from case number (e.g., BD-2024-1234 -> 1234)
    const match = latestBreakdown.breakdownNumber.match(/BD-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as BD-YYYY-XXXX (4 digits with leading zeros)
  const formattedNumber = String(nextNumber).padStart(4, '0');
  return `BD-${year}-${formattedNumber}`;
}


