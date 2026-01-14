import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Delete a deduction type template
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Verify template belongs to user's company
        const existing = await prisma.deductionTypeTemplate.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
                { status: 404 }
            );
        }

        await prisma.deductionTypeTemplate.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
        console.error('Error deleting deduction type template:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete template' } },
            { status: 500 }
        );
    }
}
