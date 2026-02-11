export interface SamsaraDevice {
    id: string;
    name?: string;
    vin?: string;
    licensePlate?: string;
    make?: string;
    model?: string;
    year?: number | string;
    odometerMiles?: number;
    engineHours?: number;
}

export interface SyncResult {
    matched: number;
    created: number;
    updated: number;
    queued: number;
    errors: string[];
}

export interface MatchResult {
    type: 'TRUCK' | 'TRAILER';
    recordId: string;
    matchSource: 'name' | 'vin' | 'licensePlate';
}

export interface ApproveQueuedDeviceParams {
    truckNumber?: string;
    trailerNumber?: string;
    mcNumberId?: string;
    equipmentType?: string;
}

export interface ApproveQueuedDeviceResult {
    success: boolean;
    recordId?: string;
    error?: string;
    action?: 'created' | 'linked' | 'rejected';
}
