import { LoadStatus, LoadType, EquipmentType, PayType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import type { ImportOptions } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { LOAD_STATUS_MAP, LOAD_TYPE_MAP } from './utils/enum-maps';
import { ImporterEntityService } from './services/ImporterEntityService';
import { LoadAnomalyDetector } from './detectors/LoadAnomalyDetector';
import { LoadRowMapper } from './mapping/LoadRowMapper';
import { LoadPersistenceService } from './services/LoadPersistenceService';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';

const METERS_TO_MILES = 0.000621371;

const STATUS_ORDER = ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED',
    'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID'];

function statusAtOrBeyond(current: string, target: string): boolean {
    const ci = STATUS_ORDER.indexOf(current);
    const ti = STATUS_ORDER.indexOf(target);
    return ci >= 0 && ti >= 0 && ci >= ti;
}

/**
 * LoadImporter — Coordinates load import with historical mode support.
 * Fully overrides import() due to service delegation pattern.
 */
export class LoadImporter extends BaseImporter {

    async import(data: any[], options: ImportOptions): Promise<ImportResult> {
        const { previewOnly, updateExisting, columnMapping, importBatchId, treatAsHistorical, formatSettings } = options;
        const autoCreate = options.autoCreate ?? { drivers: true, customers: true, trucks: true, trailers: true };
        const dateFormatHint = formatSettings?.dateFormat;
        const maps = await this.fetchLookups();
        const entityService = new ImporterEntityService(this.prisma, this.companyId, maps.defaultMcId);

        const preparedLoads: any[] = [];
        const errors: any[] = [];
        const warnings: any[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;
            try {
                const locations = LoadRowMapper.mapRowLocations(row, this.getValue.bind(this), columnMapping);
                const financial = LoadRowMapper.mapFinancials(row, this.getValue.bind(this), columnMapping);
                const dates = LoadRowMapper.mapDates(row, this.getValue.bind(this), columnMapping, dateFormatHint);
                const details = LoadRowMapper.mapDetails(row, this.getValue.bind(this), columnMapping, dateFormatHint);

                // Entity resolution
                const customerNameRaw = this.getValue(row, 'customerName', columnMapping, ['Customer', 'customer', 'Broker', 'broker', 'Bill To', 'bill_to'])
                    || this.getValue(row, 'customerId', columnMapping, ['Customer ID', 'customer_id', 'Customer #']);
                const customerName = customerNameRaw || locations.pickup.location;

                const customerId = await entityService.resolveCustomer(customerName, maps.customerMap, previewOnly, importBatchId, autoCreate.customers !== false);
                const driverId = await entityService.resolveDriver(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'driver/carrier', 'Driver/Carrier', 'Driver Name']), maps.driverMap, previewOnly, importBatchId, autoCreate.drivers !== false);
                const coDriverId = await entityService.resolveDriver(this.getValue(row, 'coDriverId', columnMapping, ['Co-Driver', 'co-driver', 'co_driver', 'Team Driver']), maps.driverMap, previewOnly, importBatchId, autoCreate.drivers !== false);
                const truckId = await entityService.resolveTruck(this.getVal(row, 'truckId', columnMapping), maps.truckMap, previewOnly, importBatchId, autoCreate.trucks !== false);
                const trailerId = await entityService.resolveTrailer(this.getVal(row, 'trailerId', columnMapping), maps.trailerMap, previewOnly, importBatchId, autoCreate.trailers !== false);

                // Status & Type
                const csvStatus = SmartEnumMapper.map(this.getValue(row, 'status', columnMapping, ['Status', 'status', 'Load Status', 'load_status', 'Current Status']), LOAD_STATUS_MAP);

                let status: LoadStatus;
                if (treatAsHistorical) {
                    status = LoadStatus.PAID;
                } else if (
                    csvStatus === LoadStatus.PENDING &&
                    dates.pickupDateRaw && dates.deliveryDateRaw &&
                    dates.deliveryDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ) {
                    status = LoadStatus.DELIVERED;
                    warnings.push(this.warning(rowNum, 'Load dates are in the past with no status — auto-set to DELIVERED', 'status'));
                } else {
                    status = csvStatus;
                }

                const loadType = SmartEnumMapper.map(this.getValue(row, 'loadType', columnMapping, ['Load Type', 'load_type', 'Type', 'size', 'Size']), LOAD_TYPE_MAP);

                if (dates.dateWarnings?.length) {
                    for (const dw of dates.dateWarnings) warnings.push(this.warning(rowNum, dw, 'date'));
                }

                // Anomaly Detection & Driver Pay
                const { suspicious, anomalies } = LoadAnomalyDetector.detect({ ...financial, profit: financial.revenue - financial.driverPay }, updateExisting);
                let { driverPay } = LoadAnomalyDetector.autoCorrect({ ...financial, defaultPayRate: 0.65 });

                if ((!driverPay || driverPay === 0) && driverId && !driverId.startsWith('PREVIEW_')) {
                    const payProfile = maps.driverPayMap.get(driverId);
                    if (payProfile && payProfile.payRate > 0) {
                        driverPay = calculateDriverPay(
                            { payType: payProfile.payType as PayType, payRate: payProfile.payRate },
                            { totalMiles: financial.totalMiles, loadedMiles: financial.loadedMiles, emptyMiles: financial.emptyMiles, revenue: financial.revenue }
                        );
                        if (driverPay > 0) {
                            warnings.push(this.warning(rowNum, `Driver pay auto-calculated: $${driverPay.toFixed(2)} (${payProfile.payType} @ ${payProfile.payRate})`, 'driverPay'));
                        }
                    }
                }

                // Dispatcher resolution
                const dispatcherNameRaw = this.getValue(row, 'dispatcherId', columnMapping, [
                    'Dispatcher', 'dispatcher', 'Dispatch', 'Agent', 'created_by', 'Created By',
                    'Dispatcher Name', 'dispatcher_name', 'Dispatcher Email', 'dispatcher_email',
                    'Assigned Dispatcher', 'Dispatch Agent'
                ])?.toLowerCase().trim();
                let dispatcherId = maps.dispatcherMap.get(dispatcherNameRaw);
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
                    customerId, driverId, coDriverId, truckId, trailerId,
                    mcNumberId: maps.defaultMcId, dispatcherId, status, loadType
                }, columnMapping);

                preparedLoads.push({ data: loadData, suspiciousPay: suspicious, anomalies, rowIndex: rowNum });
            } catch (err: any) {
                errors.push(this.error(rowNum, err.message));
            }
        }

        if (previewOnly) return this.buildLoadPreview(data.length, preparedLoads, errors, warnings);

        const persistence = new LoadPersistenceService(this.prisma, this.companyId, this.userId);
        const persistResult = await persistence.persist(preparedLoads, { updateExisting, importBatchId });

        await this.autoCalculateMissingMiles(preparedLoads, maps, warnings);

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

    private async fetchLookups() {
        const [customers, trucks, trailers, drivers, mcNumbers, users] = await Promise.all([
            this.prisma.customer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, name: true, customerNumber: true } }),
            this.prisma.truck.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, truckNumber: true } }),
            this.prisma.trailer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, trailerNumber: true } }),
            this.prisma.driver.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, driverNumber: true, payType: true, payRate: true, user: { select: { firstName: true, lastName: true } } } }),
            this.prisma.mcNumber.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, number: true, isDefault: true } }),
            this.prisma.user.findMany({ where: { companyId: this.companyId, isActive: true }, select: { id: true, firstName: true, lastName: true, email: true } }),
        ]);

        return {
            customerMap: new Map(customers.map(c => [c.name.toLowerCase(), c.id])),
            truckMap: new Map(trucks.map(t => [t.truckNumber.toLowerCase(), t.id])),
            trailerMap: new Map(trailers.map(t => [t.trailerNumber.toLowerCase(), t.id])),
            driverMap: (() => {
                const map = new Map<string, string>();
                for (const d of drivers) {
                    map.set(d.driverNumber.toLowerCase(), d.id);
                    if (d.user?.firstName && d.user?.lastName) {
                        const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase().trim();
                        if (!map.has(fullName)) map.set(fullName, d.id);
                    }
                }
                return map;
            })(),
            driverPayMap: new Map(drivers.map(d => [d.id, { payType: d.payType, payRate: Number(d.payRate) }])),
            dispatcherMap: (() => {
                const map = new Map<string, string>();
                for (const u of users) {
                    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase().trim();
                    if (fullName && fullName !== ' ') map.set(fullName, u.id);
                    if (u.email) map.set(u.email.toLowerCase().trim(), u.id);
                    if (u.firstName) { const fn = u.firstName.toLowerCase().trim(); if (fn && !map.has(fn)) map.set(fn, u.id); }
                    if (u.lastName) { const ln = u.lastName.toLowerCase().trim(); if (ln && !map.has(ln)) map.set(ln, u.id); }
                }
                return map;
            })(),
            defaultMcId: mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id
        };
    }

    private buildLoadObject(row: any, rowNum: number, context: any, mapping: any) {
        const pickup = context.pickup || {};
        const delivery = context.delivery || {};
        const status = context.status || LoadStatus.PENDING;
        const revenue = context.revenue || 0;
        const driverPay = context.driverPay || 0;
        const rpm = context.revenuePerMile ||
            (revenue > 0 && context.totalMiles > 0 ? Number((revenue / context.totalMiles).toFixed(2)) : undefined);

        return {
            loadNumber: String(this.getValue(row, 'loadNumber', mapping, ['Load ID', 'load_id', 'Load Number']) || `L-${rowNum}-${Date.now().toString().slice(-4)}`).trim(),
            customerId: context.customerId, driverId: context.driverId, coDriverId: context.coDriverId,
            truckId: context.truckId, trailerId: context.trailerId, dispatcherId: context.dispatcherId,
            revenue, driverPay, fuelAdvance: context.fuelAdvance,
            totalMiles: context.totalMiles, loadedMiles: context.loadedMiles, emptyMiles: context.emptyMiles, actualMiles: context.actualMiles,
            weight: context.weight, pieces: context.pieces, pallets: context.pallets,
            commodity: context.commodity, temperature: context.temperature, hazmat: context.hazmat, hazmatClass: context.hazmatClass,
            revenuePerMile: rpm,
            pickupCity: pickup.city || context.pickupCity, pickupState: pickup.state || context.pickupState,
            pickupZip: pickup.zip || context.pickupZip, pickupLocation: pickup.location || context.pickupLocation,
            pickupCompany: pickup.company || context.pickupCompany,
            deliveryCity: delivery.city || context.deliveryCity, deliveryState: delivery.state || context.deliveryState,
            deliveryZip: delivery.zip || context.deliveryZip, deliveryLocation: delivery.location || context.deliveryLocation,
            deliveryCompany: delivery.company || context.deliveryCompany,
            pickupDate: context.pickupDate, deliveryDate: context.deliveryDate,
            mcNumberId: context.mcNumberId, companyId: this.companyId, createdById: this.userId,
            status, loadType: context.loadType || LoadType.FTL, equipmentType: context.equipmentType || EquipmentType.DRY_VAN,
            dispatchNotes: context.dispatchNotes, driverNotes: context.driverNotes,
            shipmentId: context.shipmentId, tripId: context.tripId, stopsCount: context.stopsCount,
            lastNote: context.lastNote, onTimeDelivery: context.onTimeDelivery, lastUpdate: context.lastUpdate,
            totalExpenses: context.totalExpenses || 0,
            netProfit: revenue > 0 ? Number((revenue - driverPay - (context.totalExpenses || 0)).toFixed(2)) : undefined,
            readyForSettlement: statusAtOrBeyond(status, 'DELIVERED'),
            assignedAt: statusAtOrBeyond(status, 'ASSIGNED') ? (context.pickupDate || new Date()) : undefined,
            pickedUpAt: statusAtOrBeyond(status, 'AT_PICKUP') ? (context.pickupDate || new Date()) : undefined,
            deliveredAt: statusAtOrBeyond(status, 'DELIVERED') ? (context.deliveryDate || new Date()) : undefined,
            invoicedAt: statusAtOrBeyond(status, 'INVOICED') ? (context.deliveryDate || new Date()) : undefined,
            paidAt: status === LoadStatus.PAID ? (context.deliveryDate || new Date()) : undefined,
            pickupContact: context.pickupContact, pickupPhone: context.pickupPhone,
            deliveryContact: context.deliveryContact, deliveryPhone: context.deliveryPhone,
        };
    }

    private async autoCalculateMissingMiles(preparedLoads: any[], maps: any, warnings: any[]) {
        const needsMiles = preparedLoads.filter(l => {
            const d = l.data;
            return (!d.totalMiles || d.totalMiles === 0) && d.pickupCity && d.pickupState && d.deliveryCity && d.deliveryState;
        });
        if (needsMiles.length === 0) return;

        const routeMap = new Map<string, { origin: { city: string; state: string }; dest: { city: string; state: string }; miles?: number }>();
        for (const l of needsMiles) {
            const key = `${l.data.pickupCity},${l.data.pickupState}→${l.data.deliveryCity},${l.data.deliveryState}`.toLowerCase();
            if (!routeMap.has(key)) {
                routeMap.set(key, {
                    origin: { city: l.data.pickupCity, state: l.data.pickupState },
                    dest: { city: l.data.deliveryCity, state: l.data.deliveryState },
                });
            }
        }

        for (const [, route] of routeMap) {
            try {
                const result = await calculateDistanceMatrix({
                    origins: [route.origin], destinations: [route.dest], mode: 'driving', units: 'imperial',
                });
                const el = result?.[0]?.[0];
                if (el?.status === 'OK') route.miles = Math.round(el.distance * METERS_TO_MILES * 10) / 10;
            } catch { /* skip failed routes */ }
        }

        for (const l of needsMiles) {
            const key = `${l.data.pickupCity},${l.data.pickupState}→${l.data.deliveryCity},${l.data.deliveryState}`.toLowerCase();
            const route = routeMap.get(key);
            if (!route?.miles || route.miles <= 0) continue;

            try {
                const existing = await this.prisma.load.findFirst({
                    where: { loadNumber: l.data.loadNumber, companyId: this.companyId },
                    select: { id: true, driverId: true, revenue: true, emptyMiles: true },
                });
                if (!existing) continue;

                const totalMiles = route.miles;
                const loadedMiles = Math.max(0, totalMiles - (existing.emptyMiles || 0));
                const updateData: any = { totalMiles, loadedMiles };

                if (existing.revenue && totalMiles > 0) {
                    updateData.revenuePerMile = Math.round((existing.revenue / totalMiles) * 100) / 100;
                }

                if (existing.driverId) {
                    const payProfile = maps.driverPayMap.get(existing.driverId);
                    if (payProfile?.payRate > 0 && (payProfile.payType === 'PER_MILE' || payProfile.payType === 'HOURLY')) {
                        const newPay = calculateDriverPay(
                            { payType: payProfile.payType as PayType, payRate: payProfile.payRate },
                            { totalMiles, loadedMiles, emptyMiles: existing.emptyMiles, revenue: existing.revenue }
                        );
                        updateData.driverPay = newPay;
                        updateData.netProfit = (existing.revenue || 0) - newPay;
                    }
                }

                await this.prisma.load.update({ where: { id: existing.id }, data: updateData });
                warnings.push(this.warning(l.rowIndex, `Miles auto-calculated via Google Maps: ${totalMiles} mi`, 'totalMiles'));
            } catch { /* skip individual failures */ }
        }
    }

    private getVal(row: any, key: string, mapping: any) {
        return this.getValue(row, key, mapping, []);
    }

    private buildLoadPreview(total: number, loads: any[], errors: any[], warnings: any[]) {
        return {
            success: true, created: [], errors, warnings,
            preview: loads.slice(0, 100).map(l => ({ ...l.data, suspiciousPay: l.suspiciousPay })),
            summary: { total, created: loads.length, updated: 0, skipped: 0, errors: errors.length }
        };
    }
}
