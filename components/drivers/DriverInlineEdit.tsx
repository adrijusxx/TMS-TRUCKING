'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface DriverInlineEditProps {
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    employeeStatus: string;
    assignmentStatus: string;
    dispatchStatus: string | null;
    driverType: string;
    currentTruckId: string | null;
    currentTrailerId: string | null;
    mcNumberId: string | null;
    teamDriver: boolean;
    userId: string;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  const result = await response.json();
  return result.data || [];
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  const result = await response.json();
  return result.data || [];
}

async function updateDriver(driverId: string, data: any) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update driver');
  }
  return response.json();
}

export default function DriverInlineEdit({ driver, onSave, onCancel }: DriverInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch trucks and trailers for dropdowns
  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  const { data: trailers = [] } = useQuery({
    queryKey: ['trailers'],
    queryFn: fetchTrailers,
  });

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      phone: driver.phone || '',
      status: driver.status || 'AVAILABLE',
      employeeStatus: driver.employeeStatus || 'ACTIVE',
      assignmentStatus: driver.assignmentStatus || 'READY_TO_GO',
      dispatchStatus: driver.dispatchStatus || null,
      driverType: driver.driverType || 'COMPANY_DRIVER',
      currentTruckId: driver.currentTruckId || '',
      currentTrailerId: driver.currentTrailerId || '',
      mcNumberId: driver.mcNumberId || '',
      teamDriver: driver.teamDriver || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDriver(driver.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driver.id] });
      toast.success('Driver updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update driver');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      status: data.status,
      employeeStatus: data.employeeStatus,
      assignmentStatus: data.assignmentStatus,
      dispatchStatus: data.dispatchStatus || null,
      driverType: data.driverType,
      currentTruckId: data.currentTruckId && data.currentTruckId !== 'none' ? data.currentTruckId : null,
      currentTrailerId: data.currentTrailerId && data.currentTrailerId !== 'none' ? data.currentTrailerId : null,
      mcNumberId: data.mcNumberId || null,
      teamDriver: data.teamDriver,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Personal Information */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>

            {/* Status Fields */}
            <div className="space-y-2">
              <Label htmlFor="status">Driver Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ON_DUTY">On Duty</SelectItem>
                  <SelectItem value="DRIVING">Driving</SelectItem>
                  <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                  <SelectItem value="SLEEPER_BERTH">Sleeper Berth</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeStatus">Employee Status</Label>
              <Select
                value={watch('employeeStatus')}
                onValueChange={(value) => setValue('employeeStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                  <SelectItem value="APPLICANT">Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignmentStatus">Assignment Status</Label>
              <Select
                value={watch('assignmentStatus')}
                onValueChange={(value) => setValue('assignmentStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READY_TO_GO">Ready to Go</SelectItem>
                  <SelectItem value="NOT_READY">Not Ready</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchStatus">Dispatch Status</Label>
              <Select
                value={watch('dispatchStatus') || 'none'}
                onValueChange={(value) => setValue('dispatchStatus', value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="ENROUTE">En Route</SelectItem>
                  <SelectItem value="TERMINATION">Termination</SelectItem>
                  <SelectItem value="REST">Rest</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverType">Driver Type</Label>
              <Select
                value={watch('driverType')}
                onValueChange={(value) => setValue('driverType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY_DRIVER">Company Driver</SelectItem>
                  <SelectItem value="LEASE">Lease</SelectItem>
                  <SelectItem value="OWNER_OPERATOR">Owner Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignments */}
            <div className="space-y-2">
              <Label htmlFor="currentTruckId">Assigned Truck</Label>
              <Select
                value={watch('currentTruckId') || 'none'}
                onValueChange={(value) => setValue('currentTruckId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {trucks.map((truck: any) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentTrailerId">Assigned Trailer</Label>
              <Select
                value={watch('currentTrailerId') || 'none'}
                onValueChange={(value) => setValue('currentTrailerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trailer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {trailers.map((trailer: any) => (
                    <SelectItem key={trailer.id} value={trailer.id}>
                      {trailer.trailerNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcNumberId">MC Number</Label>
              <McNumberSelector
                value={watch('mcNumberId') || ''}
                onValueChange={(value) => setValue('mcNumberId', value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamDriver">Team Driver</Label>
              <Select
                value={watch('teamDriver') ? 'true' : 'false'}
                onValueChange={(value) => setValue('teamDriver', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
