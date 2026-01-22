import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/services/yoko/client';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { username, password, answerDevice, enabled, test } = body;

        // Validation
        if (!username || !password || !answerDevice) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const voipConfig = {
            username,
            password,
            answerDevice,
            enabled: enabled ?? false
        };

        // If testing connection
        if (test) {
            // We need to temporarily "mock" getting these settings or save them first?
            // Actually `testConnection` reads from DB. So we must save first.
            // Or refactor `testConnection` to accept credentials.
            // For now, let's just save.
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                voipConfig
            }
        });

        if (test) {
            const result = await testConnection(session.user.id);
            if (!result.success) {
                return NextResponse.json({ error: 'Saved, but connection test failed: ' + result.message }, { status: 400 });
            }
        }

        return NextResponse.json({ success: true, voipConfig });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { voipConfig: true }
    });

    return NextResponse.json({ voipConfig: user?.voipConfig || {} });
}
