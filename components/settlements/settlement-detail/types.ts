import { SettlementStatus } from '@prisma/client';

export const TRANSACTION_TYPES = {
  // Additions (Payments to driver)
  BONUS: { label: 'Bonus', category: 'addition' },
  OVERTIME: { label: 'Overtime', category: 'addition' },
  INCENTIVE: { label: 'Incentive', category: 'addition' },
  REIMBURSEMENT: { label: 'Reimbursement', category: 'addition' },

  // Deductions (Charges from driver)
  FUEL_ADVANCE: { label: 'Fuel Advance', category: 'deduction' },
  CASH_ADVANCE: { label: 'Cash Advance', category: 'deduction' },
  INSURANCE: { label: 'Insurance', category: 'deduction' },
  OCCUPATIONAL_ACCIDENT: { label: 'Occupational Accident', category: 'deduction' },
  TRUCK_PAYMENT: { label: 'Truck Payment', category: 'deduction' },
  TRUCK_LEASE: { label: 'Truck Lease', category: 'deduction' },
  ESCROW: { label: 'Escrow', category: 'deduction' },
  EQUIPMENT_RENTAL: { label: 'Equipment Rental', category: 'deduction' },
  MAINTENANCE: { label: 'Maintenance', category: 'deduction' },
  TOLLS: { label: 'Tolls', category: 'deduction' },
  PERMITS: { label: 'Permits', category: 'deduction' },
  FUEL_CARD: { label: 'Fuel Card', category: 'deduction' },
  FUEL_CARD_FEE: { label: 'Fuel Card Fee', category: 'deduction' },
  TRAILER_RENTAL: { label: 'Trailer Rental', category: 'deduction' },
  OTHER: { label: 'Other', category: 'deduction' },
} as const;

export const statusColors: Record<SettlementStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

export function formatStatus(status: SettlementStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getTransactionLabel(deductionType: string, description?: string): string {
  if (description) return description;
  const entry = TRANSACTION_TYPES[deductionType as keyof typeof TRANSACTION_TYPES];
  if (entry) return entry.label;
  return deductionType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
