'use client';

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { updateEntityField } from '@/lib/utils/updateEntityField';
import { useQueryClient } from '@tanstack/react-query';
import { DriverStatus } from '@prisma/client';

interface DriverData {
  id: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  status: DriverStatus;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_DUTY: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVING: 'bg-purple-100 text-purple-800 border-purple-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DISPATCHED: 'bg-orange-100 text-orange-800 border-orange-200',
};

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createDriverColumns(
  onUpdate?: () => void
): ExtendedColumnDef<DriverData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    await updateEntityField('driver', rowId, columnId, value);
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
      id: 'driverNumber',
      accessorKey: 'driverNumber',
      header: 'Driver #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/drivers/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.driverNumber}
        </Link>
      ),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.user.firstName} {row.original.user.lastName}
          </div>
        </div>
      ),
      defaultVisible: true,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.user.phone || row.original.phone}
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
          value={row.original.user.email || row.original.email}
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
      header: 'Address',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.address1 || ''}
          rowId={row.original.id}
          columnId="address1"
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
      accessorKey: 'zipCode',
      header: 'Zip',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.zipCode || ''}
          rowId={row.original.id}
          columnId="zipCode"
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
      id: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => {
        const mcNumber = (row.original as any).mcNumber;
        return mcNumber ? (
          <Link
            href={`/dashboard/mc-numbers/${mcNumber.id}`}
            className="text-primary hover:underline"
          >
            {mcNumber.number}
          </Link>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
      defaultVisible: false,
    },
  ];
}

