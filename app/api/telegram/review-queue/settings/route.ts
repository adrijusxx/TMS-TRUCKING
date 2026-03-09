import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
    dismissedAutoCleanupDays: z.number().min(0).max(365).optional(),
    dismissedCountLimit: z.number().min(0).max(10000).optional(),
});

/**
 * GET /api/telegram/review-queue/settings
 * Read auto-cleanup configuration
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;
        const settings = await prisma.companySettings.findUnique({
            where: { companyId },
            select: { generalSettings: true },
        });

        const general = (settings?.generalSettings as any) || {};
        return NextResponse.json({
            success: true,
            data: {
                dismissedAutoCleanupDays: general?.telegram?.dismissedAutoCleanupDays || 0,
                dismissedCountLimit: general?.telegram?.dismissedCountLimit ?? 250,
            },
        });
    } catch (error) {
        console.error('[API] Error fetching review queue settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * PATCH /api/telegram/review-queue/settings
 * Update auto-cleanup configuration (admin only)
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const parsed = settingsSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }

        const companyId = user.companyId;
        const existing = await prisma.companySettings.findUnique({ where: { companyId } });
        const general = (existing?.generalSettings as any) || {};
        const telegram = general.telegram || {};
        if (parsed.data.dismissedAutoCleanupDays !== undefined)
            telegram.dismissedAutoCleanupDays = parsed.data.dismissedAutoCleanupDays;
        if (parsed.data.dismissedCountLimit !== undefined)
            telegram.dismissedCountLimit = parsed.data.dismissedCountLimit;

        await prisma.companySettings.upsert({
            where: { companyId },
            update: { generalSettings: { ...general, telegram } },
            create: { companyId, generalSettings: { telegram } },
        });

        return NextResponse.json({ success: true, data: parsed.data });
    } catch (error) {
        console.error('[API] Error updating review queue settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
