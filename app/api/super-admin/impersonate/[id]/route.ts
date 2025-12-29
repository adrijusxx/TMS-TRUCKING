import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/super-admin/impersonate/[id]
 * Start user impersonation
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: { company: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Logic: We will set a cookie or return a special token that the Auth provider can use.
        // However, since we are using NextAuth, we might need a custom approach or 
        // simply update the session in a way that includes impersonation info.

        // For now, let's create an audit log and implement the "Peek" logic or 
        // a special session bypass. 
        // THE MOST RELIABLE WAY without hacking NextAuth internals is to provide a "Login As"
        // that creates a session for the target user but flags it with 'impersonatedBy'.

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'IMPERSONATE_USER',
                entityType: 'User',
                entityId: id,
                metadata: { targetEmail: targetUser.email, targetCompany: targetUser.company?.name },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Impersonation log created. In a production environment, this would switch your session to ${targetUser.email}.`
        });
    } catch (error) {
        console.error('Error impersonating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
