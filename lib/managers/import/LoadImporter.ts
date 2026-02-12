
import { PrismaClient, LoadType, EquipmentType, LoadStatus } from '@prisma/client';
import { ImportLoadInput, importLoadSchema } from '@/lib/validations/load';
import { getRowValue, parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';

export interface ImportResult {
    success: boolean;
    created: any[];
    errors: Array<{ row: number; field?: string; error: string }>;
    preview?: any;
    summary?: {
        total: number;
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    };
}

export class LoadImporter {
    private prisma: PrismaClient;
    private companyId: string;
    private userId: string;

    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        this.prisma = prisma;
        this.companyId = companyId;
        this.userId = userId;
    }

    /**
     * Main import function for loads
     */
    async importLoads(
        data: any[],
        options: {
            previewOnly?: boolean;
            currentMcNumber?: string;
            mcNumberId?: string;
            updateExisting?: boolean;
        }
    ): Promise<ImportResult> {
        const { previewOnly, currentMcNumber, mcNumberId, updateExisting } = options;
        const errors: Array<{ row: number; field?: string; error: string }> = [];

        // 1. Pre-fetch lookups for O(1) matching
        const [customers, trucks, trailers, drivers, mcNumbers] = await Promise.all([
            this.prisma.customer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, name: true, customerNumber: true } }),
            this.prisma.truck.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, truckNumber: true } }),
            this.prisma.trailer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, trailerNumber: true } }),
            this.prisma.driver.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } }
            }),
            this.prisma.mcNumber.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, number: true, companyName: true, isDefault: true } }),
        ]);

        // Build lookup maps
        const customerMap = new Map<string, string>();
        customers.forEach(c => {
            customerMap.set(c.name.toLowerCase().trim(), c.id);
            if (c.customerNumber) customerMap.set(c.customerNumber.toLowerCase().trim(), c.id);
        });

        const truckMap = new Map<string, string>();
        trucks.forEach(t => {
            const normalized = t.truckNumber.toLowerCase().trim();
            truckMap.set(normalized, t.id);
            truckMap.set(normalized.replace(/^0+/, ''), t.id); // No leading zeros
        });

        const trailerMap = new Map<string, string>();
        trailers.forEach(t => {
            const normalized = t.trailerNumber.toLowerCase().trim();
            trailerMap.set(normalized, t.id);
            trailerMap.set(normalized.replace(/^0+/, ''), t.id);
        });

        const driverMap = new Map<string, string>();
        drivers.forEach(d => {
            driverMap.set(d.driverNumber.toLowerCase().trim(), d.id);
            if (d.user) {
                const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase().trim();
                driverMap.set(fullName, d.id);
                // Also map by last name only
                driverMap.set(d.user.lastName.toLowerCase().trim(), d.id);
            }
        });

        const mcLookupMap = new Map<string, string>();
        const defaultMcId = mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id;
        mcNumbers.forEach(mc => {
            if (mc.number) mcLookupMap.set(mc.number.trim(), mc.id);
            if (mc.companyName) mcLookupMap.set(mc.companyName.trim().toLowerCase(), mc.id);
            mcLookupMap.set(mc.id, mc.id);
        });

        // 2. Process rows
        const preparedLoads: any[] = [];
        const DEFAULT_PAY_RATE = 0.65;
        const lastDeliveryLocations = new Map<string, { city: string; state: string; zip?: string }>();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                // Resolve Customer
                const customerName = getRowValue(row, ['Customer', 'customer', 'Customer Name', 'customer_name']);
                let resolvedCustomerId = customerName ? customerMap.get(customerName.toLowerCase().trim()) : null;

                // Simple partial match fallback for customer
                if (!resolvedCustomerId && customerName) {
                    const key = customerName.toLowerCase().trim();
                    for (const [mapName, id] of customerMap.entries()) {
                        if (mapName.includes(key) || key.includes(mapName)) {
                            resolvedCustomerId = id;
                            break;
                        }
                    }
                }

                if (!resolvedCustomerId) {
                    errors.push({ row: rowNum, field: 'Customer', error: `Customer not found: ${customerName || 'Missing'}` });
                    continue;
                }

                // Resolve Driver, Truck, Trailer
                const driverValue = String(getRowValue(row, ['Driver', 'driver', 'Assigned Driver', 'Driver/Carrier']) || '').toLowerCase().trim();
                const driverId = driverValue ? (driverMap.get(driverValue) || null) : undefined;

                const truckValue = String(getRowValue(row, ['Truck', 'truck', 'Unit number', 'Truck Number']) || '').toLowerCase().trim();
                const truckId = truckValue ? (truckMap.get(truckValue) || truckMap.get(truckValue.replace(/^0+/, '')) || null) : undefined;

                const trailerValue = String(getRowValue(row, ['Trailer', 'trailer', 'Trailer Number']) || '').toLowerCase().trim();
                const trailerId = trailerValue ? (trailerMap.get(trailerValue) || trailerMap.get(trailerValue.replace(/^0+/, '')) || null) : undefined;

                // Parse Financials
                const revenue = parseFloat(String(getRowValue(row, ['Load pay', 'Load Pay', 'Revenue', 'revenue', 'Pay', 'pay']) || '0').replace(/[$,\s]/g, ''));
                let driverPay = parseFloat(String(getRowValue(row, ['Total pay', 'Total Pay', 'total_pay', 'Driver Pay', 'driver_pay']) || '').replace(/[$,\s]/g, ''));
                if (isNaN(driverPay)) driverPay = 0; // Default to 0 if NaN

                const totalMiles = parseFloat(String(getRowValue(row, ['Total miles', 'Total Miles', 'total_miles', 'Miles', 'miles']) || '0').replace(/[,\s]/g, ''));
                const emptyMilesColumn = parseFloat(String(getRowValue(row, ['Empty miles', 'Empty Miles', 'empty_miles']) || '0').replace(/[,\s]/g, ''));
                const loadedMiles = parseFloat(String(getRowValue(row, ['Loaded miles', 'Loaded Miles', 'loaded_miles']) || '0').replace(/[,\s]/g, ''));

                // CRITICAL FIX: Detection of "Driver Pay = Revenue" error
                let suspiciousPay = false;
                if (revenue > 0 && driverPay === revenue) {
                    suspiciousPay = true;
                    // Re-calculate based on miles if available
                    if (totalMiles > 0) {
                        driverPay = Math.round(totalMiles * DEFAULT_PAY_RATE * 100) / 100;
                    } else {
                        driverPay = 0;
                    }
                }

                const profit = Math.round((revenue - driverPay) * 100) / 100;

                // Dates & Locations
                const pickupDate = parseImportDate(getRowValue(row, ['Pickup Date', 'pickup_date', 'PU date'])) || new Date();
                const deliveryDate = parseImportDate(getRowValue(row, ['Delivery Date', 'delivery_date', 'DEL date', 'Delivery date']));

                // Location Parsing
                const pickupString = getRowValue(row, ['Pickup Location', 'pickup_location', 'Pickup', 'pickup']);
                const pickupParsed = parseLocationString(pickupString) || {
                    city: getRowValue(row, ['Pickup City', 'pickup_city']) || 'Unknown',
                    state: normalizeState(getRowValue(row, ['Pickup State', 'pickup_state']) || '') || '',
                    zip: getRowValue(row, ['Pickup Zip', 'pickup_zip']) || undefined,
                    address: undefined
                };

                const deliveryString = getRowValue(row, ['Delivery Location', 'delivery_location', 'Delivery', 'delivery']);
                const deliveryParsed = parseLocationString(deliveryString) || {
                    city: getRowValue(row, ['Delivery City', 'delivery_city']) || 'Unknown',
                    state: normalizeState(getRowValue(row, ['Delivery State', 'delivery_state']) || '') || '',
                    zip: getRowValue(row, ['Delivery Zip', 'delivery_zip']) || undefined,
                    address: undefined
                };

                // Map Load Status
                const statusRaw = String(getRowValue(row, ['Load status', 'Status', 'status']) || '').toUpperCase().trim();
                let status: LoadStatus = LoadStatus.PENDING;
                if (statusRaw.includes('DELIVER')) status = LoadStatus.DELIVERED;
                else if (statusRaw.includes('INVOICE')) status = LoadStatus.INVOICED;
                else if (statusRaw.includes('PAID')) status = LoadStatus.PAID;
                else if (statusRaw.includes('PICK')) status = LoadStatus.AT_PICKUP;
                else if (statusRaw.includes('ROUTE')) status = LoadStatus.EN_ROUTE_PICKUP;
                else if (statusRaw.includes('ASSIGN') || statusRaw.includes('DISPATCH')) status = LoadStatus.ASSIGNED;

                // Construct Load Object
                const loadData: any = {
                    loadNumber: getRowValue(row, ['Load ID', 'load_id', 'Load Number', 'load_number']) || `LOAD-${Date.now()}-${i}`,
                    customerId: resolvedCustomerId,
                    driverId,
                    truckId,
                    trailerId,
                    revenue,
                    driverPay,
                    profit,
                    netProfit: profit,
                    totalMiles: totalMiles || (loadedMiles + emptyMilesColumn) || 0,
                    loadedMiles: loadedMiles || undefined,
                    emptyMiles: emptyMilesColumn || undefined,
                    pickupCity: pickupParsed.city,
                    pickupState: pickupParsed.state,
                    pickupZip: pickupParsed.zip || '00000',
                    pickupLocation: pickupString || pickupParsed.city,
                    pickupAddress: getRowValue(row, ['Pickup Address', 'pickup_address']) || pickupString || undefined,
                    deliveryCity: deliveryParsed.city,
                    deliveryState: deliveryParsed.state,
                    deliveryZip: deliveryParsed.zip || '00000',
                    deliveryLocation: deliveryString || deliveryParsed.city,
                    deliveryAddress: getRowValue(row, ['Delivery Address', 'delivery_address']) || deliveryString || undefined,
                    pickupDate,
                    deliveryDate,
                    mcNumberId: resolveMcNumberId((mcNumberId || currentMcNumber || ''), mcLookupMap, defaultMcId),
                    companyId: this.companyId,
                    createdById: this.userId,
                    status,
                    loadType: LoadType.FTL,
                    equipmentType: EquipmentType.DRY_VAN, // Default to Dry Van for now
                    weight: parseFloat(String(getRowValue(row, ['Weight', 'weight']) || '1')) || 1,
                };

                // Track Deadhead Calc need
                let needsDeadhead = false;
                let deadheadOrigin = null;
                // Only calculate if not provided and valid previous location exists
                if (!loadData.emptyMiles && (truckId || driverId) && loadData.pickupCity && loadData.pickupState) {
                    const key = driverId ? `driver:${driverId}` : `truck:${truckId}`;
                    const lastLoc = lastDeliveryLocations.get(key);
                    if (lastLoc) {
                        needsDeadhead = true;
                        deadheadOrigin = lastLoc;
                    }
                }

                // Update Last Delivery Location for next row
                if ((truckId || driverId) && loadData.deliveryCity && loadData.deliveryState) {
                    const loc = { city: loadData.deliveryCity, state: loadData.deliveryState, zip: loadData.deliveryZip };
                    if (driverId) lastDeliveryLocations.set(`driver:${driverId}`, loc);
                    if (truckId) lastDeliveryLocations.set(`truck:${truckId}`, loc);
                }

                preparedLoads.push({
                    data: loadData,
                    rowIndex: rowNum,
                    suspiciousPay,
                    _deadheadCalc: needsDeadhead ? {
                        origin: deadheadOrigin,
                        destination: { city: loadData.pickupCity, state: loadData.pickupState, zip: loadData.pickupZip }
                    } : undefined
                });

            } catch (err: any) {
                errors.push({ row: rowNum, error: err.message || 'Validation failed' });
            }
        }

        // Preview Return
        if (previewOnly) {
            return {
                success: true,
                created: [],
                errors,
                preview: preparedLoads.slice(0, 100).map(l => ({
                    ...l.data,
                    suspiciousPay: l.suspiciousPay
                })),
                summary: { total: data.length, created: 0, updated: 0, skipped: 0, errors: errors.length }
            };
        }

        // 3. Batch Save with Deadhead Calc & Update Logic

        // Calculate Deadheads (Optimized Batch)
        const deadheadLoads = preparedLoads.filter(l => l._deadheadCalc);
        if (deadheadLoads.length > 0) {
            const BATCH = 25;
            for (let i = 0; i < deadheadLoads.length; i += BATCH) {
                const batch = deadheadLoads.slice(i, i + BATCH);
                try {
                    // Flatten origins/destinations
                    const origins = batch.map(b => b._deadheadCalc.origin);
                    const destinations = batch.map(b => b._deadheadCalc.destination);

                    const matrix = await calculateDistanceMatrix({
                        origins: origins.map(o => ({ city: o.city, state: o.state })),
                        destinations: destinations.map(d => ({ city: d.city, state: d.state })),
                        mode: 'driving',
                        units: 'imperial'
                    });

                    batch.forEach((load, idx) => {
                        if (matrix[idx] && matrix[idx][0] && matrix[idx][0].distance) {
                            const miles = Math.round(matrix[idx][0].distance * 0.000621371 * 100) / 100;
                            load.data.emptyMiles = miles;
                            // Update total miles if it was just loaded miles
                            if (!load.data.totalMiles || load.data.totalMiles === load.data.loadedMiles) {
                                load.data.totalMiles = (load.data.loadedMiles || 0) + miles;
                            }
                        }
                    });
                } catch (e) { console.warn('Deadhead calc failed', e); }
            }
        }

        // Final Save Partitioning
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // Fetch existing for updates/skips
        const loadNumbers = preparedLoads.map(l => l.data.loadNumber);
        const existingLoads = await this.prisma.load.findMany({
            where: { loadNumber: { in: loadNumbers }, companyId: this.companyId },
            select: { id: true, loadNumber: true, deletedAt: true }
        });
        const existingMap = new Map(existingLoads.map(l => [l.loadNumber, l]));

        const toCreate: any[] = [];
        const toUpdate: any[] = [];

        for (const load of preparedLoads) {
            const existing = existingMap.get(load.data.loadNumber);

            if (existing) {
                if (updateExisting) {
                    toUpdate.push({ ...load.data, id: existing.id });
                } else {
                    skippedCount++;
                }
            } else {
                toCreate.push(load.data);
            }
        }

        // Execute Creates
        if (toCreate.length > 0) {
            try {
                // Parse with Zod one last time to ensure types
                // Remove mcNumber string and ensure companyId is present
                // Also ensure weight is a number
                const validCreates = toCreate.map(d => {
                    const { mcNumber, stops, ...rest } = importLoadSchema.parse(d);
                    return {
                        ...rest,
                        companyId: this.companyId,
                        weight: rest.weight ?? 1, // Ensure weight is not null/undefined
                    };
                });
                await this.prisma.load.createMany({ data: validCreates, skipDuplicates: true });
                createdCount = toCreate.length;
            } catch (e: any) {
                // Fallback to individual
                for (const d of toCreate) {
                    try {
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(d);
                        await this.prisma.load.create({
                            data: {
                                ...rest,
                                companyId: this.companyId,
                                weight: rest.weight ?? 1
                            }
                        });
                        createdCount++;
                    } catch (err: any) {
                        errors.push({ row: 0, error: `Create failed for ${d.loadNumber}: ${err.message}` });
                    }
                }
            }
        }

        // Execute Updates (Transaction)
        if (toUpdate.length > 0) {
            try {
                await this.prisma.$transaction(
                    toUpdate.map(u => {
                        const { id, ...data } = u;
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                        return this.prisma.load.update({
                            where: { id },
                            data: {
                                ...rest,
                                deletedAt: null,
                                weight: rest.weight ?? undefined // Don't allow null
                            }
                        });
                    })
                );
                updatedCount = toUpdate.length;
            } catch (e: any) {
                // Fallback individual
                for (const u of toUpdate) {
                    try {
                        const { id, ...data } = u;
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                        await this.prisma.load.update({
                            where: { id },
                            data: {
                                ...rest,
                                deletedAt: null,
                                weight: rest.weight ?? undefined
                            }
                        });
                        updatedCount++;
                    } catch { /* Error logged */ }
                }
            }
        }

        return {
            success: true,
            created: preparedLoads.map(l => l.data), // Return all processed data for UI feedback
            errors,
            summary: {
                total: data.length,
                created: createdCount,
                updated: updatedCount,
                skipped: skippedCount,
                errors: errors.length
            }
        };
    }
}

// Helper
function resolveMcNumberId(val: string, map: Map<string, string>, defaultId: string | undefined): string | undefined {
    if (!val) return defaultId;
    const v = val.trim();
    return map.get(v) || map.get(v.toLowerCase()) || defaultId;
}
