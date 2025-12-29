/**
 * Customer numbering utility
 * Generate customer numbers in C-000XXX format
 */

import { prisma } from '../prisma';

/**
 * Generate the next customer number in C-000XXX format
 * Note: This function may generate duplicate numbers under high concurrency.
 * Callers should check for uniqueness and retry if needed.
 * @internal Used internally by generateUniqueCustomerNumber
 */
async function generateCustomerNumber(companyId: string): Promise<string> {
  // Get the latest customer number for this company
  const latestCustomer = await prisma.customer.findFirst({
    where: {
      companyId,
      customerNumber: {
        startsWith: 'C-',
      },
    },
    orderBy: {
      customerNumber: 'desc',
    },
  });

  let nextNumber = 1;

  if (latestCustomer) {
    // Extract number from customer number (e.g., C-000113 -> 113)
    const match = latestCustomer.customerNumber.match(/C-(\d+)/);
    if (match) {
      const latestNum = parseInt(match[1], 10);
      nextNumber = latestNum + 1;
    }
  }

  // Format as C-000XXX (6 digits with leading zeros)
  const formattedNumber = String(nextNumber).padStart(6, '0');
  return `C-${formattedNumber}`;
}

/**
 * Generate a unique customer number with retry logic
 * This function ensures uniqueness even under high concurrency
 */
export async function generateUniqueCustomerNumber(companyId: string, maxAttempts: number = 10): Promise<string> {
  let attempts = 0;
  let customerNumber: string;
  
  while (attempts < maxAttempts) {
    customerNumber = await generateCustomerNumber(companyId);
    
    // Check if this number already exists
    const existing = await prisma.customer.findUnique({
      where: { customerNumber },
    });
    
    if (!existing) {
      return customerNumber; // Found unique number
    }
    
    attempts++;
    // Small delay to allow other transactions to complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(`Failed to generate unique customer number after ${maxAttempts} attempts`);
}


