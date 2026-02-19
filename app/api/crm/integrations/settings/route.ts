import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/crm/integrations/settings
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { mcNumberId, type, enabled, config, syncInterval } = body;

        if (!mcNumberId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check permissions
        if (session.user.role !== 'SUPER_ADMIN') {
            const canAccess = (session.user.mcAccess && session.user.mcAccess.includes(mcNumberId)) ||
                (session.user.role === 'ADMIN' && session.user.companyId === (await prisma.mcNumber.findUnique({ where: { id: mcNumberId }, select: { companyId: true } }))?.companyId);

            if (!canAccess) {
                return NextResponse.json({ error: 'Unauthorized access to MC number' }, { status: 403 });
            }
        }

        // Upsert integration
        const integration = await prisma.crmIntegration.upsert({
            where: {
                mcNumberId_type: {
                    mcNumberId,
                    type
                }
            },
            update: {
                enabled,
                config,
                ...(syncInterval !== undefined && { syncInterval: syncInterval || null }),
            },
            create: {
                mcNumberId,
                type,
                enabled,
                config,
                ...(syncInterval !== undefined && { syncInterval: syncInterval || null }),
            }
        });

        return NextResponse.json({ success: true, data: integration });

    } catch (error: any) {
        console.error('[CRM Settings POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save settings' },
            { status: 500 }
        );
    }
}
