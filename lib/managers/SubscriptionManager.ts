import { prisma } from '@/lib/prisma';
import { SubscriptionModule, SubscriptionStatus } from '@prisma/client';
import { ALL_ACCESS_PLANS } from '@/lib/config/subscription-plans';

export type PlanDetails = {
    planId: string;
    status: SubscriptionStatus;
    modules: SubscriptionModule[];
    isFreemium: boolean;
};

export class SubscriptionManager {
    /**
     * Check if a company has access to a specific feature module.
     * Caches results could be implemented here for performance.
     */
    static async hasFeature(companyId: string, module: SubscriptionModule): Promise<boolean> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
            include: { addOns: true },
        });

        if (!subscription) {
            // Default to FREE plan logic
            // If the module is part of the FREE core, return true.
            // Currently, we assume modules listed in Enum are PAID add-ons.
            // So if it's a module, it's likely paid.
            return false;
        }

        if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING' && subscription.status !== 'FREE') {
            return false;
        }

        // Check if plan grants all access
        if (ALL_ACCESS_PLANS.includes(subscription.planId)) {
            return true;
        }

        // Check for manual override by Super Admin
        if (subscription.manualOverride && subscription.manualModules) {
            return subscription.manualModules.includes(module);
        }

        // Check if module is enabled in add-ons
        return subscription.addOns.some((addon) => addon.module === module && addon.isActive);
    }

    /**
     * Get full subscription details for a company.
     */
    static async getPlanDetails(companyId: string): Promise<PlanDetails> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
            include: { addOns: true },
        });

        if (!subscription) {
            return {
                planId: 'starter-free',
                status: 'FREE',
                modules: [],
                isFreemium: true,
            };
        }

        let activeModules = subscription.addOns.filter(a => a.isActive).map(a => a.module);

        // Include manual modules if override is active
        if (subscription.manualOverride && subscription.manualModules) {
            // Merge unique modules
            activeModules = Array.from(new Set([...activeModules, ...subscription.manualModules]));
        }

        return {
            planId: subscription.planId,
            status: subscription.status,
            modules: activeModules,
            isFreemium: subscription.planId === 'starter-free',
        };
    }

    /**
     * Ensure a default FREE subscription exists for a company.
     * Useful for initialization.
     */
    static async ensureSubscription(companyId: string) {
        const existing = await prisma.subscription.findUnique({ where: { companyId } });
        if (!existing) {
            await prisma.subscription.create({
                data: {
                    companyId,
                    planId: 'starter-free',
                    status: 'FREE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Indefinite
                },
            });
        }
    }
}
