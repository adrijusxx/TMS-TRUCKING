'use client';

import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/utils';

interface Driver {
  id: string;
  driverNumber: string;
  user: {
    firstName: string;
    lastName: string;
  };
  currentTruck?: {
    truckNumber: string;
  } | null;
}

async function fetchDrivers() {
  // Use tab=active instead of status=ACTIVE since ACTIVE is not a valid DriverStatus enum
  const response = await fetch(apiUrl('/api/drivers?limit=1000&tab=active'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  const data = await response.json();
  // Handle both { drivers: [...] } and direct array responses
  return Array.isArray(data) ? data : (data.drivers || data.data || []);
}

interface DriverSelectorProps {
  value?: string;
  onValueChange: (driverId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function DriverSelector({
  value,
  onValueChange,
  label = 'Driver',
  placeholder = 'Select a driver',
  required = true,
}: DriverSelectorProps) {
  const { data: drivers = [], isLoading, error } = useQuery<Driver[]>({
    queryKey: ['drivers', 'active'],
    queryFn: fetchDrivers,
  });

  if (error) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <p className="text-sm text-destructive">Failed to load drivers</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading drivers...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {drivers.length === 0 ? (
            <SelectItem value="none" disabled>
              {isLoading ? 'Loading...' : 'No drivers available'}
            </SelectItem>
          ) : (
            drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.user.firstName} {driver.user.lastName}
                {driver.driverNumber && ` (${driver.driverNumber})`}
                {driver.currentTruck && ` - ${driver.currentTruck.truckNumber}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

