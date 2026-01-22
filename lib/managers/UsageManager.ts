import { prisma } from '@/lib/prisma';
import { UsageMetric } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface UsageLimitResult {
    allowed: boolean;
    current: number;
    limit: number | null;
    remaining: number | null;
    metric: UsageMetric;
}

export interface UsageSummary {
    periodStart: Date;
    periodEnd: Date;
    loadsCreated: number;
    loadsLimit: number | null;
    invoicesGenerated: number;
    invoicesLimit: number | null;
    settlementsGenerated: number;
    settlementsLimit: number | null;
    documentsProcessed: number;
    documentsLimit: number | null;
    isFreeTier: boolean;
}

// Map UsageMetric enum to UsageRecord field names
const METRIC_TO_FIELD: Record<UsageMetric, keyof Pick<
    { loadsCreated: number; invoicesGenerated: number; settlementsGenerated: number; documentsProcessed: number },
    'loadsCreated' | 'invoicesGenerated' | 'settlementsGenerated' | 'documentsProcessed'
>> = {
    LOADS_CREATED: 'loadsCreated',
    INVOICES_GENERATED: 'invoicesGenerated',
    SETTLEMENTS_GENERATED: 'settlementsGenerated',
    DOCUMENTS_PROCESSED: 'documentsProcessed',
};

const METRIC_TO_LIMIT_FIELD: Record<UsageMetric, 'loadsLimit' | 'invoicesLimit' | 'settlementsLimit' | 'documentsLimit'> = {
    LOADS_CREATED: 'loadsLimit',
    INVOICES_GENERATED: 'invoicesLimit',
    SETTLEMENTS_GENERATED: 'settlementsLimit',
    DOCUMENTS_PROCESSED: 'documentsLimit',
};

// ============================================
// USAGE MANAGER
// ============================================

export class UsageManager {
    /**
     * Get or create the usage record for the current billing period
     */
    private static async getOrCreateCurrentPeriod(subscriptionId: string) {
        const now = new Date();
        const periodStart = startOfMonth(now);
        const periodEnd = endOfMonth(now);

        let usageRecord = await prisma.usageRecord.findUnique({
            where: {
                subscriptionId_periodStart: {
                    subscriptionId,
                    periodStart,
                },
            },
        });

        if (!usageRecord) {
            usageRecord = await prisma.usageRecord.create({
                data: {
                    subscriptionId,
                    periodStart,
                    periodEnd,
                },
            });
        }

        return usageRecord;
    }

    /**
     * Track usage for a specific metric
     */
    static async trackUsage(companyId: string, metric: UsageMetric): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        if (!subscription) {
            console.warn(`[UsageManager] No subscription found for company ${companyId}`);
            return;
        }

        // Skip tracking if usage-based billing is disabled
        if (!subscription.usageBased) {
            return;
        }

        const usageRecord = await this.getOrCreateCurrentPeriod(subscription.id);
        const field = METRIC_TO_FIELD[metric];

        await prisma.usageRecord.update({
            where: { id: usageRecord.id },
            data: {
                [field]: { increment: 1 },
            },
        });
    }

    /**
     * Check if a company can perform an action based on usage limits
     */
    static async checkLimit(companyId: string, metric: UsageMetric): Promise<UsageLimitResult> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        // No subscription = no limits (shouldn't happen, but safe default)
        if (!subscription) {
            return {
                allowed: true,
                current: 0,
                limit: null,
                remaining: null,
                metric,
            };
        }

        // Usage-based billing disabled = unlimited
        if (!subscription.usageBased) {
            return {
                allowed: true,
                current: 0,
                limit: null,
                remaining: null,
                metric,
            };
        }

        const limitField = METRIC_TO_LIMIT_FIELD[metric];
        const limit = subscription[limitField];

        // null limit = unlimited
        if (limit === null) {
            return {
                allowed: true,
                current: 0,
                limit: null,
                remaining: null,
                metric,
            };
        }

        const usageRecord = await this.getOrCreateCurrentPeriod(subscription.id);
        const field = METRIC_TO_FIELD[metric];
        const current = usageRecord[field];
        const remaining = Math.max(0, limit - current);

        return {
            allowed: current < limit,
            current,
            limit,
            remaining,
            metric,
        };
    }

    /**
     * Get complete usage summary for a company
     */
    static async getUsageSummary(companyId: string): Promise<UsageSummary | null> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        if (!subscription) {
            return null;
        }

        const usageRecord = await this.getOrCreateCurrentPeriod(subscription.id);

        return {
            periodStart: usageRecord.periodStart,
            periodEnd: usageRecord.periodEnd,
            loadsCreated: usageRecord.loadsCreated,
            loadsLimit: subscription.loadsLimit,
            invoicesGenerated: usageRecord.invoicesGenerated,
            invoicesLimit: subscription.invoicesLimit,
            settlementsGenerated: usageRecord.settlementsGenerated,
            settlementsLimit: subscription.settlementsLimit,
            documentsProcessed: usageRecord.documentsProcessed,
            documentsLimit: subscription.documentsLimit,
            isFreeTier: subscription.usageBased && subscription.loadsLimit !== null,
        };
    }

    /**
     * Check if a company can add more trucks
     */
    static async canAddTruck(companyId: string): Promise<{ allowed: boolean; current: number; limit: number | null }> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        if (!subscription || subscription.trucksLimit === null) {
            return { allowed: true, current: 0, limit: null };
        }

        const truckCount = await prisma.truck.count({
            where: { companyId, deletedAt: null },
        });

        return {
            allowed: truckCount < subscription.trucksLimit,
            current: truckCount,
            limit: subscription.trucksLimit,
        };
    }

    /**
     * Check if a company can add more drivers
     */
    static async canAddDriver(companyId: string): Promise<{ allowed: boolean; current: number; limit: number | null }> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        if (!subscription || subscription.driversLimit === null) {
            return { allowed: true, current: 0, limit: null };
        }

        const driverCount = await prisma.driver.count({
            where: { companyId, deletedAt: null },
        });

        return {
            allowed: driverCount < subscription.driversLimit,
            current: driverCount,
            limit: subscription.driversLimit,
        };
    }

    /**
     * Set usage limits for a subscription (used when changing plans)
     */
    static async setUsageLimits(
        companyId: string,
        limits: {
            loadsLimit?: number | null;
            invoicesLimit?: number | null;
            settlementsLimit?: number | null;
            documentsLimit?: number | null;
            trucksLimit?: number | null;
            driversLimit?: number | null;
            usageBased?: boolean;
        }
    ): Promise<void> {
        await prisma.subscription.update({
            where: { companyId },
            data: limits,
        });
    }
}
