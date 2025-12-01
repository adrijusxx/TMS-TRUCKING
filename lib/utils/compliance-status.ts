/**
 * Compliance status calculation utilities
 */

import { ComplianceStatus } from '@/types/compliance';

const EXPIRING_THRESHOLD_DAYS = 30;
const CRITICAL_THRESHOLD_DAYS = 7;
const HIGH_THRESHOLD_DAYS = 15;

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(expirationDate: Date | null | undefined): number | null {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is expired
 */
export function isExpired(expirationDate: Date | null | undefined): boolean {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

/**
 * Check if date is expiring soon
 */
export function isExpiringSoon(
  expirationDate: Date | null | undefined,
  thresholdDays: number = EXPIRING_THRESHOLD_DAYS
): boolean {
  if (!expirationDate) return false;
  const daysUntil = daysUntilExpiration(expirationDate);
  if (daysUntil === null) return false;
  return daysUntil <= thresholdDays && daysUntil >= 0;
}

/**
 * Get expiration status
 */
function getExpirationStatus(
  expirationDate: Date | null | undefined
): 'current' | 'expiring' | 'expired' {
  if (!expirationDate) return 'current';
  if (isExpired(expirationDate)) return 'expired';
  if (isExpiringSoon(expirationDate)) return 'expiring';
  return 'current';
}

/**
 * Calculate compliance status with urgency
 */
export function calculateComplianceStatus(
  expirationDate: Date | null | undefined,
  isComplete: boolean = true
): ComplianceStatus {
  if (!isComplete) {
    return {
      status: 'MISSING',
      daysUntilExpiration: null,
      expirationDate: null,
      urgency: 'HIGH',
    };
  }

  if (!expirationDate) {
    return {
      status: 'COMPLETE',
      daysUntilExpiration: null,
      expirationDate: null,
      urgency: null,
    };
  }

  const daysUntil = daysUntilExpiration(expirationDate);
  const expired = isExpired(expirationDate);
  const expiring = isExpiringSoon(expirationDate);

  let status: ComplianceStatus['status'];
  let urgency: ComplianceStatus['urgency'];

  if (expired) {
    status = 'EXPIRED';
    urgency = 'CRITICAL';
  } else if (expiring) {
    status = 'EXPIRING';
    if (daysUntil !== null && daysUntil <= CRITICAL_THRESHOLD_DAYS) {
      urgency = 'CRITICAL';
    } else if (daysUntil !== null && daysUntil <= HIGH_THRESHOLD_DAYS) {
      urgency = 'HIGH';
    } else {
      urgency = 'MEDIUM';
    }
  } else {
    status = 'COMPLETE';
    urgency = 'LOW';
  }

  return {
    status,
    daysUntilExpiration: daysUntil,
    expirationDate,
    urgency,
  };
}

/**
 * Calculate overall compliance percentage for a driver
 */
export function calculateOverallCompliance(statusSummary: {
  dqf: ComplianceStatus;
  medicalCard: ComplianceStatus;
  cdl: ComplianceStatus;
  mvr: ComplianceStatus;
  drugTests: ComplianceStatus;
  hos: ComplianceStatus;
  annualReview: ComplianceStatus;
}): number {
  const checks = [
    statusSummary.dqf.status === 'COMPLETE' ? 1 : 0,
    statusSummary.medicalCard.status === 'COMPLETE' ? 1 : 0,
    statusSummary.cdl.status === 'COMPLETE' ? 1 : 0,
    statusSummary.mvr.status === 'COMPLETE' ? 1 : 0,
    statusSummary.drugTests.status === 'COMPLETE' ? 1 : 0,
    statusSummary.hos.status === 'COMPLETE' ? 1 : 0,
    statusSummary.annualReview.status === 'COMPLETE' ? 1 : 0,
  ];

  const total = checks.length;
  const passed = checks.reduce((sum, check) => sum + check, 0);

  return total > 0 ? Math.round((passed / total) * 100) : 0;
}

/**
 * Get status badge color class
 */
export function getStatusBadgeColor(status: ComplianceStatus['status']): string {
  switch (status) {
    case 'COMPLETE':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'EXPIRING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'MISSING':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'INCOMPLETE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format days until expiration for display
 */
export function formatDaysUntilExpiration(days: number | null): string {
  if (days === null) return 'N/A';
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days`;
}

