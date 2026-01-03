/**
 * Column Presets Configuration
 * Defines presets for column visibility and order per entity type
 */

export interface ColumnPreset {
    id: string;
    name: string;
    description?: string;
    columns: string[];
    icon?: string;
}

export interface EntityPresets {
    entityType: string;
    presets: ColumnPreset[];
    defaultPreset: string;
}

// Loads presets
export const loadsPresets: ColumnPreset[] = [
    {
        id: 'dispatch',
        name: 'Dispatch View',
        description: 'Essential columns for dispatch operations',
        columns: ['loadNumber', 'status', 'route', 'driver', 'truck', 'trailer', 'pickupDate', 'deliveryDate', 'dispatcher'],
        icon: 'Truck',
    },
    {
        id: 'financial',
        name: 'Financial View',
        description: 'Revenue and profit focused view',
        columns: ['loadNumber', 'customer', 'revenue', 'driverPay', 'profit', 'rpmLoaded', 'miles', 'status'],
        icon: 'DollarSign',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Compact essential columns only',
        columns: ['loadNumber', 'status', 'customer', 'route', 'pickupDate'],
        icon: 'Minimize2',
    },
    {
        id: 'full',
        name: 'Full View',
        description: 'All available columns',
        columns: ['loadNumber', 'rateConfNumber', 'status', 'customer', 'origin', 'destination', 'route', 'driver', 'truck', 'trailer', 'dispatcher', 'pickupDate', 'deliveryDate', 'miles', 'loadedMiles', 'emptyMiles', 'revenue', 'driverPay', 'profit', 'rpmLoaded', 'rpmTotal', 'weight', 'mcNumber', 'documents', 'createdAt'],
        icon: 'Maximize2',
    },
];

// Trucks presets
export const trucksPresets: ColumnPreset[] = [
    {
        id: 'fleet',
        name: 'Fleet Overview',
        description: 'General fleet management view',
        columns: ['truckNumber', 'status', 'driver', 'make', 'model', 'year', 'vin', 'mcNumber'],
        icon: 'Truck',
    },
    {
        id: 'maintenance',
        name: 'Maintenance View',
        description: 'Service and maintenance focused',
        columns: ['truckNumber', 'status', 'mileage', 'lastService', 'nextService', 'make', 'model'],
        icon: 'Wrench',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Compact essential columns',
        columns: ['truckNumber', 'status', 'driver'],
        icon: 'Minimize2',
    },
    {
        id: 'full',
        name: 'Full View',
        description: 'All available columns',
        columns: ['truckNumber', 'status', 'driver', 'make', 'model', 'year', 'vin', 'state', 'equipmentType', 'mileage', 'mcNumber', 'createdAt'],
        icon: 'Maximize2',
    },
];

// Trailers presets
export const trailersPresets: ColumnPreset[] = [
    {
        id: 'fleet',
        name: 'Fleet Overview',
        description: 'General trailer fleet view',
        columns: ['trailerNumber', 'type', 'status', 'assignedTruck', 'make', 'year'],
        icon: 'Container',
    },
    {
        id: 'assignment',
        name: 'Assignment View',
        description: 'Trailer assignment focused',
        columns: ['trailerNumber', 'assignedTruck', 'status', 'type', 'location'],
        icon: 'Link',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Compact essential columns',
        columns: ['trailerNumber', 'status', 'type'],
        icon: 'Minimize2',
    },
    {
        id: 'full',
        name: 'Full View',
        description: 'All available columns',
        columns: ['trailerNumber', 'type', 'status', 'assignedTruck', 'make', 'model', 'year', 'vin', 'state', 'mcNumber', 'createdAt'],
        icon: 'Maximize2',
    },
];

// Drivers presets
export const driversPresets: ColumnPreset[] = [
    {
        id: 'dispatch',
        name: 'Dispatch View',
        description: 'Essential dispatch information',
        columns: ['driverNumber', 'name', 'status', 'truck', 'phone', 'currentLoad'],
        icon: 'Headphones',
    },
    {
        id: 'hr',
        name: 'HR View',
        description: 'Human resources focused',
        columns: ['name', 'driverNumber', 'hireDate', 'payType', 'payRate', 'status', 'email'],
        icon: 'Users',
    },
    {
        id: 'compliance',
        name: 'Compliance View',
        description: 'License and certification tracking',
        columns: ['name', 'driverNumber', 'cdlNumber', 'cdlExpiry', 'medCardExpiry', 'status'],
        icon: 'ShieldCheck',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Compact essential columns',
        columns: ['driverNumber', 'name', 'status', 'phone'],
        icon: 'Minimize2',
    },
    {
        id: 'full',
        name: 'Full View',
        description: 'All available columns',
        columns: ['driverNumber', 'name', 'status', 'phone', 'email', 'truck', 'hireDate', 'payType', 'payRate', 'cdlNumber', 'cdlExpiry', 'medCardExpiry', 'mcNumber', 'createdAt'],
        icon: 'Maximize2',
    },
];

// Customers presets
export const customersPresets: ColumnPreset[] = [
    {
        id: 'overview',
        name: 'Overview',
        description: 'General customer information',
        columns: ['name', 'customerNumber', 'status', 'contactName', 'phone', 'email'],
        icon: 'Building2',
    },
    {
        id: 'financial',
        name: 'Financial View',
        description: 'Credit and payment focused',
        columns: ['name', 'customerNumber', 'creditLimit', 'balance', 'paymentTerms', 'status'],
        icon: 'DollarSign',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Compact essential columns',
        columns: ['name', 'customerNumber', 'status'],
        icon: 'Minimize2',
    },
    {
        id: 'full',
        name: 'Full View',
        description: 'All available columns',
        columns: ['name', 'customerNumber', 'status', 'contactName', 'phone', 'email', 'address', 'city', 'state', 'creditLimit', 'paymentTerms', 'mcNumber', 'createdAt'],
        icon: 'Maximize2',
    },
];

// Map entity types to their presets
export const entityPresetsMap: Record<string, ColumnPreset[]> = {
    loads: loadsPresets,
    trucks: trucksPresets,
    trailers: trailersPresets,
    drivers: driversPresets,
    customers: customersPresets,
};

// Default presets per entity
export const defaultPresetMap: Record<string, string> = {
    loads: 'dispatch',
    trucks: 'fleet',
    trailers: 'fleet',
    drivers: 'dispatch',
    customers: 'overview',
};

/**
 * Get presets for a specific entity type
 */
export function getPresetsForEntity(entityType: string): ColumnPreset[] {
    return entityPresetsMap[entityType] || [];
}

/**
 * Get a specific preset by entity type and preset ID
 */
export function getPreset(entityType: string, presetId: string): ColumnPreset | undefined {
    const presets = getPresetsForEntity(entityType);
    return presets.find(p => p.id === presetId);
}

/**
 * Get the default preset ID for an entity type
 */
export function getDefaultPresetId(entityType: string): string {
    return defaultPresetMap[entityType] || 'full';
}
