import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { inngest } from '@/lib/inngest/client';

// GET /api/crm/leads - List all leads
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Build MC filter
        const mcWhere = await buildMcNumberWhereClause(session, request);

        // Build where clause
        const where: any = {
            ...mcWhere,
            deletedAt: null,
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        if (priority && priority !== 'all') {
            where.priority = priority;
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { leadNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('[CRM Leads GET] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}

// POST /api/crm/leads - Create a new lead
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.firstName || !body.lastName || !body.phone) {
            return NextResponse.json(
                { error: 'First name, last name, and phone are required' },
                { status: 400 }
            );
        }

        const companyId = session.user.companyId;

        // Get MC Number for this lead
        const mcNumberId = await McStateManager.determineActiveCreationMc(session, body.mcNumberId);

        // Generate lead number
        const leadCount = await prisma.lead.count({
            where: { companyId },
        });
        const leadNumber = `CRM-${String(leadCount + 1).padStart(4, '0')}`;

        // Create lead
        const lead = await prisma.lead.create({
            data: {
                leadNumber,
                companyId,
                mcNumberId,
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
                status: body.status || 'NEW',
                priority: body.priority || 'WARM',
                source: body.source || 'OTHER',
                createdById: session.user.id,
                tags: body.tags || [],
                endorsements: body.endorsements || [],
                freightTypes: body.freightTypes || [],
                nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
                nextFollowUpNote: body.nextFollowUpNote || null,
            },
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        // Create activity for lead creation
        await prisma.leadActivity.create({
            data: {
                leadId: lead.id,
                type: 'NOTE',
                content: `Lead created with status ${lead.status}`,
                userId: session.user.id,
            },
        });

        // Fire-and-forget: automation rules (non-critical)
        inngest.send({
            name: 'automation/lead-event',
            data: {
                leadId: lead.id,
                companyId,
                event: 'new_lead',
            },
        }).catch((err) => console.warn('[CRM Leads POST] Inngest event failed:', err));

        return NextResponse.json({ lead }, { status: 201 });
    } catch (error) {
        console.error('[CRM Leads POST] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create lead' },
            { status: 500 }
        );
    }
}
