import { prisma } from '@/lib/prisma';

export interface LoadDataSnapshot {
    loadId: string;
    loadNumber: string;
    revenue: number;
    weight: number | null;
    totalMiles: number | null;
    driverPay: number | null;
    customerId: string;
    customerName: string;
    snapshotAt: Date;
}

/**
 * InvoiceSnapshotService
 * 
 * Handles capturing snapshots of load data at invoicing time for audit trails.
 */
export class InvoiceSnapshotService {
    /**
     * Create a snapshot of load data at invoice creation time
     */
    static async createLoadDataSnapshots(loadIds: string[]): Promise<LoadDataSnapshot[]> {
        const loads = await prisma.load.findMany({
            where: { id: { in: loadIds } },
            include: { customer: { select: { id: true, name: true } } },
        });

        return loads.map(load => ({
            loadId: load.id,
            loadNumber: load.loadNumber,
            revenue: load.revenue,
            weight: load.weight,
            totalMiles: load.totalMiles,
            driverPay: load.driverPay,
            customerId: load.customerId,
            customerName: load.customer.name,
            snapshotAt: new Date(),
        }));
    }

    /**
     * Check if load data has changed since invoicing
     */
    static async checkDataConsistency(loadId: string, snapshot: LoadDataSnapshot) {
        const load = await prisma.load.findUnique({
            where: { id: loadId },
            include: { customer: { select: { id: true, name: true } } },
        });

        if (!load) return { consistent: false, discrepancies: ['Load not found'] };
        const discrepancies: string[] = [];

        if (load.revenue !== snapshot.revenue) discrepancies.push(`Revenue changed from $${snapshot.revenue.toFixed(2)} to $${load.revenue.toFixed(2)}`);
        if (load.weight !== snapshot.weight) discrepancies.push(`Weight changed from ${snapshot.weight ?? 'null'} to ${load.weight ?? 'null'}`);
        if (load.totalMiles !== snapshot.totalMiles) discrepancies.push(`Total miles changed from ${snapshot.totalMiles ?? 'null'} to ${load.totalMiles ?? 'null'}`);
        if (load.driverPay !== snapshot.driverPay) discrepancies.push(`Driver pay changed from $${snapshot.driverPay?.toFixed(2) ?? 'null'} to $${load.driverPay?.toFixed(2) ?? 'null'}`);
        if (load.customerId !== snapshot.customerId) discrepancies.push(`Customer changed from ${snapshot.customerName} to ${load.customer.name}`);

        return { consistent: discrepancies.length === 0, discrepancies };
    }
}
