import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/crm/leads/[id]/activities
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const companyId = session.user.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Verify lead access via companyId
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
                deletedAt: null
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        // Optional filters
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '50');

        const activityWhere: any = { leadId: id };
        if (typeFilter) {
            activityWhere.type = { in: typeFilter.split(',') };
        }

        const activities = await prisma.leadActivity.findMany({
            where: activityWhere,
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 200),
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return NextResponse.json({ data: activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
}
