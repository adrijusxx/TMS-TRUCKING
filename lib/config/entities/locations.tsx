import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface LocationData {
  id: string;
  locationNumber: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactName?: string | null;
  contactPhone?: string | null;
  pickupCount: number;
  deliveryCount: number;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const columns: ExtendedColumnDef<LocationData>[] = [
  {
    id: 'locationNumber',
    accessorKey: 'locationNumber',
    header: 'Location #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/locations/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.locationNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    defaultVisible: true,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">{formatType(row.original.type)}</Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => (
      <div>
        <div>{row.original.address}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.city}, {row.original.state} {row.original.zip}
        </div>
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        {row.original.contactName && (
          <div className="text-sm">{row.original.contactName}</div>
        )}
        {row.original.contactPhone && (
          <div className="text-xs text-muted-foreground">{row.original.contactPhone}</div>
        )}
        {!row.original.contactName && !row.original.contactPhone && 'N/A'}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'pickupCount',
    accessorKey: 'pickupCount',
    header: 'Pickups',
    defaultVisible: false,
  },
  {
    id: 'deliveryCount',
    accessorKey: 'deliveryCount',
    header: 'Deliveries',
    defaultVisible: false,
  },
  {
    id: 'city',
    accessorKey: 'city',
    header: 'City',
    defaultVisible: false,
  },
  {
    id: 'state',
    accessorKey: 'state',
    header: 'State',
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'text',
    permission: 'locations.edit',
  },
  {
    key: 'mcNumberId',
    label: 'MC Number',
    type: 'select',
    options: [], // Will be populated dynamically by BulkEditDialog
    permission: 'mc_numbers.edit',
    placeholder: 'Select MC number',
  },
];

export const locationsTableConfig = createEntityTableConfig<LocationData>({
  entityType: 'locations',
  columns,
  defaultVisibleColumns: ['locationNumber', 'name', 'type', 'address', 'contact'],
  requiredColumns: ['locationNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'name', desc: false }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ],
});

