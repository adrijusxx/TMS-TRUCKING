import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { quickBooksSettingsSchema } from '@/lib/validations/integrations';
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

        if (!hasPermission(session.user as any, 'settings.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const settings = await prisma.quickBooksSettings.findUnique({
            where: { companyId: session.user.companyId },
        });

        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    realmId: '',
                    qboEnvironment: 'SANDBOX',
                    autoSyncInvoices: false,
                    autoSyncCustomers: false,
                    isConnected: false,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                realmId: settings.realmId,
                qboEnvironment: settings.qboEnvironment,
                autoSyncInvoices: settings.autoSyncInvoices,
                autoSyncCustomers: settings.autoSyncCustomers,
                isConnected: !!settings.accessToken, // Don't return tokens
            },
        });
    } catch (error) {
        console.error('Error fetching QuickBooks settings:', error);
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

        if (!hasPermission(session.user as any, 'settings.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validated = quickBooksSettingsSchema.parse(body);

        const settings = await prisma.quickBooksSettings.upsert({
            where: { companyId: session.user.companyId },
            create: {
                companyId: session.user.companyId,
                realmId: validated.realmId,
                qboEnvironment: validated.qboEnvironment,
                autoSyncInvoices: validated.autoSyncInvoices,
                autoSyncCustomers: validated.autoSyncCustomers,
                accessToken: '', // Initially empty, populated via OAuth callback
                refreshToken: '',
            },
            update: {
                realmId: validated.realmId,
                qboEnvironment: validated.qboEnvironment,
                autoSyncInvoices: validated.autoSyncInvoices,
                autoSyncCustomers: validated.autoSyncCustomers,
            },
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
        console.error('Error updating QuickBooks settings:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } },
            { status: 500 }
        );
    }
}
