'use client';

import { useQuery } from '@tanstack/react-query';
import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { apiUrl } from '@/lib/utils';

// Fetch template count for limit display
async function fetchTemplateCount() {
  const res = await fetch(apiUrl('/api/deduction-rules'));
  if (!res.ok) return { count: 0 };
  const data = await res.json();
  return { count: data.data?.length || 0 };
}

const fields = [
  { name: 'name', label: 'Template Name', type: 'text' as const, required: true },
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
      // Additions
      { value: 'BONUS', label: 'Bonus' },
      { value: 'OVERTIME', label: 'Overtime' },
      { value: 'INCENTIVE', label: 'Incentive' },
      { value: 'REIMBURSEMENT', label: 'Reimbursement' },
    ]
  },
  {
    name: 'driverType',
    label: 'Driver Type (Optional)',
    type: 'select' as const,
    options: [
      { value: '', label: 'All Drivers' },
      { value: 'COMPANY_DRIVER', label: 'Company Driver' },
      { value: 'OWNER_OPERATOR', label: 'Owner Operator' },
      { value: 'LEASE', label: 'Lease' },
    ]
  },
  {
    name: 'calculationType',
    label: 'Calculation',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'FIXED', label: 'Fixed Amount' },
      { value: 'PERCENTAGE', label: 'Percentage of Gross' },
      { value: 'PER_MILE', label: 'Per Mile' },
    ]
  },
  { name: 'amount', label: 'Fixed Amount ($)', type: 'number' as const },
  { name: 'percentage', label: 'Percentage (%)', type: 'number' as const },
  { name: 'perMileRate', label: 'Per Mile Rate ($)', type: 'number' as const },
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
  { name: 'minGrossPay', label: 'Min Gross Pay ($)', type: 'number' as const },
  { name: 'maxAmount', label: 'Max Amount ($)', type: 'number' as const },
  { name: 'isActive', label: 'Active', type: 'checkbox' as const },
  { name: 'notes', label: 'Notes', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Template Name' },
  {
    key: 'deductionType',
    label: 'Type',
    render: (val: string) => {
      const labels: Record<string, string> = {
        FUEL_ADVANCE: 'Fuel Advance',
        CASH_ADVANCE: 'Cash Advance',
        INSURANCE: 'Insurance',
        OCCUPATIONAL_ACCIDENT: 'Occ. Accident',
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
    label: 'Amount',
    render: (val: string, row: any) => {
      if (val === 'FIXED' && row.amount) return `$${Number(row.amount).toFixed(2)}`;
      if (val === 'PERCENTAGE' && row.percentage) return `${Number(row.percentage).toFixed(1)}%`;
      if (val === 'PER_MILE' && row.perMileRate) return `$${Number(row.perMileRate).toFixed(2)}/mi`;
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

export default function DeductionTemplatesPage() {
  const { data: countData } = useQuery({
    queryKey: ['deduction-templates-count'],
    queryFn: fetchTemplateCount,
    staleTime: 30000,
  });

  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Settings', href: '/dashboard/accounting/settings' },
        { label: 'Deduction Templates' }
      ]} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deduction Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create reusable templates for driver deductions and additions.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {countData?.count || 0} / 1000 templates
          </Badge>
        </div>
        <GenericCRUDManager
          endpoint="/api/deduction-rules"
          queryKey="deduction-rules"
          title="Templates"
          description="Templates are applied automatically during settlement generation"
          searchable={true}
          fields={fields}
          columns={columns}
        />
      </div>
    </>
  );
}
