'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { updateEntityField } from '@/lib/utils/updateEntityField';
import { CustomerType } from '@prisma/client';

interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  type: CustomerType;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  warning: string | null;
  createdAt: Date;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createCustomerColumns(
  onUpdate?: () => void
): ExtendedColumnDef<CustomerData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    await updateEntityField('customer', rowId, columnId, value);
    onUpdate?.();
  };

  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => row.original.id,
      defaultVisible: false,
    },
    {
      id: 'customerNumber',
      accessorKey: 'customerNumber',
      header: 'Customer #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/customers/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.customerNumber}
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
        <Badge variant="outline">{formatCustomerType(row.original.type)}</Badge>
      ),
      defaultVisible: true,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.phone}
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
          value={row.original.email}
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
          value={row.original.address}
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
          value={row.original.city}
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
          value={row.original.state}
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
          value={row.original.zip}
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
      accessorKey: 'warning',
      header: 'Notes',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.warning || ''}
          rowId={row.original.id}
          columnId="warning"
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
        <Badge variant="outline">{formatCustomerType(row.original.type)}</Badge>
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

