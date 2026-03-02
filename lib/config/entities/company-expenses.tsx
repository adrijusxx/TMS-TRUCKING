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
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs">{format(new Date(row.original.date), 'MMM d, yyyy')}</span>
      ),
    },
    {
      id: 'expenseNumber',
      accessorKey: 'expenseNumber',
      header: 'Ref #',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.original.expenseNumber}</span>
      ),
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <div className="truncate text-xs font-medium">{row.original.description}</div>
          {row.original.linkedReference && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-2.5 w-2.5" />
              {row.original.linkedReference}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: 'Category',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs inline-flex items-center gap-1">
          {row.original.categoryColor && (
            <span
              className="h-2 w-2 rounded-full shrink-0 inline-block"
              style={{ backgroundColor: row.original.categoryColor }}
            />
          )}
          <span className="truncate max-w-[100px]">{row.original.category}</span>
        </span>
      ),
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: 'Department',
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
        <span className="text-xs text-muted-foreground">{row.original.department || '—'}</span>
      ),
    },
    {
      id: 'paymentInstrument',
      accessorKey: 'paymentInstrument',
      header: 'Card / Account',
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
      cell: ({ row }) => (
        <span className="text-xs truncate block max-w-[80px] text-muted-foreground">
          {row.original.vendor ?? '—'}
        </span>
      ),
    },
    {
      id: 'approvalStatus',
      accessorKey: 'approvalStatus',
      header: 'Status',
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
      enableSorting: true,
      className: 'text-right',
      aggregation: { type: 'sum', formatter: (v) => formatCurrency(v) },
      cell: ({ row }) => (
        <span className="text-xs font-medium">{formatCurrency(row.original.amount)}</span>
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
