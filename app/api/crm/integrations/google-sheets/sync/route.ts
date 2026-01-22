import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { processCrmIntegration } from '@/lib/services/crm-import';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// POST /api/crm/integrations/google-sheets/sync
// Body: { integrationId: string }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { integrationId } = body;

        if (!integrationId) {
            return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
        }

        // Verify user has access to the MC number associated with this integration
        const integration = await prisma.crmIntegration.findUnique({
            where: { id: integrationId },
            include: { mcNumber: true }
        });

        if (!integration) {
            return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
        }

        // Check MC access
        if (session.user.role !== 'SUPER_ADMIN') {
            // Verify access to this MC
            const canAccessMc = (session.user?.mcAccess?.includes(integration.mcNumberId)) ||
                (session.user.role === 'ADMIN' && integration.mcNumber.companyId === session.user.companyId);

            if (!canAccessMc) {
                return NextResponse.json({ error: 'Unauthorized access to this integration' }, { status: 403 });
            }
        }

        // Run sync
        const result = await processCrmIntegration(integrationId, session.user.id);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('[CRM Sync POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync' },
            { status: 500 }
        );
    }
}
