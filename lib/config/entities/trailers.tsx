import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { EditableCell } from '@/components/ui/editable-cell';
import { EntityLink } from '@/components/common/EntityLink';
import McBadge from '@/components/mc-numbers/McBadge';
import { updateEntityField } from '@/lib/utils/updateEntityField';
import { formatDate } from '@/lib/utils';

export interface TrailerData {
  id: string;
  trailerNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  type: string | null;
  status: string | null;
  fleetStatus: string | null;
  mcNumberId?: string | null;
  mcNumber?: { id: string; number: string; companyName?: string } | null;
  assignedTruckId?: string | null;
  assignedTruck?: { id: string; truckNumber: string } | null;
  operatorDriver?: { id: string; driverNumber: string; name: string } | null;
  loadCount?: number;
  activeLoads?: number;
  lastUsed?: Date | null;
  registrationExpiry?: Date | null;
  insuranceExpiry?: Date | null;
  inspectionExpiry?: Date | null;
  ownership?: string | null;
  createdAt: Date;
  notes?: string | null;
}

function getTrailerStatusStyle(status: string | null): { badge: string; dot: string } {
  const s = (status ?? '').toUpperCase();
  if (s === 'AVAILABLE') return { badge: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' };
  if (s === 'IN_USE' || s === 'ASSIGNED') return { badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
  if (s === 'MAINTENANCE') return { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' };
  if (s === 'OUT_OF_SERVICE') return { badge: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' };
  if (s === 'INACTIVE') return { badge: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-400' };
  return { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
}

const handleSave = async (rowId: string, columnId: string, value: string | number) => {
  await updateEntityField('trailer', rowId, columnId, value);
};

const columns: ExtendedColumnDef<TrailerData>[] = [
  {
    id: 'trailerNumber',
    accessorKey: 'trailerNumber',
    header: 'Trailer #',
    cell: ({ row }) => {
      const { dot } = getTrailerStatusStyle(row.original.status);
      return (
        <div className="flex items-center gap-2 cursor-pointer">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} title={row.original.status ?? 'Unknown'} />
          <span className="text-primary hover:underline font-medium">
            {row.original.trailerNumber}
          </span>
        </div>
      );
    },
    defaultVisible: true,
    required: true,
  },
  {
    id: 'vehicle',
    header: 'Vehicle',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.year ? `${row.original.year} ` : ''}
          {row.original.make} {row.original.model}
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
    cell: ({ row }) =>
      row.original.licensePlate
        ? `${row.original.licensePlate}${row.original.state ? ` (${row.original.state})` : ''}`
        : '—',
    defaultVisible: true,
  },
  {
    id: 'vin',
    accessorKey: 'vin',
    header: 'VIN',
    cell: ({ row }) => <span className="font-mono">{row.original.vin || '-'}</span>,
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
    cell: ({ row }) => row.original.year || '-',
    defaultVisible: false,
  },
  {
    id: 'state',
    accessorKey: 'state',
    header: 'State',
    cell: ({ row }) => row.original.state || '-',
    defaultVisible: false,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => row.original.type?.replace(/_/g, ' ') || '-',
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      if (!row.original.status) return <span className="text-muted-foreground">-</span>;
      const { badge } = getTrailerStatusStyle(row.original.status);
      const label = row.original.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return <Badge variant="outline" className={badge}>{label}</Badge>;
    },
    defaultVisible: true,
  },
  {
    id: 'assignedTruck',
    header: 'Assigned Truck',
    cell: ({ row }) => {
      if (row.original.assignedTruck) {
        return (
          <EntityLink entityType="trucks" entityId={row.original.assignedTruck.id}>
            {row.original.assignedTruck.truckNumber}
          </EntityLink>
        );
      }
      return <span className="text-muted-foreground">Unassigned</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'loadCount',
    accessorKey: 'loadCount',
    header: 'Total Loads',
    cell: ({ row }) => row.original.loadCount ?? 0,
    defaultVisible: true,
  },
  {
    id: 'activeLoads',
    accessorKey: 'activeLoads',
    header: 'Active Loads',
    cell: ({ row }) => (
      <Badge variant={(row.original.activeLoads ?? 0) > 0 ? 'default' : 'outline'}>
        {row.original.activeLoads ?? 0}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'fleetStatus',
    accessorKey: 'fleetStatus',
    header: 'Fleet Status',
    cell: ({ row }) => row.original.fleetStatus || '—',
    defaultVisible: false,
  },
  {
    id: 'ownership',
    accessorKey: 'ownership',
    header: 'Ownership',
    cell: ({ row }) => row.original.ownership || '—',
    defaultVisible: false,
  },
  {
    id: 'lastUsed',
    accessorKey: 'lastUsed',
    header: 'Last Used',
    cell: ({ row }) => (row.original.lastUsed ? formatDate(row.original.lastUsed) : 'Never'),
    defaultVisible: false,
  },
  {
    id: 'registrationExpiry',
    accessorKey: 'registrationExpiry',
    header: 'Registration Expiry',
    cell: ({ row }) => row.original.registrationExpiry ? formatDate(row.original.registrationExpiry) : '—',
    defaultVisible: false,
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
    options: [
      { value: 'AVAILABLE', label: 'Available' },
      { value: 'IN_USE', label: 'In Use' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
    ],
    permission: 'trailers.edit',
  },
  {
    key: 'fleetStatus',
    label: 'Fleet Status',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SOLD', label: 'Sold' },
      { value: 'RETIRED', label: 'Retired' },
    ],
    permission: 'trailers.edit',
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

export const trailersTableConfig = createEntityTableConfig<TrailerData>({
  entityType: 'trailers',
  columns,
  defaultVisibleColumns: [
    'trailerNumber',
    'vehicle',
    'licensePlate',
    'type',
    'status',
    'assignedTruck',
    'loadCount',
    'activeLoads',
    'mcNumber',
  ],
  requiredColumns: ['trailerNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'trailerNumber', desc: false }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    { key: 'type', label: 'Type', type: 'text' },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [],
      permission: 'mc_numbers.view',
    },
    { key: 'make', label: 'Make', type: 'text' },
    { key: 'state', label: 'License State', type: 'text' },
  ],
});
