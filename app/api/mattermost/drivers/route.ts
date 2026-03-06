import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mattermost/drivers
 * Get list of drivers with Mattermost mappings
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        const mappings = await prisma.mattermostDriverMapping.findMany({
            where: {
                driver: { companyId },
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true, phone: true },
                        },
                        currentTruck: {
                            select: { truckNumber: true },
                        },
                    },
                },
            },
            orderBy: { registeredAt: 'desc' },
        });

        return NextResponse.json({ data: mappings });
    } catch (error) {
        console.error('[API] Error fetching driver mappings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch driver mappings' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/mattermost/drivers
 * Create a new driver-Mattermost mapping
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;
        const body = await request.json();
        const { driverId, mattermostUserId, username, email, firstName, lastName } = body;

        if (!driverId || !mattermostUserId) {
            return NextResponse.json(
                { error: 'driverId and mattermostUserId are required' },
                { status: 400 }
            );
        }

        // Check if mapping already exists
        const existing = await prisma.mattermostDriverMapping.findUnique({
            where: { mattermostUserId },
        });

        if (existing && existing.driverId && existing.driverId !== driverId) {
            return NextResponse.json(
                { error: 'Mattermost user already mapped to another driver. Unlink first.' },
                { status: 400 }
            );
        }

        const mapping = existing
            ? await prisma.mattermostDriverMapping.update({
                where: { mattermostUserId },
                data: { driverId, username, email, firstName, lastName, isActive: true },
                include: {
                    driver: {
                        include: {
                            user: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
            })
            : await prisma.mattermostDriverMapping.create({
                data: { driverId, mattermostUserId, username, email, firstName, lastName, isActive: true },
                include: {
                    driver: {
                        include: {
                            user: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
            });

        // Auto-unignore: remove from ignore list if previously ignored
        await prisma.messagingIgnoredContact.deleteMany({
            where: { companyId, platform: 'MATTERMOST', externalId: mattermostUserId },
        });

        return NextResponse.json({ data: mapping });
    } catch (error) {
        console.error('[API] Error creating driver mapping:', error);
        return NextResponse.json(
            { error: 'Failed to create driver mapping' },
            { status: 500 }
        );
    }
}
