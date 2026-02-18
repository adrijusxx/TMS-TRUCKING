import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PATCH /api/crm/settings/slug — Update the company's public application slug
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await request.json();

        if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json(
                { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
                { status: 400 }
            );
        }

        // Check uniqueness
        const existing = await prisma.company.findFirst({
            where: { slug, id: { not: session.user.companyId } },
        });

        if (existing) {
            return NextResponse.json({ error: 'This URL is already taken' }, { status: 409 });
        }

        await prisma.company.update({
            where: { id: session.user.companyId },
            data: { slug },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[CRM Slug PATCH] Error:', error);
        return NextResponse.json({ error: 'Failed to update slug' }, { status: 500 });
    }
}
