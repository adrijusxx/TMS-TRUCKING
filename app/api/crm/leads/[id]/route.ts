import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/crm/leads/[id] - Get a single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Build MC filter
        const mcWhere = await buildMcNumberWhereClause(session, request);

        const lead = await prisma.lead.findFirst({
            where: {
                id,
                ...mcWhere,
                deletedAt: null,
            },
            include: {
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { firstName: true, lastName: true },
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        createdBy: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ lead });
    } catch (error) {
        console.error('[CRM Lead GET] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lead' },
            { status: 500 }
        );
    }
}

// PATCH /api/crm/leads/[id] - Update a lead
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Build MC filter
        const mcWhere = await buildMcNumberWhereClause(session, request);

        // Verify lead exists and user has access
        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                ...mcWhere,
                deletedAt: null,
            },
        });

        if (!existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Track status changes for activity log
        const statusChanged = body.status && body.status !== existingLead.status;
        const previousStatus = existingLead.status;

        // Update lead
        const lead = await prisma.lead.update({
            where: { id },
            data: {
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
                email: body.email || null,
                address: body.address || null,
                city: body.city || null,
                state: body.state || null,
                zip: body.zip || null,
                cdlNumber: body.cdlNumber || null,
                cdlClass: body.cdlClass || null,
                yearsExperience: body.yearsExperience || null,
                status: body.status,
                priority: body.priority,
                source: body.source,
                assignedToId: body.assignedToId || null,
                lastContactedAt: body.lastContactedAt || undefined,
            },
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        // Log status change as activity
        if (statusChanged) {
            await prisma.leadActivity.create({
                data: {
                    leadId: id,
                    type: 'STATUS_CHANGE',
                    content: `Status changed from ${previousStatus} to ${body.status}`,
                    userId: session.user.id,
                    metadata: {
                        previousStatus,
                        newStatus: body.status,
                    },
                },
            });
        }

        return NextResponse.json({ lead });
    } catch (error) {
        console.error('[CRM Lead PATCH] Error:', error);
        return NextResponse.json(
            { error: 'Failed to update lead' },
            { status: 500 }
        );
    }
}

// DELETE /api/crm/leads/[id] - Soft delete a lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Build MC filter
        const mcWhere = await buildMcNumberWhereClause(session, request);

        // Verify lead exists and user has access
        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                ...mcWhere,
                deletedAt: null,
            },
        });

        if (!existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Soft delete
        await prisma.lead.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[CRM Lead DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete lead' },
            { status: 500 }
        );
    }
}
