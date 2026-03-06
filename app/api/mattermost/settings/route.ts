import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mattermost/settings
 * Get Mattermost integration settings for the company
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;

        let settings = await prisma.mattermostSettings.findUnique({
            where: { companyId },
        });

        // Return null if not configured yet (settings are created via connection flow)
        if (!settings) {
            return NextResponse.json({ data: null });
        }

        return NextResponse.json({ data: settings });
    } catch (error) {
        console.error('[API] Error fetching Mattermost settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/mattermost/settings
 * Update Mattermost integration settings
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const companyId = (session.user as any).companyId;
        const body = await request.json();

        // Settings must already exist (created via connection flow)
        const existing = await prisma.mattermostSettings.findUnique({ where: { companyId } });
        if (!existing) {
            return NextResponse.json({ error: 'Mattermost not connected. Connect first.' }, { status: 400 });
        }

        const settings = await prisma.mattermostSettings.update({
            where: { companyId },
            data: {
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
                teamId: body.teamId,
                notificationChannelId: body.notificationChannelId,
            },
        });

        return NextResponse.json({ data: settings });
    } catch (error) {
        console.error('[API] Error updating Mattermost settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
