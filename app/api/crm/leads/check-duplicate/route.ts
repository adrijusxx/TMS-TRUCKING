import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getCrmGeneralSettings } from '@/lib/utils/crm-settings';

// POST /api/crm/leads/check-duplicate — Check for existing leads with same phone/email/cdl/name
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const { phone, email, cdlNumber, firstName, lastName, excludeId } = await request.json();

        // Check duplicate detection settings
        const crmSettings = await getCrmGeneralSettings(companyId);
        const detection = crmSettings.duplicateDetection || { enabled: true, matchFields: ['phone', 'email'] };

        if (!detection.enabled) {
            return NextResponse.json({ duplicates: [] });
        }

        const matchFields = detection.matchFields || ['phone', 'email'];
        const conditions: any[] = [];

        if (matchFields.includes('phone') && phone) {
            const normalizedPhone = phone.replace(/\D/g, '');
            conditions.push({ phone: { contains: normalizedPhone.slice(-10) } });
        }

        if (matchFields.includes('email') && email) {
            conditions.push({ email: { equals: email, mode: 'insensitive' as const } });
        }

        if (matchFields.includes('cdlNumber') && cdlNumber) {
            conditions.push({ cdlNumber: { equals: cdlNumber, mode: 'insensitive' as const } });
        }

        if (matchFields.includes('name') && firstName && lastName) {
            conditions.push({
                AND: [
                    { firstName: { equals: firstName, mode: 'insensitive' as const } },
                    { lastName: { equals: lastName, mode: 'insensitive' as const } },
                ],
            });
        }

        if (conditions.length === 0) {
            return NextResponse.json({ duplicates: [] });
        }

        const duplicates = await prisma.lead.findMany({
            where: {
                companyId,
                deletedAt: null,
                ...(excludeId ? { id: { not: excludeId } } : {}),
                OR: conditions,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                status: true,
                createdAt: true,
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
            },
            take: 5,
        });

        return NextResponse.json({ duplicates });
    } catch (error) {
        console.error('[CRM Check Duplicate] Error:', error);
        return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 });
    }
}
