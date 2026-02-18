'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Truck, Package } from 'lucide-react';
import DriverTruckHistoryTable from './DriverTruckHistoryTable';
import DriverTrailerHistoryTable from './DriverTrailerHistoryTable';
import DriverCommentsSection from './DriverCommentsSection';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';

interface DriverWorkDetailsTabProps {
  driver: any;
  trucks: Array<{ id: string; truckNumber: string }>;
  trailers: Array<{ id: string; trailerNumber: string }>;
  dispatchers: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  onSave: (data: any) => void;
}

export default function DriverWorkDetailsTab({
  driver,
  trucks,
  trailers,
  dispatchers,
  users,
  onSave,
}: DriverWorkDetailsTabProps) {
  // Convert currentTrailerId to trailerNumber for the combobox
  const getTrailerNumberFromId = (trailerId: string | null | undefined): string => {
    if (!trailerId) return '';
    const trailer = trailers.find((t) => t.id === trailerId);
    return trailer?.trailerNumber || '';
  };

  const defaultValues = {
    employmentStatus: driver.employeeStatus || 'ACTIVE',
    hireDate: driver.hireDate ? new Date(driver.hireDate).toISOString().split('T')[0] : '',
    tenureAtCompany: driver.tenure || '',
    driverStatus: driver.status || 'AVAILABLE',
    thresholdAmount: driver.thresholdAmount || '',
    // Assignments
    assignedTruck: driver.currentTruckId || '',
    assignedTrailer: driver.currentTrailerId || '', // Store ID directly (TrailerCombobox returns ID)
    assignedDispatcher: driver.assignedDispatcherId || '',
    hrManager: driver.hrManagerId || '',
    safetyManager: driver.safetyManagerId || '',
    mcNumber: typeof driver.mcNumber === 'object' ? driver.mcNumber?.id || '' : driver.mcNumber || '',
    teamDriver: driver.teamDriver || false,
    otherId: driver.otherId || '',
    driverTags: driver.driverTags || [],
    notes: driver.notes || '',
    // Dispatch preferences
    dispatchPreferences: driver.dispatchPreferences || '',
  };

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues,
  });

  // Reset form when driver assignment data changes (e.g., after save)
  useEffect(() => {
    const newDefaultValues = {
      ...defaultValues,
      assignedTruck: driver.currentTruckId || '',
      assignedTrailer: driver.currentTrailerId || '',
    };
    reset(newDefaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver.currentTruckId, driver.currentTrailerId]);

  const [driverTags, setDriverTags] = useState<string[]>(watch('driverTags') || []);

  const onSubmit = (data: any) => {
    // Convert trailerNumber back to trailerId
    const getTrailerIdFromNumber = (trailerNumber: string | null | undefined): string | null => {
      if (!trailerNumber || trailerNumber === 'none' || trailerNumber === '') return null;
      const trailer = trailers.find((t) => t.trailerNumber === trailerNumber);
      return trailer?.id || null;
    };

    const apiData: any = {
      employeeStatus: data.employmentStatus,
      hireDate: data.hireDate || undefined,
      tenure: data.tenureAtCompany,
      status: data.driverStatus,
      thresholdAmount: data.thresholdAmount ? parseFloat(data.thresholdAmount) : undefined,
      // Assignments - use null to explicitly clear, not undefined
      currentTruckId: data.assignedTruck && data.assignedTruck !== 'none' && data.assignedTruck !== '' ? data.assignedTruck : null,
      currentTrailerId: data.assignedTrailer && data.assignedTrailer !== 'none' && data.assignedTrailer !== '' ? data.assignedTrailer : null,
      assignedDispatcherId: data.assignedDispatcher && data.assignedDispatcher !== 'none' ? data.assignedDispatcher : undefined,
      hrManagerId: data.hrManager && data.hrManager !== 'none' ? data.hrManager : undefined,
      safetyManagerId: data.safetyManager && data.safetyManager !== 'none' ? data.safetyManager : undefined,
      mcNumberId: data.mcNumber || undefined, // Correct field name for Zod schema + Prisma
      teamDriver: data.teamDriver,
      otherId: data.otherId,
      tags: driverTags, // Correct field name matching updateDriverSchema
      notes: data.notes,
      // Dispatch
      dispatchPreferences: data.dispatchPreferences,
    };

    onSave(apiData);
  };

  // Save when main Save button is clicked
  useEffect(() => {
    const handleSave = () => {
      handleSubmit(onSubmit)();
    };
    
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [handleSubmit, driverTags]);

  return (
    <form id="driver-work-details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  value={watch('employmentStatus')}
                  onValueChange={(value) => setValue('employmentStatus', value)}
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
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input id="hireDate" type="date" {...register('hireDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenureAtCompany">Tenure at Company</Label>
                <Input id="tenureAtCompany" {...register('tenureAtCompany')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverStatus">Driver Status</Label>
                <Select
                  value={watch('driverStatus')}
                  onValueChange={(value) => setValue('driverStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="IN_TRANSIT">In-Transit</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="ON_DUTY">On Duty</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thresholdAmount">Threshold Amount</Label>
                <Input id="thresholdAmount" type="number" {...register('thresholdAmount')} />
              </div>
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTruck" className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Assigned Truck
                </Label>
                <TruckCombobox
                  value={watch('assignedTruck') || ''}
                  onValueChange={(value) => setValue('assignedTruck', value || '')}
                  placeholder="Search truck by number..."
                  trucks={trucks}
                />
                {watch('assignedTruck') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current assignment will be updated when you save
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTrailer" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Assigned Trailer
                </Label>
                <TrailerCombobox
                  value={watch('assignedTrailer') || ''}
                  onValueChange={(value) => setValue('assignedTrailer', value || '')}
                  placeholder="Search trailer by number..."
                  trailers={trailers}
                />
                {watch('assignedTrailer') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current assignment will be updated when you save
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDispatcher">Assigned Dispatcher</Label>
                <Select
                  value={watch('assignedDispatcher') || 'none'}
                  onValueChange={(value) => setValue('assignedDispatcher', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatcher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dispatchers.map((dispatcher) => (
                      <SelectItem key={dispatcher.id} value={dispatcher.id}>
                        {dispatcher.firstName} {dispatcher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hrManager">HR Manager</Label>
                <Select
                  value={watch('hrManager') || 'none'}
                  onValueChange={(value) => setValue('hrManager', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select HR manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyManager">Safety Manager</Label>
                <Select
                  value={watch('safetyManager') || 'none'}
                  onValueChange={(value) => setValue('safetyManager', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select safety manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcNumber">MC Number</Label>
                <McNumberSelector
                  value={watch('mcNumber')}
                  onValueChange={(value) => setValue('mcNumber', value)}
                />
              </div>

              <div className="flex items-center space-x-4">
                <Label>Team Driver</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="teamDriverYes"
                      name="teamDriver"
                      checked={watch('teamDriver') === true}
                      onChange={() => setValue('teamDriver', true)}
                    />
                    <Label htmlFor="teamDriverYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="teamDriverNo"
                      name="teamDriver"
                      checked={watch('teamDriver') === false}
                      onChange={() => setValue('teamDriver', false)}
                    />
                    <Label htmlFor="teamDriverNo">No</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherId">Other ID</Label>
                <Input id="otherId" {...register('otherId')} />
              </div>

              <div className="space-y-2">
                <Label>Driver Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {driverTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setDriverTags(driverTags.filter((t) => t !== tag))}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    placeholder="Add tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value && !driverTags.includes(value)) {
                          setDriverTags([...driverTags, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="w-[150px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} />
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="dispatchPreferences">Dispatch Preferences</Label>
                <Textarea id="dispatchPreferences" {...register('dispatchPreferences')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverCommentsSection driver={driver} />
            </CardContent>
          </Card>

          {/* Truck History */}
          <Card>
            <CardHeader>
              <CardTitle>Truck History</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverTruckHistoryTable driver={driver} trucks={trucks} />
            </CardContent>
          </Card>

          {/* Trailer History */}
          <Card>
            <CardHeader>
              <CardTitle>Trailer History</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverTrailerHistoryTable driver={driver} trailers={trailers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

