'use strict';
import { z } from 'zod';

// =============================================================================
// STEP 1: ACCOUNT DETAILS
// =============================================================================

export const onboardingStep1Schema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name is too long'),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name is too long'),
    email: z.string()
        .email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
        .min(1, 'Please confirm your password'),
    turnstileToken: z.string()
        .min(1, 'Please complete the CAPTCHA verification'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;

// =============================================================================
// STEP 2: COMPANY DETAILS
// =============================================================================

export const onboardingStep2Schema = z.object({
    companyName: z.string()
        .min(1, 'Company name is required')
        .max(100, 'Company name is too long'),
    dotNumber: z.string()
        .min(1, 'DOT Number is required')
        .regex(/^\d+$/, 'DOT Number must contain only digits'),
    mcNumber: z.string()
        .min(1, 'MC Number is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
});

export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;

// =============================================================================
// STEP 3: IMPORT DATA (OPTIONAL)
// =============================================================================

export const importEntitySchema = z.enum([
    'drivers',
    'trucks',
    'trailers',
    'customers',
    'loads',
    'invoices',
    'settlements',
]);

export type ImportEntity = z.infer<typeof importEntitySchema>;

export const onboardingStep3Schema = z.object({
    skipImport: z.boolean().default(false),
    importedEntities: z.array(importEntitySchema).optional(),
    importedData: z.record(z.string(), z.array(z.any())).optional(),
});

export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;

// =============================================================================
// STEP 4: PLAN SELECTION (COMPLETE)
// =============================================================================

export const subscriptionPlanSchema = z.enum([
    'owner_operator',  // Free: 1 truck limit
    'trial',           // 14-day Pro trial with all modules
]);

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const onboardingStep4Schema = z.object({
    plan: subscriptionPlanSchema,
});

export type OnboardingStep4Input = z.infer<typeof onboardingStep4Schema>;

// =============================================================================
// COMBINED FULL REGISTRATION SCHEMA
// =============================================================================

export const fullOnboardingSchema = z.object({
    // Step 1
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(8),

    // Step 2
    companyName: z.string().min(1).max(100),
    dotNumber: z.string().min(1),
    mcNumber: z.string().min(1),
    phone: z.string().optional(),

    // Step 4
    plan: subscriptionPlanSchema,
});

export type FullOnboardingInput = z.infer<typeof fullOnboardingSchema>;

// =============================================================================
// ONBOARDING STATUS ENUM
// =============================================================================

export const onboardingStepEnum = z.enum(['1', '2', '3', '4', 'complete']);
export type OnboardingStep = z.infer<typeof onboardingStepEnum>;

// =============================================================================
// PLAN DETAILS FOR UI
// =============================================================================

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    description: string;
    features: string[];
    limitations?: string[];
    recommended?: boolean;
    badge?: string;
}

export const PLAN_OPTIONS: PlanDetails[] = [
    {
        id: 'owner_operator',
        name: 'Free Tier',
        description: 'Get started with monthly usage limits',
        features: [
            '10 Loads per month',
            '5 Invoices per month',
            '3 Settlements per month',
            '1 Truck, 2 Drivers max',
            'Document AI (5 scans/mo)',
        ],
        limitations: [
            'Usage resets monthly',
            'Upgrade when you need more',
        ],
        badge: 'Free Tier',
    },
    {
        id: 'trial',
        name: '14-Day Pro Trial',
        description: 'Experience unlimited access to TMS Pro',
        features: [
            'Unlimited loads & invoices',
            'Unlimited trucks & drivers',
            'Full Accounting module',
            'Full Safety & Compliance',
            'AI-powered dispatch',
        ],
        limitations: [
            'Trial expires after 14 days',
            'Downgrades to Free Tier after trial',
        ],
        recommended: true,
        badge: 'Full Access',
    },
];
