import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Correct type for Next.js 15+ dynamic params
) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Not authenticated' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // 1. Check Permissions: Only ADMIN or FLEET_MANAGER (if exists) should delete. 
        // The user requested "admin to delete".
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Only Admins can delete breakdowns' },
                { status: 403 }
            );
        }

        // 2. Verify Assignment/Ownership (Multi-MC Context)
        // Even Admins should belong to the same Company
        const breakdown = await prisma.breakdown.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!breakdown) {
            return NextResponse.json(
                { success: false, error: 'Breakdown not found' },
                { status: 404 }
            );
        }

        if (breakdown.companyId !== session.user.companyId) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: You cannot access this resource' },
                { status: 403 }
            );
        }

        // 3. Soft Delete
        await prisma.breakdown.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                // Optional: Add audit log or note about who deleted it?
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Breakdown deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting breakdown:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
