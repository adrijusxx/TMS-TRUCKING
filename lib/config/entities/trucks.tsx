import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { TruckStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { EditableCell } from '@/components/ui/editable-cell';
import { EntityLink } from '@/components/common/EntityLink';
import McBadge from '@/components/mc-numbers/McBadge';
import { updateEntityField } from '@/lib/utils/updateEntityField';

export interface TruckData {
  id: string;
  truckNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  equipmentType?: string;
  status: TruckStatus;
  createdAt: Date;
  notes?: string | null;
  currentDrivers?: Array<{
    id: string;
    driverNumber: string;
    user: { firstName: string; lastName: string };
  }>;
  odometerReading?: number | null;
  nextInspectionDue?: Date | null;
  _count?: { documents: number };
  mcNumber?: { id: string; number: string; companyName?: string } | null;
}

const statusColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
  MAINTENANCE_DUE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  NEEDS_REPAIR: 'bg-red-100 text-red-800 border-red-200',
};

const statusDotColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-500',
  IN_USE: 'bg-blue-500',
  MAINTENANCE: 'bg-orange-500',
  MAINTENANCE_DUE: 'bg-yellow-400',
  OUT_OF_SERVICE: 'bg-red-500',
  INACTIVE: 'bg-gray-400',
  NEEDS_REPAIR: 'bg-red-600',
};

function formatStatus(status: TruckStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const handleSave = async (rowId: string, columnId: string, value: string | number) => {
  await updateEntityField('truck', rowId, columnId, value);
};

const columns: ExtendedColumnDef<TruckData>[] = [
  {
    id: 'truckNumber',
    accessorKey: 'truckNumber',
    header: 'Truck #',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 cursor-pointer">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${statusDotColors[row.original.status]}`}
          title={formatStatus(row.original.status)}
        />
        <span className="text-primary hover:underline font-medium">
          {row.original.truckNumber}
        </span>
      </div>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'vehicle',
    header: 'Vehicle',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.year} {row.original.make} {row.original.model}
        </div>
        {row.original.vin && (
          <div className="text-sm text-muted-foreground">
            VIN: {row.original.vin.slice(0, 8)}...
          </div>
        )}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'licensePlate',
    accessorKey: 'licensePlate',
    header: 'License Plate',
    cell: ({ row }) => `${row.original.licensePlate} (${row.original.state})`,
    defaultVisible: true,
  },
  {
    id: 'vin',
    accessorKey: 'vin',
    header: 'VIN',
    cell: ({ row }) => <span className="font-mono">{row.original.vin}</span>,
    defaultVisible: false,
  },
  {
    id: 'make',
    accessorKey: 'make',
    header: 'Make',
    defaultVisible: false,
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: 'Model',
    defaultVisible: false,
  },
  {
    id: 'year',
    accessorKey: 'year',
    header: 'Year',
    defaultVisible: false,
  },
  {
    id: 'state',
    accessorKey: 'state',
    header: 'State',
    defaultVisible: false,
  },
  {
    id: 'equipmentType',
    accessorKey: 'equipmentType',
    header: 'Equip Type',
    cell: ({ row }) => row.original.equipmentType?.replace(/_/g, ' ') || '-',
    defaultVisible: true,
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) => {
      if (row.original.currentDrivers && row.original.currentDrivers.length > 0) {
        return (
          <div>
            {row.original.currentDrivers.map((driver) => (
              <EntityLink
                key={driver.id}
                entityType="drivers"
                entityId={driver.id}
                className="text-primary hover:underline block cursor-pointer"
              >
                {driver.user.firstName} {driver.user.lastName}
              </EntityLink>
            ))}
          </div>
        );
      }
      return <span className="text-muted-foreground">Unassigned</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'odometerReading',
    accessorKey: 'odometerReading',
    header: 'Odometer',
    cell: ({ row }) => {
      const reading = row.original.odometerReading;
      return reading != null ? reading.toLocaleString() : '—';
    },
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
  {
    id: 'annualInspectionExpiry',
    header: 'Annual Inspection',
    cell: ({ row }) => {
      const date = row.original.nextInspectionDue;
      if (!date) return <span className="text-muted-foreground">-</span>;
      const d = new Date(date);
      const now = new Date();
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const formatted = d.toLocaleDateString();
      if (diffDays < 0) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">{formatted}</span>
            <Badge variant="destructive" className="text-xs">EXPIRED</Badge>
          </div>
        );
      }
      if (diffDays <= 30) {
        return <span className="text-yellow-600 font-medium">{formatted}</span>;
      }
      return <span>{formatted}</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'hasDocuments',
    header: 'Docs',
    cell: ({ row }) => {
      const count = row.original._count?.documents ?? 0;
      if (count > 0) {
        return <Badge variant="secondary">{count} doc{count !== 1 ? 's' : ''}</Badge>;
      }
      return <span className="text-muted-foreground">-</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'notes',
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.notes || ''}
        rowId={row.original.id}
        columnId="notes"
        onSave={handleSave}
        type="text"
        placeholder="Enter notes"
      />
    ),
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => {
      const mcNumber = row.original.mcNumber;
      return mcNumber ? (
        <McBadge
          mcNumber={mcNumber.number}
          mcNumberId={mcNumber.id}
          companyName={mcNumber.companyName}
          size="sm"
        />
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
    defaultVisible: true,
    permission: 'mc_numbers.view',
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.values(TruckStatus).map(status => ({
      value: status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    })),
    permission: 'trucks.edit',
  },
  {
    key: 'mcNumberId',
    label: 'MC Number',
    type: 'select',
    options: [],
    permission: 'mc_numbers.edit',
    placeholder: 'Select MC Number',
  },
];

export const trucksTableConfig = createEntityTableConfig<TruckData>({
  entityType: 'trucks',
  columns,
  defaultVisibleColumns: [
    'truckNumber',
    'vehicle',
    'licensePlate',
    'equipmentType',
    'driver',
    'odometerReading',
    'status',
    'annualInspectionExpiry',
    'hasDocuments',
    'mcNumber',
  ],
  requiredColumns: ['truckNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'truckNumber', desc: false }],
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
      options: Object.keys(TruckStatus).map((status) => ({
        value: status,
        label: formatStatus(status as TruckStatus),
      })),
    },
    { key: 'make', label: 'Make', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'equipmentType', label: 'Equipment Type', type: 'text' },
    { key: 'state', label: 'License State', type: 'text' },
  ],
});
