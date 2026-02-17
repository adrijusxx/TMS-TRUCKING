import { prisma } from '@/lib/prisma';

export class SettlementWorkflowManager {
    /**
     * Submit settlement for approval
     */
    async submitForApproval(settlementId: string): Promise<any> {
        return await prisma.settlement.update({
            where: { id: settlementId },
            data: { approvalStatus: 'UNDER_REVIEW' },
        });
    }

    /**
     * Approve settlement
     */
    async approveSettlement(
        settlementId: string,
        approverId: string,
        notes?: string
    ): Promise<any> {
        const settlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                approvalStatus: 'APPROVED',
                approvedById: approverId,
                approvedAt: new Date(),
                status: 'APPROVED',
            },
        });

        await prisma.settlementApproval.create({
            data: {
                settlementId,
                status: 'APPROVED',
                approvedById: approverId,
                notes,
            },
        });

        // UPDATE STOP LIMIT BALANCES
        const deductionItems = await prisma.settlementDeduction.findMany({
            where: { settlementId },
        });

        for (const item of deductionItems) {
            // Only track progress for deductions, not additions (bonuses, overtime, etc.)
            if (item.category === 'addition') continue;
            const meta = item.metadata as Record<string, any> | null;
            if (meta?.deductionRuleId) {
                await prisma.deductionRule.update({
                    where: { id: meta.deductionRuleId },
                    data: { currentAmount: { increment: item.amount } },
                });
            }
        }

        return settlement;
    }

    /**
     * Reject settlement
     */
    async rejectSettlement(
        settlementId: string,
        approverId: string,
        reason: string
    ): Promise<any> {
        const settlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                approvalStatus: 'REJECTED',
                approvedById: approverId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
        });

        await prisma.settlementApproval.create({
            data: {
                settlementId,
                status: 'REJECTED',
                approvedById: approverId,
                notes: reason,
            },
        });

        return settlement;
    }

    /**
     * Mark settlement as paid
     */
    async processPayment(
        settlementId: string,
        paymentMethod: string,
        paymentReference?: string
    ): Promise<any> {
        return await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                status: 'PAID',
                paidDate: new Date(),
                paymentMethod: paymentMethod as any,
                paymentReference,
            },
        });
    }

    /**
     * Get settlements pending approval
     */
    async getPendingApprovals(mcWhere: Record<string, any>): Promise<any[]> {
        return await prisma.settlement.findMany({
            where: {
                driver: {
                    ...mcWhere,
                    deletedAt: null
                },
                approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] },
            },
            include: {
                driver: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
                deductionItems: true,
            },
            orderBy: { calculatedAt: 'asc' },
        });
    }

    /**
     * Get settlement breakdown
     */
    async getSettlementBreakdown(settlementId: string): Promise<any> {
        return await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: {
                driver: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
                deductionItems: {
                    include: {
                        fuelEntry: true,
                        driverAdvance: true,
                        loadExpense: true,
                    },
                },
                driverAdvances: true,
                loadExpenses: true,
                approvalHistory: {
                    include: {
                        approvedBy: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
}
