import { prisma } from '@/lib/prisma';
import { SubscriptionModule, SubscriptionStatus } from '@prisma/client';
import { ALL_ACCESS_PLANS } from '@/lib/config/subscription-plans';

// Plans where users get all module access (with usage limits enforced at action level)
const FREE_TIER_PLANS = [
    'owner-operator-free',
    'starter-free',
];

export type PlanDetails = {
    planId: string;
    status: SubscriptionStatus;
    modules: SubscriptionModule[];
    isFreemium: boolean;
};

export class SubscriptionManager {
    /**
     * Check if a company has access to a specific feature module.
     * 
     * USAGE-BASED MODEL:
     * - All tiers (free + pro) have access to all modules
     * - Usage limits are enforced at the action level (see UsageManager)
     * - Only CANCELED/PAST_DUE subscriptions are denied access
     */
    static async hasFeature(companyId: string, module: SubscriptionModule): Promise<boolean> {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
            include: { addOns: true },
        });

        if (!subscription) {
            // No subscription = default free tier, still has module access
            // Usage limits will be enforced at action level
            return true;
        }

        // Block access for canceled/past due subscriptions
        if (subscription.status === 'CANCELED' || subscription.status === 'PAST_DUE') {
            return false;
        }

        // All active subscriptions (FREE, TRIALING, ACTIVE, OWNER_OPERATOR) get full module access
        // Usage limits are enforced separately via UsageManager
        if (ALL_ACCESS_PLANS.includes(subscription.planId)) {
            return true;
        }

        // Free tier plans also get all module access (with usage limits)
        if (FREE_TIER_PLANS.includes(subscription.planId)) {
            return true;
        }

        // Default: Check for manual override by Super Admin
        if (subscription.manualOverride && subscription.manualModules) {
            return subscription.manualModules.includes(module);
        }

        // Check if module is enabled in add-ons
        const hasAddon = subscription.addOns.some((addon) => addon.module === module && addon.isActive);
        if (hasAddon) {
            return true;
        }

        // Default to true for usage-based model - all users get access
        // They'll hit limits when trying to take actions
        return true;
    }


    /**
     * Get full subscription details for a company.
     * 
     * USAGE-BASED MODEL: All users get access to all modules
     */
    static async getPlanDetails(companyId: string): Promise<PlanDetails> {
        // All available modules - free tier gets all of them
        const allModules: SubscriptionModule[] = [
            'FLEET', 'ACCOUNTING', 'SAFETY', 'INTEGRATIONS',
            'AI_DISPATCH', 'ANALYTICS', 'HR'
        ];

        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
            include: { addOns: true },
        });

        if (!subscription) {
            return {
                planId: 'starter-free',
                status: 'FREE',
                modules: allModules, // Free tier gets all modules
                isFreemium: true,
            };
        }

        // For usage-based model, all plans get all modules
        const isFreeTier = FREE_TIER_PLANS.includes(subscription.planId);
        const isProTier = ALL_ACCESS_PLANS.includes(subscription.planId);

        // All tiers get all modules in usage-based model
        let activeModules = allModules;

        // Include manual modules if override is active (for custom setups)
        if (subscription.manualOverride && subscription.manualModules) {
            activeModules = Array.from(new Set([...activeModules, ...subscription.manualModules]));
        }

        return {
            planId: subscription.planId,
            status: subscription.status,
            modules: activeModules,
            isFreemium: isFreeTier,
        };
    }


    /**
     * Ensure a default FREE subscription exists for a company.
     * Sets up usage-based limits for free tier.
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
                    currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
                    // Usage-based free tier limits
                    usageBased: true,
                    loadsLimit: 10,
                    invoicesLimit: 5,
                    settlementsLimit: 3,
                    documentsLimit: 5,
                    trucksLimit: 1,
                    driversLimit: 2,
                },
            });
        }
    }
}

