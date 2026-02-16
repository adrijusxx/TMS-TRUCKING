import { prisma } from '@/lib/prisma';

/**
 * InvoiceAuditService
 * 
 * Handles auditing logic to detect revenue leaks and settlement parity.
 */
export class InvoiceAuditService {
    /**
     * Money Trace Audit: Ensure delivered loads are invoiced or held.
     */
    static async checkInvoicingCompleteness(companyId: string, mcNumberId?: string) {
        const loads = await prisma.load.findMany({
            where: {
                companyId, mcNumberId, deletedAt: null,
                status: 'DELIVERED', isBillingHold: false,
                invoices: { none: {} },
                rateConfirmation: { isNot: null }
            },
            select: { loadNumber: true }
        });
        return { orphanCount: loads.length, orphanLoadNumbers: loads.map(l => l.loadNumber) };
    }

    /**
     * Financial Parity Audit: Check for Invoiced loads not yet settled.
     */
    static async checkSettlementParity(companyId: string, mcNumberId?: string) {
        const loads = await prisma.load.findMany({
            where: {
                companyId, mcNumberId, deletedAt: null,
                invoices: { some: { status: { in: ['SENT', 'PAID', 'PARTIAL'] } } },
                driverId: { not: null }, readyForSettlement: true,
            },
            select: { id: true, loadNumber: true }
        });

        const settledLoadIds = await prisma.settlement.findMany({
            where: { driver: { companyId } }, select: { loadIds: true }
        });
        const allSettledIds = new Set(settledLoadIds.flatMap(s => (s as any).loadIds));
        const unsettledLoads = loads.filter(l => !allSettledIds.has(l.id));

        return { unsettledCount: unsettledLoads.length, unsettledLoadNumbers: unsettledLoads.map(l => l.loadNumber) };
    }
}
