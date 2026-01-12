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
