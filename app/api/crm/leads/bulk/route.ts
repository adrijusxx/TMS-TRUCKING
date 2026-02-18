import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// POST /api/crm/leads/bulk - Bulk operations on leads
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids, action, payload } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
        }

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        // Ensure leads belong to user's MC scope
        const mcWhere = await buildMcNumberWhereClause(session, request);
        const accessibleLeads = await prisma.lead.findMany({
            where: { id: { in: ids }, ...mcWhere, deletedAt: null },
            select: { id: true },
        });
        const accessibleIds = accessibleLeads.map((l) => l.id);

        if (accessibleIds.length === 0) {
            return NextResponse.json({ error: 'No accessible leads found' }, { status: 404 });
        }

        let updated = 0;

        switch (action) {
            case 'status-change': {
                if (!payload?.status) {
                    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
                }
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { status: payload.status },
                });
                updated = result.count;

                // Log activity for each lead
                await prisma.leadActivity.createMany({
                    data: accessibleIds.map((id) => ({
                        leadId: id,
                        type: 'STATUS_CHANGE' as const,
                        content: `Bulk status change to ${payload.status}`,
                        userId: session.user.id,
                        metadata: { newStatus: payload.status, bulk: true },
                    })),
                });
                break;
            }

            case 'assign': {
                if (!payload?.assignedToId) {
                    return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
                }
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { assignedToId: payload.assignedToId },
                });
                updated = result.count;

                await prisma.leadActivity.createMany({
                    data: accessibleIds.map((id) => ({
                        leadId: id,
                        type: 'ASSIGNMENT_CHANGE' as const,
                        content: 'Bulk assignment change',
                        userId: session.user.id,
                        metadata: { assignedToId: payload.assignedToId, bulk: true },
                    })),
                });
                break;
            }

            case 'delete': {
                const result = await prisma.lead.updateMany({
                    where: { id: { in: accessibleIds } },
                    data: { deletedAt: new Date() },
                });
                updated = result.count;
                break;
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            updated,
            total: accessibleIds.length,
        });
    } catch (error) {
        console.error('[CRM Leads Bulk POST] Error:', error);
        return NextResponse.json(
            { error: 'Bulk operation failed' },
            { status: 500 }
        );
    }
}
