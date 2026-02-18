import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const DEFAULT_SLA: Record<string, number> = {
    NEW: 2, CONTACTED: 5, QUALIFIED: 7,
    DOCUMENTS_PENDING: 10, DOCUMENTS_COLLECTED: 5,
    INTERVIEW: 7, OFFER: 5,
};

// GET /api/crm/sla-config — Get SLA config for the company
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.recruitingSLAConfig.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { status: 'asc' },
        });

        // If no configs exist, return defaults
        if (configs.length === 0) {
            const defaults = Object.entries(DEFAULT_SLA).map(([status, maxDays]) => ({
                id: null,
                status,
                maxDays,
                enabled: true,
            }));
            return NextResponse.json({ configs: defaults, isDefault: true });
        }

        return NextResponse.json({ configs, isDefault: false });
    } catch (error) {
        console.error('[SLA Config GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch SLA config' }, { status: 500 });
    }
}

// PUT /api/crm/sla-config — Upsert SLA config
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { configs } = await request.json();

        if (!Array.isArray(configs)) {
            return NextResponse.json({ error: 'configs must be an array' }, { status: 400 });
        }

        const companyId = session.user.companyId;

        // Upsert each config
        const results = await Promise.all(
            configs.map((c: { status: string; maxDays: number; enabled: boolean }) =>
                prisma.recruitingSLAConfig.upsert({
                    where: { companyId_status: { companyId, status: c.status as any } },
                    create: { companyId, status: c.status as any, maxDays: c.maxDays, enabled: c.enabled },
                    update: { maxDays: c.maxDays, enabled: c.enabled },
                })
            )
        );

        return NextResponse.json({ configs: results });
    } catch (error) {
        console.error('[SLA Config PUT] Error:', error);
        return NextResponse.json({ error: 'Failed to save SLA config' }, { status: 500 });
    }
}
