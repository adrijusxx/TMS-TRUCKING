import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField, CustomBulkAction } from '@/components/data-table/types';
import { SettlementStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, DollarSign, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface SettlementData {
  id: string;
  settlementNumber: string;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    driverNumber: string;
  };
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  deductions: number;
  advances: number;
  netPay: number;
  status: SettlementStatus;
}

function formatStatus(status: SettlementStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const statusColors: Record<SettlementStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

export const createSettlementColumns = (onView?: (id: string) => void): ExtendedColumnDef<SettlementData>[] => [
  {
    id: 'settlementNumber',
    accessorKey: 'settlementNumber',
    header: 'Settlement #',
    cell: ({ row }) => (
      onView ? (
        <span
          className="text-primary hover:underline font-medium cursor-pointer"
          onClick={() => onView(row.original.id)}
        >
          {row.original.settlementNumber}
        </span>
      ) : (
        <Link
          href={`/dashboard/settlements/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.settlementNumber}
        </Link>
      )
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/drivers/${row.original.driver.id}`}
        className="text-primary hover:underline"
      >
        {row.original.driver.user.firstName} {row.original.driver.user.lastName}
      </Link>
    ),
    defaultVisible: true,
  },
  {
    id: 'period',
    header: 'Period',
    cell: ({ row }) => (
      <div>
        {formatDate(new Date(row.original.periodStart))} - {formatDate(new Date(row.original.periodEnd))}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'grossPay',
    accessorKey: 'grossPay',
    header: 'Gross Pay',
    cell: ({ row }) => formatCurrency(row.original.grossPay),
    defaultVisible: true,
  },
  {
    id: 'deductions',
    accessorKey: 'deductions',
    header: 'Deductions',
    cell: ({ row }) => formatCurrency(row.original.deductions),
    defaultVisible: true,
  },
  {
    id: 'advances',
    accessorKey: 'advances',
    header: 'Advances',
    cell: ({ row }) => formatCurrency(row.original.advances),
    defaultVisible: false,
  },
  {
    id: 'netPay',
    accessorKey: 'netPay',
    header: 'Net Pay',
    cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.netPay)}</span>
    ),
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={statusColors[row.original.status]}>
        {formatStatus(row.original.status)}
      </Badge>
    ),
    defaultVisible: true,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(SettlementStatus).map((status) => ({
      value: status,
      label: formatStatus(status as SettlementStatus),
    })),
    permission: 'settlements.edit',
  },
];

const customBulkActions: CustomBulkAction[] = [];

export const getSettlementsTableConfig = (onView?: (id: string) => void) => createEntityTableConfig<SettlementData>({
  entityType: 'settlements',
  columns: createSettlementColumns(onView),
  defaultVisibleColumns: [
    'settlementNumber',
    'driver',
    'period',
    'grossPay',
    'deductions',
    'netPay',
    'status',
  ],
  requiredColumns: ['settlementNumber'],
  bulkEditFields,
  customBulkActions,
  defaultSort: [{ id: 'periodEnd', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: Object.keys(SettlementStatus).map((status) => ({
        value: status,
        label: formatStatus(status as SettlementStatus),
      })),
    },
    {
      key: 'driverId',
      label: 'Driver',
      type: 'text',
    },
  ],
});

export const settlementsTableConfig = getSettlementsTableConfig();

