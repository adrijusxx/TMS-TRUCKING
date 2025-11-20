/**
 * Samsara Integration
 * 
 * This module provides functions for integrating with Samsara API:
 * - Fleet tracking
 * - HOS (Hours of Service) data
 * - Driver location and status
 * - Vehicle telematics
 * 
 * Note: Requires SAMSARA_API_KEY environment variable
 * API Documentation: https://developers.samsara.com/
 */

interface SamsaraConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret?: string;
}

interface SamsaraVehicle {
  id: string;
  name: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  engineHours?: number;
  odometerMiles?: number;
  vehicleTime?: string;
  location?: {
    latitude: number;
    longitude: number;
    speedMilesPerHour?: number;
    heading?: number;
    address?: string;
  };
  gps?: {
    latitude: number;
    longitude: number;
    speedMilesPerHour?: number;
    heading?: number;
    address?: string;
    reverseGeo?: {
      formattedLocation?: string;
    };
  };
}

interface SamsaraVehicleDiagnostic {
  vehicleId: string;
  faults?: Array<{
    code?: string;
    description?: string;
    severity?: string;
    active?: boolean;
    occurredAt?: string;
  }>;
  checkEngineLightOn?: boolean;
  lastUpdatedTime?: string;
}

interface SamsaraDriver {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseState?: string;
  eldExempt?: boolean;
  eldExemptReason?: string;
  isActive?: boolean;
  vehicleIds?: string[];
  hosStatuses?: Array<{
    driverId: string;
    logStartTime: string;
    status: string;
    vehName?: string;
    driverName: string;
    shiftStart?: string;
    shiftRemaining?: number;
    cycleRemaining?: number;
    cycleTomorrow?: number;
    drivingInViolationToday?: number;
    drivingInViolationCycle?: number;
    driverVehicleIds?: string[];
    coDrivers?: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

interface SamsaraHOSLog {
  driverId: string;
  vehicleId?: string;
  logStartTime: string;
  logEndTime?: string;
  statuses?: Array<{
    status: string;
    time: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }>;
  locations?: Array<{
    latitude: number;
    longitude: number;
    time: string;
    address?: string;
  }>;
  vehicleName?: string;
  driverName: string;
}

interface SamsaraVehicleStats {
  id: string;
  vehicleId: string;
  currentSpeed?: number;
  speedLimit?: number;
  fuelPercent?: number;
  odometerMiles?: number;
  engineHours?: number;
  engineState?: string;
  seatbeltStatus?: string;
}

interface SamsaraTrip {
  id: string;
  vehicleId: string;
  startLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    time?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    time?: string;
  };
  distanceMiles?: number;
  durationSeconds?: number;
}

interface SamsaraCameraMedia {
  url: string;
  createdAt: string;
  cameraType?: string;
  vehicleId?: string;
}

/**
 * Get Samsara configuration from environment variables
 */
export function getSamsaraConfig(): SamsaraConfig | null {
  const apiKey = process.env.SAMSARA_API_KEY;

  if (!apiKey) {
    console.warn('Samsara API key not configured');
    return null;
  }

  return {
    apiKey,
    baseUrl: 'https://api.samsara.com',
    webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET,
  };
}

/**
 * Make authenticated request to Samsara API
 */
async function samsaraRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const config = getSamsaraConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Samsara API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Samsara API request error:', error);
    return null;
  }
}

/**
 * Get all vehicles in the fleet
 */
export async function getSamsaraVehicles(): Promise<SamsaraVehicle[] | null> {
  const result = await samsaraRequest<SamsaraVehicle[] | { data?: SamsaraVehicle[] }>(
    '/fleet/vehicles'
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get vehicle by ID
 */
export async function getSamsaraVehicle(vehicleId: string): Promise<SamsaraVehicle | null> {
  const vehicles = await getSamsaraVehicles();
  if (!vehicles) return null;
  return vehicles.find((v) => v.id === vehicleId) || null;
}

/**
 * Get all drivers
 */
export async function getSamsaraDrivers(): Promise<SamsaraDriver[] | null> {
  const result = await samsaraRequest<SamsaraDriver[] | { data?: SamsaraDriver[] }>(
    '/fleet/drivers'
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get driver by ID
 */
export async function getSamsaraDriver(driverId: string): Promise<SamsaraDriver | null> {
  const drivers = await getSamsaraDrivers();
  if (!drivers) return null;
  return drivers.find((d) => d.id === driverId) || null;
}

/**
 * Get HOS (Hours of Service) status for drivers
 */
export async function getSamsaraHOSStatuses(
  driverIds?: string[]
): Promise<SamsaraDriver['hosStatuses'] | null> {
  const params = new URLSearchParams();
  if (driverIds && driverIds.length > 0) {
    params.append('driverIds', driverIds.join(','));
  }

  const endpoint = `/fleet/hos_authentication_logs${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await samsaraRequest<{ data: SamsaraDriver[] }>(endpoint);
  
  if (!result || !result.data) return null;
  
  // Extract HOS statuses from driver data
  return result.data.flatMap((driver) => driver.hosStatuses || []);
}

/**
 * Get HOS logs for a specific driver
 */
export async function getSamsaraHOSLogs(
  driverId: string,
  startTime: string,
  endTime?: string
): Promise<SamsaraHOSLog[] | null> {
  const params = new URLSearchParams({
    driverId,
    startTime,
    ...(endTime && { endTime }),
  });

  const result = await samsaraRequest<{ data: SamsaraHOSLog[] }>(
    `/fleet/hos_logs?${params.toString()}`
  );
  
  return result?.data || null;
}

/**
 * Get vehicle locations in real-time
 */
export async function getSamsaraVehicleLocations(
  vehicleIds?: string[]
): Promise<Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> | null> {
  const params = new URLSearchParams();
  if (vehicleIds && vehicleIds.length > 0) {
    params.append('vehicleIds', vehicleIds.join(','));
  }

  const result = await samsaraRequest<{ data: SamsaraVehicle[] }>(
    `/fleet/vehicles/locations${params.toString() ? `?${params.toString()}` : ''}`
  );
  
  if (!result || !result.data) return null;
  
  return result.data.map((vehicle) => ({
    vehicleId: vehicle.id,
    location: vehicle.location || vehicle.gps,
  }));
}

/**
 * Get diagnostics / fault codes for vehicles
 * Note: Some Samsara API configurations may require vehicleIds parameter
 */
export async function getSamsaraVehicleDiagnostics(vehicleIds?: string[]): Promise<SamsaraVehicleDiagnostic[] | null> {
  try {
    let endpoint = '/fleet/vehicles/diagnostics';
    if (vehicleIds && vehicleIds.length > 0) {
      const params = new URLSearchParams();
      params.append('vehicleIds', vehicleIds.join(','));
      endpoint = `${endpoint}?${params.toString()}`;
    }

    const result = await samsaraRequest<
      SamsaraVehicleDiagnostic[] | { data?: SamsaraVehicleDiagnostic[] }
    >(endpoint);

    if (!result) return null;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;

    return null;
  } catch (error: any) {
    // Suppress "invalid id" errors - diagnostics might not be available for all configurations
    if (error?.message?.includes('invalid id') || error?.message?.includes('invalid')) {
      console.debug('[Samsara] Diagnostics endpoint unavailable or requires vehicle IDs');
      return null;
    }
    throw error;
  }
}

/**
 * Get vehicle stats (speed, fuel, odometer, etc.)
 */
export async function getSamsaraVehicleStats(): Promise<SamsaraVehicleStats[] | null> {
  if (process.env.SAMSARA_STATS_ENABLED !== 'true') {
    return null;
  }

  const types = [
    'currentSpeed',
    'speedLimit',
    'fuelPercent',
    'odometerMiles',
    'engineHours',
    'engineState',
    'seatbeltStatus',
  ].join(',');

  const result = await samsaraRequest<SamsaraVehicleStats[] | { data?: SamsaraVehicleStats[] }>(
    `/fleet/vehicles/stats?types=${encodeURIComponent(types)}`
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get recent trips for vehicles
 */
export async function getSamsaraTrips(): Promise<SamsaraTrip[] | null> {
  if (process.env.SAMSARA_TRIPS_ENABLED !== 'true') {
    return null;
  }

  const limit = parseInt(process.env.SAMSARA_TRIPS_LIMIT || '3', 10);
  const result = await samsaraRequest<SamsaraTrip[] | { data?: SamsaraTrip[] }>(
    `/fleet/trips/recent?limit=${Number.isFinite(limit) ? limit : 3}`
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get latest camera media (stills) for vehicles
 */
export async function getSamsaraCameraMedia(): Promise<SamsaraCameraMedia[] | null> {
  if (process.env.SAMSARA_CAMERA_MEDIA_ENABLED !== 'true') {
    return null;
  }

  const requestedTypes =
    process.env.SAMSARA_CAMERA_MEDIA_TYPES || ['forwardFacing', 'driverFacing'].join(',');

  const result = await samsaraRequest<SamsaraCameraMedia[] | { data?: SamsaraCameraMedia[] }>(
    `/fleet/cameras/media?types=${encodeURIComponent(requestedTypes)}`
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Sync driver HOS data from Samsara to our system
 */
export async function syncSamsaraHOSToDriver(
  samsaraDriverId: string,
  ourDriverId: string
): Promise<boolean> {
  try {
    const hosStatuses = await getSamsaraHOSStatuses([samsaraDriverId]);
    if (!hosStatuses || hosStatuses.length === 0) return false;

    const currentStatus = hosStatuses[0];
    
    // Map Samsara HOS status to our driver status
    const statusMap: Record<string, string> = {
      'offDuty': 'OFF_DUTY',
      'driving': 'DRIVING',
      'onDuty': 'ON_DUTY',
      'onDutyNotDriving': 'ON_DUTY',
      'sleeper': 'SLEEPER_BERTH',
    };

    const ourStatus = statusMap[currentStatus.status] || 'OFF_DUTY';

    // Update driver status in our database
    // This would typically call your Prisma client
    // For now, this is a placeholder
    console.log(`Would sync HOS for driver ${ourDriverId}:`, {
      status: ourStatus,
      shiftStart: currentStatus.shiftStart,
      shiftRemaining: currentStatus.shiftRemaining,
    });

    return true;
  } catch (error) {
    console.error('Samsara HOS sync error:', error);
    return false;
  }
}

