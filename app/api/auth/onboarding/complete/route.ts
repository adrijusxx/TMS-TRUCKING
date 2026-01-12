import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { onboardingStep4Schema, type SubscriptionPlan } from '@/lib/validations/onboarding';
import { addDays } from 'date-fns';

/**
 * POST /api/auth/onboarding/complete
 * 
 * Step 4: Complete registration with plan selection.
 * Sets subscription status and finalizes onboarding.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validated = onboardingStep4Schema.parse(body);

        // Get user and company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true },
        });

        if (!user || !user.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'User or company not found' } },
                { status: 404 }
            );
        }

        // Determine subscription settings based on plan
        const planConfig = getPlanConfig(validated.plan);

        // Update company with subscription settings
        await prisma.company.update({
            where: { id: user.companyId },
            data: {
                subscriptionStatus: planConfig.status,
                trialEndsAt: planConfig.trialEndsAt,
                truckLimit: planConfig.truckLimit,
                onboardingComplete: true,
                isReadOnly: false,
            },
        });

        // Update user onboarding status
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                onboardingStep: 4,
                onboardingComplete: true,
            },
        });

        // Update subscription record
        await prisma.subscription.updateMany({
            where: { companyId: user.companyId },
            data: {
                status: planConfig.status,
                planId: planConfig.planId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: planConfig.trialEndsAt || new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                plan: validated.plan,
                subscriptionStatus: planConfig.status,
                trialEndsAt: planConfig.trialEndsAt,
            },
        });
    } catch (error) {
        console.error('[Onboarding Complete] Error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to complete registration' } },
            { status: 500 }
        );
    }
}

/**
 * Get subscription configuration based on selected plan
 */
function getPlanConfig(plan: SubscriptionPlan) {
    switch (plan) {
        case 'owner_operator':
            return {
                status: 'OWNER_OPERATOR' as const,
                planId: 'owner-operator-free',
                truckLimit: 1,
                trialEndsAt: null,
            };
        case 'trial':
            return {
                status: 'TRIALING' as const,
                planId: 'pro-trial-14day',
                truckLimit: 999, // Unlimited during trial
                trialEndsAt: addDays(new Date(), 14),
            };
        default:
            return {
                status: 'FREE' as const,
                planId: 'free',
                truckLimit: 1,
                trialEndsAt: null,
            };
    }
}
