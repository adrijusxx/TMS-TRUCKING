import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentInstrumentBadge } from '@/components/company-expenses/PaymentInstrumentBadge';
import { ExpenseReceiptCell } from '@/components/company-expenses/ExpenseReceiptCell';
import { formatCurrency } from '@/lib/utils';
import type { ExtendedColumnDef, FilterDefinition } from '@/components/data-table/types';

const SOURCE_COLORS: Record<string, string> = {
  COMPANY_EXPENSE: 'info',
  BREAKDOWN_PAYMENT: 'warning',
  LOAD_EXPENSE: 'neutral',
};

const SOURCE_LABELS: Record<string, string> = {
  COMPANY_EXPENSE: 'Company',
  BREAKDOWN_PAYMENT: 'Breakdown',
  LOAD_EXPENSE: 'Load Exp.',
};

const APPROVAL_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
};

export function createCompanyExpenseColumns(): ExtendedColumnDef<any>[] {
  return [
    {
      id: 'date',
      accessorKey: 'date',
      header: 'Date',
      className: 'w-[100px] min-w-[90px]',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">{format(new Date(row.original.date), 'MMM d, yyyy')}</span>
      ),
    },
    {
      id: 'expenseNumber',
      accessorKey: 'expenseNumber',
      header: 'Ref #',
      className: 'w-[110px] min-w-[100px]',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{row.original.expenseNumber}</span>
      ),
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      className: 'w-full min-w-[180px]',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{row.original.description}</div>
          {row.original.linkedReference && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{row.original.linkedReference}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: 'Category',
      className: 'w-[120px] min-w-[100px]',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs inline-flex items-center gap-1.5">
          {row.original.categoryColor && (
            <span
              className="h-2 w-2 rounded-full shrink-0 inline-block"
              style={{ backgroundColor: row.original.categoryColor }}
            />
          )}
          <span className="truncate">{row.original.category}</span>
        </span>
      ),
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: 'Department',
      className: 'w-[110px] min-w-[90px]',
      enableSorting: true,
      filterType: 'select',
      filterOptions: [
        { value: 'OPERATIONS', label: 'Operations' },
        { value: 'FLEET', label: 'Fleet' },
        { value: 'RECRUITING', label: 'Recruiting' },
        { value: 'DISPATCH', label: 'Dispatch' },
        { value: 'SAFETY', label: 'Safety' },
        { value: 'ACCOUNTING', label: 'Accounting' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'OTHER', label: 'Other' },
      ],
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">{row.original.department || '—'}</span>
      ),
    },
    {
      id: 'paymentInstrument',
      accessorKey: 'paymentInstrument',
      header: 'Card / Account',
      className: 'w-[130px] min-w-[110px]',
      cell: ({ row }) =>
        row.original.paymentInstrument ? (
          <PaymentInstrumentBadge
            name={row.original.paymentInstrument.name}
            lastFour={row.original.paymentInstrument.lastFour}
            color={row.original.paymentInstrument.color}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'vendor',
      accessorKey: 'vendor',
      header: 'Vendor',
      className: 'w-[120px] min-w-[80px]',
      cell: ({ row }) => (
        <span className="text-xs truncate block text-muted-foreground">
          {row.original.vendor ?? '—'}
        </span>
      ),
    },
    {
      id: 'approvalStatus',
      accessorKey: 'approvalStatus',
      header: 'Status',
      className: 'w-[90px] min-w-[80px]',
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
      cell: ({ row }) =>
        row.original.approvalStatus ? (
          <Badge variant={APPROVAL_COLORS[row.original.approvalStatus] ?? 'neutral'} size="xs">
            {row.original.approvalStatus}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'source',
      accessorKey: 'source',
      header: 'Source',
      className: 'w-[90px] min-w-[80px]',
      filterType: 'select',
      filterOptions: [
        { value: 'COMPANY_EXPENSE', label: 'Company Expenses' },
        { value: 'BREAKDOWN_PAYMENT', label: 'Breakdown / Fuel' },
        { value: 'LOAD_EXPENSE', label: 'Load Expenses' },
      ],
      cell: ({ row }) => (
        <Badge variant={(SOURCE_COLORS[row.original.source] as any) ?? 'neutral'} size="xs">
          {SOURCE_LABELS[row.original.source] ?? row.original.source}
        </Badge>
      ),
    },
    {
      id: 'receipt',
      accessorKey: 'receiptUrl',
      header: 'Receipt',
      className: 'w-[80px] min-w-[70px]',
      cell: ({ row }) => (
        <ExpenseReceiptCell
          id={row.original.id}
          source={row.original.source}
          receiptUrl={row.original.receiptUrl}
        />
      ),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      className: 'w-[100px] min-w-[80px] text-right',
      enableSorting: true,
      aggregation: { type: 'sum', formatter: (v) => formatCurrency(v) },
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums">{formatCurrency(row.original.amount)}</span>
      ),
    },
  ];
}

export const companyExpenseFilterDefinitions: FilterDefinition[] = [
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: [
      { value: 'COMPANY_EXPENSE', label: 'Company Expenses' },
      { value: 'BREAKDOWN_PAYMENT', label: 'Breakdown / Fuel' },
      { value: 'LOAD_EXPENSE', label: 'Load Expenses' },
    ],
  },
  {
    key: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'OPERATIONS', label: 'Operations' },
      { value: 'FLEET', label: 'Fleet' },
      { value: 'RECRUITING', label: 'Recruiting' },
      { value: 'DISPATCH', label: 'Dispatch' },
      { value: 'SAFETY', label: 'Safety' },
      { value: 'ACCOUNTING', label: 'Accounting' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'OTHER', label: 'Other' },
    ],
  },
  {
    key: 'approvalStatus',
    label: 'Approval',
    type: 'select',
    options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'REJECTED', label: 'Rejected' },
    ],
  },
  {
    key: 'hasReceipt',
    label: 'Receipt',
    type: 'select',
    options: [
      { value: 'true', label: 'Has Receipt' },
      { value: 'false', label: 'Missing Receipt' },
    ],
  },
  {
    key: 'date',
    label: 'Date Range',
    type: 'daterange',
  },
];
