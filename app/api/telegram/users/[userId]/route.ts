import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTelegramService } from '@/lib/services/TelegramService';
import { prisma } from '@/lib/prisma';

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

        const telegramService = getTelegramService();
        const profile = await telegramService.getUserProfile(userId);

        // Check if this user is mapped to a driver
        const driverMapping = await prisma.telegramDriverMapping.findUnique({
            where: { telegramId: userId },
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
                driverMapping: driverMapping ? {
                    driverId: driverMapping.driver.id,
                    driverName: `${driverMapping.driver.user.firstName} ${driverMapping.driver.user.lastName}`,
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
