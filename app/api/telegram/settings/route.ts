import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveTelegramScope, buildTelegramScopeWhere } from '@/lib/services/telegram/TelegramScopeResolver';

const DEFAULT_KEYWORDS = ['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt'];

/**
 * GET /api/telegram/settings
 * Get Telegram integration settings (scoped by company or MC)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const { searchParams } = new URL(request.url);
        const mcNumberId = searchParams.get('mcNumberId') || user.mcNumberId;
        const scope = await resolveTelegramScope(user.companyId, mcNumberId);
        const scopeWhere = buildTelegramScopeWhere(scope);

        let settings = await prisma.telegramSettings.findFirst({ where: scopeWhere });

        if (!settings) {
            settings = await prisma.telegramSettings.create({
                data: {
                    ...scopeWhere,
                    autoCreateCases: true,
                    aiAutoResponse: false,
                    requireStaffApproval: true,
                    confidenceThreshold: 0.8,
                    aiProvider: 'OPENAI',
                    businessHoursOnly: false,
                    timezone: 'America/Chicago',
                    emergencyKeywords: DEFAULT_KEYWORDS,
                },
            });
        }

        return NextResponse.json({ data: { ...settings, scopeMode: scope.mode } });
    } catch (error) {
        console.error('[API] Error fetching Telegram settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * PUT /api/telegram/settings
 * Update Telegram integration settings (scoped by company or MC)
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = session.user as any;
        const body = await request.json();
        const mcNumberId = body.mcNumberId || user.mcNumberId;
        const scope = await resolveTelegramScope(user.companyId, mcNumberId);
        const scopeWhere = buildTelegramScopeWhere(scope);

        const updateData: any = {
            autoCreateCases: body.autoCreateCases,
            aiAutoResponse: body.aiAutoResponse,
            requireStaffApproval: body.requireStaffApproval,
            confidenceThreshold: body.confidenceThreshold,
            aiProvider: body.aiProvider,
            businessHoursOnly: body.businessHoursOnly,
            businessHoursStart: body.businessHoursStart,
            businessHoursEnd: body.businessHoursEnd,
            timezone: body.timezone,
            emergencyKeywords: body.emergencyKeywords,
            autoAckMessage: body.autoAckMessage,
            caseCreatedMessage: body.caseCreatedMessage,
            afterHoursMessage: body.afterHoursMessage,
            emergencyContactNumber: body.emergencyContactNumber,
        };

        // telegramScope preference is only settable on the company-level row
        if (body.telegramScope && !scope.mcNumberId) {
            updateData.telegramScope = body.telegramScope;
        }

        // Find existing or create
        const existing = await prisma.telegramSettings.findFirst({ where: scopeWhere });
        let settings;
        if (existing) {
            settings = await prisma.telegramSettings.update({
                where: { id: existing.id },
                data: updateData,
            });
        } else {
            settings = await prisma.telegramSettings.create({
                data: {
                    ...scopeWhere,
                    ...updateData,
                    autoCreateCases: body.autoCreateCases ?? true,
                    aiAutoResponse: body.aiAutoResponse ?? false,
                    requireStaffApproval: body.requireStaffApproval ?? true,
                    confidenceThreshold: body.confidenceThreshold ?? 0.8,
                    aiProvider: body.aiProvider ?? 'OPENAI',
                    timezone: body.timezone ?? 'America/Chicago',
                    emergencyKeywords: body.emergencyKeywords ?? DEFAULT_KEYWORDS,
                },
            });
        }

        return NextResponse.json({ data: settings });
    } catch (error) {
        console.error('[API] Error updating Telegram settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
