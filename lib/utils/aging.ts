/**
 * Aging calculation utilities
 * Calculate invoice aging days and categorize into buckets
 */

interface AgingBucket {
  current: number;
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
}

interface AgingInfo {
  daysPastDue: number;
  agingStatus: 'NOT_OVERDUE' | '1-30' | '31-60' | '61-90' | '90+';
  bucket: keyof AgingBucket;
}

/**
 * Calculate days past due from a due date
 */
export function calculateAgingDays(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateOnly = new Date(due);
  dueDateOnly.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dueDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get aging status based on days past due
 */
function getAgingStatus(daysPastDue: number): AgingInfo['agingStatus'] {
  if (daysPastDue <= 0) {
    return 'NOT_OVERDUE';
  } else if (daysPastDue <= 30) {
    return '1-30';
  } else if (daysPastDue <= 60) {
    return '31-60';
  } else if (daysPastDue <= 90) {
    return '61-90';
  } else {
    return '90+';
  }
}

/**
 * Get aging bucket key for categorization
 */
function getAgingBucket(daysPastDue: number): keyof AgingBucket {
  if (daysPastDue <= 0) {
    return 'current';
  } else if (daysPastDue <= 30) {
    return '1-30';
  } else if (daysPastDue <= 60) {
    return '31-60';
  } else if (daysPastDue <= 90) {
    return '61-90';
  } else {
    return '90+';
  }
}

/**
 * Get complete aging information for an invoice
 */
function getAgingInfo(dueDate: Date | string): AgingInfo {
  const daysPastDue = calculateAgingDays(dueDate);
  const agingStatus = getAgingStatus(daysPastDue);
  const bucket = getAgingBucket(daysPastDue);
  
  return {
    daysPastDue,
    agingStatus,
    bucket,
  };
}

/**
 * Categorize invoices into aging buckets
 */
function categorizeAgingBuckets(
  invoices: Array<{ dueDate: Date | string; balance: number }>
): AgingBucket {
  const buckets: AgingBucket = {
    current: 0,
    '1-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  };
  
  invoices.forEach((invoice) => {
    const daysPastDue = calculateAgingDays(invoice.dueDate);
    const bucket = getAgingBucket(daysPastDue);
    buckets[bucket] += invoice.balance;
  });
  
  return buckets;
}

