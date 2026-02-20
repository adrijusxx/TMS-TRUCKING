import { PrismaClient, EquipmentType } from '@prisma/client';

/**
 * ImporterEntityService
 * 
 * Handles Just-In-Time (JIT) creation and lookup of entities during import.
 * Ensures data isolation by companyId and mcNumberId.
 */
export class ImporterEntityService {
    constructor(
        private prisma: PrismaClient,
        private companyId: string,
        private defaultMcId?: string
    ) { }

    /**
     * Resolve or create a customer on the fly
     */
    async resolveCustomer(
        name: string,
        customerMap: Map<string, string>,
        previewOnly: boolean = false,
        importBatchId?: string,
        allowCreate: boolean = true
    ): Promise<string | null> {
        if (!name) return null;
        const normalizedName = name.trim();
        const lowerName = normalizedName.toLowerCase();

        let id = customerMap.get(lowerName) || customerMap.get(normalizedName);
        if (id) return id;

        // Try partial match lookup
        for (const [mapName, mapId] of customerMap.entries()) {
            if (mapName.includes(lowerName) || lowerName.includes(mapName) || mapName === normalizedName) {
                return mapId;
            }
        }

        if (previewOnly) return allowCreate
            ? `PREVIEW_NEW_CUST_${normalizedName.replace(/[^a-zA-Z0-9]/g, '')}`
            : `SKIPPED_CUST_${normalizedName.replace(/[^a-zA-Z0-9]/g, '')}`;

        // DB Check (race condition protection)
        const existing = await this.prisma.customer.findFirst({
            where: { companyId: this.companyId, name: { equals: normalizedName, mode: 'insensitive' } },
            select: { id: true }
        });

        if (existing) {
            customerMap.set(lowerName, existing.id);
            return existing.id;
        }

        if (!allowCreate) return null;

        // Create new customer
        const shortName = normalizedName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newCust = await this.prisma.customer.create({
            data: {
                name: normalizedName,
                customerNumber: `${shortName}-${randomSuffix}-${Date.now().toString().slice(-4)}`,
                companyId: this.companyId,
                address: 'Unknown',
                city: 'Unknown',
                state: 'XX',
                zip: '00000',
                phone: '000-000-0000',
                email: `contact@${shortName.toLowerCase() || 'unknown'}.local`,
                isActive: true,
                importBatchId
            }
        });
        customerMap.set(lowerName, newCust.id);
        return newCust.id;
    }

    /**
     * Resolve or create a driver on the fly
     */
    async resolveDriver(
        name: string,
        driverMap: Map<string, string>,
        previewOnly: boolean = false,
        importBatchId?: string,
        allowCreate: boolean = true
    ): Promise<string | null> {
        if (!name) return null;
        const lowerName = name.toLowerCase().trim();
        let id = driverMap.get(lowerName);
        if (id) return id;

        if (previewOnly) return allowCreate
            ? `PREVIEW_NEW_DRV_${lowerName.replace(/[^a-zA-Z0-9]/g, '')}`
            : `SKIPPED_DRV_${lowerName.replace(/[^a-zA-Z0-9]/g, '')}`;

        let dNumber = name;
        let dFirst = 'Driver';
        let dLast = name;

        if (/\d/.test(name) && !/\s/.test(name)) {
            dNumber = name;
        } else if (/\s/.test(name)) {
            const parts = name.split(/\s+/);
            dFirst = parts[0];
            dLast = parts.slice(1).join(' ');
            dNumber = `DRV-${dFirst.toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 1000)}`;
        }

        const existing = await this.prisma.driver.findFirst({
            where: {
                companyId: this.companyId,
                OR: [
                    { driverNumber: { equals: dNumber, mode: 'insensitive' } },
                    { user: { AND: [{ firstName: { equals: dFirst, mode: 'insensitive' } }, { lastName: { equals: dLast, mode: 'insensitive' } }] } }
                ]
            },
            select: { id: true }
        });

        if (existing) {
            driverMap.set(lowerName, existing.id);
            return existing.id;
        }

        if (!allowCreate) return null;

        // We need an MC ID to create a User (database constraint)
        if (!this.defaultMcId) {
            console.warn(`[Importer] Skipping User creation for driver ${name} - No MC ID available.`);
            return this.createDriverWithoutUser(dNumber, lowerName, driverMap, importBatchId);
        }

        try {
            const newUser = await this.prisma.user.create({
                data: {
                    email: `driver.${dNumber.toLowerCase()}@imported.local`,
                    firstName: dFirst,
                    lastName: dLast,
                    password: 'Imported123!',
                    role: 'DRIVER',
                    companyId: this.companyId,
                    mcNumberId: this.defaultMcId,
                    isActive: true
                }
            });

            const newDrv = await this.prisma.driver.create({
                data: {
                    companyId: this.companyId,
                    userId: newUser.id,
                    driverNumber: dNumber,
                    licenseNumber: `PENDING-${dNumber}`,
                    licenseState: 'XX',
                    licenseExpiry: this.getFutureDate(1),
                    medicalCardExpiry: this.getFutureDate(1),
                    payType: 'PER_MILE' as any,
                    payRate: 0.65,
                    mcNumberId: this.defaultMcId,
                    status: 'AVAILABLE',
                    isActive: true,
                    importBatchId
                }
            });
            driverMap.set(lowerName, newDrv.id);
            return newDrv.id;
        } catch (e) {
            return this.createDriverWithoutUser(dNumber, lowerName, driverMap, importBatchId);
        }
    }

    private async createDriverWithoutUser(dNumber: string, lowerName: string, driverMap: Map<string, string>, importBatchId?: string): Promise<string | null> {
        try {
            const simpleDrv = await this.prisma.driver.create({
                data: {
                    companyId: this.companyId,
                    driverNumber: dNumber,
                    licenseNumber: `PENDING-${dNumber}`,
                    licenseState: 'XX',
                    licenseExpiry: this.getFutureDate(1),
                    medicalCardExpiry: this.getFutureDate(1),
                    payType: 'PER_MILE' as any,
                    payRate: 0.65,
                    mcNumberId: this.defaultMcId || '', // Driver record might allow null, check schema
                    status: 'AVAILABLE',
                    isActive: true,
                    importBatchId
                }
            });
            driverMap.set(lowerName, simpleDrv.id);
            return simpleDrv.id;
        } catch (ex) { return null; }
    }

    /**
     * Resolve or create a truck on the fly
     */
    async resolveTruck(
        number: string,
        truckMap: Map<string, string>,
        previewOnly: boolean = false,
        importBatchId?: string,
        allowCreate: boolean = true
    ): Promise<string | null> {
        if (!number) return null;
        const normalized = number.toLowerCase().trim();
        let id = truckMap.get(normalized) || truckMap.get(normalized.replace(/^0+/, ''));
        if (id) return id;

        if (previewOnly) return allowCreate
            ? `PREVIEW_NEW_TRK_${normalized.replace(/[^a-zA-Z0-9]/g, '')}`
            : `SKIPPED_TRK_${normalized.replace(/[^a-zA-Z0-9]/g, '')}`;

        const existing = await this.prisma.truck.findFirst({
            where: { companyId: this.companyId, truckNumber: { equals: number, mode: 'insensitive' } },
            select: { id: true }
        });

        if (existing) {
            truckMap.set(normalized, existing.id);
            return existing.id;
        }

        if (!allowCreate) return null;

        try {
            const newTrk = await this.prisma.truck.create({
                data: {
                    companyId: this.companyId,
                    truckNumber: number,
                    make: 'Unknown',
                    model: 'Unknown',
                    year: new Date().getFullYear(),
                    licensePlate: 'UNKNOWN',
                    state: 'XX',
                    vin: `PENDING-VIN-${number}-${Date.now().toString().slice(-4)}`,
                    mcNumberId: this.defaultMcId,
                    equipmentType: EquipmentType.DRY_VAN,
                    capacity: 45000,
                    registrationExpiry: this.getFutureDate(1),
                    insuranceExpiry: this.getFutureDate(1),
                    inspectionExpiry: this.getFutureDate(1),
                    status: 'AVAILABLE',
                    isActive: true,
                    importBatchId
                }
            });
            truckMap.set(normalized, newTrk.id);
            return newTrk.id;
        } catch (e) { return null; }
    }

    /**
     * Resolve or create a trailer on the fly
     */
    async resolveTrailer(
        number: string,
        trailerMap: Map<string, string>,
        previewOnly: boolean = false,
        importBatchId?: string,
        allowCreate: boolean = true
    ): Promise<string | null> {
        if (!number) return null;
        const normalized = number.toLowerCase().trim();
        let id = trailerMap.get(normalized) || trailerMap.get(normalized.replace(/^0+/, ''));
        if (id) return id;

        if (previewOnly) return allowCreate
            ? `PREVIEW_NEW_TRL_${normalized.replace(/[^a-zA-Z0-9]/g, '')}`
            : `SKIPPED_TRL_${normalized.replace(/[^a-zA-Z0-9]/g, '')}`;

        const existing = await this.prisma.trailer.findFirst({
            where: { companyId: this.companyId, trailerNumber: { equals: number, mode: 'insensitive' } },
            select: { id: true }
        });

        if (existing) {
            trailerMap.set(normalized, existing.id);
            return existing.id;
        }

        if (!allowCreate) return null;

        try {
            const newTrl = await this.prisma.trailer.create({
                data: {
                    companyId: this.companyId,
                    trailerNumber: number,
                    make: 'Unknown',
                    model: 'Unknown',
                    vin: `PENDING-VIN-TRL-${number}-${Date.now().toString().slice(-4)}`,
                    mcNumberId: this.defaultMcId,
                    status: 'AVAILABLE',
                    isActive: true,
                    importBatchId
                }
            });
            trailerMap.set(normalized, newTrl.id);
            return newTrl.id;
        } catch (e) { return null; }
    }

    private getFutureDate(years: number): Date {
        const d = new Date();
        d.setFullYear(d.getFullYear() + years);
        return d;
    }
}
