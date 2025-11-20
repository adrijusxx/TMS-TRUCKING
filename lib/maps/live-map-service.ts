import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/maps/google-maps';
import {
  getSamsaraCameraMedia,
  getSamsaraVehicleDiagnostics,
  getSamsaraVehicleLocations,
  getSamsaraVehicleStats,
  getSamsaraVehicles,
  getSamsaraTrips,
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
  driver?: {
    id: string;
    driverNumber: string;
    name: string;
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
  'ASSIGNED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'LOADED',
  'EN_ROUTE_DELIVERY',
  'AT_DELIVERY',
] as const;

const ACTIVE_TRUCK_STATUSES = ['IN_USE', 'AVAILABLE'] as const;

export class LiveMapService {
  private readonly companyId: string;
  private geocodeCache = new Map<string, MapLocation>();

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  async getSnapshot(): Promise<{ loads: LoadMapEntry[]; trucks: TruckMapEntry[] }> {
    const [loads, trucks] = await Promise.all([this.getLoadEntries(), this.getTruckEntries()]);

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

        return {
          id: load.id,
          loadNumber: load.loadNumber,
          status: load.status,
          pickup,
          delivery,
          routeWaypoints,
          driver: load.driver
            ? {
                id: load.driver.id,
                driverNumber: load.driver.driverNumber,
                name: `${load.driver.user.firstName} ${load.driver.user.lastName}`,
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
    const trucks = await prisma.truck.findMany({
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
      take: 300,
    });

    const samsaraVehicles = await this.getSamsaraVehiclesWithTelemetry();

    return trucks.map((truck) => {
      const match = this.matchTruckWithSamsaraVehicle(truck, samsaraVehicles);
      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        status: truck.status,
        location: match?.location,
        matchSource: match?.matchSource,
        diagnostics: match?.diagnostics,
        sensors: match?.sensors,
        latestMedia: match?.latestMedia,
        recentTrips: match?.recentTrips,
      };
    });
  }

  private async getSamsaraVehiclesWithTelemetry(): Promise<SamsaraVehicleWithLocation[]> {
    // Get vehicles first, then diagnostics (which may need vehicle IDs)
    const vehiclesPromise = getSamsaraVehicles();
    const locationsPromise = getSamsaraVehicleLocations();

    const [vehicles, locations] = await Promise.all([vehiclesPromise, locationsPromise]);

    // Try diagnostics with vehicle IDs if available
    const diagnosticsPromise = (async () => {
      try {
        const vehicleIds = vehicles?.map((v) => v.id).filter(Boolean) as string[] | undefined;
        if (vehicleIds && vehicleIds.length > 0) {
          return await getSamsaraVehicleDiagnostics(vehicleIds);
        }
        return await getSamsaraVehicleDiagnostics();
      } catch (error) {
        // Diagnostics are optional - fail silently
        return null;
      }
    })();

    const diagnostics = await diagnosticsPromise;

    const statsPromise = getSamsaraVehicleStats().catch((error) => {
      console.info('[Samsara] Stats unavailable:', error instanceof Error ? error.message : error);
      return null;
    });

    const tripsPromise = getSamsaraTrips().catch((error) => {
      console.info('[Samsara] Trips unavailable:', error instanceof Error ? error.message : error);
      return null;
    });

    const mediaPromise = getSamsaraCameraMedia().catch((error) => {
      console.info(
        '[Samsara] Camera media unavailable:',
        error instanceof Error ? error.message : error
      );
      return null;
    });

    const [stats, trips, media] = await Promise.all([statsPromise, tripsPromise, mediaPromise]);

    if (!vehicles || !locations) {
      return [];
    }

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

    const diagnosticsById = new Map<string, TruckDiagnostics>();
    diagnostics?.forEach((entry) => {
      if (!entry || !entry.vehicleId) return;
      const faults = entry.faults || [];
      diagnosticsById.set(entry.vehicleId, {
        totalFaults: faults.length,
        activeFaults: faults.filter((fault) => fault.active !== false).length,
        checkEngineLightOn: entry.checkEngineLightOn,
        lastUpdated: entry.lastUpdatedTime,
        faults: faults.map((fault) => ({
          code: fault.code,
          description: fault.description,
          severity: fault.severity,
          active: fault.active,
          occurredAt: fault.occurredAt,
        })),
      });
    });

    const statsById = new Map<string, TruckSensors>();
    stats?.forEach((entry) => {
      if (!entry?.vehicleId) return;
      statsById.set(entry.vehicleId, {
        speed:
          entry.currentSpeed !== undefined || entry.speedLimit !== undefined
            ? { value: entry.currentSpeed, limit: entry.speedLimit }
            : undefined,
        fuelPercent: entry.fuelPercent,
        odometerMiles: entry.odometerMiles,
        engineHours: entry.engineHours,
        engineState: entry.engineState,
        seatbeltStatus: entry.seatbeltStatus,
      });
    });

    const tripsByVehicle = new Map<string, TruckTrip[]>();
    trips?.forEach((trip) => {
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
    media?.forEach((item) => {
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

    return vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      location: locationById.get(vehicle.id),
      diagnostics: diagnosticsById.get(vehicle.id),
      sensors: statsById.get(vehicle.id),
      recentTrips: tripsByVehicle.get(vehicle.id),
      latestMedia: mediaByVehicle.get(vehicle.id),
    }));
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
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}

