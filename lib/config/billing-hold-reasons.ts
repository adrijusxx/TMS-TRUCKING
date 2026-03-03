/**
 * Predefined billing hold reason categories.
 * Used across BillingHoldManager, BillingExceptionsQueue, and invoice workflows.
 */

export interface HoldReasonOption {
  value: string;
  label: string;
  description: string;
  category: HoldReasonCategory;
  /** Whether this hold can be auto-cleared (e.g., when POD is uploaded) */
  autoResolvable: boolean;
}

export type HoldReasonCategory =
  | 'DOCUMENTATION'
  | 'CUSTOMER_DISPUTE'
  | 'RATE_DISCREPANCY'
  | 'REGULATORY'
  | 'INTERNAL'
  | 'OTHER';

export const HOLD_REASON_CATEGORIES: Record<HoldReasonCategory, string> = {
  DOCUMENTATION: 'Missing Documentation',
  CUSTOMER_DISPUTE: 'Customer Dispute',
  RATE_DISCREPANCY: 'Rate / Charge Discrepancy',
  REGULATORY: 'Regulatory Review',
  INTERNAL: 'Internal Hold',
  OTHER: 'Other',
};

export const BILLING_HOLD_REASONS: HoldReasonOption[] = [
  // Documentation
  {
    value: 'WAITING_FOR_POD',
    label: 'Waiting for POD',
    description: 'Proof of Delivery document has not been uploaded',
    category: 'DOCUMENTATION',
    autoResolvable: true,
  },
  {
    value: 'WAITING_FOR_BOL',
    label: 'Waiting for BOL',
    description: 'Bill of Lading missing or incomplete',
    category: 'DOCUMENTATION',
    autoResolvable: true,
  },
  {
    value: 'WAITING_FOR_RATE_CON',
    label: 'Rate Con Update Required',
    description: 'Rate confirmation needs update to include accessorial charges',
    category: 'DOCUMENTATION',
    autoResolvable: false,
  },
  {
    value: 'MISSING_WEIGHT_TICKET',
    label: 'Missing Weight Ticket',
    description: 'Weight ticket required but not yet uploaded',
    category: 'DOCUMENTATION',
    autoResolvable: true,
  },

  // Customer Dispute
  {
    value: 'CUSTOMER_DISPUTE_DAMAGE',
    label: 'Damage Claim',
    description: 'Customer has filed a cargo damage claim',
    category: 'CUSTOMER_DISPUTE',
    autoResolvable: false,
  },
  {
    value: 'CUSTOMER_DISPUTE_SHORTAGE',
    label: 'Shortage Claim',
    description: 'Customer reports missing or short items',
    category: 'CUSTOMER_DISPUTE',
    autoResolvable: false,
  },
  {
    value: 'CUSTOMER_DISPUTE_SERVICE',
    label: 'Service Issue',
    description: 'Customer disputes service quality (late delivery, etc.)',
    category: 'CUSTOMER_DISPUTE',
    autoResolvable: false,
  },

  // Rate Discrepancy
  {
    value: 'RATE_MISMATCH',
    label: 'Rate Mismatch',
    description: 'Invoiced rate does not match agreed rate confirmation',
    category: 'RATE_DISCREPANCY',
    autoResolvable: false,
  },
  {
    value: 'ACCESSORIAL_PENDING',
    label: 'Accessorial Charges Pending',
    description: 'Detention, lumper, or other accessorial charges need approval',
    category: 'RATE_DISCREPANCY',
    autoResolvable: false,
  },
  {
    value: 'FUEL_SURCHARGE_REVIEW',
    label: 'Fuel Surcharge Review',
    description: 'Fuel surcharge calculation needs verification',
    category: 'RATE_DISCREPANCY',
    autoResolvable: false,
  },

  // Regulatory
  {
    value: 'REGULATORY_REVIEW',
    label: 'Regulatory Review',
    description: 'Invoice requires regulatory compliance review',
    category: 'REGULATORY',
    autoResolvable: false,
  },
  {
    value: 'HAZMAT_DOCUMENTATION',
    label: 'Hazmat Documentation',
    description: 'Hazmat-related paperwork needs verification',
    category: 'REGULATORY',
    autoResolvable: false,
  },

  // Internal
  {
    value: 'MANAGEMENT_REVIEW',
    label: 'Management Review',
    description: 'Invoice held for management approval',
    category: 'INTERNAL',
    autoResolvable: false,
  },
  {
    value: 'CREDIT_HOLD',
    label: 'Customer Credit Hold',
    description: 'Customer account is on credit hold',
    category: 'INTERNAL',
    autoResolvable: false,
  },

  // Other
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Custom reason — provide details in notes',
    category: 'OTHER',
    autoResolvable: false,
  },
];

/** Lookup a hold reason by value */
export function getHoldReason(value: string): HoldReasonOption | undefined {
  return BILLING_HOLD_REASONS.find((r) => r.value === value);
}

/** Get hold reasons by category */
export function getHoldReasonsByCategory(
  category: HoldReasonCategory
): HoldReasonOption[] {
  return BILLING_HOLD_REASONS.filter((r) => r.category === category);
}

/** Get the display label for a hold reason value, or return the raw value if not found */
export function getHoldReasonLabel(value: string): string {
  return getHoldReason(value)?.label ?? value;
}
