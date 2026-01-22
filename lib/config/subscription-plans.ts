import { SubscriptionModule } from '@prisma/client';

export const SUBSCRIPTION_PLANS = {
    FREE: 'starter-free',
    PRO: 'pro-monthly',
    ENTERPRISE: 'enterprise',
} as const;

// Plans that include access to ALL modules automatically
export const ALL_ACCESS_PLANS = [
    SUBSCRIPTION_PLANS.ENTERPRISE,
    SUBSCRIPTION_PLANS.PRO, // Pro Monthly now grants full access
    'pro-bundle', // Legacy or bundle identifier
    'premium',    // Potential alias
    'pro-trial-14day', // 14-day Pro Trial
];

export const MODULE_PRICES: Record<SubscriptionModule, string> = {
    FLEET: '$200/mo',
    ACCOUNTING: '$300/mo',
    SAFETY: '$200/mo',
    INTEGRATIONS: '$100/mo',
    AI_DISPATCH: '$150/mo',
    ANALYTICS: '$100/mo',
    HR: '$100/mo',
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
// USAGE-BASED FREE TIER LIMITS
// ============================================

export interface UsageLimits {
    loadsLimit: number | null;       // Monthly loads
    invoicesLimit: number | null;    // Monthly invoices
    settlementsLimit: number | null; // Monthly settlements
    documentsLimit: number | null;   // Monthly document AI scans
    trucksLimit: number | null;      // Max trucks
    driversLimit: number | null;     // Max drivers
}

/**
 * Free Tier: Usage-based limits
 * Users get X actions per month, then must upgrade
 */
export const FREE_TIER_LIMITS: UsageLimits = {
    loadsLimit: 10,           // 10 loads per month
    invoicesLimit: 5,         // 5 invoices per month
    settlementsLimit: 3,      // 3 settlements per month
    documentsLimit: 5,        // 5 document AI scans per month
    trucksLimit: 1,           // 1 truck max
    driversLimit: 2,          // 2 drivers max
};

/**
 * Pro Tier: Unlimited usage
 * null = unlimited
 */
export const PRO_TIER_LIMITS: UsageLimits = {
    loadsLimit: null,
    invoicesLimit: null,
    settlementsLimit: null,
    documentsLimit: null,
    trucksLimit: null,
    driversLimit: null,
};

/**
 * Get limits based on plan ID
 */
export function getLimitsForPlan(planId: string): UsageLimits {
    if (ALL_ACCESS_PLANS.includes(planId)) {
        return PRO_TIER_LIMITS;
    }
    return FREE_TIER_LIMITS;
}

/**
 * Human-readable limit descriptions for UI
 */
export const LIMIT_DESCRIPTIONS = {
    loadsLimit: 'Loads per month',
    invoicesLimit: 'Invoices per month',
    settlementsLimit: 'Settlements per month',
    documentsLimit: 'Document scans per month',
    trucksLimit: 'Maximum trucks',
    driversLimit: 'Maximum drivers',
};
