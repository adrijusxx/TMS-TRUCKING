import { LoadStatus, LoadType, EquipmentType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { ImporterEntityService } from './services/ImporterEntityService';
import { LoadAnomalyDetector } from './detectors/LoadAnomalyDetector';
import { LoadRowMapper } from './mapping/LoadRowMapper';
import { LoadPersistenceService } from './services/LoadPersistenceService';

const STATUS_ORDER = ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED',
    'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID'];

function statusAtOrBeyond(current: string, target: string): boolean {
    const ci = STATUS_ORDER.indexOf(current);
    const ti = STATUS_ORDER.indexOf(target);
    return ci >= 0 && ti >= 0 && ci >= ti;
}

/**
 * LoadImporter - Coordinates load import with historical mode support.
 * When treatAsHistorical=true (default), all loads are set to PAID status
 * with full timestamps, making them closed historical records.
 */
export class LoadImporter extends BaseImporter {

    async import(data: any[], options: any): Promise<ImportResult> {
        return this.importLoads(data, options);
    }

    async importLoads(data: any[], options: any): Promise<ImportResult> {
        const { previewOnly, updateExisting, columnMapping, importBatchId, treatAsHistorical } = options;
        const autoCreate = options.autoCreate ?? { drivers: true, customers: true, trucks: true, trailers: true };
        const maps = await this.preFetchLookups();
        const entityService = new ImporterEntityService(this.prisma, this.companyId, maps.defaultMcId);

        const preparedLoads: any[] = [];
        const errors: any[] = [];
        const warnings: any[] = [];
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
                // Customer Resolution: Try explicit Customer column first, then customerId (often contains name), then Pickup Location
                const customerNameRaw = this.getValue(row, 'customerName', columnMapping, ['Customer', 'customer', 'Broker', 'broker', 'Bill To', 'bill_to'])
                    || this.getValue(row, 'customerId', columnMapping, ['Customer ID', 'customer_id', 'Customer #']);
                const customerName = customerNameRaw || locations.pickup.location;

                const customerId = await entityService.resolveCustomer(customerName, maps.customerMap, previewOnly, importBatchId, autoCreate.customers !== false);
                const driverId = await entityService.resolveDriver(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'driver/carrier', 'Driver/Carrier', 'Driver Name']), maps.driverMap, previewOnly, importBatchId, autoCreate.drivers !== false);
                const coDriverId = await entityService.resolveDriver(this.getValue(row, 'coDriverId', columnMapping, ['Co-Driver', 'co-driver', 'co_driver', 'Team Driver']), maps.driverMap, previewOnly, importBatchId, autoCreate.drivers !== false);
                const truckId = await entityService.resolveTruck(this.getVal(row, 'truckId', columnMapping), maps.truckMap, previewOnly, importBatchId, autoCreate.trucks !== false);
                const trailerId = await entityService.resolveTrailer(this.getVal(row, 'trailerId', columnMapping), maps.trailerMap, previewOnly, importBatchId, autoCreate.trailers !== false);

                // 3. Status & Type Mapping
                const statusStr = this.getValue(row, 'status', columnMapping, ['Status', 'status', 'Load Status', 'load_status', 'Current Status']);
                const csvStatus = this.mapLoadStatusSmart(statusStr);
                const status = treatAsHistorical ? LoadStatus.PAID : csvStatus;

                const typeStr = this.getValue(row, 'loadType', columnMapping, ['Load Type', 'load_type', 'Type', 'size', 'Size']);
                const loadType = this.mapLoadTypeSmart(typeStr);

                // 4. Anomaly Detection
                const { suspicious, anomalies } = LoadAnomalyDetector.detect({ ...financial, profit: financial.revenue - financial.driverPay }, updateExisting);
                const { driverPay } = LoadAnomalyDetector.autoCorrect({ ...financial, defaultPayRate: 0.65 });

                // 5. Construct Load Object
                const dispatcherNameRaw = this.getValue(row, 'dispatcherId', columnMapping, ['Dispatcher', 'dispatcher', 'Dispatch', 'Agent', 'created_by', 'Created By'])?.toLowerCase().trim();
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

                let loadData = this.buildLoadObject(row, rowNum, {
                    ...locations, ...financial, ...dates, ...details, driverPay,
                    customerId, driverId, coDriverId, truckId, trailerId,
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

        const persistence = new LoadPersistenceService(this.prisma, this.companyId, this.userId);
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
        const pickup = context.pickup || {};
        const delivery = context.delivery || {};
        const status = context.status || LoadStatus.PENDING;
        const revenue = context.revenue || 0;
        const driverPay = context.driverPay || 0;

        // Calculate revenuePerMile if not already set from CSV
        const rpm = context.revenuePerMile ||
            (revenue > 0 && context.totalMiles > 0
                ? Number((revenue / context.totalMiles).toFixed(2)) : undefined);

        return {
            loadNumber: String(this.getValue(row, 'loadNumber', mapping, ['Load ID', 'load_id', 'Load Number']) || `L-${rowNum}-${Date.now().toString().slice(-4)}`).trim(),
            customerId: context.customerId,
            driverId: context.driverId,
            coDriverId: context.coDriverId,
            truckId: context.truckId,
            trailerId: context.trailerId,
            dispatcherId: context.dispatcherId,
            revenue,
            driverPay,
            fuelAdvance: context.fuelAdvance,
            totalMiles: context.totalMiles,
            loadedMiles: context.loadedMiles,
            emptyMiles: context.emptyMiles,
            actualMiles: context.actualMiles,
            weight: context.weight,
            pieces: context.pieces,
            pallets: context.pallets,
            commodity: context.commodity,
            temperature: context.temperature,
            hazmat: context.hazmat,
            hazmatClass: context.hazmatClass,
            revenuePerMile: rpm,
            pickupCity: pickup.city || context.pickupCity,
            pickupState: pickup.state || context.pickupState,
            pickupZip: pickup.zip || context.pickupZip,
            pickupLocation: pickup.location || context.pickupLocation,
            pickupCompany: pickup.company || context.pickupCompany,
            deliveryCity: delivery.city || context.deliveryCity,
            deliveryState: delivery.state || context.deliveryState,
            deliveryZip: delivery.zip || context.deliveryZip,
            deliveryLocation: delivery.location || context.deliveryLocation,
            deliveryCompany: delivery.company || context.deliveryCompany,
            pickupDate: context.pickupDate,
            deliveryDate: context.deliveryDate,
            mcNumberId: context.mcNumberId,
            companyId: this.companyId,
            createdById: this.userId,
            status,
            loadType: context.loadType || LoadType.FTL,
            equipmentType: context.equipmentType || EquipmentType.DRY_VAN,
            dispatchNotes: context.dispatchNotes,
            driverNotes: context.driverNotes,
            shipmentId: context.shipmentId,
            tripId: context.tripId,
            stopsCount: context.stopsCount,
            lastNote: context.lastNote,
            onTimeDelivery: context.onTimeDelivery,
            lastUpdate: context.lastUpdate,
            // Computed fields (netProfit = revenue - driverPay - totalExpenses)
            totalExpenses: context.totalExpenses || 0,
            netProfit: revenue > 0 ? Number((revenue - driverPay - (context.totalExpenses || 0)).toFixed(2)) : undefined,
            readyForSettlement: statusAtOrBeyond(status, 'DELIVERED'),
            // Status timestamps based on progression
            assignedAt: statusAtOrBeyond(status, 'ASSIGNED') ? (context.pickupDate || new Date()) : undefined,
            pickedUpAt: statusAtOrBeyond(status, 'AT_PICKUP') ? (context.pickupDate || new Date()) : undefined,
            deliveredAt: statusAtOrBeyond(status, 'DELIVERED') ? (context.deliveryDate || new Date()) : undefined,
            invoicedAt: statusAtOrBeyond(status, 'INVOICED') ? (context.deliveryDate || new Date()) : undefined,
            paidAt: status === LoadStatus.PAID ? (context.deliveryDate || new Date()) : undefined,
            // Stop contact info (passed through to LoadStop creation)
            pickupContact: context.pickupContact,
            pickupPhone: context.pickupPhone,
            deliveryContact: context.deliveryContact,
            deliveryPhone: context.deliveryPhone,
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

    private mapLoadStatusSmart(val: any): LoadStatus {
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

        return LoadStatus.PENDING;
    }

    private mapLoadTypeSmart(val: any): LoadType {
        if (!val) return LoadType.FTL;
        const v = String(val).toUpperCase();

        if (v.includes('LTL') || v.includes('PARTIAL') || v.includes('LESS')) return LoadType.LTL;
        if (v.includes('FTL') || v.includes('FULL') || v.includes('VAN')) return LoadType.FTL;
        if (v.includes('INTERMODAL') || v.includes('RAIL') || v.includes('CONTAINER')) return LoadType.INTERMODAL;

        return LoadType.FTL;
    }
}
