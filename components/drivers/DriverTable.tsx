'use client';

import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeletedRecordBadge } from '@/components/common/DeletedRecordBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { DriverStatus, EmployeeStatus, AssignmentStatus, DispatchStatus, DriverType } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import DriverExpandedEdit from './DriverExpandedEdit';
import QuickAssignmentDialog from './QuickAssignmentDialog';
import { usePermissions } from '@/hooks/usePermissions';

interface Driver {
  id: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  driverType: DriverType;
  mcNumber: { id: string; number: string } | null;
  status: DriverStatus;
  employeeStatus: EmployeeStatus;
  assignmentStatus: AssignmentStatus;
  dispatchStatus: DispatchStatus | null;
  truck?: { id: string; truckNumber: string } | null;
  trailer?: { id: string; trailerNumber: string } | null;
  currentTruckId?: string | null;
  currentTrailerId?: string | null;
  mcNumberId?: string | null;
  userId?: string;
  teamDriver: boolean;
  payTo: string | null;
  driverTariff: string | null;
  warnings: string | null;
  notes: string | null;
  hireDate: Date | null;
  terminationDate: Date | null;
  driverTags: string[];
  deletedAt?: Date | null; // For admin visibility
  isActive?: boolean;
}

interface DriverTableProps {
  drivers: Driver[];
  selectedDriverIds: string[];
  onSelectDriver: (driverId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  visibleColumns?: {
    checkbox?: boolean;
    driverNumber?: boolean;
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    status?: boolean;
    employeeStatus?: boolean;
    assignmentStatus?: boolean;
    dispatchStatus?: boolean;
    driverType?: boolean;
    mcNumber?: boolean;
    teamDriver?: boolean;
    truck?: boolean;
    trailer?: boolean;
    payTo?: boolean;
    driverTariff?: boolean;
    warnings?: boolean;
    tags?: boolean;
    actions?: boolean;
  };
}

const getAssignmentStatusIcon = (status: AssignmentStatus) => {
  switch (status) {
    case 'READY_TO_GO':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'NOT_READY':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'TERMINATED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

const getAssignmentStatusText = (status: AssignmentStatus) => {
  switch (status) {
    case 'READY_TO_GO':
      return 'Ready to go';
    case 'NOT_READY':
      return 'Not ready';
    case 'TERMINATED':
      return 'Terminated';
    default:
      return status;
  }
};

const getEmployeeStatusBadge = (status: EmployeeStatus) => {
  const colors = {
    ACTIVE: 'bg-green-500 text-white',
    TERMINATED: 'bg-red-500 text-white',
    APPLICANT: 'bg-blue-500 text-white',
  };
  return (
    <Badge className={colors[status] || 'bg-gray-500 text-white'}>
      {status}
    </Badge>
  );
};

const getDriverStatusBadge = (status: DriverStatus) => {
  const colors = {
    AVAILABLE: 'bg-green-500 text-white',
    IN_TRANSIT: 'bg-orange-500 text-white',
    DISPATCHED: 'bg-blue-500 text-white',
    INACTIVE: 'bg-red-500 text-white',
    ON_DUTY: 'bg-blue-500 text-white',
    DRIVING: 'bg-purple-500 text-white',
    OFF_DUTY: 'bg-gray-500 text-white',
    SLEEPER_BERTH: 'bg-indigo-500 text-white',
    ON_LEAVE: 'bg-yellow-500 text-white',
  };
  return (
    <Badge className={colors[status] || 'bg-gray-500 text-white'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

const getDispatchStatusBadge = (status: DispatchStatus | null) => {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const colors = {
    DISPATCHED: 'bg-blue-500 text-white',
    ENROUTE: 'bg-orange-500 text-white',
    TERMINATION: 'bg-red-500 text-white',
    REST: 'bg-red-500 text-white',
    AVAILABLE: 'bg-green-500 text-white',
  };
  return (
    <Badge className={colors[status] || 'bg-gray-500 text-white'}>
      {status}
    </Badge>
  );
};

const formatDriverType = (type: DriverType) => {
  return type.replace(/_/g, ' ');
};

export default function DriverTable({
  drivers,
  selectedDriverIds,
  onSelectDriver,
  onSelectAll,
  allSelected,
  someSelected,
  canEdit,
  canDelete,
  visibleColumns = {},
  onDriverUpdate,
}: DriverTableProps & { onDriverUpdate?: () => void }) {
  const { can } = usePermissions();
  const canAssign = can('drivers.edit') || can('loads.assign');
  const [quickAssignDriver, setQuickAssignDriver] = useState<{
    id: string;
    driverNumber: string;
    user: { firstName: string; lastName: string };
    currentTruck?: { id: string; truckNumber: string } | null;
    currentTrailer?: { id: string; trailerNumber: string } | null;
  } | null>(null);
  
  // Track expanded rows - all collapsed by default
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (driverId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  // Default to essential columns only, allow override via visibleColumns prop
  const cols = {
    checkbox: true,
    driverNumber: false, // Hidden by default
    name: true,
    email: true,
    phone: true,
    status: true,
    employeeStatus: true,
    assignmentStatus: true,
    dispatchStatus: false, // Hidden by default
    driverType: false, // Hidden by default
    mcNumber: true,
    teamDriver: false, // Hidden by default
    truck: true,
    trailer: false, // Hidden by default
    payTo: false, // Hidden by default
    driverTariff: false, // Hidden by default
    warnings: false, // Hidden by default
    tags: false, // Hidden by default
    actions: true,
    ...visibleColumns, // Override with provided visibleColumns
  };

  // Calculate column count for colspan
  const columnCount = Object.values(cols).filter(Boolean).length + (canEdit || canDelete ? 1 : 0);

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {(canEdit || canDelete) && cols.checkbox && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all drivers"
                />
              </TableHead>
            )}
            {cols.assignmentStatus && <TableHead>Assign status</TableHead>}
            {cols.employeeStatus && <TableHead>Employee status</TableHead>}
            {cols.driverNumber && <TableHead>Driver #</TableHead>}
            {cols.name && <TableHead>Name</TableHead>}
            {cols.driverType && <TableHead>Driver Type</TableHead>}
            {cols.mcNumber && <TableHead>MC number</TableHead>}
            {cols.phone && <TableHead>Contact</TableHead>}
            {cols.email && <TableHead>Email</TableHead>}
            {cols.status && <TableHead>Driver status</TableHead>}
            {cols.truck && <TableHead>Truck</TableHead>}
            {cols.trailer && <TableHead>Trailer</TableHead>}
            {cols.teamDriver && <TableHead>Team driver</TableHead>}
            {cols.payTo && <TableHead>Pay to</TableHead>}
            {cols.driverTariff && <TableHead>Driver tariff</TableHead>}
            {cols.dispatchStatus && <TableHead>Dispatch status</TableHead>}
            {cols.warnings && <TableHead>Warnings</TableHead>}
            {cols.actions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => {
            const isExpanded = expandedRows.has(driver.id);
            return (
              <React.Fragment key={driver.id}>
                <TableRow 
                  className={driver.deletedAt ? 'opacity-60 bg-muted/30' : ''}
                >
                  {(canEdit || canDelete) && cols.checkbox && (
                    <TableCell>
                      <Checkbox
                        checked={selectedDriverIds.includes(driver.id)}
                        onCheckedChange={(checked) =>
                          onSelectDriver(driver.id, checked as boolean)
                        }
                        aria-label={`Select driver ${driver.driverNumber}`}
                      />
                    </TableCell>
                  )}
                  {cols.assignmentStatus && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAssignmentStatusIcon(driver.assignmentStatus)}
                        <span className="text-sm">
                          {getAssignmentStatusText(driver.assignmentStatus)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {cols.employeeStatus && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEmployeeStatusBadge(driver.employeeStatus)}
                        <DeletedRecordBadge deletedAt={driver.deletedAt} />
                      </div>
                    </TableCell>
                  )}
                  {cols.driverNumber && (
                    <TableCell className="font-medium">
                      {driver.driverNumber}
                    </TableCell>
                  )}
                  {cols.name && (
                    <TableCell className="font-medium">
                      {driver.firstName} {driver.lastName}
                    </TableCell>
                  )}
                  {cols.driverType && <TableCell>{formatDriverType(driver.driverType)}</TableCell>}
                  {cols.mcNumber && <TableCell>{driver.mcNumber?.number || '-'}</TableCell>}
                  {cols.phone && <TableCell>{driver.phone || '-'}</TableCell>}
                  {cols.email && (
                    <TableCell className="max-w-[200px] truncate">
                      {driver.email}
                    </TableCell>
                  )}
                  {cols.status && (
                    <TableCell>
                      {getDriverStatusBadge(driver.status)}
                    </TableCell>
                  )}
                  {cols.truck && (
                    <TableCell>
                      {driver.truck ? driver.truck.truckNumber : '-'}
                    </TableCell>
                  )}
                  {cols.trailer && (
                    <TableCell>
                      {driver.trailer ? driver.trailer.trailerNumber : '-'}
                    </TableCell>
                  )}
                  {cols.teamDriver && <TableCell>{driver.teamDriver ? 'Yes' : 'No'}</TableCell>}
                  {cols.payTo && <TableCell>{driver.payTo || '-'}</TableCell>}
                  {cols.driverTariff && (
                    <TableCell className="max-w-[200px] truncate">
                      {driver.driverTariff || '-'}
                    </TableCell>
                  )}
                  {cols.dispatchStatus && (
                    <TableCell>
                      <Select
                        value={driver.dispatchStatus || ''}
                        onValueChange={(value) => {
                          // Handle dispatch status change
                          console.log('Change dispatch status', driver.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue>
                            {driver.dispatchStatus ? (
                              getDispatchStatusBadge(driver.dispatchStatus)
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DISPATCHED">DISPATCHED</SelectItem>
                          <SelectItem value="ENROUTE">ENROUTE</SelectItem>
                          <SelectItem value="TERMINATION">TERMINATION</SelectItem>
                          <SelectItem value="REST">REST</SelectItem>
                          <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  {cols.warnings && <TableCell>{driver.warnings || '-'}</TableCell>}
                  {cols.actions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canAssign && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const driverData = drivers.find((d) => d.id === driver.id);
                              if (driverData) {
                                setQuickAssignDriver({
                                  id: driverData.id,
                                  driverNumber: driverData.driverNumber,
                                  user: {
                                    firstName: driverData.firstName,
                                    lastName: driverData.lastName,
                                  },
                                  currentTruck: (driverData as any).currentTruck,
                                  currentTrailer: (driverData as any).currentTrailer,
                                });
                              }
                            }}
                            type="button"
                            title="Quick Assignment"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleRow(driver.id)}
                            type="button"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="p-0">
                      <DriverExpandedEdit
                        driverId={driver.id}
                        onSave={() => {
                          toggleRow(driver.id);
                          onDriverUpdate?.();
                        }}
                        onCancel={() => toggleRow(driver.id)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Quick Assignment Dialog */}
      {quickAssignDriver && (
        <QuickAssignmentDialog
          open={!!quickAssignDriver}
          onOpenChange={(open) => {
            if (!open) {
              setQuickAssignDriver(null);
            }
          }}
          driver={quickAssignDriver}
        />
      )}
    </div>
  );
}

