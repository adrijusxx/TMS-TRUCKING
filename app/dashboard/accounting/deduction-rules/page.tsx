'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Rule Name', type: 'text' as const, required: true },
  { 
    name: 'deductionType', 
    label: 'Transaction Type', 
    type: 'select' as const, 
    required: true, 
    options: [
      // Deductions
      { value: 'FUEL_ADVANCE', label: 'Fuel Advance' },
      { value: 'CASH_ADVANCE', label: 'Cash Advance' },
      { value: 'INSURANCE', label: 'Insurance' },
      { value: 'OCCUPATIONAL_ACCIDENT', label: 'Occupational Accident' },
      { value: 'TRUCK_PAYMENT', label: 'Truck Payment' },
      { value: 'TRUCK_LEASE', label: 'Truck Lease' },
      { value: 'ESCROW', label: 'Escrow' },
      { value: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'TOLLS', label: 'Tolls' },
      { value: 'PERMITS', label: 'Permits' },
      { value: 'FUEL_CARD', label: 'Fuel Card' },
      { value: 'FUEL_CARD_FEE', label: 'Fuel Card Fee' },
      { value: 'TRAILER_RENTAL', label: 'Trailer Rental' },
      { value: 'OTHER', label: 'Other' },
      // Additions (Payments to driver)
      { value: 'BONUS', label: 'Bonus' },
      { value: 'OVERTIME', label: 'Overtime' },
      { value: 'INCENTIVE', label: 'Incentive' },
      { value: 'REIMBURSEMENT', label: 'Reimbursement' },
    ]
  },
  { 
    name: 'driverType', 
    label: 'Driver Type', 
    type: 'select' as const, 
    options: [
      { value: 'COMPANY_DRIVER', label: 'Company Driver' },
      { value: 'OWNER_OPERATOR', label: 'Owner Operator' },
      { value: 'LEASE', label: 'Lease' },
    ]
  },
  { 
    name: 'calculationType', 
    label: 'Calculation Type', 
    type: 'select' as const, 
    required: true, 
    options: [
      { value: 'FIXED', label: 'Fixed Amount' },
      { value: 'PERCENTAGE', label: 'Percentage' },
      { value: 'PER_MILE', label: 'Per Mile' },
    ]
  },
  { name: 'amount', label: 'Amount (Fixed)', type: 'number' as const },
  { name: 'percentage', label: 'Percentage', type: 'number' as const },
  { name: 'perMileRate', label: 'Per Mile Rate', type: 'number' as const },
  { 
    name: 'frequency', 
    label: 'Frequency', 
    type: 'select' as const, 
    required: true, 
    options: [
      { value: 'PER_SETTLEMENT', label: 'Per Settlement' },
      { value: 'WEEKLY', label: 'Weekly' },
      { value: 'BIWEEKLY', label: 'Biweekly' },
      { value: 'MONTHLY', label: 'Monthly' },
      { value: 'ONE_TIME', label: 'One Time' },
    ]
  },
  { name: 'minGrossPay', label: 'Min Gross Pay', type: 'number' as const },
  { name: 'maxAmount', label: 'Max Amount', type: 'number' as const },
  { name: 'isActive', label: 'Active', type: 'checkbox' as const },
  { name: 'notes', label: 'Notes', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Rule Name' },
  { 
    key: 'deductionType', 
    label: 'Type',
    render: (val: string) => {
      const labels: Record<string, string> = {
        // Deductions
        FUEL_ADVANCE: 'Fuel Advance',
        CASH_ADVANCE: 'Cash Advance',
        INSURANCE: 'Insurance',
        OCCUPATIONAL_ACCIDENT: 'Occupational Accident',
        TRUCK_PAYMENT: 'Truck Payment',
        TRUCK_LEASE: 'Truck Lease',
        ESCROW: 'Escrow',
        EQUIPMENT_RENTAL: 'Equipment Rental',
        MAINTENANCE: 'Maintenance',
        TOLLS: 'Tolls',
        PERMITS: 'Permits',
        FUEL_CARD: 'Fuel Card',
        FUEL_CARD_FEE: 'Fuel Card Fee',
        TRAILER_RENTAL: 'Trailer Rental',
        OTHER: 'Other',
        // Additions (Payments to driver)
        BONUS: 'Bonus',
        OVERTIME: 'Overtime',
        INCENTIVE: 'Incentive',
        REIMBURSEMENT: 'Reimbursement',
      };
      return labels[val] || val;
    }
  },
  { 
    key: 'calculationType', 
    label: 'Calculation',
    render: (val: string, row: any) => {
      if (val === 'FIXED' && row.amount) {
        return `$${Number(row.amount).toFixed(2)}`;
      }
      if (val === 'PERCENTAGE' && row.percentage) {
        return `${Number(row.percentage).toFixed(2)}%`;
      }
      if (val === 'PER_MILE' && row.perMileRate) {
        return `$${Number(row.perMileRate).toFixed(2)}/mile`;
      }
      return val;
    }
  },
  { 
    key: 'frequency', 
    label: 'Frequency',
    render: (val: string) => {
      const labels: Record<string, string> = {
        PER_SETTLEMENT: 'Per Settlement',
        WEEKLY: 'Weekly',
        BIWEEKLY: 'Biweekly',
        MONTHLY: 'Monthly',
        ONE_TIME: 'One Time',
      };
      return labels[val] || val;
    }
  },
  { 
    key: 'isActive', 
    label: 'Status',
    render: (val: boolean) => val ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>
  },
];

export default function DeductionRulesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Deduction Rules' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deduction Rules</h1>
          <p className="text-muted-foreground mt-2">
            Manage deduction rules for driver settlements. Configure automatic deductions for fuel advances, insurance, truck payments, and more.
          </p>
        </div>
        <GenericCRUDManager
          endpoint="/api/deduction-rules"
          queryKey="deduction-rules"
          title="Deduction Rules"
          description="Configure automatic deductions applied to driver settlements"
          searchable={true}
          fields={fields}
          columns={columns}
        />
      </div>
    </>
  );
}

