/**
 * Factoring utility functions
 * Calculate reserve amounts, expected funding dates, etc.
 */

import { FactoringStatus, Invoice, FactoringCompany } from '@prisma/client';

/**
 * Calculate reserve amount based on reserve percentage
 */
export function calculateReserveAmount(
  invoiceTotal: number,
  reservePercentage: number = 10
): number {
  return Math.round((invoiceTotal * reservePercentage) / 100 * 100) / 100;
}

/**
 * Calculate advance amount (total - reserve)
 */
export function calculateAdvanceAmount(
  invoiceTotal: number,
  reservePercentage: number = 10
): number {
  const reserve = calculateReserveAmount(invoiceTotal, reservePercentage);
  return Math.round((invoiceTotal - reserve) * 100) / 100;
}

/**
 * Calculate factoring fee (typically a percentage of total)
 */
export function calculateFactoringFee(
  invoiceTotal: number,
  feePercentage: number = 3
): number {
  return Math.round((invoiceTotal * feePercentage) / 100 * 100) / 100;
}

/**
 * Calculate expected reserve release date
 * Typically 90 days after funding date
 */
export function calculateReserveReleaseDate(
  fundedAt: Date | string,
  reserveHoldDays: number = 90
): Date {
  const funded = typeof fundedAt === 'string' ? new Date(fundedAt) : fundedAt;
  const releaseDate = new Date(funded);
  releaseDate.setDate(releaseDate.getDate() + reserveHoldDays);
  return releaseDate;
}

/**
 * Check if reserve should be released based on hold period
 */
export function shouldReleaseReserve(
  fundedAt: Date | string | null,
  reserveHoldDays: number = 90
): boolean {
  if (!fundedAt) return false;
  
  const releaseDate = calculateReserveReleaseDate(fundedAt, reserveHoldDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return today >= releaseDate;
}

/**
 * Get expected funding date (typically 1-3 days after submission)
 */
function getExpectedFundingDate(
  submittedAt: Date | string,
  fundingDays: number = 2
): Date {
  const submitted = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const fundingDate = new Date(submitted);
  fundingDate.setDate(fundingDate.getDate() + fundingDays);
  return fundingDate;
}

/**
 * Get days until reserve release
 */
function getDaysUntilReserveRelease(
  fundedAt: Date | string | null,
  reserveHoldDays: number = 90
): number | null {
  if (!fundedAt) return null;
  
  const releaseDate = calculateReserveReleaseDate(fundedAt, reserveHoldDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = releaseDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Check if invoice is eligible for factoring
 */
function isEligibleForFactoring(invoice: {
  status: string;
  factoringStatus: FactoringStatus;
  balance: number;
}): boolean {
  // Already factored
  if (invoice.factoringStatus !== 'NOT_FACTORED') {
    return false;
  }
  
  // Must have outstanding balance
  if (invoice.balance <= 0) {
    return false;
  }
  
  // Status must allow factoring
  const eligibleStatuses = ['SENT', 'POSTED', 'PARTIAL', 'OVERDUE'];
  return eligibleStatuses.includes(invoice.status);
}

/**
 * Get factoring company configuration for invoice
 */
export function getFactoringConfig(
  invoice: Invoice & { factoringCompany?: FactoringCompany | null },
  defaultReservePercentage: number = 10,
  defaultReserveHoldDays: number = 90
): {
  reservePercentage: number;
  reserveHoldDays: number;
} {
  if (invoice.factoringCompany) {
    return {
      reservePercentage: invoice.factoringCompany.reservePercentage,
      reserveHoldDays: invoice.factoringCompany.reserveHoldDays,
    };
  }
  
  return {
    reservePercentage: defaultReservePercentage,
    reserveHoldDays: defaultReserveHoldDays,
  };
}

