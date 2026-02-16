import { prisma } from '@/lib/prisma';
import { validateLoadForAccounting } from '@/lib/validations/load';

/**
 * InvoiceValidationManager
 * 
 * Handles all logic for determining if loads are ready to be billed.
 */
export class InvoiceValidationManager {
    /**
     * Check if load is ready to bill ("Clean Load" check)
     */
    static async isReadyToBill(loadId: string, options?: {
        allowBrokerageSplit?: boolean;
    }) {
        const reasons: string[] = [];
        const load = await prisma.load.findUnique({
            where: { id: loadId },
            include: {
                documents: { where: { type: 'POD', deletedAt: null } },
                customer: { select: { id: true, type: true } },
            },
        });

        if (!load) return { ready: false, reasons: ['Load not found'] };

        const podDocuments = load.documents.filter(doc => doc.type === 'POD' && doc.fileUrl);
        if (podDocuments.length === 0) reasons.push('POD (Proof of Delivery) image is missing');

        const carrierRate = load.driverPay || 0;
        const customerRate = load.revenue || 0;
        const isBrokerageSplit = options?.allowBrokerageSplit || (load.customer as any).type === 'BROKER';

        if (carrierRate !== customerRate && !isBrokerageSplit) {
            reasons.push(`Rate mismatch: Carrier Rate ($${carrierRate.toFixed(2)}) != Customer Rate ($${customerRate.toFixed(2)}).`);
        }

        if (!load.weight || load.weight === 0) reasons.push('BOL Weight is missing or zero');

        return {
            ready: reasons.length === 0,
            reasons: reasons.length > 0 ? reasons : undefined,
            missingPOD: podDocuments.length === 0,
            rateMismatch: carrierRate !== customerRate && !isBrokerageSplit,
            missingBOLWeight: !load.weight || load.weight === 0,
        };
    }

    /**
     * Check multiple loads for billing readiness
     */
    static async areLoadsReadyToBill(loadIds: string[], options?: { allowBrokerageSplit?: boolean }) {
        const results = await Promise.all(loadIds.map(id => this.isReadyToBill(id, options)));
        return { allReady: results.every(r => r.ready), results };
    }

    /**
     * Validate loads for accounting requirements
     */
    static async validateLoadsForInvoicing(loadIds: string[]) {
        const loads = await prisma.load.findMany({
            where: { id: { in: loadIds } },
            select: { id: true, loadNumber: true, customerId: true, revenue: true, weight: true, driverId: true, totalMiles: true, driverPay: true, fuelAdvance: true },
        });

        const results = loads.map(load => {
            const validation = validateLoadForAccounting(load);
            return {
                loadId: load.id,
                loadNumber: load.loadNumber,
                canInvoice: validation.canInvoice,
                errors: validation.errors,
                warnings: validation.warnings,
            };
        });

        return { allValid: results.every(r => r.canInvoice), results };
    }

    /**
     * Detect financial anomalies and revenue leaks
     */
    static async detectExpenseGaps(loadId: string) {
        const load = await prisma.load.findUnique({
            where: { id: loadId },
            include: { documents: { where: { deletedAt: null } }, loadExpenses: true }
        });

        if (!load) return { hasAnomalies: false, anomalies: [] };
        const anomalies: string[] = [];

        if (load.status === 'DELIVERED' && !load.documents.some(d => d.type === 'POD')) {
            anomalies.push('Load is DELIVERED but missing Proof of Delivery (POD).');
        }

        if (load.totalMiles && load.totalMiles > 300) {
            if (!load.loadExpenses.some(e => ['FUEL_ADDITIVE', 'DEF'].includes(e.expenseType))) {
                anomalies.push(`High mileage load (${load.totalMiles.toFixed(0)} mi) has zero registered fuel expenses.`);
            }
        }

        if (load.readyForSettlement && (!load.revenue || load.revenue <= 0)) {
            anomalies.push('Load is marked for settlement but has zero revenue.');
        }

        return { hasAnomalies: anomalies.length > 0, anomalies };
    }
}
