import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// GET /api/crm/leads/export — Export leads as CSV
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const source = searchParams.get('source');

        const where: any = {
            ...mcWhere,
            companyId: session.user.companyId,
            deletedAt: null,
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (source) where.source = source;

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5000, // Safety cap
        });

        // Build CSV
        const headers = [
            'Lead #', 'First Name', 'Last Name', 'Phone', 'Email',
            'Status', 'Priority', 'Source', 'CDL Class', 'Years Experience',
            'City', 'State', 'Assigned To', 'Created', 'Last Contacted',
        ];

        const rows = leads.map((lead) => [
            lead.leadNumber,
            lead.firstName,
            lead.lastName,
            lead.phone,
            lead.email || '',
            lead.status,
            lead.priority,
            lead.source,
            lead.cdlClass || '',
            lead.yearsExperience?.toString() || '',
            lead.city || '',
            lead.state || '',
            lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '',
            lead.createdAt.toISOString().split('T')[0],
            lead.lastContactedAt?.toISOString().split('T')[0] || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row.map((cell) => {
                    const escaped = String(cell).replace(/"/g, '""');
                    return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
                        ? `"${escaped}"`
                        : escaped;
                }).join(',')
            ),
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('[CRM Leads Export] Error:', error);
        return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
    }
}
