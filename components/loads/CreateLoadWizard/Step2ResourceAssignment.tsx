'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Truck, Package, Info } from 'lucide-react';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Step2ResourceAssignmentProps {
  driverId?: string;
  truckId?: string;
  trailerNumber?: string;
  onDriverChange: (driverId: string) => void;
  onTruckChange: (truckId: string) => void;
  onTrailerChange: (trailerNumber: string) => void;
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000&status=AVAILABLE'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

async function fetchTrailers() {
  // Use skipStats=true for faster loading when preloading for combobox
  const response = await fetch(apiUrl('/api/trailers?limit=1000&skipStats=true'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  return response.json();
}

interface Driver {
  id: string;
  driverNumber: string;
  currentTruck?: {
    id: string;
    truckNumber: string;
  } | null;
  currentTrailer?: {
    id: string;
    trailerNumber: string;
  } | null;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function Step2ResourceAssignment({
  driverId,
  truckId,
  trailerNumber,
  onDriverChange,
  onTruckChange,
  onTrailerChange,
}: Step2ResourceAssignmentProps) {

  const { data: driversData, isLoading: isLoadingDrivers, error: driversError } = useQuery({
    queryKey: ['drivers', 'wizard'],
    queryFn: fetchDrivers,
    enabled: true, // Always enable the query
    retry: 2,
  });

  const { data: trucksData, isLoading: isLoadingTrucks, error: trucksError } = useQuery({
    queryKey: ['trucks', 'wizard'],
    queryFn: fetchTrucks,
    enabled: true, // Always enable the query
    retry: 2,
  });

  const { data: trailersData, isLoading: isLoadingTrailers, error: trailersError } = useQuery({
    queryKey: ['trailers', 'wizard'],
    queryFn: fetchTrailers,
    enabled: true, // Always enable the query
    retry: 2,
  });

  // Extract data from API response - handle both { data: [...] } and { success: true, data: [...] } formats
  const drivers: Driver[] = driversData?.data || (Array.isArray(driversData) ? driversData : []);
  const trucks = trucksData?.data || (Array.isArray(trucksData) ? trucksData : []);
  const trailers = trailersData?.data || (Array.isArray(trailersData) ? trailersData : []);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  // Handle driver selection with auto-fill of truck and trailer
  const handleDriverSelect = (value: string) => {
    onDriverChange(value);
    const driver = drivers.find((d) => d.id === value);
    if (driver) {
      onTruckChange(driver.currentTruck?.id || '');
      onTrailerChange(driver.currentTrailer?.trailerNumber || '');
    } else {
      onTruckChange('');
      onTrailerChange('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Resource Assignment
          </CardTitle>
          <CardDescription>
            Assign a driver, truck, and trailer to this load. The system will auto-fill the truck and trailer if the driver has default assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver" className="text-sm font-medium">
              Driver *
            </Label>
            {driversError && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  Failed to load drivers. Please try again.
                </AlertDescription>
              </Alert>
            )}
            <DriverCombobox
              value={driverId || ''}
              onValueChange={handleDriverSelect}
              placeholder={isLoadingDrivers ? 'Loading drivers...' : 'Search driver by name or number...'}
              drivers={drivers}
              disabled={isLoadingDrivers}
            />
            {selectedDriver && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </span>
                  <span className="text-muted-foreground">
                    (#{selectedDriver.driverNumber})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Auto-fill Notification */}
          {selectedDriver &&
           (selectedDriver.currentTruck || selectedDriver.currentTrailer) &&
           (truckId === selectedDriver.currentTruck?.id || trailerNumber === selectedDriver.currentTrailer?.trailerNumber) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {selectedDriver.currentTruck && selectedDriver.currentTrailer &&
                 truckId === selectedDriver.currentTruck.id &&
                 trailerNumber === selectedDriver.currentTrailer.trailerNumber
                  ? `Auto-filled Truck #${selectedDriver.currentTruck.truckNumber} and Trailer #${selectedDriver.currentTrailer.trailerNumber} from driver's default assignments. You can override if needed.`
                  : selectedDriver.currentTruck && truckId === selectedDriver.currentTruck.id
                    ? `Auto-filled Truck #${selectedDriver.currentTruck.truckNumber} from driver's default assignment.`
                    : selectedDriver.currentTrailer && trailerNumber === selectedDriver.currentTrailer.trailerNumber
                      ? `Auto-filled Trailer #${selectedDriver.currentTrailer.trailerNumber} from driver's default assignment.`
                      : null}
              </AlertDescription>
            </Alert>
          )}

          {/* Truck Selection */}
          <div className="space-y-2">
            <Label htmlFor="truck" className="text-sm font-medium">
              Truck
            </Label>
            <TruckCombobox
              value={truckId || ''}
              onValueChange={onTruckChange}
              placeholder="Search truck by number..."
              trucks={trucks}
            />
            {selectedDriver?.currentTruck && truckId === selectedDriver.currentTruck.id && (
              <p className="text-xs text-muted-foreground mt-1">
                Default truck for this driver
              </p>
            )}
          </div>

          {/* Trailer Selection */}
          <div className="space-y-2">
            <Label htmlFor="trailer" className="text-sm font-medium">
              Trailer
            </Label>
            <TrailerCombobox
              value={trailerNumber || ''}
              onValueChange={onTrailerChange}
              placeholder="Search trailer by number..."
              trailers={trailers}
            />
            {selectedDriver?.currentTrailer && trailerNumber === selectedDriver.currentTrailer.trailerNumber && (
              <p className="text-xs text-muted-foreground mt-1">
                Default trailer for this driver
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Smart Assignment
                </p>
                <p className="text-xs text-blue-700">
                  When you select a driver, the system automatically assigns their default truck and trailer if available. 
                  You can manually override these assignments for this specific load if needed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

