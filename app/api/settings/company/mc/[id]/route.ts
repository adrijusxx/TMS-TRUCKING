import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update MC settings' } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id } = await params;

        // Verify MC belongs to company
        const existingMc = await prisma.mcNumber.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!existingMc) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'MC Number not found' } },
                { status: 404 }
            );
        }

        // Build update data — only include fields that are present in body
        const updateData: Record<string, unknown> = {};
        const allowedFields = [
            'branding', 'email', 'address', 'city', 'state', 'zip',
            'website', 'companyName', 'companyPhone', 'logoUrl',
        ] as const;
        for (const field of allowedFields) {
            if (field in body) updateData[field] = body[field];
        }

        const updatedMc = await prisma.mcNumber.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            data: updatedMc,
        });

    } catch (error) {
        console.error('MC update error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update MC Number' } },
            { status: 500 }
        );
    }
}
