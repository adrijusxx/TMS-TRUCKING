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

        // Update
        const updatedMc = await prisma.mcNumber.update({
            where: { id },
            data: {
                branding: body.branding,
                email: body.email,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                website: body.website,
                // Allow updating common validation fields if needed, but primarily branding
            },
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
