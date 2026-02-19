import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeNSCall } from '@/lib/integrations/netsapiens';

interface VoipConfig {
    pbxExtension?: string;
    answerDevice?: string;
    enabled?: boolean;
    // Legacy fields (pre-v2 migration)
    username?: string;
    password?: string;
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { destination } = body;

        if (!destination) {
            return NextResponse.json({ error: 'Destination number required' }, { status: 400 });
        }

        // Get user's VoIP config
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { voipConfig: true, companyId: true },
        });

        const config = (user?.voipConfig as VoipConfig) || {};

        // Support both new (pbxExtension) and legacy (username) fields
        const extension = config.pbxExtension || config.username;
        const answerDevice = config.answerDevice;

        if (!extension) {
            return NextResponse.json(
                { error: 'PBX extension not configured. Go to Profile Settings to set up your phone.' },
                { status: 400 }
            );
        }
        if (!answerDevice) {
            return NextResponse.json(
                { error: 'Answer device not set. Go to Profile Settings and add your phone number.' },
                { status: 400 }
            );
        }
        if (!config.enabled) {
            return NextResponse.json(
                { error: 'Phone integration is disabled. Enable it in Profile Settings.' },
                { status: 400 }
            );
        }

        const result = await makeNSCall(extension, destination, answerDevice, user?.companyId || undefined);

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to initiate call' }, { status: 500 });
        }

        return NextResponse.json({ success: true, callId: result.callId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
