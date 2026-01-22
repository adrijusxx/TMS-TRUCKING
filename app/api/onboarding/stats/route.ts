import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { McStateManager } from '@/lib/managers/McStateManager';

/**
 * Get entity counts for onboarding progress tracking
 * Returns counts for customers, drivers, trucks, trailers, and loads
 */
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const mcWhere = await McStateManager.buildMcNumberWhereClause(session, request);
        const baseWhere = { ...mcWhere, deletedAt: null };

        // Fetch all counts in parallel for performance
        const [customers, drivers, trucks, trailers, loads] = await Promise.all([
            prisma.customer.count({ where: baseWhere }),
            prisma.driver.count({ where: { ...baseWhere, isActive: true } }),
            prisma.truck.count({ where: baseWhere }),
            prisma.trailer.count({ where: baseWhere }),
            prisma.load.count({ where: baseWhere }),
        ]);

        // Calculate completion status
        const hasCustomers = customers > 0;
        const hasDrivers = drivers > 0;
        const hasTrucks = trucks > 0;
        const hasTrailers = trailers > 0;
        const hasLoads = loads > 0;

        // Determine recommended next step based on dependencies
        let recommendedStep: string | null = null;
        if (!hasCustomers) {
            recommendedStep = 'customers';
        } else if (!hasDrivers) {
            recommendedStep = 'drivers';
        } else if (!hasTrucks) {
            recommendedStep = 'trucks';
        } else if (!hasTrailers) {
            recommendedStep = 'trailers';
        } else if (!hasLoads) {
            recommendedStep = 'loads';
        }

        // Calculate overall progress
        const completedSteps = [hasCustomers, hasDrivers, hasTrucks, hasTrailers, hasLoads].filter(Boolean).length;
        const progressPercent = Math.round((completedSteps / 5) * 100);

        return NextResponse.json({
            success: true,
            data: {
                counts: { customers, drivers, trucks, trailers, loads },
                completion: { hasCustomers, hasDrivers, hasTrucks, hasTrailers, hasLoads },
                recommendedStep,
                progressPercent,
                isComplete: completedSteps === 5,
            },
        });
    } catch (error) {
        console.error('Onboarding stats fetch error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
            { status: 500 }
        );
    }
}
