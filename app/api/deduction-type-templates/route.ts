import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    category: z.enum(['addition', 'deduction']),
});

/**
 * Create a new deduction type template
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validated = createTemplateSchema.parse(body);

        // Check 1000 template limit per company
        const count = await prisma.deductionTypeTemplate.count({
            where: { companyId: session.user.companyId },
        });

        if (count >= 1000) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'LIMIT_EXCEEDED',
                        message: 'Maximum 1000 type templates allowed per company',
                    },
                },
                { status: 403 }
            );
        }

        // Check if name already exists
        const existing = await prisma.deductionTypeTemplate.findFirst({
            where: {
                companyId: session.user.companyId,
                name: validated.name,
            },
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'DUPLICATE', message: 'Type name already exists' },
                },
                { status: 400 }
            );
        }

        const template = await prisma.deductionTypeTemplate.create({
            data: {
                companyId: session.user.companyId,
                name: validated.name,
                category: validated.category,
            },
        });

        return NextResponse.json({ success: true, data: template });
    } catch (error: any) {
        console.error('Error creating deduction type template:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create template' } },
            { status: 500 }
        );
    }
}

/**
 * List all deduction type templates for company
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');

        const where: any = {
            companyId: session.user.companyId,
        };

        if (category) {
            where.category = category;
        }

        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const templates = await prisma.deductionTypeTemplate.findMany({
            where,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                category: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, data: templates });
    } catch (error: any) {
        console.error('Error listing deduction type templates:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to list templates' } },
            { status: 500 }
        );
    }
}
