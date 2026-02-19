import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/crm/campaigns/[id]/recipients — List recipients with status
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
        where: { id, companyId: session.user.companyId },
        select: { id: true },
    });

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const [recipients, total] = await Promise.all([
        prisma.campaignRecipient.findMany({
            where: { campaignId: id },
            include: {
                lead: { select: { firstName: true, lastName: true, phone: true, email: true, leadNumber: true } },
                executions: { select: { stepId: true, status: true, sentAt: true, error: true } },
            },
            orderBy: { enrolledAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.campaignRecipient.count({ where: { campaignId: id } }),
    ]);

    return NextResponse.json({ data: recipients, total, page, limit });
}
