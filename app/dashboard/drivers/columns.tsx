'use client';

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { DriverStatus } from '@prisma/client';
import { Button } from '@/components/ui/button'; // Import Button if needed, or use span/link style

export interface DriverData {
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
  warnings?: string | null;
  teamDriver?: boolean;
  currentTruck?: { id: string; truckNumber: string } | null;
  currentTrailer?: { id: string; trailerNumber: string } | null;
  status: DriverStatus;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  // HR Fields
  employeeStatus?: string;
  driverType?: string;
  hireDate?: Date | null;
  payRate?: number | null;
  payType?: string | null;
  payTo?: string | null;
  licenseExpiry?: Date | null;
  medicalCardExpiry?: Date | null;
  mcNumberId: string;
  mcNumber?: { id: string; number: string; } | null;
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
  onEdit: (id: string) => void
): ExtendedColumnDef<DriverData>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div
          className="font-medium text-primary hover:underline cursor-pointer"
          onClick={() => onEdit(row.original.id)}
        >
          {row.original.user.firstName} {row.original.user.lastName}
        </div>
      ),
      defaultVisible: true,
      enableSorting: true,
      // Create a custom accessor for sorting by name
      accessorFn: (row: DriverData) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[120px] block">
          {row.original.user.phone || row.original.phone || '-'}
        </span>
      ),
      defaultVisible: true,
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[180px] block text-muted-foreground">
          {row.original.user.email || row.original.email || '-'}
        </span>
      ),
      defaultVisible: true,
    },
    {
      id: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[150px] block">
          {row.original.address1 || '-'}
        </span>
      ),
      defaultVisible: false,
    },
    {
      id: 'city',
      accessorKey: 'city',
      header: 'City',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.city || '-'}</span>
      ),
      defaultVisible: false,
    },
    {
      id: 'state',
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.state || '-'}</span>
      ),
      defaultVisible: false,
    },
    {
      id: 'zip',
      accessorKey: 'zipCode',
      header: 'Zip',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.zipCode || '-'}</span>
      ),
      defaultVisible: false,
    },
    {
      id: 'currentTruck',
      accessorKey: 'currentTruck.truckNumber',
      header: 'Truck',
      cell: ({ row }) => {
        const num = row.original.currentTruck?.truckNumber;
        return num ? <span className="font-mono">{num}</span> : '-';
      },
      defaultVisible: true,
    },
    {
      id: 'currentTrailer',
      accessorKey: 'currentTrailer.trailerNumber',
      header: 'Trailer',
      cell: ({ row }) => {
        const num = row.original.currentTrailer?.trailerNumber;
        return num ? <span className="font-mono">{num}</span> : '-';
      },
      defaultVisible: true,
    },
    {
      id: 'teamDriver',
      accessorKey: 'teamDriver',
      header: 'Team',
      cell: ({ row }) => row.original.teamDriver ? <Badge variant="secondary">Team</Badge> : null,
      defaultVisible: false,
    },
    {
      id: 'warnings',
      accessorKey: 'warnings',
      header: 'Warnings',
      cell: ({ row }) => {
        const w = row.original.warnings;
        if (!w) return null;
        return <Badge variant="destructive">{w}</Badge>;
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
    // HR Columns
    {
      id: 'employeeStatus',
      accessorKey: 'employeeStatus',
      header: 'Emp Status',
      cell: ({ row }) => {
        const status = row.original.employeeStatus;
        if (!status) return null;
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
      },
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'driverType',
      accessorKey: 'driverType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.driverType;
        if (!type) return null;
        return <Badge variant="outline">{type.replace(/_/g, ' ')}</Badge>;
      },
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'hireDate',
      accessorKey: 'hireDate',
      header: 'Hire Date',
      cell: ({ row }) => row.original.hireDate ? formatDate(row.original.hireDate) : '-',
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'pay',
      header: 'Pay',
      cell: ({ row }) => {
        if (!row.original.payRate) return null;
        return (
          <div className="text-xs">
            <span className="font-medium">${row.original.payRate.toFixed(2)}</span>
            {row.original.payType && <span className="text-muted-foreground ml-1">{row.original.payType.replace(/_/g, ' ')}</span>}
          </div>
        );
      },
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'payTo',
      accessorKey: 'payTo',
      header: 'Pay To',
      cell: ({ row }) => row.original.payTo || '-',
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'license',
      header: 'License',
      cell: ({ row }) => row.original.licenseExpiry ? formatDate(row.original.licenseExpiry) : '-',
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'medical',
      header: 'Medical',
      cell: ({ row }) => row.original.medicalCardExpiry ? formatDate(row.original.medicalCardExpiry) : '-',
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => {
        const mcNumber = row.original.mcNumber;
        return mcNumber ? (
          <span className="text-primary font-medium">
            {mcNumber.number}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'notes',
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[200px] block text-muted-foreground" title={row.original.notes || ''}>
          {row.original.notes || '-'}
        </span>
      ),
      defaultVisible: false,
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

