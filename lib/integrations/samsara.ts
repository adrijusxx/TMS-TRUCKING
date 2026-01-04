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

// Cache for unavailable endpoints to reduce log noise
const unavailableEndpoints = new Set<string>();

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
 * Get Samsara configuration from database (hierarchical) or environment variables
 * @param companyId Optional company ID to check database first
 * @param mcNumberId Optional MC ID for specific override
 */
export async function getSamsaraConfig(
  companyId?: string,
  mcNumberId?: string
): Promise<SamsaraConfig | null> {
  const { ApiKeyService } = await import('@/lib/services/ApiKeyService');

  // 1. Try Hierarchical Lookup (MC -> Company -> Global)
  try {
    const hierarchicalToken = await ApiKeyService.getCredential('SAMSARA', 'API_TOKEN', {
      companyId,
      mcNumberId
    });

    if (hierarchicalToken) {
      return {
        apiKey: hierarchicalToken,
        baseUrl: 'https://api.samsara.com',
        webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET, // Default or could be in KeyConfig too
      };
    }
  } catch (error) {
    console.debug('[Samsara] Hierarchical API key lookup failed:', error);
  }

  // 1.5. NEW: Check SamsaraSettings table (The new standard)
  if (companyId) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const settings = await prisma.samsaraSettings.findUnique({
        where: { companyId }
      });

      if (settings?.apiToken) {
        return {
          apiKey: settings.apiToken,
          baseUrl: 'https://api.samsara.com',
          webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET,
        };
      }
    } catch (error) {
      console.debug('[Samsara] Could not fetch settings from SamsaraSettings table:', error);
    }
  }

  // 2. Legacy: Check old Integration table
  if (companyId) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const integration = await prisma.integration.findUnique({
        where: {
          companyId_provider: {
            companyId,
            provider: 'SAMSARA',
          },
        },
      });

      if (integration?.apiKey && integration.isActive) {
        return {
          apiKey: integration.apiKey,
          baseUrl: 'https://api.samsara.com',
          webhookSecret: integration.apiSecret || process.env.SAMSARA_WEBHOOK_SECRET,
        };
      }
    } catch (error) {
      console.debug('[Samsara] Could not fetch legacy API key from database:', error);
    }
  }

  // 3. Fall back to environment variable
  // const apiKey = process.env.SAMSARA_API_KEY;

  // if (!apiKey) {
  //   console.warn('Samsara API key not configured (checked hierarchy, legacy db, and env)');
  //   return null;
  // }

  console.warn('Samsara API key not configured for company', companyId);
  return null;

  // return {
  //   apiKey,
  //   baseUrl: 'https://api.samsara.com',
  //   webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET,
  // };
}

/**
 * Make authenticated request to Samsara API
 * @param endpoint API endpoint (e.g., '/fleet/vehicles')
 * @param options Request options
 * @param companyId Optional company ID to check database for API key first
 */
async function samsaraRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  companyId?: string
): Promise<T | null> {
  const config = await getSamsaraConfig(companyId);
  if (!config) {
    console.warn('[Samsara] API key not configured - check database Integration table or SAMSARA_API_KEY in .env.local');
    return null;
  }

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
      // Handle 401 (Unauthorized) - API key might be invalid
      if (response.status === 401) {
        console.error(`[Samsara] Authentication failed for endpoint: ${endpoint}`);
        console.error('[Samsara] Check if API key is valid and not expired');
        console.error('[Samsara] Verify token in Settings → API Tokens in Samsara dashboard');
        return null;
      }

      // Handle 403 (Forbidden) - API key might not have required permissions/scopes
      if (response.status === 403) {
        console.error(`[Samsara] Access forbidden for endpoint: ${endpoint}`);
        console.error('[Samsara] API token may not have required scope/permission');
        console.error('[Samsara] Go to Settings → API Tokens and add missing scope');
        console.error('[Samsara] For Live Map, ensure "Vehicles - Read" scope is enabled');
        return null;
      }

      // Handle 404 (Not Found) gracefully - endpoint may not be available for this account
      if (response.status === 404) {
        // Only log once per endpoint to reduce noise
        if (!unavailableEndpoints.has(endpoint)) {
          unavailableEndpoints.add(endpoint);
          console.debug(`[Samsara] Endpoint not found: ${endpoint} (may not be available for this account)`);
        }
        return null;
      }

      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = error.message || response.statusText;

      // Handle "invalid id" errors gracefully - these are common when vehicle IDs don't match
      // Only log once per endpoint to reduce noise
      if (errorMessage.includes('invalid id') || errorMessage.includes('invalid')) {
        const errorKey = `${endpoint}:invalid_id`;
        if (!unavailableEndpoints.has(errorKey)) {
          unavailableEndpoints.add(errorKey);
          console.debug(`[Samsara] Invalid ID error for endpoint: ${endpoint} (vehicle IDs may not match)`);
        }
        return null;
      }

      throw new Error(`Samsara API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    // Only log as error if it's not a handled case (404, invalid id, etc.)
    if (error instanceof Error) {
      const isHandledError =
        error.message.includes('404') ||
        error.message.includes('invalid id') ||
        error.message.includes('Invalid stat type') ||
        error.message.includes('Not Found');

      if (!isHandledError) {
        console.error('Samsara API request error:', error);
      } else {
        // Log handled errors at debug level only
        console.debug(`[Samsara] Handled error: ${error.message}`);
      }
    } else {
      console.error('Samsara API request error:', error);
    }
    return null;
  }
}

/**
 * Get all vehicles in the fleet
 * @param companyId Optional company ID to check database for API key first
 */
export async function getSamsaraVehicles(companyId?: string): Promise<SamsaraVehicle[] | null> {
  // Use correct endpoint: /fleet/vehicles (not /vehicles)
  // The /vehicles endpoint doesn't exist - must use /fleet/vehicles
  const result = await samsaraRequest<SamsaraVehicle[] | { data?: SamsaraVehicle[] }>(
    '/fleet/vehicles',
    {},
    companyId
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get all assets (trailers) in the fleet
 * @param companyId Optional company ID to check database for API key first
 */
export async function getSamsaraAssets(companyId?: string): Promise<SamsaraVehicle[] | null> {
  try {
    const result = await samsaraRequest<SamsaraVehicle[] | { data?: SamsaraVehicle[] }>(
      '/fleet/assets',
      {},
      companyId
    );

    if (!result) return null;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;

    return null;
  } catch (error) {
    // Assets endpoint might not be available for all accounts
    console.debug('[Samsara] Assets endpoint not available:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get vehicle by ID
 */
async function getSamsaraVehicle(vehicleId: string): Promise<SamsaraVehicle | null> {
  const vehicles = await getSamsaraVehicles();
  if (!vehicles) return null;
  return vehicles.find((v) => v.id === vehicleId) || null;
}

/**
 * Get all drivers
 */
export async function getSamsaraDrivers(companyId?: string): Promise<SamsaraDriver[] | null> {
  // Use the correct endpoint: /fleet/drivers (per Samsara API docs)
  const result = await samsaraRequest<SamsaraDriver[] | { data?: SamsaraDriver[] }>(
    '/fleet/drivers',
    {},
    companyId
  );

  if (!result) return null;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;

  return null;
}

/**
 * Get driver by ID
 */
async function getSamsaraDriver(driverId: string, companyId?: string): Promise<SamsaraDriver | null> {
  const drivers = await getSamsaraDrivers(companyId);
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
async function getSamsaraHOSLogs(
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
 * Get asset location and speed data using the stream endpoint
 * This endpoint returns location AND speed together, more efficient than separate calls
 * Reference: https://developers.samsara.com/reference/getassetslocationandspeedstream
 * 
 * NOTE: This endpoint REQUIRES asset IDs and has a limit of 50 IDs per request
 */
async function getSamsaraAssetLocationAndSpeed(
  vehicleIds?: string[],
  companyId?: string
): Promise<Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> | null> {
  // This endpoint requires asset IDs - skip if not provided
  if (!vehicleIds || vehicleIds.length === 0) {
    return null;
  }

  // API limit: maximum 50 asset IDs per request
  const MAX_IDS_PER_REQUEST = 50;

  // If we have more than 50 IDs, we need to batch the requests
  if (vehicleIds.length > MAX_IDS_PER_REQUEST) {
    const allResults: Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> = [];

    // Process in batches of 50
    for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
      const batch = vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST);
      const batchResult = await getSamsaraAssetLocationAndSpeed(batch, companyId);
      if (batchResult) {
        allResults.push(...batchResult);
      }
    }

    return allResults.length > 0 ? allResults : null;
  }

  try {
    const params = new URLSearchParams();

    // Set time range (last 5 minutes for real-time data)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // 5 minutes ago
    params.append('startTime', startTime.toISOString());
    params.append('endTime', endTime.toISOString());

    // Include speed and reverse geocoding
    params.append('includeSpeed', 'true');
    params.append('includeReverseGeo', 'true');

    // REQUIRED: Filter by vehicle IDs (endpoint requires this, max 50)
    params.append('ids', vehicleIds.join(','));

    // Set limit (max 512)
    params.append('limit', '512');

    const result = await samsaraRequest<{
      data?: Array<{
        id: string;
        location: {
          latitude: number;
          longitude: number;
          speed?: { value: number; unit: string };
          heading?: number;
          address?: string;
        };
        time: string;
      }>;
      pagination?: { endCursor?: string };
    }>(
      `/assets/location-and-speed/stream?${params.toString()}`,
      {},
      companyId
    );

    if (!result || !result.data || result.data.length === 0) {
      return null;
    }

    // Convert to our format, taking the most recent location for each vehicle
    const locationMap = new Map<string, { vehicleId: string; location: SamsaraVehicle['location'] }>();

    result.data.forEach((entry) => {
      if (!entry.id || !entry.location) return;

      const speedMph = entry.location.speed?.value
        ? (entry.location.speed.unit === 'mph'
          ? entry.location.speed.value
          : entry.location.speed.value * 0.621371) // Convert km/h to mph
        : undefined;

      locationMap.set(entry.id, {
        vehicleId: entry.id,
        location: {
          latitude: entry.location.latitude,
          longitude: entry.location.longitude,
          speedMilesPerHour: speedMph,
          heading: entry.location.heading,
          address: entry.location.address,
        },
      });
    });

    return Array.from(locationMap.values());
  } catch (error) {
    console.debug('[Samsara] Asset location-and-speed stream endpoint not available, falling back to legacy endpoint');
    return null;
  }
}

/**
 * Get vehicle locations in real-time
 * Tries the new location-and-speed stream endpoint first (if vehicle IDs provided), then falls back to legacy endpoints
 * Reference: 
 * - New: https://developers.samsara.com/reference/getassetslocationandspeedstream
 * - Legacy: https://developers.samsara.com/reference/getfleetvehicleslocations
 */
export async function getSamsaraVehicleLocations(
  vehicleIds?: string[],
  companyId?: string
): Promise<Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> | null> {
  // Try the new location-and-speed stream endpoint first (only if vehicle IDs are provided)
  // This endpoint requires IDs, so we can only use it when we have them
  if (vehicleIds && vehicleIds.length > 0) {
    const streamResult = await getSamsaraAssetLocationAndSpeed(vehicleIds, companyId);
    if (streamResult && streamResult.length > 0) {
      return streamResult;
    }
  }

  // Fallback to correct endpoints (these work without IDs or with batched IDs)
  // Use the correct endpoint: /fleet/vehicles/locations (per Samsara API docs)
  // Note: /fleet/locations doesn't exist - use /fleet/vehicles/locations instead

  // Batch vehicle IDs if we have more than 50
  const MAX_IDS_PER_REQUEST = 50;
  let allResults: Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> = [];

  if (vehicleIds && vehicleIds.length > MAX_IDS_PER_REQUEST) {
    // Process in batches of 50
    for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
      const batch = vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST);
      const batchResult = await getSamsaraVehicleLocations(batch, companyId);
      if (batchResult) {
        allResults.push(...batchResult);
      }
    }
    return allResults.length > 0 ? allResults : null;
  }

  // Use correct endpoint: /fleet/vehicles/locations
  const params = new URLSearchParams();
  if (vehicleIds && vehicleIds.length > 0) {
    params.append('vehicleIds', vehicleIds.join(','));
  }
  // Add types parameter for current location
  params.append('types', 'currentLocation');

  // Try the correct endpoint: /fleet/vehicles/locations
  let result = await samsaraRequest<{ data: SamsaraVehicle[] }>(
    `/fleet/vehicles/locations?${params.toString()}`,
    {},
    companyId
  );

  // If that fails, try without types parameter
  if (!result || !result.data) {
    const simpleParams = new URLSearchParams();
    if (vehicleIds && vehicleIds.length > 0) {
      simpleParams.append('vehicleIds', vehicleIds.join(','));
    }
    result = await samsaraRequest<{ data: SamsaraVehicle[] }>(
      `/fleet/vehicles/locations${simpleParams.toString() ? `?${simpleParams.toString()}` : ''}`,
      {},
      companyId
    );
  }

  if (!result || !result.data) return null;

  // Handle different response formats
  if (Array.isArray(result.data)) {
    // Check if it's the new format (array of location objects with vehicleId)
    if (result.data.length > 0 && 'vehicleId' in result.data[0]) {
      return result.data.map((entry: any) => ({
        vehicleId: entry.vehicleId,
        location: entry.location,
      }));
    }
    // Legacy format: array of vehicles
    return result.data.map((vehicle: any) => ({
      vehicleId: vehicle.id,
      location: vehicle.location || vehicle.gps,
    }));
  }

  return [];
}

/**
 * Get diagnostics / fault codes for vehicles
 * Note: Some Samsara API configurations may require vehicleIds parameter
 */
export async function getSamsaraVehicleDiagnostics(
  vehicleIds?: string[],
  companyId?: string
): Promise<SamsaraVehicleDiagnostic[] | null> {
  try {
    // Batch vehicle IDs if we have more than 50 (API limit)
    const MAX_IDS_PER_REQUEST = 50;

    if (vehicleIds && vehicleIds.length > MAX_IDS_PER_REQUEST) {
      const allResults: SamsaraVehicleDiagnostic[] = [];

      // Process in batches of 50
      for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
        const batch = vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST);
        const batchResult = await getSamsaraVehicleDiagnostics(batch, companyId);
        if (batchResult) {
          allResults.push(...batchResult);
        }
      }

      return allResults.length > 0 ? allResults : null;
    }

    // Try /fleet/vehicles/stats first (more reliable than diagnostics)
    // Use faultCodes stat type (checkEngineLightOn doesn't exist)
    // faultCodes includes milStatus field which indicates check engine light
    let endpoint = '/fleet/vehicles/stats';
    const params = new URLSearchParams();
    // Use valid stat types: faultCodes (includes milStatus for check engine light)
    params.append('types', 'faultCodes');
    // Only add vehicleIds if provided, otherwise fetch all (like diagnostics endpoint does)
    if (vehicleIds && vehicleIds.length > 0) {
      params.append('vehicleIds', vehicleIds.join(','));
    }
    endpoint = `${endpoint}?${params.toString()}`;

    console.log('[Samsara] Fetching diagnostics from:', endpoint);
    const statsResult = await samsaraRequest<any>(endpoint, {}, companyId);

    // Samsara API returns { data: [...] } wrapper, not direct array
    const dataArray = Array.isArray(statsResult)
      ? statsResult
      : (statsResult?.data && Array.isArray(statsResult.data)
        ? statsResult.data
        : (statsResult?.data ? [statsResult.data] : []));

    // If stats endpoint works, convert to diagnostics format
    if (dataArray && dataArray.length > 0) {
      console.log('[Samsara] Diagnostics: Got', dataArray.length, 'entries from', endpoint);
      // Log first entry structure for debugging
      if (dataArray[0]) {
        console.log('[Samsara] Diagnostics first entry keys:', Object.keys(dataArray[0]));
      }
      return dataArray
        .map((entry: any) => {
          // Extract vehicleId FIRST - Samsara stats API returns 'id' at top level
          // Check multiple possible fields
          const vehicleId = entry.id || entry.vehicleId || entry.vehicle?.id;

          if (!vehicleId) {
            // Only log occasionally to reduce spam
            if (Math.random() < 0.01) {
              console.warn('[Samsara] Diagnostics entry missing vehicleId. Entry structure:', {
                keys: Object.keys(entry).slice(0, 10),
                hasFaultCodes: !!entry.faultCodes,
              });
            }
            return null;
          }

          // faultCodes can be an object with nested structure: {j1939: {diagnosticTroubleCodes: [...]}}
          // OR it can be a direct array
          let faultCodesArray: any[] = [];
          let milStatus: any = null;
          let checkEngineLights: any = null;

          if (entry.faultCodes) {
            // Check if it's the nested structure (j1939 format)
            if (entry.faultCodes.j1939) {
              const j1939 = entry.faultCodes.j1939;
              // Extract diagnostic trouble codes
              if (Array.isArray(j1939.diagnosticTroubleCodes)) {
                faultCodesArray = j1939.diagnosticTroubleCodes.map((dtc: any) => ({
                  code: dtc.spnId ? `SPN${dtc.spnId}` : dtc.code,
                  description: dtc.spnDescription || dtc.fmiDescription || dtc.description,
                  severity: dtc.milStatus === 1 ? 'high' : 'medium',
                  active: dtc.occurrenceCount > 0,
                  occurredAt: entry.time || dtc.time,
                }));
              }
              // Extract check engine lights
              checkEngineLights = j1939.checkEngineLights;
              milStatus = checkEngineLights?.warningIsOn || checkEngineLights?.emissionsIsOn ||
                checkEngineLights?.protectIsOn || checkEngineLights?.stopIsOn;
            } else if (Array.isArray(entry.faultCodes)) {
              // Direct array format
              faultCodesArray = entry.faultCodes;
            }
          }

          // Determine check engine light status
          const checkEngineLightOn = milStatus === true || milStatus === 'On' ||
            (checkEngineLights && (checkEngineLights.warningIsOn || checkEngineLights.emissionsIsOn));

          return {
            vehicleId, // Already extracted at the top of the function
            checkEngineLightOn: checkEngineLightOn || false,
            faults: faultCodesArray,
            lastUpdatedTime: entry.time || new Date().toISOString(),
          };
        })
        .filter((entry: { vehicleId: string; checkEngineLightOn: boolean; faults: any[]; lastUpdatedTime: string } | null): entry is { vehicleId: string; checkEngineLightOn: boolean; faults: any[]; lastUpdatedTime: string } => entry !== null);
    }

    // No data returned
    console.warn('[Samsara] Diagnostics: No data from endpoint', endpoint, '- response type:', typeof statsResult, 'keys:', statsResult ? Object.keys(statsResult) : 'null');
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
 * Uses the Stats endpoint per Samsara API documentation
 * Reference: https://developers.samsara.com/reference/getfleetvehiclesstats
 * 
 * Note: The stats endpoint may not be available for all Samsara accounts/plans.
 * If unavailable, speed data can still be obtained from vehicle locations.
 */
export async function getSamsaraVehicleStats(
  vehicleIds?: string[],
  companyId?: string
): Promise<SamsaraVehicleStats[] | null> {
  // Only skip if explicitly disabled (not just missing)
  // This allows the feature to work by default
  if (process.env.SAMSARA_STATS_ENABLED === 'false') {
    console.debug('[Samsara] Stats disabled by SAMSARA_STATS_ENABLED=false');
    return null;
  }

  // Samsara API limit: Maximum 3 stat types per request (or 1 type + 2 decorations = 4 total)
  // We need to make multiple requests to get all the data we need

  try {
    // Request 1: Speed and engine data (most critical)
    const request1Types = ['ecuSpeedMph', 'engineStates', 'engineRpm'];
    const params1 = new URLSearchParams();
    params1.append('types', request1Types.join(','));
    if (vehicleIds && vehicleIds.length > 0) {
      params1.append('vehicleIds', vehicleIds.join(','));
    }

    const result1 = await samsaraRequest<SamsaraVehicleStats[] | { data?: SamsaraVehicleStats[] }>(
      `/fleet/vehicles/stats?${params1.toString()}`,
      {},
      companyId
    );

    // Request 2: Fuel and odometer data
    const request2Types = ['fuelPercents', 'obdOdometerMeters'];
    const params2 = new URLSearchParams();
    params2.append('types', request2Types.join(','));
    if (vehicleIds && vehicleIds.length > 0) {
      params2.append('vehicleIds', vehicleIds.join(','));
    }

    const result2 = await samsaraRequest<SamsaraVehicleStats[] | { data?: SamsaraVehicleStats[] }>(
      `/fleet/vehicles/stats?${params2.toString()}`,
      {},
      companyId
    );



    // Combine results from both requests
    const stats1 = Array.isArray(result1) ? result1 : (result1?.data || []);
    const stats2 = Array.isArray(result2) ? result2 : (result2?.data || []);



    // Merge stats by vehicleId (Samsara API returns 'id' at top level, not 'vehicleId')
    const statsMap = new Map<string, any>();

    // Add stats from first request
    stats1.forEach((entry: any) => {
      // Samsara API returns 'id' at top level, not 'vehicleId'
      const vehicleId = entry?.id || entry?.vehicleId;
      if (vehicleId) {
        statsMap.set(vehicleId, { ...entry, vehicleId: vehicleId });
      }
    });

    // Merge stats from second request
    stats2.forEach((entry: any) => {
      // Samsara API returns 'id' at top level, not 'vehicleId'
      const vehicleId = entry?.id || entry?.vehicleId;
      if (vehicleId) {
        const existing = statsMap.get(vehicleId) || {};
        statsMap.set(vehicleId, {
          ...existing,
          ...entry,
          vehicleId: vehicleId, // Ensure vehicleId is set for downstream code
          // Merge fuelPercents and obdOdometerMeters
          fuelPercents: entry.fuelPercents ?? existing.fuelPercents,
          obdOdometerMeters: entry.obdOdometerMeters ?? existing.obdOdometerMeters,
        });
      }
    });

    const combinedStats = Array.from(statsMap.values());

    if (combinedStats.length > 0) {
      console.log('[Samsara] Stats API returned', combinedStats.length, 'vehicles with telemetry');
      return combinedStats;
    } else {
      console.log('[Samsara] Stats API returned no data - stats1:', stats1.length, 'stats2:', stats2.length);
    }
  } catch (error: any) {
    if (error?.message?.includes('Invalid stat type') ||
      error?.message?.includes('invalid') ||
      error?.message?.includes('Must provide') ||
      error?.message?.includes('restricted to 4 types')) {
      console.debug('[Samsara] Stats endpoint not available or stat types not supported');
      console.debug('[Samsara] Speed data will be obtained from vehicle locations instead');
      return null;
    }
    console.debug('[Samsara] Stats endpoint error:', error instanceof Error ? error.message : error);
  }

  // Return null gracefully - speed can come from location data
  return null;
}

/**
 * Get recent trips for vehicles
 * @param vehicleIds Optional array of vehicle IDs to filter trips (required for /trips endpoint)
 * @param driverIds Optional array of driver IDs to filter trips (alternative to vehicleIds)
 * @param companyId Optional company ID to check database for API key first
 */
export async function getSamsaraTrips(
  vehicleIds?: string[],
  driverIds?: string[],
  companyId?: string
): Promise<SamsaraTrip[] | null> {
  // Only skip if explicitly disabled (not just missing)
  // This allows the feature to work by default
  if (process.env.SAMSARA_TRIPS_ENABLED === 'false') {
    console.debug('[Samsara] Trips disabled by SAMSARA_TRIPS_ENABLED=false');
    return null;
  }

  // The /trips endpoint requires at least one filter: vehicleIds OR driverIds
  // If neither is provided, we can't make the request
  if ((!vehicleIds || vehicleIds.length === 0) && (!driverIds || driverIds.length === 0)) {
    console.debug('[Samsara] Trips endpoint requires vehicleIds or driverIds filter - skipping');
    return null;
  }

  // Use correct endpoint: /trips (requires enablement) or /v1/fleet/trips (legacy)
  // Note: /fleet/trips doesn't exist in current API
  const limit = parseInt(process.env.SAMSARA_TRIPS_LIMIT || '3', 10);
  const params = new URLSearchParams();

  // Add required filter: vehicleIds or driverIds
  if (vehicleIds && vehicleIds.length > 0) {
    // Batch vehicle IDs if more than 50 (API limit)
    const batches: string[][] = [];
    for (let i = 0; i < vehicleIds.length; i += 50) {
      batches.push(vehicleIds.slice(i, i + 50));
    }

    // Make requests for each batch and combine results
    const allTrips: SamsaraTrip[] = [];

    for (const batch of batches) {
      const batchParams = new URLSearchParams();
      batchParams.append('vehicleIds', batch.join(','));

      // Set time range (last 24 hours)
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      batchParams.append('startTime', startTime.toISOString());
      batchParams.append('endTime', endTime.toISOString());
      batchParams.append('limit', String(limit));

      try {
        // Try new endpoint first: /trips (requires enablement)
        const result = await samsaraRequest<SamsaraTrip[] | { data?: SamsaraTrip[] }>(
          `/trips?${batchParams.toString()}`,
          {},
          companyId
        );

        if (result) {
          const trips = Array.isArray(result) ? result : (result.data || []);
          allTrips.push(...trips);
        }
      } catch (error) {
        // If /trips fails, we'll try legacy endpoint below
        console.debug('[Samsara] /trips endpoint failed, trying legacy fallback:', error instanceof Error ? error.message : 'Unknown error');
        // Break the loop to stop trying /trips for other batches and fall through to legacy
        break;
      }
    }

    // Only return if we actually got results from the new endpoint
    // If allTrips is empty (or partial because we broke), we might want to try legacy for ALL ids
    // But the legacy block below uses the original `vehicleIds` array.
    if (allTrips.length > 0 && allTrips.length === vehicleIds.length) { // Optimization: if we matched count, return. But actually just return what we found?
      return allTrips;
    }
    // If we have some trips but failed on later batches, we might be in a mixed state. 
    // Safer to just check: if we caught an error (failed), we fall through.
    // However, if we successfully got trips for ALL batches, we return them.
    if (allTrips.length > 0) {
      return allTrips;
    }
  } else if (driverIds && driverIds.length > 0) {
    // Filter by driver IDs
    params.append('driverIds', driverIds.join(','));

    // Set time range (last 24 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    params.append('startTime', startTime.toISOString());
    params.append('endTime', endTime.toISOString());
    params.append('limit', String(limit));

    // Try new endpoint first: /trips (requires enablement)
    const result = await samsaraRequest<SamsaraTrip[] | { data?: SamsaraTrip[] }>(
      `/trips?${params.toString()}`,
      {},
      companyId
    );

    if (result) {
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.data)) return result.data;
    }
  }

  // Fallback to legacy endpoint if new one doesn't work
  // Legacy endpoint also requires vehicleIds or driverIds
  if (vehicleIds && vehicleIds.length > 0) {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      const legacyResult = await samsaraRequest<SamsaraTrip[] | { data?: SamsaraTrip[] }>(
        '/v1/fleet/trips',
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleIds: vehicleIds.slice(0, 50), // Legacy may also have limits
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            limit,
          }),
        },
        companyId
      );
      if (legacyResult) {
        if (Array.isArray(legacyResult)) return legacyResult;
        if (Array.isArray(legacyResult.data)) return legacyResult.data;
      }
    } catch (error) {
      // Legacy endpoint also failed - trips not available
      // Only log once to reduce noise
      if (!unavailableEndpoints.has('/trips')) {
        unavailableEndpoints.add('/trips');
        console.debug('[Samsara] Trips endpoint not available (requires enablement)');
      }
    }
  }

  return null;
}

/**
 * Get latest camera media (stills) for vehicles
 * 
 * Note: Camera media endpoints vary by Samsara account type and may require:
 * - Safety license
 * - Specific API permissions
 * - Camera hardware installed on vehicles
 * 
 * This function tries multiple endpoints and gracefully handles failures
 */
export async function getSamsaraCameraMedia(companyId?: string): Promise<SamsaraCameraMedia[] | null> {
  // Only skip if explicitly disabled (not just missing)
  // This allows the feature to work by default
  if (process.env.SAMSARA_CAMERA_MEDIA_ENABLED === 'false') {
    console.debug('[Samsara] Camera media disabled by SAMSARA_CAMERA_MEDIA_ENABLED=false');
    return null;
  }

  const requestedTypes =
    process.env.SAMSARA_CAMERA_MEDIA_TYPES || ['forwardFacing', 'driverFacing'].join(',');

  // Check if camera features are unavailable (cached to reduce log noise)
  if (unavailableEndpoints.has('/fleet/cameras/media') && unavailableEndpoints.has('/safety/media')) {
    return null;
  }

  // Try the legacy cameras/media endpoint first (most common)
  try {
    const mediaResult = await samsaraRequest<SamsaraCameraMedia[] | { data?: SamsaraCameraMedia[] }>(
      `/fleet/cameras/media?types=${encodeURIComponent(requestedTypes)}`,
      {},
      companyId
    );

    if (mediaResult) {
      // Normalize the response to always have data property
      let result: { data?: SamsaraCameraMedia[] } | null = null;
      if (Array.isArray(mediaResult)) {
        result = { data: mediaResult };
      } else if (mediaResult && typeof mediaResult === 'object' && 'data' in mediaResult) {
        result = mediaResult;
      }

      if (result?.data) {
        return result.data;
      }
    }
  } catch (error: any) {
    // Endpoint not found or not available - mark as unavailable and try alternatives
    if (!unavailableEndpoints.has('/fleet/cameras/media')) {
      unavailableEndpoints.add('/fleet/cameras/media');
      console.debug('[Samsara] Camera media endpoint /fleet/cameras/media not available, trying alternatives');
    }
  }

  // Try Safety Media endpoint (requires Safety license)
  // Skip if already marked as unavailable
  if (unavailableEndpoints.has('/safety/media')) {
    return null;
  }

  try {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const result = await samsaraRequest<{ data?: SamsaraCameraMedia[] }>(
      `/safety/media?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      {},
      companyId
    );

    if (result?.data) {
      return result.data;
    }
  } catch (error: any) {
    // Safety endpoint not available - mark as unavailable and only log once
    if (!unavailableEndpoints.has('/safety/media')) {
      unavailableEndpoints.add('/safety/media');
      console.debug('[Samsara] Safety media endpoint not available - camera media may require Safety license');
    }
  }

  // No camera media available - this is normal if:
  // - Account doesn't have Safety license
  // - No cameras installed on vehicles
  // - API token doesn't have required permissions
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

