import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/drivers
 * Get list of drivers with Telegram mappings
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        const mappings = await prisma.telegramDriverMapping.findMany({
            where: {
                driver: {
                    companyId,
                },
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                        currentTruck: {
                            select: {
                                truckNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                registeredAt: 'desc',
            },
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
 * POST /api/telegram/drivers
 * Create a new driver-Telegram mapping
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { driverId, telegramId, username, phoneNumber, firstName, lastName } = body;

        if (!driverId || !telegramId) {
            return NextResponse.json(
                { error: 'driverId and telegramId are required' },
                { status: 400 }
            );
        }

        // Check if mapping already exists — update it if no driver linked yet, or if relinking
        const existing = await prisma.telegramDriverMapping.findUnique({
            where: { telegramId },
        });

        if (existing && existing.driverId && existing.driverId !== driverId) {
            return NextResponse.json(
                { error: 'Telegram ID already mapped to another driver. Unlink first.' },
                { status: 400 }
            );
        }

        const mapping = existing
            ? await prisma.telegramDriverMapping.update({
                where: { telegramId },
                data: { driverId, username, phoneNumber, firstName, lastName, isActive: true },
                include: {
                    driver: {
                        include: {
                            user: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
            })
            : await prisma.telegramDriverMapping.create({
                data: { driverId, telegramId, username, phoneNumber, firstName, lastName, isActive: true },
                include: {
                    driver: {
                        include: {
                            user: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
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
