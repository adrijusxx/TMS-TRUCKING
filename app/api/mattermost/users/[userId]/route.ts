import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMattermostQueryService } from '@/lib/services/MattermostQueryService';

/**
 * GET /api/mattermost/users/[userId]
 * Get Mattermost user profile with driver mapping
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        const queryService = getMattermostQueryService();
        const profile = await queryService.getUserProfile(userId);

        // Check if this user is mapped to a driver
        const driverMapping = await prisma.mattermostDriverMapping.findUnique({
            where: { mattermostUserId: userId },
            include: {
                driver: {
                    include: {
                        user: true,
                        currentTruck: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...profile,
                driverMapping: driverMapping?.driver
                    ? {
                        driverId: driverMapping.driver.id,
                        driverName: driverMapping.driver.user
                            ? `${driverMapping.driver.user.firstName} ${driverMapping.driver.user.lastName}`
                            : 'Unknown',
                        currentTruck: driverMapping.driver.currentTruck?.truckNumber,
                    }
                    : null,
            },
        });
    } catch (error: any) {
        console.error('[API] Error fetching user profile:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
