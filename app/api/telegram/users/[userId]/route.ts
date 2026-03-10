import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTelegramService } from '@/lib/services/TelegramService';
import { prisma } from '@/lib/prisma';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

/**
 * GET /api/telegram/users/[userId]
 * Get Telegram user profile information
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        const user = session.user as any;
        const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);
        const telegramService = getTelegramService(scope);
        const profile = await telegramService.getUserProfile(userId);

        // Check if this user is mapped to a driver (scoped)
        const driverMapping = await prisma.telegramDriverMapping.findFirst({
            where: { telegramId: userId, companyId: user.companyId, mcNumberId: scope.mcNumberId },
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
                driverMapping: (driverMapping && driverMapping.driver) ? {
                    driverId: driverMapping.driver.id,
                    driverName: driverMapping.driver.user ? `${driverMapping.driver.user.firstName} ${driverMapping.driver.user.lastName}` : 'Unknown',
                    currentTruck: driverMapping.driver.currentTruck?.truckNumber,
                } : null,
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
