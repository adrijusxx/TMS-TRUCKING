'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Edit, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { DriverStatus, EmployeeStatus, AssignmentStatus, DispatchStatus, DriverType } from '@prisma/client';
import { formatDate } from '@/lib/utils';

interface Driver {
  id: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  driverType: DriverType;
  mcNumber: string | null;
  status: DriverStatus;
  employeeStatus: EmployeeStatus;
  assignmentStatus: AssignmentStatus;
  dispatchStatus: DispatchStatus | null;
  truck?: { truckNumber: string } | null;
  trailer?: { trailerNumber: string } | null;
  teamDriver: boolean;
  payTo: string | null;
  driverTariff: string | null;
  warnings: string | null;
  notes: string | null;
  hireDate: Date | null;
  terminationDate: Date | null;
  driverTags: string[];
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
}: DriverTableProps) {
  // Default all columns to visible if not specified
  const cols = {
    checkbox: true,
    driverNumber: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    employeeStatus: true,
    assignmentStatus: true,
    dispatchStatus: true,
    driverType: true,
    mcNumber: true,
    teamDriver: true,
    truck: true,
    trailer: true,
    payTo: true,
    driverTariff: true,
    warnings: true,
    tags: true,
    actions: true,
    ...visibleColumns,
  };
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {(canEdit || canDelete) && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all drivers"
                />
              </TableHead>
            )}
            <TableHead>Assign status</TableHead>
            <TableHead>Employee stat...</TableHead>
            <TableHead>First name</TableHead>
            <TableHead>Last name</TableHead>
            <TableHead>Driver Type</TableHead>
            <TableHead>MC number</TableHead>
            <TableHead>Contact numb...</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Driver status</TableHead>
            <TableHead>Truck</TableHead>
            <TableHead>Trailer</TableHead>
            <TableHead>Team driver</TableHead>
            <TableHead>Pay to</TableHead>
            <TableHead>Driver tariff</TableHead>
            <TableHead>Dispatch sta...</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead>Hire date</TableHead>
            <TableHead>Termination date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
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
                  {getEmployeeStatusBadge(driver.employeeStatus)}
                </TableCell>
              )}
              {cols.name && <TableCell className="font-medium">{driver.firstName}</TableCell>}
              {cols.name && <TableCell className="font-medium">{driver.lastName}</TableCell>}
              {cols.driverType && <TableCell>{formatDriverType(driver.driverType)}</TableCell>}
              {cols.mcNumber && <TableCell>{driver.mcNumber || '-'}</TableCell>}
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
              <TableCell className="max-w-[200px] truncate">
                {driver.notes || '-'}
              </TableCell>
              {cols.warnings && <TableCell>{driver.warnings || '-'}</TableCell>}
              <TableCell>
                {driver.hireDate ? formatDate(driver.hireDate) : '-'}
              </TableCell>
              <TableCell>
                {driver.terminationDate
                  ? formatDate(driver.terminationDate)
                  : '-'}
              </TableCell>
              {cols.actions && (
                <TableCell className="text-right">
                  {canEdit && (
                    <Link href={`/dashboard/drivers/${driver.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

