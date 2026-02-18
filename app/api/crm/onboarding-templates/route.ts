import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/crm/onboarding-templates — list all templates for company
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templates = await prisma.onboardingTemplate.findMany({
            where: { companyId: session.user.companyId },
            include: {
                steps: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('[Onboarding Templates GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

// POST /api/crm/onboarding-templates — create a new template
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.templates.manage')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, isDefault, steps } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
        }

        if (!steps?.length) {
            return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
        }

        const companyId = session.user.companyId;

        // If marking as default, unset other defaults
        if (isDefault) {
            await prisma.onboardingTemplate.updateMany({
                where: { companyId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const template = await prisma.onboardingTemplate.create({
            data: {
                companyId,
                name: name.trim(),
                description: description?.trim() || null,
                isDefault: !!isDefault,
                steps: {
                    create: steps.map((step: any, index: number) => ({
                        stepType: step.stepType,
                        label: step.label,
                        description: step.description || null,
                        required: step.required ?? true,
                        sortOrder: index,
                    })),
                },
            },
            include: {
                steps: { orderBy: { sortOrder: 'asc' } },
            },
        });

        return NextResponse.json({ template }, { status: 201 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
        }
        console.error('[Onboarding Templates POST] Error:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
