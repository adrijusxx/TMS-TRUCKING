import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/maps/google-maps';
import {
  getSamsaraCameraMedia,
  getSamsaraVehicleDiagnostics,
  getSamsaraVehicleLocations,
  getSamsaraVehicleStats,
  getSamsaraVehicles,
  getSamsaraTrips,
  getSamsaraAssets,
} from '@/lib/integrations/samsara';

type LocationSource = 'route' | 'geocode' | 'samsara';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  source: LocationSource;
  heading?: number;
  speed?: number;
  lastUpdated?: string;
}

export interface LoadMapEntry {
  id: string;
  loadNumber: string;
  status: string;
  pickup?: MapLocation;
  delivery?: MapLocation;
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  routeDescription?: string; // "City, State → City, State"
  driver?: {
    id: string;
    driverNumber: string;
    name: string;
  };
  dispatcher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  truck?: {
    id: string;
    truckNumber: string;
    licensePlate?: string | null;
    vin?: string | null;
  };
  trailer?: {
    id: string;
    trailerNumber: string;
  };
  truckLocation?: MapLocation;
  truckDiagnostics?: TruckDiagnostics;
  truckSensors?: TruckSensors;
  truckMedia?: TruckMedia;
  truckTrips?: TruckTrip[];
}

export interface TruckMapEntry {
  id: string;
  truckNumber: string;
  status: string;
  location?: MapLocation;
  matchSource?: string;
  diagnostics?: TruckDiagnostics;
  sensors?: TruckSensors;
  latestMedia?: TruckMedia;
  recentTrips?: TruckTrip[];
  isSamsaraOnly?: boolean; // True if this vehicle exists in Samsara but not in database
  activeLoad?: {
    id: string;
    loadNumber: string;
    status: string;
    stops: Array<{
      id: string;
      city: string | null;
      state: string | null;
      formattedAddress: string | null;
      scheduledTime: Date | null;
    }>;
  } | null;
}

export interface TrailerMapEntry {
  id: string;
  trailerNumber: string;
  status: string;
  location?: MapLocation;
  matchSource?: string;
}

export interface TruckDiagnostics {
  totalFaults: number;
  activeFaults: number;
  checkEngineLightOn?: boolean;
  lastUpdated?: string;
  faults: Array<{
    code?: string;
    description?: string;
    severity?: string;
    active?: boolean;
    occurredAt?: string;
  }>;
}

interface SamsaraVehicleWithLocation {
  id: string;
  name?: string;
  licensePlate?: string;
  vin?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    heading?: number;
    speedMilesPerHour?: number;
    vehicleTime?: string;
  };
  diagnostics?: TruckDiagnostics;
  sensors?: TruckSensors;
  recentTrips?: TruckTrip[];
  latestMedia?: TruckMedia;
}

export interface TruckSensors {
  speed?: {
    value?: number;
    limit?: number;
  };
  fuelPercent?: number;
  odometerMiles?: number;
  engineHours?: number;
  engineState?: string;
  seatbeltStatus?: string;
}

export interface TruckTrip {
  id: string;
  startAddress?: string;
  endAddress?: string;
  distanceMiles?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
}

export interface TruckMedia {
  url: string;
  capturedAt: string;
  cameraType?: string;
}

const ACTIVE_LOAD_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'LOADED',
  'EN_ROUTE_DELIVERY',
  'AT_DELIVERY',
] as const;

const ACTIVE_TRUCK_STATUSES = ['IN_USE', 'AVAILABLE'] as const;
// Include all non-deleted trailers for map display (not just IN_USE/AVAILABLE)
// Trailers can have various statuses but we want to show them all if they're not deleted
const ACTIVE_TRAILER_STATUSES = ['IN_USE', 'AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RESERVED'] as const;

export class LiveMapService {
  private readonly companyId: string;
  private geocodeCache = new Map<string, MapLocation>(); // Keep geocoding cache for Google Maps API

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  async getSnapshot(): Promise<{ loads: LoadMapEntry[]; trucks: TruckMapEntry[]; trailers: TrailerMapEntry[] }> {
    // Get loads first (fast, no external API calls)
    const loads = await this.getLoadEntries();

    // Get trucks and trailers in parallel (these call Samsara but we'll make them faster)
    const [trucks, trailers] = await Promise.all([
      this.getTruckEntries(),
      this.getTrailerEntries(),
    ]);

    console.log('[LiveMapService] Snapshot summary:', {
      loads: loads.length,
      trucks: trucks.length,
      trucksWithLocation: trucks.filter(t => t.location).length,
      trucksWithoutLocation: trucks.filter(t => !t.location).length,
      trailers: trailers.length,
      trailersWithLocation: trailers.filter(t => t.location).length,
    });

    const truckTelemetry = new Map<string, TruckMapEntry>();
    trucks.forEach((truck) => {
      truckTelemetry.set(truck.id, truck);
    });

    const loadsWithTruckLocation = loads.map((load) => {
      const telemetry = load.truck?.id ? truckTelemetry.get(load.truck.id) : undefined;
      return {
        ...load,
        truckLocation: telemetry?.location,
        truckDiagnostics: telemetry?.diagnostics,
        truckSensors: telemetry?.sensors,
        truckMedia: telemetry?.latestMedia,
        truckTrips: telemetry?.recentTrips,
      };
    });

    return {
      loads: loadsWithTruckLocation,
      trucks,
      trailers,
    };
  }

  private async getLoadEntries(): Promise<LoadMapEntry[]> {
    const loads = await prisma.load.findMany({
      where: {
        companyId: this.companyId,
        deletedAt: null,
        status: { in: ACTIVE_LOAD_STATUSES as any },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        route: true,
        stops: {
          orderBy: { sequence: 'asc' },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
            licensePlate: true,
            vin: true,
          },
        },
        trailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
      },
    });

    return Promise.all(
      loads.map(async (load) => {
        const pickup = await this.resolveLoadPoint(load, 'pickup');
        const delivery = await this.resolveLoadPoint(load, 'delivery');
        const routeWaypoints = this.getRouteWaypoints(load.route?.waypoints);

        // Generate route description
        const routeDescription = this.generateRouteDescription(load);

        return {
          id: load.id,
          loadNumber: load.loadNumber,
          status: load.status,
          pickup,
          delivery,
          routeWaypoints,
          routeDescription,
          driver: load.driver
            ? {
              id: load.driver.id,
              driverNumber: load.driver.driverNumber,
              name: `${load.driver.user.firstName} ${load.driver.user.lastName}`,
            }
            : undefined,
          dispatcher: load.dispatcher
            ? {
              id: load.dispatcher.id,
              firstName: load.dispatcher.firstName,
              lastName: load.dispatcher.lastName,
            }
            : undefined,
          truck: load.truck
            ? {
              id: load.truck.id,
              truckNumber: load.truck.truckNumber,
              licensePlate: load.truck.licensePlate,
              vin: load.truck.vin,
            }
            : undefined,
          trailer: load.trailer
            ? {
              id: load.trailer.id,
              trailerNumber: load.trailer.trailerNumber,
            }
            : undefined,
        };
      })
    );
  }

  private getRouteWaypoints(waypoints?: any): Array<{ lat: number; lng: number }> | undefined {
    if (!Array.isArray(waypoints)) {
      return undefined;
    }

    const validWaypoints = waypoints
      .map((point: any) => ({
        lat: typeof point.lat === 'number' ? point.lat : undefined,
        lng: typeof point.lng === 'number' ? point.lng : undefined,
      }))
      .filter((point) => typeof point.lat === 'number' && typeof point.lng === 'number') as Array<{
        lat: number;
        lng: number;
      }>;

    return validWaypoints.length > 0 ? validWaypoints : undefined;
  }

  private async resolveLoadPoint(
    load: any,
    type: 'pickup' | 'delivery'
  ): Promise<MapLocation | undefined> {
    const routeWaypoints = this.getRouteWaypoints(load.route?.waypoints);
    if (routeWaypoints && routeWaypoints.length >= 2) {
      const waypoint =
        type === 'pickup' ? routeWaypoints[0] : routeWaypoints[routeWaypoints.length - 1];
      return {
        lat: waypoint.lat,
        lng: waypoint.lng,
        source: 'route',
      };
    }

    const stop = this.getStopForType(load, type);
    if (!stop) {
      const cityField = type === 'pickup' ? load.pickupCity : load.deliveryCity;
      const stateField = type === 'pickup' ? load.pickupState : load.deliveryState;
      const addressField = type === 'pickup' ? load.pickupAddress : load.deliveryAddress;
      if (!cityField || !stateField) {
        return undefined;
      }

      return this.geocodeLocation([addressField, cityField, stateField].filter(Boolean).join(', '));
    }

    return this.geocodeLocation(`${stop.address}, ${stop.city}, ${stop.state}`);
  }

  private getStopForType(load: any, type: 'pickup' | 'delivery') {
    if (!Array.isArray(load.stops) || load.stops.length === 0) {
      return undefined;
    }

    const sortedStops = [...load.stops].sort((a, b) => a.sequence - b.sequence);
    if (type === 'pickup') {
      return sortedStops.find((stop) => stop.stopType === 'PICKUP') || sortedStops[0];
    }
    return (
      [...sortedStops]
        .reverse()
        .find((stop) => stop.stopType === 'DELIVERY') || sortedStops[sortedStops.length - 1]
    );
  }

  private async geocodeLocation(address: string): Promise<MapLocation | undefined> {
    const key = address.toLowerCase();
    if (this.geocodeCache.has(key)) {
      return this.geocodeCache.get(key);
    }

    const result = await geocodeAddress(address);
    if (!result) {
      return undefined;
    }

    const location: MapLocation = {
      lat: result.lat,
      lng: result.lng,
      address: result.formattedAddress,
      source: 'geocode',
    };

    this.geocodeCache.set(key, location);
    return location;
  }

  private async getTruckEntries(): Promise<TruckMapEntry[]> {
    // Fetch trucks and their active loads separately
    const [trucksRaw, activeLoads] = await Promise.all([
      prisma.truck.findMany({
        where: {
          companyId: this.companyId,
          deletedAt: null,
          status: { in: ACTIVE_TRUCK_STATUSES as any },
        },
        select: {
          id: true,
          truckNumber: true,
          status: true,
          licensePlate: true,
          vin: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      // Fetch active loads for all trucks
      prisma.load.findMany({
        where: {
          companyId: this.companyId,
          deletedAt: null,
          status: { in: ACTIVE_LOAD_STATUSES as any },
          truckId: { not: null },
        },
        select: {
          id: true,
          loadNumber: true,
          status: true,
          truckId: true,
          stops: {
            orderBy: { sequence: 'asc' },
            select: {
              id: true,
              city: true,
              state: true,
              address: true,
              earliestArrival: true,
            }
          }
        }
      })
    ]);

    // Create a map of truckId -> activeLoad
    const activeLoadByTruckId = new Map<string, any>();
    activeLoads.forEach(load => {
      if (load.truckId) {
        activeLoadByTruckId.set(load.truckId, load);
      }
    });

    // Attach active loads to trucks
    const trucks = trucksRaw.map(truck => ({
      ...truck,
      activeLoad: activeLoadByTruckId.get(truck.id) || null,
    }));

    console.log('[LiveMapService] Found', trucks.length, 'trucks in database');

    const samsaraVehicles = await this.getSamsaraVehiclesWithTelemetry();

    // Check how many vehicles have telemetry data
    const vehiclesWithDiagnostics = samsaraVehicles.filter(v => v.diagnostics).length;
    const vehiclesWithSensors = samsaraVehicles.filter(v => v.sensors).length;
    console.log('[LiveMapService] Got', samsaraVehicles.length, 'Samsara vehicles:', {
      withDiagnostics: vehiclesWithDiagnostics,
      withSensors: vehiclesWithSensors,
      withLocation: samsaraVehicles.filter(v => v.location).length,
    });

    const matchedTrucks = trucks.map((truck) => {
      const match = this.matchTruckWithSamsaraVehicle(truck, samsaraVehicles);
      if (!match?.location) {
        console.debug('[LiveMapService] Truck', truck.truckNumber, 'has no location match');
      }

      // DEBUG: Log if sensors are being attached (remove after fix)
      // Removed debug log

      const result = {
        id: truck.id,
        truckNumber: truck.truckNumber,
        status: truck.status,
        location: match?.location,
        matchSource: match?.matchSource,
        diagnostics: match?.diagnostics,
        sensors: match?.sensors,
        latestMedia: match?.latestMedia,
        recentTrips: match?.recentTrips,
        activeLoad: truck.activeLoad ? {
          id: truck.activeLoad.id,
          loadNumber: truck.activeLoad.loadNumber,
          status: truck.activeLoad.status,
          stops: truck.activeLoad.stops.map((stop: any) => ({
            id: stop.id,
            city: stop.city,
            state: stop.state,
            formattedAddress: stop.address, // Map address to formattedAddress for UI compatibility
            scheduledTime: stop.earliestArrival, // Map earliestArrival to scheduledTime
          })),
        } : null,
      };


      return result;
    });




    // Find Samsara vehicles that aren't matched to any database truck
    // Build a set of matched Samsara vehicle IDs by checking all trucks
    const matchedSamsaraIds = new Set<string>();
    trucks.forEach((truck) => {
      samsaraVehicles.forEach((sv) => {
        const match = this.matchTruckWithSamsaraVehicle(truck, [sv]);
        if (match !== undefined) {
          matchedSamsaraIds.add(sv.id);
        }
      });
    });

    const samsaraOnlyVehicles = samsaraVehicles
      .filter((sv) => !matchedSamsaraIds.has(sv.id) && sv.location)
      .map((sv) => {
        // Use Samsara vehicle name or ID as truck number
        const truckNumber = sv.name || sv.id.substring(0, 8) || 'UNKNOWN';
        return {
          id: `samsara-${sv.id}`, // Prefix to avoid conflicts
          truckNumber,
          status: 'SAMSARA_ONLY' as string,
          location: sv.location
            ? {
              lat: sv.location.latitude,
              lng: sv.location.longitude,
              address: sv.location.address,
              heading: sv.location.heading,
              speed: sv.location.speedMilesPerHour,
              lastUpdated: sv.location.vehicleTime,
              source: 'samsara',
            }
            : undefined,
          matchSource: 'samsara-only',
          diagnostics: sv.diagnostics,
          sensors: sv.sensors,
          latestMedia: sv.latestMedia,
          recentTrips: sv.recentTrips,
          isSamsaraOnly: true, // Mark as Samsara-only vehicle
        } as TruckMapEntry;
      });

    console.log('[LiveMapService] Samsara-only vehicles:', {
      count: samsaraOnlyVehicles.length,
      vehicles: samsaraOnlyVehicles.map((v) => ({
        number: v.truckNumber,
        hasLocation: !!v.location,
      })),
    });

    // Combine database trucks with Samsara-only vehicles
    return [...matchedTrucks, ...samsaraOnlyVehicles];
  }

  private async getTrailerEntries(): Promise<TrailerMapEntry[]> {
    try {
      // Get all non-deleted trailers (don't filter by status - show all active trailers)
      // Trailers can have various status values, so we show all non-deleted ones
      const trailers = await prisma.trailer.findMany({
        where: {
          companyId: this.companyId,
          deletedAt: null,
          isActive: true, // Only show active trailers
        },
        select: {
          id: true,
          trailerNumber: true,
          status: true,
          licensePlate: true,
          vin: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 500, // Increased to handle large trailer fleets (you have 231)
      });

      // Get Samsara assets AND vehicles (trailers might be registered as vehicles, not assets)
      const [samsaraAssets, samsaraVehicles] = await Promise.all([
        this.getSamsaraAssetsWithLocation().catch((error) => {
          console.warn('[Samsara] Failed to fetch assets for trailers:', error instanceof Error ? error.message : error);
          return [];
        }),
        // Also get vehicles - trailers might be in the vehicles list
        this.getSamsaraVehiclesWithTelemetry().catch((error) => {
          console.warn('[Samsara] Failed to fetch vehicles for trailers:', error instanceof Error ? error.message : error);
          return [];
        }),
      ]);

      // Combine assets and vehicles for trailer matching
      // Convert vehicles to asset-like format for matching
      const allSamsaraDevices: Array<{
        id: string;
        name?: string;
        licensePlate?: string;
        vin?: string;
        location?: SamsaraVehicleWithLocation['location'];
      }> = [
          ...samsaraAssets,
          ...samsaraVehicles.map((v) => ({
            id: v.id,
            name: v.name,
            licensePlate: v.licensePlate,
            vin: v.vin,
            location: v.location,
          })),
        ];

      console.log('[LiveMap] Matching', trailers.length, 'trailers with', samsaraAssets.length, 'Samsara assets and', samsaraVehicles.length, 'Samsara vehicles (total devices:', allSamsaraDevices.length, ')');

      const matchedTrailers = trailers.map((trailer) => {
        // Try matching with all Samsara devices (assets + vehicles)
        const match = this.matchTrailerWithSamsaraAsset(trailer, allSamsaraDevices);
        if (match) {
          console.log('[LiveMap] Matched trailer', trailer.trailerNumber, 'via', match.matchSource);
        }
        return {
          id: trailer.id,
          trailerNumber: trailer.trailerNumber,
          status: trailer.status || 'UNKNOWN',
          location: match?.location,
          matchSource: match?.matchSource,
        };
      });

      console.log('[LiveMap] Returning', matchedTrailers.filter(t => t.location).length, 'trailers with locations');
      return matchedTrailers;
    } catch (error) {
      console.error('[LiveMap] Error fetching trailers:', error);
      return [];
    }
  }

  private async getSamsaraAssetsWithLocation(): Promise<SamsaraVehicleWithLocation[]> {
    try {
      // Get assets (trailers) from Samsara
      const assets = await getSamsaraAssets(this.companyId);

      if (!assets || assets.length === 0) {
        console.debug('[Samsara] No assets found - trailers may not be configured in Samsara');
        return [];
      }

      console.log('[Samsara] Found', assets.length, 'assets from Samsara');

      const assetIds = assets.map((a) => a.id).filter(Boolean) as string[];

      if (assetIds.length === 0) {
        console.debug('[Samsara] No asset IDs found');
        return assets.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          licensePlate: asset.licensePlate,
          vin: asset.vin,
          location: undefined,
        }));
      }

      // Get locations for assets (this is the critical data we need)
      const locations = await getSamsaraVehicleLocations(assetIds, this.companyId);

      if (!locations || locations.length === 0) {
        console.debug('[Samsara] No locations found for assets');
        return assets.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          licensePlate: asset.licensePlate,
          vin: asset.vin,
          location: undefined,
        }));
      }

      console.log('[Samsara] Found', locations.length, 'asset locations');

      const locationById = new Map<string, SamsaraVehicleWithLocation['location']>();
      locations.forEach((entry: any) => {
        if (entry.vehicleId && entry.location && entry.location.latitude && entry.location.longitude) {
          locationById.set(entry.vehicleId, {
            latitude: entry.location.latitude,
            longitude: entry.location.longitude,
            address: entry.location.address,
            heading: entry.location.heading,
            speedMilesPerHour: entry.location.speedMilesPerHour,
            vehicleTime: entry.location.vehicleTime,
          });
        }
      });

      const result = assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        licensePlate: asset.licensePlate,
        vin: asset.vin,
        location: locationById.get(asset.id),
      }));

      console.log('[Samsara] Returning', result.filter(a => a.location).length, 'assets with locations');
      return result;
    } catch (error) {
      console.error('[Samsara] Error fetching assets:', error);
      return [];
    }
  }

  private matchTrailerWithSamsaraAsset(
    trailer: { trailerNumber: string; licensePlate?: string | null; vin?: string | null },
    samsaraDevices: Array<{
      id: string;
      name?: string;
      licensePlate?: string;
      vin?: string;
      location?: SamsaraVehicleWithLocation['location'];
    }>
  ):
    | {
      location: MapLocation;
      matchSource: string;
    }
    | undefined {
    // Normalize identifiers - handle letters, numbers, and mixed formats
    const normalizedTrailerNumber = this.normalize(trailer.trailerNumber);
    const normalizedPlate = this.normalize(trailer.licensePlate);
    const normalizedVin = this.normalize(trailer.vin);

    for (const device of samsaraDevices) {
      if (!device.location) continue;

      const normalizedDevicePlate = this.normalize(device.licensePlate);
      const normalizedDeviceName = this.normalize(device.name);
      const normalizedDeviceVin = this.normalize(device.vin);

      // Try exact match first
      const nameMatches: boolean =
        !!(normalizedDeviceName &&
          normalizedTrailerNumber &&
          normalizedDeviceName === normalizedTrailerNumber);

      const plateMatches: boolean =
        !!(normalizedDevicePlate && normalizedPlate && normalizedDevicePlate === normalizedPlate);

      const vinMatches: boolean =
        !!(normalizedDeviceVin && normalizedVin && normalizedDeviceVin === normalizedVin);

      // Also try partial matches for trailer numbers (handles cases like "TRL-123" vs "123")
      const namePartialMatch: boolean =
        !!(normalizedDeviceName &&
          normalizedTrailerNumber &&
          (normalizedDeviceName.includes(normalizedTrailerNumber) ||
            normalizedTrailerNumber.includes(normalizedDeviceName)));

      if (nameMatches || plateMatches || vinMatches || namePartialMatch) {
        return {
          location: {
            lat: device.location.latitude,
            lng: device.location.longitude,
            address: device.location.address,
            heading: device.location.heading,
            speed: device.location.speedMilesPerHour,
            lastUpdated: device.location.vehicleTime,
            source: 'samsara',
          },
          matchSource: this.resolveMatchSource({
            plate: plateMatches,
            name: nameMatches || namePartialMatch,
            vin: vinMatches,
          }),
        };
      }
    }

    return undefined;
  }

  private async getSamsaraVehiclesWithTelemetry(): Promise<SamsaraVehicleWithLocation[]> {
    // Get vehicles and locations first (essential data - prioritize speed)
    const [vehicles, locations] = await Promise.all([
      getSamsaraVehicles(this.companyId),
      // Get locations without waiting for vehicle IDs (faster)
      getSamsaraVehicleLocations(undefined, this.companyId),
    ]);

    const vehicleIds = vehicles?.map((v) => v.id).filter(Boolean) as string[] | undefined;

    // Check if API key is working
    if (!vehicles && !locations) {
      console.warn('[Samsara] No vehicles or locations returned - API key may be invalid or missing');
      return [];
    }

    // Process locations immediately (don't wait for telemetry)
    const locationById = new Map<string, SamsaraVehicleWithLocation['location']>();
    locations?.forEach((entry: any) => {
      if (entry.vehicleId && entry.location && entry.location.latitude && entry.location.longitude) {
        // Get address with reverseGeo fallback (matches case-context API)
        const address = entry.location.address
          || entry.location.reverseGeo?.formattedLocation
          || (entry.location.latitude && entry.location.longitude
            ? `${entry.location.latitude.toFixed(5)}, ${entry.location.longitude.toFixed(5)}`
            : undefined);

        locationById.set(entry.vehicleId, {
          latitude: entry.location.latitude,
          longitude: entry.location.longitude,
          address: address,
          heading: entry.location.heading,
          speedMilesPerHour: entry.location.speedMilesPerHour,
          vehicleTime: entry.location.vehicleTime,
        });
      }
    });

    if (!vehicles) {
      return [];
    }

    // Get telemetry data - DON'T use timeout, let it complete (diagnostics endpoint shows it works)
    // The issue was the timeout cutting off the requests before they complete
    let diagnosticsResult: any = null;
    let statsResult: any = null;
    let tripsResult: any = null;
    let mediaResult: any = null;

    try {
      console.log('[Samsara] Fetching telemetry data for all vehicles (NOT filtering by vehicleIds - API works better without)');

      // Fetch all telemetry in parallel - don't timeout, let them complete
      // DON'T pass vehicleIds to diagnostics/stats - API returns all data without filter
      // (The diagnostic test shows /fleet/vehicles/stats?types=faultCodes works and returns 248 items)
      const telemetryResults = await Promise.allSettled([
        // Diagnostics: DON'T pass vehicleIds - API works better without it
        getSamsaraVehicleDiagnostics(undefined, this.companyId),
        getSamsaraVehicleStats(undefined, this.companyId),
        // Trips DOES require vehicleIds
        vehicleIds && vehicleIds.length > 0
          ? getSamsaraTrips(vehicleIds, undefined, this.companyId)
          : Promise.resolve(null),
        getSamsaraCameraMedia(this.companyId),
      ]);

      diagnosticsResult = telemetryResults[0]?.status === 'fulfilled' ? telemetryResults[0].value : null;
      statsResult = telemetryResults[1]?.status === 'fulfilled' ? telemetryResults[1].value : null;
      tripsResult = telemetryResults[2]?.status === 'fulfilled' ? telemetryResults[2].value : null;
      mediaResult = telemetryResults[3]?.status === 'fulfilled' ? telemetryResults[3].value : null;

      if (diagnosticsResult?.length === 0 && statsResult?.length === 0) {
        console.warn('[Samsara] ⚠️ No telemetry data received - diagnostics:', diagnosticsResult?.length || 0, 'stats:', statsResult?.length || 0);
        if (telemetryResults[0]?.status === 'rejected') {
          console.error('[Samsara] Diagnostics error:', telemetryResults[0].reason);
        }
        if (telemetryResults[1]?.status === 'rejected') {
          console.error('[Samsara] Stats error:', telemetryResults[1].reason);
        }
      } else {
        console.log('[Samsara] Telemetry:', { diagnostics: diagnosticsResult?.length || 0, stats: statsResult?.length || 0 });
      }
    } catch (error) {
      // Telemetry failed - continue with just locations
      console.error('[Samsara] Telemetry error:', error instanceof Error ? error.message : error);
    }

    const diagnosticsById = new Map<string, TruckDiagnostics>();
    if (diagnosticsResult && diagnosticsResult.length > 0) {
      let vehiclesWithFaults = 0;
      let totalActiveFaults = 0;

      diagnosticsResult.forEach((entry: { vehicleId: string; faults?: Array<{ code?: string; description?: string; severity?: string; active?: boolean; occurredAt?: string }>; checkEngineLightOn?: boolean; lastUpdatedTime?: string }) => {
        if (!entry || !entry.vehicleId) {
          return;
        }
        const faults = entry.faults || [];
        const activeFaults = faults.filter((fault: { active?: boolean }) => fault.active !== false).length;
        const diagnostics: TruckDiagnostics = {
          totalFaults: faults.length,
          activeFaults: activeFaults,
          checkEngineLightOn: entry.checkEngineLightOn,
          lastUpdated: entry.lastUpdatedTime,
          faults: faults.map((fault: { code?: string; description?: string; severity?: string; active?: boolean; occurredAt?: string }) => ({
            code: fault.code,
            description: fault.description,
            severity: fault.severity,
            active: fault.active,
            occurredAt: fault.occurredAt,
          })),
        };
        diagnosticsById.set(entry.vehicleId, diagnostics);

        if (activeFaults > 0) {
          vehiclesWithFaults++;
          totalActiveFaults += activeFaults;
        }
      });

      console.log('[Samsara] Diagnostics:', {
        total: diagnosticsById.size,
        withFaults: vehiclesWithFaults,
        totalActiveFaults: totalActiveFaults,
      });
    } else {
      console.warn('[Samsara] No diagnostics data received');
    }

    const statsById = new Map<string, TruckSensors>();

    // If stats endpoint provided data, use it
    if (statsResult && statsResult.length > 0) {
      let vehiclesWithFuel = 0;
      let vehiclesWithSpeed = 0;

      statsResult.forEach((entry: any) => {
        // Samsara API returns 'id' at top level, not 'vehicleId'
        const vehicleId = entry.id || entry.vehicleId;
        if (!vehicleId) {
          return;
        }

        // Handle valid Samsara stat types
        // Note: ecuSpeedMph can be an object with {time, value} or a direct number
        const speedObj = entry.ecuSpeedMph;
        const speed = typeof speedObj === 'object' && speedObj?.value !== undefined
          ? speedObj.value
          : (typeof speedObj === 'number' ? speedObj : undefined);
        const speedLimit = entry.speedLimit;

        // fuelPercents can be:
        // 1. Array of objects with {time, value} (most common)
        // 2. Single object with {time, value}
        // 3. Array of numbers
        // 4. Direct number
        let fuelPercent: number | undefined = undefined;
        // Check all possible field names for fuel data
        const fuelData = entry.fuelPercents ?? entry.fuelPercent ?? entry.fuelLevel ?? entry.fuel;

        if (fuelData !== undefined && fuelData !== null) {
          if (Array.isArray(fuelData) && fuelData.length > 0) {
            const firstItem = fuelData[0];
            fuelPercent = (typeof firstItem === 'object' && firstItem !== null) ? firstItem.value : firstItem;
          } else if (typeof fuelData === 'object' && fuelData !== null && fuelData.value !== undefined) {
            fuelPercent = fuelData.value;
          } else if (typeof fuelData === 'number') {
            fuelPercent = fuelData;
          }
        }

        // Ensure fuelPercent is a valid number, otherwise undefined
        if (fuelPercent !== undefined && fuelPercent !== null && (typeof fuelPercent !== 'number' || !isFinite(fuelPercent))) {
          fuelPercent = undefined;
        }

        // obdOdometerMeters can be:
        // 1. Array of objects with {time, value}
        // 2. Single object with {time, value}
        // 3. Direct number
        const odometerObj = entry.obdOdometerMeters;
        let odometerMeters: number | undefined;
        if (Array.isArray(odometerObj) && odometerObj.length > 0) {
          odometerMeters = (typeof odometerObj[0] === 'object' && odometerObj[0] !== null) ? odometerObj[0].value : odometerObj[0];
        } else if (typeof odometerObj === 'object' && odometerObj !== null && odometerObj.value !== undefined) {
          odometerMeters = odometerObj.value;
        } else if (typeof odometerObj === 'number') {
          odometerMeters = odometerObj;
        }

        const odometerMiles = odometerMeters
          ? odometerMeters * 0.000621371 // Convert meters to miles
          : (entry.obdOdometerMiles ?? entry.odometerMiles ?? entry.odometer);

        // engineStates is an object with state property
        const engineState = entry.engineStates?.state ?? entry.engineState;

        // engineHours might be in obdEngineSeconds or syntheticEngineSeconds
        const engineSecondsObj = entry.obdEngineSeconds ?? entry.syntheticEngineSeconds;
        let engineSeconds: number | undefined;
        if (Array.isArray(engineSecondsObj) && engineSecondsObj.length > 0) {
          engineSeconds = (typeof engineSecondsObj[0] === 'object' && engineSecondsObj[0] !== null) ? engineSecondsObj[0].value : engineSecondsObj[0];
        } else if (typeof engineSecondsObj === 'object' && engineSecondsObj !== null && engineSecondsObj.value !== undefined) {
          engineSeconds = engineSecondsObj.value;
        } else if (typeof engineSecondsObj === 'number') {
          engineSeconds = engineSecondsObj;
        }

        const engineHours = engineSeconds
          ? engineSeconds / 3600
          : entry.engineHours;

        const sensors: TruckSensors = {
          speed:
            speed !== undefined || speedLimit !== undefined
              ? { value: speed, limit: speedLimit }
              : undefined,
          fuelPercent: fuelPercent,
          odometerMiles: odometerMiles,
          engineHours: engineHours,
          engineState: engineState,
          seatbeltStatus: entry.seatbeltStatus,
        };
        statsById.set(vehicleId, sensors);

        // Track statistics
        if (fuelPercent !== undefined) vehiclesWithFuel++;
        if (speed !== undefined) vehiclesWithSpeed++;
      });

      console.log('[Samsara] Sensors:', {
        total: statsById.size,
        withFuel: vehiclesWithFuel,
        withSpeed: vehiclesWithSpeed,
      });
    } else {
      console.warn('[Samsara] No stats data received');
    }

    // Extract speed from location data if stats endpoint didn't provide it
    // Location data often includes speedMilesPerHour
    locations?.forEach((entry: any) => {
      if (!entry?.vehicleId || !entry?.location) return;

      const vehicleId = entry.vehicleId;
      const location = entry.location;

      // If we don't have stats for this vehicle, create sensors from location data
      if (!statsById.has(vehicleId) && location.speedMilesPerHour !== undefined) {
        statsById.set(vehicleId, {
          speed: {
            value: location.speedMilesPerHour,
            limit: undefined, // Speed limit not available from location
          },
          // Fuel and other stats not available from location data
        });
      } else if (statsById.has(vehicleId)) {
        // If we have stats but no speed, try to get it from location
        const existing = statsById.get(vehicleId)!;
        if (!existing.speed?.value && location.speedMilesPerHour !== undefined) {
          existing.speed = {
            value: location.speedMilesPerHour,
            limit: existing.speed?.limit,
          };
        }
      }
    });

    const tripsByVehicle = new Map<string, TruckTrip[]>();
    tripsResult?.forEach((trip: { id: string; vehicleId: string; startLocation?: { address?: string; time?: string }; endLocation?: { address?: string; time?: string }; distanceMiles?: number; durationSeconds?: number }) => {
      if (!trip?.vehicleId) return;
      const list = tripsByVehicle.get(trip.vehicleId) || [];
      list.push({
        id: trip.id,
        startAddress: trip.startLocation?.address,
        endAddress: trip.endLocation?.address,
        distanceMiles: trip.distanceMiles,
        durationSeconds: trip.durationSeconds,
        startedAt: trip.startLocation?.time,
        endedAt: trip.endLocation?.time,
      });
      tripsByVehicle.set(trip.vehicleId, list.slice(0, 3));
    });

    const mediaByVehicle = new Map<string, TruckMedia>();
    mediaResult?.forEach((item: { url: string; createdAt: string; cameraType?: string; vehicleId?: string }) => {
      if (!item?.vehicleId || !item.url) return;
      const existing = mediaByVehicle.get(item.vehicleId);
      if (!existing || new Date(item.createdAt).getTime() > new Date(existing.capturedAt).getTime()) {
        mediaByVehicle.set(item.vehicleId, {
          url: item.url,
          capturedAt: item.createdAt,
          cameraType: item.cameraType,
        });
      }
    });

    const result = vehicles.map((vehicle: any) => {
      const diagnostics = diagnosticsById.get(vehicle.id);
      const sensors = statsById.get(vehicle.id);

      return {
        id: vehicle.id,
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        location: locationById.get(vehicle.id),
        diagnostics,
        sensors,
        recentTrips: tripsByVehicle.get(vehicle.id),
        latestMedia: mediaByVehicle.get(vehicle.id),
      };
    });

    const telemetrySummary = {
      withDiagnostics: result.filter(v => v.diagnostics).length,
      withSensors: result.filter(v => v.sensors).length,
      withLocation: result.filter(v => v.location).length,
    };

    console.log('[Samsara] Returning', result.length, 'vehicles:', telemetrySummary);

    // If no telemetry, log a warning
    if (telemetrySummary.withDiagnostics === 0 && telemetrySummary.withSensors === 0) {
      console.warn('[Samsara] ⚠️ NO TELEMETRY DATA - diagnostics/stats may have failed or vehicle IDs don\'t match');
    }

    return result;
  }

  private generateRouteDescription(load: any): string | undefined {
    // Try to get route from stops first
    if (load.stops && Array.isArray(load.stops) && load.stops.length > 0) {
      const sortedStops = [...load.stops].sort((a: any, b: any) => a.sequence - b.sequence);
      const pickupStop = sortedStops.find((s: any) => s.stopType === 'PICKUP') || sortedStops[0];
      const deliveryStop = sortedStops.find((s: any) => s.stopType === 'DELIVERY') || sortedStops[sortedStops.length - 1];

      if (pickupStop && deliveryStop) {
        const pickup = pickupStop.city && pickupStop.state
          ? `${pickupStop.city}, ${pickupStop.state}`
          : pickupStop.address;
        const delivery = deliveryStop.city && deliveryStop.state
          ? `${deliveryStop.city}, ${deliveryStop.state}`
          : deliveryStop.address;

        if (pickup && delivery) {
          return `${pickup} → ${delivery}`;
        }
      }
    }

    // Fallback to load fields
    const pickupCity = load.pickupCity;
    const pickupState = load.pickupState;
    const deliveryCity = load.deliveryCity;
    const deliveryState = load.deliveryState;

    if (pickupCity && pickupState && deliveryCity && deliveryState) {
      return `${pickupCity}, ${pickupState} → ${deliveryCity}, ${deliveryState}`;
    }

    return undefined;
  }

  private matchTruckWithSamsaraVehicle(
    truck: { truckNumber: string; licensePlate?: string | null; vin?: string | null },
    samsaraVehicles: SamsaraVehicleWithLocation[]
  ):
    | {
      location: MapLocation;
      matchSource: string;
      diagnostics?: TruckDiagnostics;
      sensors?: TruckSensors;
      latestMedia?: TruckMedia;
      recentTrips?: TruckTrip[];
    }
    | undefined {
    const normalizedTruckNumber = this.normalize(truck.truckNumber);
    const normalizedPlate = this.normalize(truck.licensePlate);
    const normalizedVin = this.normalize(truck.vin);

    for (const vehicle of samsaraVehicles) {
      if (!vehicle.location) continue;

      const normalizedVehiclePlate = this.normalize(vehicle.licensePlate);
      const normalizedVehicleName = this.normalize(vehicle.name);
      const normalizedVehicleVin = this.normalize(vehicle.vin);

      const nameMatches: boolean =
        !!(normalizedVehicleName &&
          normalizedTruckNumber &&
          normalizedVehicleName === normalizedTruckNumber);

      const plateMatches: boolean =
        !!(normalizedVehiclePlate && normalizedPlate && normalizedVehiclePlate === normalizedPlate);

      const vinMatches: boolean =
        !!(normalizedVehicleVin && normalizedVin && normalizedVehicleVin === normalizedVin);

      if (nameMatches || plateMatches || vinMatches) {

        return {
          location: {
            lat: vehicle.location.latitude,
            lng: vehicle.location.longitude,
            address: vehicle.location.address,
            heading: vehicle.location.heading,
            speed: vehicle.location.speedMilesPerHour,
            lastUpdated: vehicle.location.vehicleTime,
            source: 'samsara',
          },
          matchSource: this.resolveMatchSource({
            plate: plateMatches,
            name: nameMatches,
            vin: vinMatches,
          }),
          diagnostics: vehicle.diagnostics,
          sensors: vehicle.sensors,
          latestMedia: vehicle.latestMedia,
          recentTrips: vehicle.recentTrips,
        };
      }
    }

    return undefined;
  }

  private resolveMatchSource(flags: { plate?: boolean; name?: boolean; vin?: boolean }): string {
    if (flags.name) return 'vehicleName';
    if (flags.plate) return 'licensePlate';
    if (flags.vin) return 'vin';
    return 'unknown';
  }

  private normalize(value?: string | null): string | undefined {
    if (!value) return undefined;
    // Remove all non-alphanumeric characters and convert to lowercase
    // This handles mixed letters/numbers like "TRL-123", "ABC456", "123-XYZ"
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}

