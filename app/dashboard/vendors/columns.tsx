'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { updateEntityField } from '@/lib/utils/updateEntityField';

interface VendorData {
  id: string;
  vendorNumber: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  notes?: string | null;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createVendorColumns(
  onUpdate?: () => void
): ExtendedColumnDef<VendorData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    await updateEntityField('vendor', rowId, columnId, value);
    onUpdate?.();
  };

  return [
    {
      id: 'vendorNumber',
      accessorKey: 'vendorNumber',
      header: 'Vendor #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/vendors/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.vendorNumber}
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
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.phone || ''}
          rowId={row.original.id}
          columnId="phone"
          onSave={handleSave}
          type="text"
          placeholder="Enter phone number"
        />
      ),
      defaultVisible: true,
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.email || ''}
          rowId={row.original.id}
          columnId="email"
          onSave={handleSave}
          type="text"
          placeholder="Enter email"
        />
      ),
      defaultVisible: true,
    },
    {
      id: 'address',
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.address || ''}
          rowId={row.original.id}
          columnId="address"
          onSave={handleSave}
          type="text"
          placeholder="Enter address"
        />
      ),
      defaultVisible: true,
    },
    {
      id: 'city',
      accessorKey: 'city',
      header: 'City',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.city || ''}
          rowId={row.original.id}
          columnId="city"
          onSave={handleSave}
          type="text"
          placeholder="Enter city"
        />
      ),
      defaultVisible: true,
    },
    {
      id: 'state',
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.state || ''}
          rowId={row.original.id}
          columnId="state"
          onSave={handleSave}
          type="text"
          placeholder="Enter state"
        />
      ),
      defaultVisible: true,
    },
    {
      id: 'zip',
      accessorKey: 'zip',
      header: 'Zip',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.zip || ''}
          rowId={row.original.id}
          columnId="zip"
          onSave={handleSave}
          type="text"
          placeholder="Enter zip code"
        />
      ),
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
      id: 'status',
      accessorKey: 'type',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline">{formatType(row.original.type)}</Badge>
      ),
      defaultVisible: false,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
      defaultVisible: false,
    },
  ];
}

