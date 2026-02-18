import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { driverApplicationSchema } from '@/lib/validations/driver-application';
import { notifyNewApplication } from '@/lib/notifications/crm-triggers';

// Rate limit map: IP → { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimits.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimits.set(ip, { count: 1, resetAt: now + 3600_000 });
        return true;
    }
    if (entry.count >= 5) return false;
    entry.count++;
    return true;
}

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET /api/public/apply/[slug] — Get company info for the application form
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        const company = await prisma.company.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            select: { id: true, name: true, city: true, state: true },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({
            company: { name: company.name, city: company.city, state: company.state },
        });
    } catch (error) {
        console.error('[Public Apply GET] Error:', error);
        return NextResponse.json({ error: 'Failed to load company' }, { status: 500 });
    }
}

// POST /api/public/apply/[slug] — Submit a driver application (no auth required)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        // Rate limit by IP
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many submissions. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Validate input
        const parsed = driverApplicationSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Honeypot check (bots fill hidden fields)
        if (parsed.data.honeypot) {
            return NextResponse.json({ success: true }); // Silently ignore spam
        }

        // Find company by slug
        const company = await prisma.company.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            select: { id: true },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Find a system user for createdById (first admin)
        const systemUser = await prisma.user.findFirst({
            where: { companyId: company.id, role: { in: ['SUPER_ADMIN', 'ADMIN'] }, deletedAt: null },
            select: { id: true },
        });

        if (!systemUser) {
            return NextResponse.json({ error: 'Company not configured' }, { status: 500 });
        }

        // Generate lead number
        const leadCount = await prisma.lead.count({ where: { companyId: company.id } });
        const leadNumber = `CRM-${String(leadCount + 1).padStart(4, '0')}`;

        // Create the lead
        const lead = await prisma.lead.create({
            data: {
                leadNumber,
                companyId: company.id,
                firstName: parsed.data.firstName,
                lastName: parsed.data.lastName,
                phone: parsed.data.phone,
                email: parsed.data.email || null,
                city: parsed.data.city || null,
                state: parsed.data.state || null,
                cdlNumber: parsed.data.cdlNumber || null,
                cdlClass: parsed.data.cdlClass || null,
                yearsExperience: parsed.data.yearsExperience || null,
                endorsements: parsed.data.endorsements || [],
                previousEmployers: parsed.data.previousEmployers || null,
                status: 'NEW',
                priority: 'WARM',
                source: 'APPLICATION',
                createdById: systemUser.id,
                metadata: parsed.data.referralSource
                    ? { referralSource: parsed.data.referralSource }
                    : undefined,
            },
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: lead.id,
                type: 'NOTE',
                content: 'Lead created from public application form',
                userId: systemUser.id,
            },
        });

        // Notify recruiters
        await notifyNewApplication(
            lead.id,
            company.id,
            `${parsed.data.firstName} ${parsed.data.lastName}`,
            leadNumber
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('[Public Apply POST] Error:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}
