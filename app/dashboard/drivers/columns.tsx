'use client';

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { DriverStatus } from '@prisma/client';
import { Truck, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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
  } | null;
  // Performance (visible to all)
  totalLoads?: number;
  onTimePercentage?: number;
  rating?: number | null;
  // HR Fields
  employeeStatus?: string;
  driverType?: string;
  hireDate?: Date | null;
  payRate?: number | null;
  payType?: string | null;
  payTo?: string | null;
  licenseNumber?: string | null;
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

// Deterministic avatar color based on first char of driverNumber
const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

function getAvatarColor(key: string): string {
  const code = key.charCodeAt(0) || 0;
  return avatarColors[code % avatarColors.length];
}

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

type ComplianceStatus = 'ok' | 'expiring' | 'expired' | 'missing';

function getCdlComplianceStatus(licenseNumber: string | null | undefined, expiry: Date | null | undefined): ComplianceStatus {
  // Placeholder license number means safety data was never entered
  if (!licenseNumber || licenseNumber.toUpperCase().startsWith('PENDING')) return 'missing';
  if (!expiry) return 'missing';
  const now = new Date();
  const msIn60Days = 60 * 24 * 60 * 60 * 1000;
  if (expiry < now) return 'expired';
  if (expiry.getTime() - now.getTime() < msIn60Days) return 'expiring';
  return 'ok';
}

function getMedComplianceStatus(expiry: Date | null | undefined): ComplianceStatus {
  if (!expiry) return 'missing';
  const now = new Date();
  const msIn60Days = 60 * 24 * 60 * 60 * 1000;
  // If exactly 1 year from today (within a day), it's a defaulted placeholder
  const msFromNow = expiry.getTime() - now.getTime();
  const msIn370Days = 370 * 24 * 60 * 60 * 1000;
  const msIn360Days = 360 * 24 * 60 * 60 * 1000;
  if (msFromNow > msIn360Days && msFromNow < msIn370Days) return 'missing';
  if (expiry < now) return 'expired';
  if (msFromNow < msIn60Days) return 'expiring';
  return 'ok';
}

function getPayProfileStatus(payType: string | null | undefined, payRate: number | null | undefined): ComplianceStatus {
  if (!payType || !payRate) return 'missing';
  return 'ok';
}

function ComplianceDot({ label, status }: { label: string; status: ComplianceStatus }) {
  const dotClass =
    status === 'ok' ? 'bg-green-500' :
    status === 'expiring' ? 'bg-yellow-400' :
    'bg-red-500';
  const textClass =
    status === 'ok' ? 'text-green-700' :
    status === 'expiring' ? 'text-yellow-700' :
    'text-red-700';
  const sublabel = status === 'missing' ? 'N/A' : status === 'expired' ? 'Exp' : status === 'expiring' ? 'Soon' : '';
  return (
    <span className="inline-flex items-center gap-1" title={`${label}: ${status}`}>
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className={`text-xs font-medium ${textClass}`}>{label}{sublabel ? ` ${sublabel}` : ''}</span>
    </span>
  );
}

export function createDriverColumns(
  onEdit: (id: string) => void
): ExtendedColumnDef<DriverData>[] {
  return [
    {
      id: 'name',
      header: 'Driver',
      cell: ({ row }) => {
        const user = row.original.user;
        const firstName = user?.firstName ?? row.original.firstName;
        const lastName = user?.lastName ?? row.original.lastName;
        const displayName = firstName || lastName
          ? `${firstName} ${lastName}`.trim()
          : `Unlinked (${row.original.driverNumber})`;
        const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
        const colorClass = getAvatarColor(row.original.driverNumber);

        return (
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onEdit(row.original.id)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colorClass}`}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-primary hover:underline leading-tight truncate">
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground font-mono leading-tight">
                {row.original.driverNumber}
              </div>
            </div>
          </div>
        );
      },
      defaultVisible: true,
      enableSorting: true,
      accessorFn: (row: DriverData) =>
        row.user ? `${row.user.firstName} ${row.user.lastName}` : row.driverNumber,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[120px] block">
          {row.original.user?.phone || row.original.phone || '-'}
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
          {row.original.user?.email || row.original.email || '-'}
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
        return num ? (
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm">{num}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/50">
            <Truck className="h-3 w-3 shrink-0" />
            <span className="text-sm">-</span>
          </div>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'currentTrailer',
      accessorKey: 'currentTrailer.trailerNumber',
      header: 'Trailer',
      cell: ({ row }) => {
        const num = row.original.currentTrailer?.trailerNumber;
        return num ? (
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm">{num}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/50">
            <Package className="h-3 w-3 shrink-0" />
            <span className="text-sm">-</span>
          </div>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        const loads = row.original.totalLoads ?? 0;
        const otp = row.original.onTimePercentage ?? 100;
        const otpColor =
          otp >= 90
            ? 'text-green-700'
            : otp >= 75
            ? 'text-yellow-700'
            : 'text-red-700';
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{loads} loads</span>
            <span className="text-muted-foreground/40">·</span>
            <span className={`font-medium ${otpColor}`}>{otp.toFixed(0)}% OTP</span>
          </div>
        );
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
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
            <Badge variant="destructive" className="text-xs">{w}</Badge>
          </div>
        );
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
      id: 'compliance',
      header: 'Profile',
      cell: ({ row }) => {
        const cdlStatus = getCdlComplianceStatus(row.original.licenseNumber, row.original.licenseExpiry ?? null);
        const medStatus = getMedComplianceStatus(row.original.medicalCardExpiry ?? null);
        const payStatus = getPayProfileStatus(row.original.payType, row.original.payRate);
        return (
          <div className="flex items-center gap-2">
            <ComplianceDot label="CDL" status={cdlStatus} />
            <ComplianceDot label="Med" status={medStatus} />
            <ComplianceDot label="Pay" status={payStatus} />
          </div>
        );
      },
      defaultVisible: true,
      permission: 'hr.view',
    },
    {
      id: 'employeeStatus',
      accessorKey: 'employeeStatus',
      header: 'Emp Status',
      cell: ({ row }) => {
        const status = row.original.employeeStatus;
        if (!status) return null;
        return <Badge variant="secondary">{status}</Badge>;
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
        if (!type) return <span className="text-muted-foreground text-sm">-</span>;
        const label = type === 'OWNER_OPERATOR' ? 'Owner Op' : type === 'COMPANY_DRIVER' ? 'Company' : type.replace(/_/g, ' ');
        return <Badge variant="outline" className="whitespace-nowrap">{label}</Badge>;
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
      header: 'License Exp',
      cell: ({ row }) => row.original.licenseExpiry ? formatDate(row.original.licenseExpiry) : '-',
      defaultVisible: false,
      permission: 'hr.view',
    },
    {
      id: 'medical',
      header: 'Med Exp',
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
