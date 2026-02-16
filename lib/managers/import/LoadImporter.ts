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

                // 2. Entity Resolution (JIT)
                const customerId = await entityService.resolveCustomer(locations.pickup.location, maps.customerMap, previewOnly, importBatchId);
                const driverId = await entityService.resolveDriver(this.getVal(row, 'driverId', columnMapping), maps.driverMap, previewOnly, importBatchId);
                const truckId = await entityService.resolveTruck(this.getVal(row, 'truckId', columnMapping), maps.truckMap, previewOnly, importBatchId);
                const trailerId = await entityService.resolveTrailer(this.getVal(row, 'trailerId', columnMapping), maps.trailerMap, previewOnly, importBatchId);

                // 3. Anomaly Detection
                const { suspicious, anomalies } = LoadAnomalyDetector.detect({ ...financial, profit: financial.revenue - financial.driverPay }, updateExisting);
                const { driverPay } = LoadAnomalyDetector.autoCorrect({ ...financial, defaultPayRate: 0.65 });

                // 4. Construct Load Object
                const loadData = this.buildLoadObject(row, rowNum, {
                    ...locations, ...financial, ...dates, driverPay,
                    customerId, driverId, truckId, trailerId,
                    mcNumberId: maps.defaultMcId,
                    dispatcherId: maps.dispatcherMap.get(this.getVal(row, 'dispatcherId', columnMapping)?.toLowerCase())
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
            pickupCity: context.pickup.city,
            pickupState: context.pickup.state,
            pickupZip: context.pickup.zip,
            pickupLocation: context.pickup.location,
            deliveryCity: context.delivery.city,
            deliveryState: context.delivery.state,
            deliveryZip: context.delivery.zip,
            deliveryLocation: context.delivery.location,
            pickupDate: context.pickupDate,
            deliveryDate: context.deliveryDate,
            mcNumberId: context.mcNumberId,
            companyId: this.companyId,
            createdById: this.userId,
            status: LoadStatus.PENDING,
            loadType: LoadType.FTL,
            equipmentType: EquipmentType.DRY_VAN,
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
}
