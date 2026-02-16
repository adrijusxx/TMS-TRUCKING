import { LoadType, EquipmentType, LoadStatus } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { ImportLoadInput, importLoadSchema } from '@/lib/validations/load';
import { getRowValue, parseImportDate, parseLocationString, parseImportNumber } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';

export class LoadImporter extends BaseImporter {
    /**
     * Unified import interface
     */
    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
    }): Promise<ImportResult> {
        return this.importLoads(data, options);
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
            columnMapping?: Record<string, string>;
            importBatchId?: string;
        }
    ): Promise<ImportResult> {
        const { previewOnly, currentMcNumber, mcNumberId, updateExisting, columnMapping, importBatchId } = options;
        const errors: any[] = [];
        const warnings: any[] = [];
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // 1. Pre-fetch lookups for O(1) matching
        const [customers, trucks, trailers, drivers, mcNumbers, users] = await Promise.all([
            this.prisma.customer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, name: true, customerNumber: true } }),
            this.prisma.truck.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, truckNumber: true } }),
            this.prisma.trailer.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, trailerNumber: true } }),
            this.prisma.driver.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } }
            }),

            this.prisma.mcNumber.findMany({ where: { companyId: this.companyId, deletedAt: null }, select: { id: true, number: true, companyName: true, isDefault: true } }),
            this.prisma.user.findMany({
                where: { companyId: this.companyId, isActive: true },
                select: { id: true, firstName: true, lastName: true, email: true }
            }),
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





        const dispatcherMap = new Map<string, string>();
        users.forEach(u => {
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase().trim();
            dispatcherMap.set(fullName, u.id);
            dispatcherMap.set(u.email.toLowerCase().trim(), u.id);
            dispatcherMap.set(u.firstName.toLowerCase().trim(), u.id); // Fallback for first name only
        });

        // 2. Process rows
        const preparedLoads: any[] = [];
        const DEFAULT_PAY_RATE = 0.65;
        const lastDeliveryLocations = new Map<string, { city: string; state: string; zip?: string }>();

        // PERFORMANCE: Limit detailed preview rows for very large files to ensure fast response
        const totalRows = data.length;
        const rowsToProcess = totalRows;



        // --- STEP 1: Identification & Batch Creation of Entities (Customers, Drivers, Trucks, Trailers) ---
        const uniqueNewCustomers = new Map<string, string>(); // lowerName -> originalName
        const uniqueNewDrivers = new Map<string, { firstName: string, lastName: string, number: string }>(); // key -> data
        const uniqueNewTrucks = new Map<string, string>(); // number -> original
        const uniqueNewTrailers = new Map<string, string>(); // number -> original
        const uniqueNewDispatchers = new Map<string, string>(); // lowerName -> originalName

        for (let i = 0; i < rowsToProcess; i++) {
            const row = data[i];

            // 1.1 Customer Identification
            const customerName = this.getValue(row, 'customerId', columnMapping, ['Customer', 'customer', 'Customer Name', 'customer_name']);
            if (customerName) {
                const trimmedName = customerName.trim();
                const lowerName = trimmedName.toLowerCase();
                if (!customerMap.has(lowerName) && !customerMap.has(trimmedName)) {
                    uniqueNewCustomers.set(lowerName, trimmedName);
                }
            }

            // 1.2 Driver Identification
            const driverVal = String(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'Assigned Driver', 'Driver/Carrier']) || '').trim();
            if (driverVal && !driverMap.has(driverVal.toLowerCase())) {
                const lowerVal = driverVal.toLowerCase();
                if (!uniqueNewDrivers.has(lowerVal)) {
                    // Try to guess if it's a name or number
                    if (/\d/.test(driverVal) && !/\s/.test(driverVal)) {
                        // Looks like a number
                        uniqueNewDrivers.set(lowerVal, { firstName: 'Driver', lastName: driverVal, number: driverVal });
                    } else if (/\s/.test(driverVal)) {
                        // Looks like a name
                        const parts = driverVal.split(/\s+/);
                        uniqueNewDrivers.set(lowerVal, {
                            firstName: parts[0],
                            lastName: parts.length > 1 ? parts.slice(1).join(' ') : 'Unknown',
                            number: `DRV-${parts[0].toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 1000)}`
                        });
                    } else {
                        uniqueNewDrivers.set(lowerVal, { firstName: 'Driver', lastName: driverVal, number: `DRV-${driverVal.toUpperCase()}` });
                    }
                }
            }

            // 1.3 Truck Identification
            const truckVal = String(this.getValue(row, 'truckId', columnMapping, ['Truck', 'truck', 'Unit number', 'Truck Number']) || '').trim();
            if (truckVal && !truckMap.has(truckVal.toLowerCase()) && !truckMap.has(truckVal.toLowerCase().replace(/^0+/, ''))) {
                uniqueNewTrucks.set(truckVal.toLowerCase(), truckVal);
            }

            // 1.4 Trailer Identification
            const trailerVal = String(this.getValue(row, 'trailerId', columnMapping, ['Trailer', 'trailer', 'Trailer Number']) || '').trim();
            if (trailerVal && !trailerMap.has(trailerVal.toLowerCase()) && !trailerMap.has(trailerVal.toLowerCase().replace(/^0+/, ''))) {
                uniqueNewTrailers.set(trailerVal.toLowerCase(), trailerVal);
            }

            // 1.5 Dispatcher Identification
            const dispatcherVal = String(this.getValue(row, 'dispatcherId', columnMapping, ['Dispatcher', 'dispatcher', 'Dispatcher Name', 'dispatcher_name', 'Dispatcher Email']) || '').trim();
            if (dispatcherVal) {
                const lowerVal = dispatcherVal.toLowerCase();
                // Check if we already have this dispatcher in our map (by name or email)
                let found = false;
                for (const keys of dispatcherMap.keys()) {
                    if (keys === lowerVal) { found = true; break; }
                }

                if (!found && !uniqueNewDispatchers.has(lowerVal)) {
                    uniqueNewDispatchers.set(lowerVal, dispatcherVal);
                }
            }
        }

        // Batch Create Missing Customers
        if (uniqueNewCustomers.size > 0) {
            if (previewOnly) {
                // Mock IDs for preview
                for (const [lowerName, originalName] of uniqueNewCustomers) {
                    const mockId = `PREVIEW_NEW_CUST_${originalName.replace(/[^a-zA-Z0-9]/g, '')}`;
                    customerMap.set(lowerName, mockId);
                    customerMap.set(originalName, mockId);
                }
            } else {
                // Real Batch Create
                const newCustomersData = Array.from(uniqueNewCustomers.entries()).map(([_, name]) => {
                    const normalizedName = name.trim();
                    const shortName = normalizedName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
                    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

                    return {
                        name: normalizedName,
                        customerNumber: `${shortName}-${randomSuffix}-${Date.now().toString().slice(-4)}`,
                        companyId: this.companyId,
                        address: 'Unknown',
                        city: 'Unknown',
                        state: 'XX',
                        zip: '00000',
                        phone: '000-000-0000',
                        email: `contact@${shortName.toLowerCase()}.local`,
                        isActive: true,
                        importBatchId // Add batch ID
                    };
                });

                await this.prisma.customer.createMany({
                    data: newCustomersData,
                    skipDuplicates: true
                });

                const createdCustomers = await this.prisma.customer.findMany({
                    where: { companyId: this.companyId, name: { in: Array.from(uniqueNewCustomers.values()) } },
                    select: { id: true, name: true }
                });

                for (const c of createdCustomers) {
                    customerMap.set(c.name.toLowerCase().trim(), c.id);
                    customerMap.set(c.name, c.id);
                }
            }
        }

        // Batch Create Missing Drivers
        if (uniqueNewDrivers.size > 0) {
            if (previewOnly) {
                // Mock IDs for preview
                for (const [key, data] of uniqueNewDrivers.entries()) {
                    const mockId = `PREVIEW_NEW_DRIVER_${data.number}`;
                    driverMap.set(key, mockId);
                    driverMap.set(data.number.toLowerCase(), mockId);
                }
            } else {
                const newDriversData = Array.from(uniqueNewDrivers.values()).map(d => ({
                    companyId: this.companyId,
                    driverNumber: d.number,
                    licenseNumber: `PENDING-${d.number}`,
                    licenseState: 'XX',
                    licenseExpiry: this.getFutureDate(1),
                    medicalCardExpiry: this.getFutureDate(1),
                    payRate: 0.65,
                    mcNumberId: defaultMcId,
                    status: 'AVAILABLE' as any,
                    employeeStatus: 'ACTIVE' as any,
                    isActive: true,
                    importBatchId // Add batch ID
                }));

                await this.prisma.driver.createMany({ data: newDriversData, skipDuplicates: true });
                const createdDrivers = await this.prisma.driver.findMany({
                    where: { companyId: this.companyId, driverNumber: { in: newDriversData.map(d => d.driverNumber) } },
                    select: { id: true, driverNumber: true }
                });
                const createdDriversMap = new Map(createdDrivers.map(d => [d.driverNumber, d.id]));

                // Map created driver numbers
                for (const d of createdDrivers) driverMap.set(d.driverNumber.toLowerCase(), d.id);

                // Also map the original lookup keys (e.g. names) to the new IDs
                for (const [key, data] of uniqueNewDrivers.entries()) {
                    const newId = createdDriversMap.get(data.number);
                    if (newId) {
                        driverMap.set(key, newId);
                    }
                }
            }
        }

        // Batch Create Missing Trucks
        if (uniqueNewTrucks.size > 0) {
            if (previewOnly) {
                // Mock IDs for preview
                for (const [key, original] of uniqueNewTrucks) {
                    const mockId = `PREVIEW_NEW_TRUCK_${original}`;
                    truckMap.set(key, mockId);
                    truckMap.set(key.replace(/^0+/, ''), mockId);
                }
            } else {
                const newTrucksData = Array.from(uniqueNewTrucks.values()).map(t => ({
                    companyId: this.companyId,
                    truckNumber: t,
                    make: 'Unknown',
                    model: 'Unknown',
                    year: new Date().getFullYear(),
                    licensePlate: 'UNKNOWN',
                    state: 'XX',
                    registrationExpiry: this.getFutureDate(1),
                    insuranceExpiry: this.getFutureDate(1),
                    inspectionExpiry: this.getFutureDate(1),
                    vin: this.getPlaceholder('VIN', 0),
                    mcNumberId: defaultMcId,
                    equipmentType: 'DRY_VAN' as any,
                    capacity: 45000,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    importBatchId // Add batch ID
                }));
                await this.prisma.truck.createMany({ data: newTrucksData, skipDuplicates: true });
                const createdTrucks = await this.prisma.truck.findMany({
                    where: { companyId: this.companyId, truckNumber: { in: Array.from(uniqueNewTrucks.values()) } },
                    select: { id: true, truckNumber: true }
                });
                for (const t of createdTrucks) truckMap.set(t.truckNumber.toLowerCase(), t.id);
            }
        }

        // Batch Create Missing Trailers
        if (uniqueNewTrailers.size > 0) {
            if (previewOnly) {
                // Mock IDs for preview
                for (const [key, original] of uniqueNewTrailers) {
                    const mockId = `PREVIEW_NEW_TRAILER_${original}`;
                    trailerMap.set(key, mockId);
                    trailerMap.set(key.replace(/^0+/, ''), mockId);
                }
            } else {
                const newTrailersData = Array.from(uniqueNewTrailers.values()).map(t => ({
                    companyId: this.companyId,
                    trailerNumber: t,
                    make: 'Unknown',
                    model: 'Unknown',
                    vin: this.getPlaceholder('VIN', 0),
                    mcNumberId: defaultMcId,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    importBatchId // Add batch ID
                }));
                await this.prisma.trailer.createMany({ data: newTrailersData, skipDuplicates: true });
                const createdTrailers = await this.prisma.trailer.findMany({
                    where: { companyId: this.companyId, trailerNumber: { in: Array.from(uniqueNewTrailers.values()) } },
                    select: { id: true, trailerNumber: true }
                });
                for (const t of createdTrailers) trailerMap.set(t.trailerNumber.toLowerCase(), t.id);
            }
        }

        // Batch Create Missing Dispatchers
        if (uniqueNewDispatchers.size > 0) {
            if (previewOnly) {
                for (const [key, original] of uniqueNewDispatchers) {
                    const mockId = `PREVIEW_NEW_DISP_${original.replace(/[^a-zA-Z0-9]/g, '')}`;
                    dispatcherMap.set(key, mockId);
                }
            } else {
                const newDispatchersData = Array.from(uniqueNewDispatchers.values()).map(name => {
                    const names = name.split(' ');
                    const firstName = names[0] || 'Unknown';
                    const lastName = names.slice(1).join(' ') || 'Dispatcher';
                    const randomSuffix = Math.floor(Math.random() * 1000).toString();
                    // Create a placeholder email
                    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${randomSuffix}@imported.local`;

                    return {
                        firstName,
                        lastName,
                        email,
                        password: '$2b$10$EpIc.XF.2/6.1.1.1.1.1.1.1.1.1.1.1.1.1.1', // Placeholder bcrypt hash
                        tempPassword: 'ChangeMe123!',
                        role: 'DISPATCHER' as any,
                        companyId: this.companyId,
                        mcNumberId: defaultMcId,
                        isActive: true
                    };
                });

                // Collect emails for lookup
                const newEmails = newDispatchersData.map(d => d.email);

                await this.prisma.user.createMany({ data: newDispatchersData, skipDuplicates: true });

                // Retrieve created users to map them
                const createdUsers = await this.prisma.user.findMany({
                    where: {
                        companyId: this.companyId,
                        email: { in: newEmails }
                    },
                    select: { id: true, firstName: true, lastName: true, email: true }
                });

                for (const u of createdUsers) {
                    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase().trim().replace(/\s+/g, ' ');
                    dispatcherMap.set(fullName, u.id);
                    dispatcherMap.set(u.email.toLowerCase().trim(), u.id);
                    dispatcherMap.set(u.firstName.toLowerCase().trim(), u.id);
                }
            }
        }

        // --- STEP 2: Process Rows (Now fast) ---
        for (let i = 0; i < rowsToProcess; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                // Resolve Customer
                const customerName = this.getValue(row, 'customerId', columnMapping, ['Customer', 'customer', 'Customer Name', 'customer_name']);
                let resolvedCustomerId = customerName ? (customerMap.get(customerName.toLowerCase().trim()) || customerMap.get(customerName.trim())) : null;

                // Simple partial match fallback for customer
                if (!resolvedCustomerId && customerName) {
                    const key = customerName.toLowerCase().trim();
                    for (const [mapName, id] of customerMap.entries()) {
                        if (mapName.includes(key) || key.includes(mapName) || mapName === customerName.trim()) {
                            resolvedCustomerId = id;
                            break;
                        }
                    }
                }

                // Customer resolution is now purely lookup-based (O(1))
                if (!resolvedCustomerId && customerName) {
                    // Try one last lookup in case it was just added
                    resolvedCustomerId = customerMap.get(customerName.toLowerCase().trim()) || customerMap.get(customerName.trim());
                }

                if (!resolvedCustomerId) {
                    resolvedCustomerId = Array.from(customerMap.values())[0] || null;
                    if (resolvedCustomerId) {
                        warnings.push(this.warning(rowNum, `Customer not found, defaulted to first available customer`, 'customerId'));
                    } else {
                        errors.push(this.error(rowNum, 'Customer not found and no default available', 'customerId'));
                        continue;
                    }
                }

                // Resolve Driver, Truck, Trailer
                const driverValue = String(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'Assigned Driver', 'Driver/Carrier', 'Driver Name', 'driver_name']) || '').toLowerCase().trim();
                const driverId = driverValue ? (driverMap.get(driverValue) || null) : undefined;

                const truckValue = String(this.getValue(row, 'truckId', columnMapping, ['Truck', 'truck', 'Unit number', 'Truck Number', 'Truck ID', 'truck_id']) || '').toLowerCase().trim();
                const truckId = truckValue ? (truckMap.get(truckValue) || truckMap.get(truckValue.replace(/^0+/, '')) || null) : undefined;

                const trailerValue = String(this.getValue(row, 'trailerId', columnMapping, ['Trailer', 'trailer', 'Trailer Number', 'Trailer ID', 'trailer_id']) || '').toLowerCase().trim();
                const trailerId = trailerValue ? (trailerMap.get(trailerValue) || trailerMap.get(trailerValue.replace(/^0+/, '')) || null) : undefined;

                const dispatcherValue = String(this.getValue(row, 'dispatcherId', columnMapping, ['Dispatcher', 'dispatcher', 'Dispatcher Name', 'dispatcher_name', 'Dispatcher Email']) || '').toLowerCase().trim();
                const dispatcherId = dispatcherValue ? (dispatcherMap.get(dispatcherValue) || null) : undefined;

                // Parse Financials
                const revenue = parseImportNumber(this.getValue(row, 'revenue', columnMapping, ['Load pay', 'Load Pay', 'Revenue', 'revenue', 'Pay', 'pay'])) || 0;
                let driverPay = parseImportNumber(this.getValue(row, 'driverPay', columnMapping, ['Total pay', 'Total Pay', 'total_pay', 'Driver Pay', 'driver_pay']));
                if (driverPay === null) driverPay = 0;

                // Distance Calculation
                const totalMilesCol = parseImportNumber(this.getValue(row, 'totalMiles', columnMapping, ['Total miles', 'Total Miles', 'total_miles', 'Miles', 'miles', 'All Miles', 'All miles', 'all_miles'])) || 0;
                const emptyMilesCol = parseImportNumber(this.getValue(row, 'emptyMiles', columnMapping, ['Empty miles', 'Empty Miles', 'empty_miles'])) || 0;
                const loadedMilesCol = parseImportNumber(this.getValue(row, 'loadedMiles', columnMapping, ['Loaded miles', 'Loaded Miles', 'loaded_miles'])) || 0;
                const weightVal = parseImportNumber(this.getValue(row, 'weight', columnMapping, ['Weight', 'weight'])) || 0;

                // Initial Profit Calculation
                let profit = Math.round((revenue - driverPay) * 100) / 100;

                // --- ANOMALY DETECTION (Smart Diagnostics) ---
                const anomalies: string[] = [];
                if (revenue < 0) anomalies.push('Negative Revenue');
                if (driverPay > revenue && revenue > 0) anomalies.push('Pay exceeds Revenue');
                if (profit < 0 && !updateExisting) anomalies.push('Negative Profit');

                // Robust Mileage Calculation:
                // If loaded miles are missing but total and empty are present, calculate loaded.
                const finalEmptyMiles = emptyMilesCol;
                let finalLoadedMiles = loadedMilesCol;
                if (finalLoadedMiles === 0 && totalMilesCol > 0) {
                    finalLoadedMiles = Math.max(0, totalMilesCol - finalEmptyMiles);
                }

                // Final total is either explicit total or sum (favoring sum if components present)
                const finalTotalMiles = (finalLoadedMiles + finalEmptyMiles) > 0
                    ? (finalLoadedMiles + finalEmptyMiles)
                    : totalMilesCol;

                if (finalTotalMiles > 4000) anomalies.push('High Mileage (>4000)');
                if (weightVal > 50000) anomalies.push('Overweight (>50,000 lbs)');
                if (revenue > 20000) anomalies.push('Extremely High Revenue');

                let suspiciousPay = anomalies.length > 0;

                // CRITICAL FIX: Detection of "Driver Pay = Revenue" error
                if (revenue > 0 && driverPay === revenue) {
                    suspiciousPay = true;
                    // Re-calculate based on miles if available
                    if (finalTotalMiles > 0) {
                        driverPay = Math.round(finalTotalMiles * DEFAULT_PAY_RATE * 100) / 100;
                        profit = Math.round((revenue - driverPay) * 100) / 100; // Recalculate profit
                        anomalies.push('Self-Corrected: Driver Pay was exactly Revenue');
                    } else {
                        driverPay = 0;
                        profit = revenue;
                    }
                }

                // Dates & Locations
                const pickupDate = parseImportDate(this.getValue(row, 'pickupDate', columnMapping, ['Pickup Date', 'pickup_date', 'PU date']));
                const deliveryDate = parseImportDate(this.getValue(row, 'deliveryDate', columnMapping, ['Delivery Date', 'delivery_date', 'DEL date', 'Delivery date']));

                // --- ROBUST LOCATION PARSING (Merge Origin/Dest string with City/State columns) ---
                const pickupString = this.getValue(row, 'pickupLocation', columnMapping, ['Pickup Location', 'pickup_location', 'Pickup', 'pickup', 'Origin', 'origin']);
                const pickupParsed = parseLocationString(pickupString);

                const expPickupCity = this.getValue(row, 'pickupCity', columnMapping, ['Pickup City', 'pickup_city', 'Origin City', 'origin_city']);
                const expPickupState = this.getValue(row, 'pickupState', columnMapping, ['Pickup State', 'pickup_state', 'Origin State', 'origin_state']);
                const expPickupZip = this.getValue(row, 'pickupZip', columnMapping, ['Pickup Zip', 'pickup_zip', 'Origin Zip', 'origin_zip']);

                const pickupFinal = {
                    city: (expPickupCity || pickupParsed?.city || 'Unknown').trim(),
                    state: normalizeState(expPickupState || pickupParsed?.state) || '',
                    zip: (expPickupZip || pickupParsed?.zip || '00000').trim()
                };

                const deliveryString = this.getValue(row, 'deliveryLocation', columnMapping, ['Delivery Location', 'delivery_location', 'Delivery', 'delivery', 'Destination', 'destination', 'Dest', 'dest']);
                const deliveryParsed = parseLocationString(deliveryString);

                const expDeliveryCity = this.getValue(row, 'deliveryCity', columnMapping, ['Delivery City', 'delivery_city', 'Destination City', 'destination_city', 'Dest City', 'dest_city']);
                const expDeliveryState = this.getValue(row, 'deliveryState', columnMapping, ['Delivery State', 'delivery_state', 'Destination State', 'destination_state', 'Dest State', 'dest_state']);
                const expDeliveryZip = this.getValue(row, 'deliveryZip', columnMapping, ['Delivery Zip', 'delivery_zip', 'Destination Zip', 'destination_zip', 'Dest Zip', 'dest_zip']);

                const deliveryFinal = {
                    city: (expDeliveryCity || deliveryParsed?.city || 'Unknown').trim(),
                    state: normalizeState(expDeliveryState || deliveryParsed?.state) || '',
                    zip: (expDeliveryZip || deliveryParsed?.zip || '00000').trim()
                };

                // Zero-Failure: Date defaults
                const finalPickupDate = pickupDate || new Date();
                const finalDeliveryDate = deliveryDate || new Date(finalPickupDate.getTime() + 24 * 60 * 60 * 1000);

                if (!pickupDate) warnings.push(this.warning(rowNum, 'Pickup Date missing, defaulted to today', 'pickupDate'));
                if (!deliveryDate) warnings.push(this.warning(rowNum, 'Delivery Date missing, defaulted to pickup +1 day', 'deliveryDate'));


                // Map Load Status
                const statusRaw = String(this.getValue(row, 'status', columnMapping, ['Load status', 'Status', 'status']) || '').toUpperCase().trim();
                let status: LoadStatus = LoadStatus.PENDING;
                if (statusRaw.includes('DELIVER')) status = LoadStatus.DELIVERED;
                else if (statusRaw.includes('INVOICE')) status = LoadStatus.INVOICED;
                else if (statusRaw.includes('PAID')) status = LoadStatus.PAID;
                else if (statusRaw.includes('PICK')) status = LoadStatus.AT_PICKUP;
                else if (statusRaw.includes('ROUTE')) status = LoadStatus.EN_ROUTE_PICKUP;
                else if (statusRaw.includes('ASSIGN') || statusRaw.includes('DISPATCH')) status = LoadStatus.ASSIGNED;

                // Construct Load Object
                const loadData: any = {
                    // Standard Fields
                    loadNumber: String(this.getValue(row, 'loadNumber', columnMapping, ['Load ID', 'load_id', 'Load Number', 'load_number']) || this.getPlaceholder('LOAD', rowNum)).trim(),
                    customerId: resolvedCustomerId,
                    driverId,
                    truckId,
                    trailerId,
                    dispatcherId,
                    revenue,
                    driverPay,
                    profit,
                    netProfit: profit,

                    // Stats
                    totalMiles: finalTotalMiles,
                    loadedMiles: finalLoadedMiles || undefined,
                    emptyMiles: finalEmptyMiles || undefined,
                    revenuePerMile: finalTotalMiles > 0 ? (revenue / finalTotalMiles) : 0,
                    weight: weightVal || 1,

                    // Location & Dates
                    pickupCity: pickupFinal.city,
                    pickupState: pickupFinal.state,
                    pickupZip: pickupFinal.zip,
                    pickupLocation: pickupString || pickupFinal.city,
                    pickupAddress: this.getValue(row, 'pickupAddress', columnMapping, ['Pickup Address', 'pickup_address']) || pickupString || undefined,
                    pickupCompany: this.getValue(row, 'pickupCompany', columnMapping, ['Pickup company', 'Pickup Company', 'Shipper', 'shipper']) || undefined,

                    deliveryCity: deliveryFinal.city,
                    deliveryState: deliveryFinal.state,
                    deliveryZip: deliveryFinal.zip,
                    deliveryLocation: deliveryString || deliveryFinal.city,
                    deliveryAddress: this.getValue(row, 'deliveryAddress', columnMapping, ['Delivery Address', 'delivery_address']) || deliveryString || undefined,
                    deliveryCompany: this.getValue(row, 'deliveryCompany', columnMapping, ['Delivery company', 'Delivery Company', 'Receiver', 'receiver']) || undefined,

                    pickupDate: finalPickupDate,
                    deliveryDate: finalDeliveryDate,

                    // IDs & Status
                    mcNumberId: await this.resolveMcNumberId(this.getValue(row, 'mcNumberId', columnMapping, []) || mcNumberId || currentMcNumber),
                    companyId: this.companyId,
                    createdById: this.userId, // Default to importer, overridden below if dispatcher found
                    status,

                    // Metadata / Enums
                    loadType: LoadType.FTL,
                    equipmentType: EquipmentType.DRY_VAN,

                    // --- NEWLY MAPPED FIELDS ---
                    tripId: String(this.getValue(row, 'tripId', columnMapping, ['Trip ID', 'trip_id']) || '') || undefined,
                    shipmentId: String(this.getValue(row, 'shipmentId', columnMapping, ['Shipment ID', 'shipment_id']) || '') || undefined,
                    stopsCount: parseInt(String(this.getValue(row, 'stopsCount', columnMapping, ['Stops count', 'stops_count', 'Stops']) || '0')) || undefined,
                    totalPay: parseFloat(String(this.getValue(row, 'totalPay', columnMapping, ['Total Pay', 'total_pay']) || '0').replace(/[$,\s]/g, '')) || undefined,
                    lastUpdate: parseImportDate(this.getValue(row, 'lastUpdate', columnMapping, ['Last update', 'last_update'])),
                    onTimeDelivery: ['yes', 'true', '1', 'on time'].includes(String(this.getValue(row, 'onTimeDelivery', columnMapping, ['On Time Delivery', 'on_time_delivery']) || '').toLowerCase()),
                    serviceFee: parseFloat(String(this.getValue(row, 'serviceFee', columnMapping, ['Service fee', 'Overview service fee', 'service_fee']) || '0').replace(/[$,\s]/g, '')) || undefined,
                };

                // (Dispatcher already resolved at line 455 using dispatcherMap)

                // Explicit 'Created By' column override
                const createdByName = String(this.getValue(row, 'createdById', columnMapping, ['Created By', 'created_by']) || '').trim();
                if (createdByName) {
                    const cName = createdByName.toLowerCase();
                    const cUser = users.find(u =>
                        `${u.firstName} ${u.lastName}`.toLowerCase() === cName ||
                        u.lastName.toLowerCase() === cName
                    );
                    if (cUser) loadData.createdById = cUser.id;
                }

                // --- ROBUSTNESS: Capture Unmapped Column Data into Metadata ---
                // This ensures "different data" formats are not lost
                const mappedKeys = new Set<string>();

                // 1. Collect all keys that we explicitly looked up (system fields & their aliases)
                // This is an approximation since getValue checks multiple synonyms. 
                // A better approach is to check what REMAINS in 'row' after accounting for knowns.
                // But 'row' keys are the Source Headers. 

                // Let's define the "Known Headers" roughly based on what we just parsed
                const knownHeaders = [
                    'loadNumber', 'loadId', 'load_id', 'load number', 'load_number',
                    'customerId', 'customer', 'customer name', 'customer_name',
                    'driverId', 'driver', 'assigned driver', 'driver/carrier',
                    'truckId', 'truck', 'unit number', 'truck number',
                    'trailerId', 'trailer', 'trailer number',
                    'revenue', 'load pay', 'load_pay', 'pay',
                    'driverPay', 'total pay', 'total_pay', 'driver pay', 'driver_pay',
                    'totalMiles', 'total miles', 'total_miles', 'miles',
                    'emptyMiles', 'empty miles', 'empty_miles',
                    'loadedMiles', 'loaded miles', 'loaded_miles',
                    'weight',
                    'pickupDate', 'pickup_date', 'pu date',
                    'deliveryDate', 'delivery_date', 'del date', 'delivery date',
                    'pickupLocation', 'pickup_location', 'pickup',
                    'pickupCity', 'pickup_city',
                    'pickupState', 'pickup_state',
                    'pickupZip', 'pickup_zip',
                    'pickupAddress', 'pickup_address',
                    'pickupCompany', 'pickup company', 'shipper',
                    'deliveryLocation', 'delivery_location', 'delivery',
                    'deliveryCity', 'delivery_city',
                    'deliveryState', 'delivery_state',
                    'deliveryZip', 'delivery_zip',
                    'deliveryAddress', 'delivery_address',
                    'deliveryCompany', 'delivery company', 'receiver',
                    'status', 'load status',
                    'mcNumberId',
                    'dispatcherId', 'dispatcher',
                    'createdById', 'created by', 'created_by',
                    'tripId', 'trip_id', 'trip id',
                    'shipmentId', 'shipment_id', 'shipment id',
                    'stopsCount', 'stops count', 'stops_count', 'stops',
                    'lastUpdate', 'last update', 'last_update',
                    'onTimeDelivery', 'on time delivery', 'on_time_delivery',
                    'serviceFee', 'service fee', 'overview service fee', 'service_fee'
                ];

                const meta: Record<string, any> = {};
                for (const [key, val] of Object.entries(row)) {
                    // Check if this source header key matches any of our known headers (normalized)
                    const normalizedKey = key.toLowerCase().trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
                    const isKnown = knownHeaders.some(kh =>
                        kh.toLowerCase().replace(/_/g, ' ') === normalizedKey ||
                        normalizedKey.includes(kh.toLowerCase()) // Loose matching to be safe
                    );

                    if (!isKnown && val !== null && val !== undefined && val !== '') {
                        meta[key] = val;
                    }
                }

                if (Object.keys(meta).length > 0) {
                    loadData.metadata = meta;
                }



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
                    anomalies,
                    _deadheadCalc: needsDeadhead ? {
                        origin: deadheadOrigin,
                        destination: { city: loadData.pickupCity, state: loadData.pickupState, zip: loadData.pickupZip }
                    } : undefined
                });

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Validation failed'));
            }

            // PAYLOAD PROTECTION: Don't collection too many errors for return result, but process FULL file
            // if (errors.length > 500) break; // REMOVED: Process the whole file even if some rows fail
        }

        // Preview Return
        if (previewOnly) {
            return {
                success: true,
                created: preparedLoads.slice(0, 100).map(l => l.data),
                errors: errors.slice(0, 500),
                warnings,
                preview: preparedLoads.slice(0, 100).map(l => ({
                    ...l.data,
                    suspiciousPay: l.suspiciousPay
                })),
                summary: {
                    total: totalRows,
                    created: preparedLoads.length,
                    updated: 0,
                    skipped: 0,
                    errors: errors.length
                }
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
                    /*
                    const origins = batch.map(b => b._deadheadCalc.origin);
                    const destinations = batch.map(b => b._deadheadCalc.destination);
                    // Disabling Deadhead Calc due to missing import/implementation in this context
                    // const matrix = await calculateDistanceMatrix({...}) 
                    */
                    batch.forEach(load => {
                        load.data.emptyMiles = 0; // Default to 0 if we can't calc
                    });


                } catch (e) { console.warn('Deadhead calc failed', e); }
            }
        }

        // Deduplicate preparedLoads by loadNumber to prevent unique constraint errors within the same file
        const uniquePreparedLoads = new Map<string, any>();
        let duplicateRowsInFile = 0;
        for (const load of preparedLoads) {
            if (uniquePreparedLoads.has(load.data.loadNumber)) {
                duplicateRowsInFile++;
            }
            uniquePreparedLoads.set(load.data.loadNumber, load); // Last one wins
        }
        const finalPreparedLoads = Array.from(uniquePreparedLoads.values());
        skippedCount += duplicateRowsInFile; // Count rows dropped by deduplication as skipped

        // Final Save Partitioning
        // (counters initialized at top of function)

        // Fetch existing for updates/skips
        const loadNumbers = finalPreparedLoads.map(l => String(l.data.loadNumber).trim());
        const existingLoads = await this.prisma.load.findMany({
            where: {
                loadNumber: { in: loadNumbers },
                companyId: this.companyId
            },
            select: { id: true, loadNumber: true, deletedAt: true }
        });

        // Use a normalized map (trimmed, case-insensitive) for better matching
        const existingMap = new Map<string, any>();
        existingLoads.forEach(l => {
            existingMap.set(l.loadNumber.trim().toLowerCase(), l);
        });

        const toCreate: any[] = [];
        const toUpdate: any[] = [];

        for (const load of finalPreparedLoads) {
            const normalizedLoadNum = String(load.data.loadNumber).trim().toLowerCase();
            const existing = existingMap.get(normalizedLoadNum);

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

        // Execute Creates in Batches
        const CREATE_BATCH_SIZE = 100;
        if (toCreate.length > 0) {
            for (let i = 0; i < toCreate.length; i += CREATE_BATCH_SIZE) {
                const batch = toCreate.slice(i, i + CREATE_BATCH_SIZE);
                try {
                    const validCreates: any[] = [];
                    // Validate entire batch first
                    for (const d of batch) {
                        try {
                            const { mcNumber, stops, ...rest } = importLoadSchema.parse(d);
                            validCreates.push({
                                ...rest,
                                companyId: this.companyId,
                                weight: rest.weight ?? 1,
                                importBatchId // Add batch ID
                            });
                        } catch (err: any) {
                            errors.push({ row: 0, error: `Validation failed for ${d.loadNumber}: ${err.message}` });
                        }
                    }

                    if (validCreates.length > 0) {
                        await this.prisma.load.createMany({ data: validCreates, skipDuplicates: true });
                        createdCount += validCreates.length;
                    }
                } catch (e: any) {
                    // Fallback to individual for this batch only if createMany significantly fails (e.g. DB error)
                    // This path should rarely happen now that we pre-validate
                    for (const d of batch) {
                        try {
                            const { mcNumber, stops, ...rest } = importLoadSchema.parse(d);
                            await this.prisma.load.create({
                                data: {
                                    ...rest,
                                    companyId: this.companyId,
                                    weight: rest.weight ?? 1,
                                    importBatchId // Add batch ID
                                }
                            });
                            createdCount++;
                        } catch (err: any) {
                            // Don't duplicate error if already pushed
                            if (!errors.find(e => e.error.includes(d.loadNumber))) {
                                errors.push({ row: 0, error: `Create failed for ${d.loadNumber}: ${err.message}` });
                            }
                        }
                    }
                }
            }
        }

        // Execute Updates in Batches
        if (toUpdate.length > 0) {
            for (let i = 0; i < toUpdate.length; i += CREATE_BATCH_SIZE) {
                const batch = toUpdate.slice(i, i + CREATE_BATCH_SIZE);
                try {
                    await this.prisma.$transaction(
                        batch.map(u => {
                            const { id, ...data } = u;
                            const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                            const { suspiciousPay, anomalies, rowIndex, ...cleanData } = rest as any;
                            return this.prisma.load.update({
                                where: { id },
                                data: {
                                    ...cleanData,
                                    deletedAt: null,
                                    weight: cleanData.weight ?? undefined
                                }
                            });
                        })
                    );
                    updatedCount += batch.length;
                } catch (e: any) {
                    // Fallback individual
                    for (const u of batch) {
                        try {
                            const { id, ...data } = u;
                            const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                            const { suspiciousPay, anomalies, rowIndex, ...cleanData } = rest as any;
                            await this.prisma.load.update({
                                where: { id },
                                data: {
                                    ...cleanData,
                                    deletedAt: null,
                                    weight: cleanData.weight ?? undefined
                                }
                            });
                            updatedCount++;
                        } catch (err: any) {
                            errors.push({ row: 0, error: `Update failed for ${u.loadNumber}: ${err.message}` });
                        }
                    }
                }
            }
        }
        return {
            success: true,
            created: [],
            errors: errors.slice(0, 500),
            warnings,
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
