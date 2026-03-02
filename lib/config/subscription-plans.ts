import { SubscriptionModule } from '@prisma/client';

// ============================================
// PLAN IDENTIFIERS
// ============================================

export const SUBSCRIPTION_PLANS = {
    FREE: 'starter-free',
    PRO: 'pro-monthly',
    ENTERPRISE: 'enterprise',
} as const;

/** Plans that include access to ALL modules with unlimited usage */
export const ALL_ACCESS_PLANS = [
    SUBSCRIPTION_PLANS.ENTERPRISE,
    SUBSCRIPTION_PLANS.PRO,
    'pro-bundle',
    'premium',
    'pro-trial-14day',
];

// ============================================
// PRICING (amounts in cents for Stripe)
// ============================================

/** $15 per truck per month */
export const PRO_PRICE_PER_TRUCK = 1500;

/** Core modules included in all plans (free + pro) */
export const CORE_MODULES: SubscriptionModule[] = [
    'FLEET', 'ACCOUNTING', 'SAFETY', 'HR', 'INTEGRATIONS',
];

/** Premium add-ons with separate pricing */
export const PREMIUM_MODULES: SubscriptionModule[] = [
    'AI_DISPATCH', 'ANALYTICS',
];

/** Premium add-on prices in cents */
export const PREMIUM_ADDON_PRICES: Partial<Record<SubscriptionModule, number>> = {
    AI_DISPATCH: 5000,  // $50/mo
    ANALYTICS: 5000,    // $50/mo
};

/** Display prices for all modules */
export const MODULE_PRICES: Record<SubscriptionModule, string> = {
    FLEET: 'Included',
    ACCOUNTING: 'Included',
    SAFETY: 'Included',
    INTEGRATIONS: 'Included',
    HR: 'Included',
    AI_DISPATCH: '$50/mo',
    ANALYTICS: '$50/mo',
};

export const MODULE_NAMES: Record<SubscriptionModule, string> = {
    FLEET: 'Fleet Management',
    ACCOUNTING: 'Accounting & Finance',
    SAFETY: 'Safety & Compliance',
    INTEGRATIONS: 'Connect & Integrations',
    AI_DISPATCH: 'AI Dispatch',
    ANALYTICS: 'Analytics',
    HR: 'Human Resources',
};

export const MODULE_DESCRIPTIONS: Record<SubscriptionModule, string> = {
    FLEET: 'Advanced fleet management, tracking, and maintenance tools.',
    ACCOUNTING: 'Complete financial suite including invoices, settlements, and QuickBooks sync.',
    SAFETY: 'Compliance tracking, driver files, and incident management.',
    INTEGRATIONS: 'Connect with Samsara, ELD providers, and external load boards.',
    AI_DISPATCH: 'AI-powered load optimization and automated dispatching.',
    ANALYTICS: 'Comprehensive reporting and business intelligence dashboards.',
    HR: 'Driver evaluations, performance tracking, and personnel management.',
};

// ============================================
// USAGE-BASED TIER LIMITS
// ============================================

export interface UsageLimits {
    loadsLimit: number | null;
    invoicesLimit: number | null;
    settlementsLimit: number | null;
    documentsLimit: number | null;
    trucksLimit: number | null;
    driversLimit: number | null;
}

/** Free Tier: generous limits to hook small fleets */
export const FREE_TIER_LIMITS: UsageLimits = {
    loadsLimit: 25,
    invoicesLimit: 10,
    settlementsLimit: 5,
    documentsLimit: 10,
    trucksLimit: 3,
    driversLimit: 5,
};

/** Pro Tier: unlimited (null = no limit) */
export const PRO_TIER_LIMITS: UsageLimits = {
    loadsLimit: null,
    invoicesLimit: null,
    settlementsLimit: null,
    documentsLimit: null,
    trucksLimit: null,
    driversLimit: null,
};

/** Get limits based on plan ID */
export function getLimitsForPlan(planId: string): UsageLimits {
    if (ALL_ACCESS_PLANS.includes(planId)) {
        return PRO_TIER_LIMITS;
    }
    return FREE_TIER_LIMITS;
}

/** Human-readable limit descriptions for UI */
export const LIMIT_DESCRIPTIONS = {
    loadsLimit: 'Loads per month',
    invoicesLimit: 'Invoices per month',
    settlementsLimit: 'Settlements per month',
    documentsLimit: 'Document scans per month',
    trucksLimit: 'Maximum trucks',
    driversLimit: 'Maximum drivers',
};
