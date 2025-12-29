import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { samsaraSettingsSchema } from '@/lib/validations/integrations';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Permission check
        if (!hasPermission(session.user.role as any, 'settings.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const settings = await prisma.samsaraSettings.findUnique({
            where: { companyId: session.user.companyId },
        });

        if (!settings) {
            // Return defaults if not found
            return NextResponse.json({
                success: true,
                data: {
                    apiToken: '',
                    autoSyncDrivers: false,
                    autoSyncVehicles: false,
                    syncIntervalMinutes: 60,
                },
            });
        }

        // Mask API token for security
        const maskedSettings = {
            ...settings,
            apiToken: settings.apiToken ? '•'.repeat(20) : '',
            // In a real app, we'd never send the full token back. 
            // The frontend would only send a new token to update.
        };

        return NextResponse.json({
            success: true,
            data: maskedSettings,
        });
    } catch (error) {
        console.error('Error fetching Samsara settings:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Handle partial token updates:
        // If apiToken is all dots, it means user didn't change it, so we shouldn't update it to '•••••'
        // But Zod expects a string. We'll handle this logic before validation or by checking existing.

        // Simplification: We blindly validate, but we check if input matches mask.
        let dataToValidate = { ...body };
        const isMasked = body.apiToken && /^[•]+$/.test(body.apiToken);

        if (isMasked) {
            // If masked, we need to fetch existing to pass validation if we were strict,
            // or just accept it and NOT update the field in DB.
            // Let's validate without token first if masked.
            // Actually, easiest way is: if masked, don't update apiToken field.
        }

        const validated = samsaraSettingsSchema.parse(body);

        // Prepare update data
        const updateData: any = {
            autoSyncDrivers: validated.autoSyncDrivers,
            autoSyncVehicles: validated.autoSyncVehicles,
            syncIntervalMinutes: validated.syncIntervalMinutes,
        };

        // Only update token if it's NOT the mask
        if (!isMasked && validated.apiToken) {
            updateData.apiToken = validated.apiToken;
        }

        const settings = await prisma.samsaraSettings.upsert({
            where: { companyId: session.user.companyId },
            create: {
                companyId: session.user.companyId,
                apiToken: validated.apiToken || '', // Encrypt in real app
                autoSyncDrivers: validated.autoSyncDrivers,
                autoSyncVehicles: validated.autoSyncVehicles,
                syncIntervalMinutes: validated.syncIntervalMinutes,
            },
            update: updateData,
        });

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
                { status: 400 }
            );
        }
        console.error('Error updating Samsara settings:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } },
            { status: 500 }
        );
    }
}
