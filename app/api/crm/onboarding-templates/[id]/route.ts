import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/crm/onboarding-templates/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const template = await prisma.onboardingTemplate.findFirst({
            where: { id, companyId: session.user.companyId },
            include: {
                steps: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template });
    } catch (error) {
        console.error('[Onboarding Template GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

// PATCH /api/crm/onboarding-templates/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.templates.manage')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, isDefault, steps } = body;
        const companyId = session.user.companyId;

        const existing = await prisma.onboardingTemplate.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // If marking as default, unset other defaults
        if (isDefault && !existing.isDefault) {
            await prisma.onboardingTemplate.updateMany({
                where: { companyId, isDefault: true },
                data: { isDefault: false },
            });
        }

        // Replace steps if provided
        if (steps) {
            await prisma.onboardingTemplateStep.deleteMany({
                where: { templateId: id },
            });
        }

        const template = await prisma.onboardingTemplate.update({
            where: { id },
            data: {
                name: name?.trim() || undefined,
                description: description !== undefined ? (description?.trim() || null) : undefined,
                isDefault: isDefault !== undefined ? !!isDefault : undefined,
                ...(steps ? {
                    steps: {
                        create: steps.map((step: any, index: number) => ({
                            stepType: step.stepType,
                            label: step.label,
                            description: step.description || null,
                            required: step.required ?? true,
                            sortOrder: index,
                        })),
                    },
                } : {}),
            },
            include: {
                steps: { orderBy: { sortOrder: 'asc' } },
            },
        });

        return NextResponse.json({ template });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
        }
        console.error('[Onboarding Template PATCH] Error:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

// DELETE /api/crm/onboarding-templates/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'crm.templates.manage')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const existing = await prisma.onboardingTemplate.findFirst({
            where: { id, companyId: session.user.companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        await prisma.onboardingTemplate.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Onboarding Template DELETE] Error:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
