import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/settings
 * Get Telegram integration settings for the company
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        let settings = await prisma.telegramSettings.findUnique({
            where: { companyId },
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.telegramSettings.create({
                data: {
                    companyId,
                    autoCreateCases: true,
                    aiAutoResponse: false,
                    requireStaffApproval: true,
                    confidenceThreshold: 0.8,
                    aiProvider: 'OPENAI',
                    businessHoursOnly: false,
                    timezone: 'America/Chicago',
                    emergencyKeywords: ['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt'],
                },
            });
        }

        return NextResponse.json({ data: settings });
    } catch (error) {
        console.error('[API] Error fetching Telegram settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/telegram/settings
 * Update Telegram integration settings
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const companyId = (session.user as any).companyId;
        const body = await request.json();

        const settings = await prisma.telegramSettings.upsert({
            where: { companyId },
            update: {
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
            },
            create: {
                companyId,
                autoCreateCases: body.autoCreateCases ?? true,
                aiAutoResponse: body.aiAutoResponse ?? false,
                requireStaffApproval: body.requireStaffApproval ?? true,
                confidenceThreshold: body.confidenceThreshold ?? 0.8,
                aiProvider: body.aiProvider ?? 'OPENAI',
                businessHoursOnly: body.businessHoursOnly ?? false,
                businessHoursStart: body.businessHoursStart,
                businessHoursEnd: body.businessHoursEnd,
                timezone: body.timezone ?? 'America/Chicago',
                emergencyKeywords: body.emergencyKeywords ?? ['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt'],
                autoAckMessage: body.autoAckMessage,
                caseCreatedMessage: body.caseCreatedMessage,
                afterHoursMessage: body.afterHoursMessage,
                emergencyContactNumber: body.emergencyContactNumber,
            },
        });

        return NextResponse.json({ data: settings });
    } catch (error) {
        console.error('[API] Error updating Telegram settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
