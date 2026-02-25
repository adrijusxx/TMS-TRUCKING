/**
 * GET  /api/crm/settings/general  — Read CRM general settings
 * PATCH /api/crm/settings/general — Update CRM general settings (partial merge)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/route-helpers';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const settings = await prisma.companySettings.findUnique({
            where: { companyId },
            select: { generalSettings: true, notificationSettings: true },
        });

        const generalSettings = (settings?.generalSettings as any) || {};
        const notificationSettings = (settings?.notificationSettings as any) || {};

        return NextResponse.json({
            crm: generalSettings.crm || {},
            notifications: notificationSettings.crm || {},
        });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const body = await req.json();
        const { crm, notifications } = body;

        // Read current settings
        const current = await prisma.companySettings.findUnique({
            where: { companyId },
            select: { generalSettings: true, notificationSettings: true },
        });

        const currentGeneral = (current?.generalSettings as any) || {};
        const currentNotifications = (current?.notificationSettings as any) || {};

        // Build updated settings by merging
        const updates: any = {};

        if (crm !== undefined) {
            updates.generalSettings = {
                ...currentGeneral,
                crm: { ...(currentGeneral.crm || {}), ...crm },
            };
        }

        if (notifications !== undefined) {
            updates.notificationSettings = {
                ...currentNotifications,
                crm: { ...(currentNotifications.crm || {}), ...notifications },
            };
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No settings to update' }, { status: 400 });
        }

        await prisma.companySettings.upsert({
            where: { companyId },
            create: { companyId, ...updates },
            update: updates,
        });

        // Return updated settings
        const updated = await prisma.companySettings.findUnique({
            where: { companyId },
            select: { generalSettings: true, notificationSettings: true },
        });

        const updatedGeneral = (updated?.generalSettings as any) || {};
        const updatedNotifications = (updated?.notificationSettings as any) || {};

        return NextResponse.json({
            crm: updatedGeneral.crm || {},
            notifications: updatedNotifications.crm || {},
        });
    } catch (error) {
        return handleApiError(error);
    }
}
