import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/crm/leads/check-duplicate — Check for existing leads with same phone/email
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone, email, excludeId } = await request.json();

        if (!phone && !email) {
            return NextResponse.json({ duplicates: [] });
        }

        const companyId = session.user.companyId;
        const conditions = [];

        if (phone) {
            // Normalize phone: strip non-digits for comparison
            const normalizedPhone = phone.replace(/\D/g, '');
            conditions.push({ phone: { contains: normalizedPhone.slice(-10) } });
        }

        if (email) {
            conditions.push({ email: { equals: email, mode: 'insensitive' as const } });
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
