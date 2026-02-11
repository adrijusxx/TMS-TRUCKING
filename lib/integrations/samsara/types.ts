/**
 * Samsara Integration Types
 */

export interface SamsaraConfig {
    apiKey: string;
    baseUrl: string;
    webhookSecret?: string;
}

export interface SamsaraVehicle {
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

export interface SamsaraVehicleDiagnostic {
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

export interface SamsaraDriver {
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
        drivingInViolationToday?: number;
        drivingInViolationCycle?: number;
        driverVehicleIds?: string[];
        coDrivers?: Array<{
            id: string;
            name: string;
        }>;
    }>;
}

export interface SamsaraHOSLog {
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

export interface SamsaraVehicleStats {
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

export interface SamsaraTrip {
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

export interface SamsaraCameraMedia {
    url: string;
    createdAt: string;
    cameraType?: string;
    vehicleId?: string;
}
