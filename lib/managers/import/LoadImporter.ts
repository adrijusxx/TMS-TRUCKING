import { LoadStatus, LoadType, EquipmentType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { ImporterEntityService } from './services/ImporterEntityService';
import { LoadAnomalyDetector } from './detectors/LoadAnomalyDetector';
import { LoadRowMapper } from './mapping/LoadRowMapper';
import { LoadPersistenceService } from './services/LoadPersistenceService';

/**
 * LoadImporter - Split from original file to comply with 500-line limit.
 * Coordinates the import process using dedicated services for entity resolution,
 * anomaly detection, and persistence.
 */
export class LoadImporter extends BaseImporter {
    private statusCache = new Map<string, LoadStatus>();
    private typeCache = new Map<string, LoadType>();

    async import(data: any[], options: any): Promise<ImportResult> {
        return this.importLoads(data, options);
    }

    async importLoads(data: any[], options: any): Promise<ImportResult> {
        const { previewOnly, updateExisting, columnMapping, importBatchId } = options;
        const maps = await this.preFetchLookups();
        const entityService = new ImporterEntityService(this.prisma, this.companyId, maps.defaultMcId);

        const preparedLoads: any[] = [];
        const errors: any[] = [];
        const warnings: any[] = [];
        const lastLocs = new Map<string, any>();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;
            try {
                // 1. Mapping & Parsing
                const locations = LoadRowMapper.mapRowLocations(row, this.getValue.bind(this), columnMapping);
                const financial = LoadRowMapper.mapFinancials(row, this.getValue.bind(this), columnMapping);
                const dates = LoadRowMapper.mapDates(row, this.getValue.bind(this), columnMapping);
                const details = LoadRowMapper.mapDetails(row, this.getValue.bind(this), columnMapping);

                // 2. Entity Resolution (JIT)
                // Customer Resolution: Try explicit Customer column first, then fallback to Pickup Location
                const customerNameRaw = this.getValue(row, 'customerName', columnMapping, ['Customer', 'customer', 'Broker', 'broker', 'Bill To', 'bill_to']);
                const customerName = customerNameRaw || locations.pickup.location;

                const customerId = await entityService.resolveCustomer(customerName, maps.customerMap, previewOnly, importBatchId);
                const driverId = await entityService.resolveDriver(this.getVal(row, 'driverId', columnMapping), maps.driverMap, previewOnly, importBatchId);
                const truckId = await entityService.resolveTruck(this.getVal(row, 'truckId', columnMapping), maps.truckMap, previewOnly, importBatchId);
                const trailerId = await entityService.resolveTrailer(this.getVal(row, 'trailerId', columnMapping), maps.trailerMap, previewOnly, importBatchId);

                // 3. AI Smart Mapping (Status & Type)
                const statusStr = this.getValue(row, 'status', columnMapping, ['Status', 'status', 'Load Status', 'Current Status']);
                const status = await this.mapLoadStatusSmart(statusStr);

                const typeStr = this.getValue(row, 'loadType', columnMapping, ['Load Type', 'load_type', 'Type', 'size', 'Size']);
                const loadType = await this.mapLoadTypeSmart(typeStr);

                // 4. Anomaly Detection
                const { suspicious, anomalies } = LoadAnomalyDetector.detect({ ...financial, profit: financial.revenue - financial.driverPay }, updateExisting);
                const { driverPay } = LoadAnomalyDetector.autoCorrect({ ...financial, defaultPayRate: 0.65 });

                // 5. Construct Load Object
                const dispatcherNameRaw = this.getValue(row, 'dispatcherId', columnMapping, ['Dispatcher', 'dispatcher', 'Dispatch', 'Agent'])?.toLowerCase().trim();
                let dispatcherId = maps.dispatcherMap.get(dispatcherNameRaw);

                // Fallback: Try partial match on First Name if full name fails
                if (!dispatcherId && dispatcherNameRaw) {
                    for (const [key, id] of maps.dispatcherMap.entries()) {
                        if (key.includes(dispatcherNameRaw) || dispatcherNameRaw.includes(key)) {
                            dispatcherId = id;
                            break;
                        }
                    }
                }

                const loadData = this.buildLoadObject(row, rowNum, {
                    ...locations, ...financial, ...dates, ...details, driverPay,
                    customerId, driverId, truckId, trailerId,
                    mcNumberId: maps.defaultMcId,
                    dispatcherId: dispatcherId,
                    status,
                    loadType
                }, columnMapping);

                preparedLoads.push({ data: loadData, suspiciousPay: suspicious, anomalies, rowIndex: rowNum });
            } catch (err: any) {
                errors.push(this.error(rowNum, err.message));
            }
        }

        if (previewOnly) return this.buildPreviewResult(data.length, preparedLoads, errors, warnings);

        const persistence = new LoadPersistenceService(this.prisma, this.companyId);
        const persistResult = await persistence.persist(preparedLoads, { updateExisting, importBatchId });

        return {
            success: true,
            created: [],
            errors: [...errors, ...persistResult.errors],
            warnings,
            summary: {
                total: data.length,
                created: persistResult.createdCount,
                updated: persistResult.updatedCount,
                skipped: persistResult.skippedCount,
                errors: errors.length + persistResult.errors.length
            }
        };
    }

    private async preFetchLookups() {
        const [customers, trucks, trailers, drivers, mcNumbers, users] = await Promise.all([
            this.prisma.customer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, name: true, customerNumber: true } }),
            this.prisma.truck.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, truckNumber: true } }),
            this.prisma.trailer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, trailerNumber: true } }),
            this.prisma.driver.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } } }),
            this.prisma.mcNumber.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, number: true, isDefault: true } }),
            this.prisma.user.findMany({ where: { companyId: this.companyId, isActive: true }, select: { id: true, firstName: true, lastName: true, email: true } }),
        ]);

        return {
            customerMap: new Map(customers.map(c => [c.name.toLowerCase(), c.id])),
            truckMap: new Map(trucks.map(t => [t.truckNumber.toLowerCase(), t.id])),
            trailerMap: new Map(trailers.map(t => [t.trailerNumber.toLowerCase(), t.id])),
            driverMap: new Map(drivers.map(d => [d.driverNumber.toLowerCase(), d.id])),
            dispatcherMap: new Map(users.map(u => [`${u.firstName} ${u.lastName}`.toLowerCase(), u.id])),
            defaultMcId: mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id
        };
    }

    private buildLoadObject(row: any, rowNum: number, context: any, mapping: any) {
        return {
            loadNumber: String(this.getValue(row, 'loadNumber', mapping, ['Load ID', 'load_id', 'Load Number']) || `L-${rowNum}-${Date.now().toString().slice(-4)}`).trim(),
            customerId: context.customerId,
            driverId: context.driverId,
            truckId: context.truckId,
            trailerId: context.trailerId,
            dispatcherId: context.dispatcherId,
            revenue: context.revenue,
            driverPay: context.driverPay,
            totalMiles: context.totalMiles,
            loadedMiles: context.loadedMiles,
            emptyMiles: context.emptyMiles,
            weight: context.weight,
            revenuePerMile: context.revenuePerMile,
            pickupCity: context.pickupCity,
            pickupState: context.pickupState,
            pickupZip: context.pickupZip,
            pickupLocation: context.pickupLocation,
            deliveryCity: context.deliveryCity,
            deliveryState: context.deliveryState,
            deliveryZip: context.deliveryZip,
            deliveryLocation: context.deliveryLocation,
            pickupDate: context.pickupDate,
            deliveryDate: context.deliveryDate,
            mcNumberId: context.mcNumberId,
            companyId: this.companyId,
            createdById: this.userId,
            status: context.status || LoadStatus.PENDING,
            loadType: context.loadType || LoadType.FTL,
            equipmentType: context.equipmentType || EquipmentType.DRY_VAN,

            // New Fields
            commodity: context.commodity,
            shipmentId: context.shipmentId,
            dispatchNotes: context.dispatchNotes,
        };
    }

    private getVal(row: any, key: string, mapping: any) {
        return this.getValue(row, key, mapping, []);
    }

    private buildPreviewResult(total: number, loads: any[], errors: any[], warnings: any[]) {
        return {
            success: true, created: [], errors, warnings,
            preview: loads.slice(0, 100).map(l => ({ ...l.data, suspiciousPay: l.suspiciousPay })),
            summary: { total, created: loads.length, updated: 0, skipped: 0, errors: errors.length }
        };
    }

    private async mapLoadStatusSmart(val: any): Promise<LoadStatus> {
        if (!val) return LoadStatus.PENDING;
        const v = String(val).toUpperCase();

        if (v.includes('PENDING') || v.includes('OPEN') || v.includes('AVAILABLE')) return LoadStatus.PENDING;
        if (v.includes('ASSIGNED') || v.includes('COVERED') || v.includes('DISPATCHED')) return LoadStatus.ASSIGNED;
        if (v.includes('PICK') || v.includes('LOADING')) return LoadStatus.AT_PICKUP;
        if (v.includes('TRANSIT') || v.includes('ROUTE')) return LoadStatus.EN_ROUTE_DELIVERY;
        if (v.includes('DELIVERED') || v.includes('COMPLETED') || v.includes('DONE')) return LoadStatus.DELIVERED;
        if (v.includes('INVOICE') || v.includes('BILLED')) return LoadStatus.INVOICED;
        if (v.includes('PAID')) return LoadStatus.PAID;
        if (v.includes('CANCEL')) return LoadStatus.CANCELLED;

        // Check cache
        if (this.statusCache.has(v)) return this.statusCache.get(v)!;

        // AI Fallback
        try {
            const result = await this.aiService.callAI(`Map load status to one of: PENDING, ASSIGNED, EN_ROUTE_PICKUP, AT_PICKUP, LOADED, EN_ROUTE_DELIVERY, AT_DELIVERY, DELIVERED, INVOICED, PAID, CANCELLED. Input: "${val}"`, {
                systemPrompt: "Return ONLY the enum value.",
                jsonMode: false,
                temperature: 0
            });
            const mapped = String(result.data).toUpperCase().trim() as LoadStatus;
            if (Object.values(LoadStatus).includes(mapped)) {
                this.statusCache.set(v, mapped);
                return mapped;
            }
        } catch (e) {
            console.error('[LoadImporter] AI status mapping failed', e);
        }

        return LoadStatus.PENDING;
    }

    private async mapLoadTypeSmart(val: any): Promise<LoadType> {
        if (!val) return LoadType.FTL;
        const v = String(val).toUpperCase();

        if (v.includes('LTL') || v.includes('PARTIAL') || v.includes('LESS')) return LoadType.LTL;
        if (v.includes('FTL') || v.includes('FULL') || v.includes('VAN')) return LoadType.FTL;
        if (v.includes('INTERMODAL') || v.includes('RAIL') || v.includes('CONTAINER')) return LoadType.INTERMODAL;

        // Check cache
        if (this.typeCache.has(v)) return this.typeCache.get(v)!;

        // AI Fallback
        try {
            const result = await this.aiService.callAI(`Map load type to one of: FTL, LTL, PARTIAL, INTERMODAL. Input: "${val}"`, {
                systemPrompt: "Return ONLY the enum value.",
                jsonMode: false,
                temperature: 0
            });
            const mapped = String(result.data).toUpperCase().trim() as LoadType;
            if (Object.values(LoadType).includes(mapped)) {
                this.typeCache.set(v, mapped);
                return mapped;
            }
        } catch (e) {
            console.error('[LoadImporter] AI type mapping failed', e);
        }

        return LoadType.FTL;
    }
}
