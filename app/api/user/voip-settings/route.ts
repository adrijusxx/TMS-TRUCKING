import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { nsRequest } from '@/lib/integrations/netsapiens';
import { NSUser } from '@/lib/integrations/netsapiens/types';

interface VoipConfig {
    pbxExtension?: string;
    answerDevice?: string;
    enabled?: boolean;
    sipPassword?: string;
    softphoneEnabled?: boolean;
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { pbxExtension, answerDevice, enabled, sipPassword, softphoneEnabled, test } = body;

        if (!pbxExtension || !answerDevice) {
            return NextResponse.json({ error: 'PBX extension and answer device are required' }, { status: 400 });
        }

        const voipConfig: VoipConfig = {
            pbxExtension,
            answerDevice,
            enabled: enabled ?? false,
            ...(sipPassword !== undefined && { sipPassword }),
            ...(softphoneEnabled !== undefined && { softphoneEnabled }),
        };

        // Save to DB first (test reads from NS API, not from saved config)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { voipConfig: voipConfig as any },
        });

        // Verify extension exists on PBX
        if (test) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true },
            });

            const nsUser = await nsRequest<NSUser>(
                `/domains/{domain}/users/${encodeURIComponent(pbxExtension)}`,
                { method: 'GET' },
                user?.companyId || undefined,
            );

            if (!nsUser) {
                return NextResponse.json(
                    { error: `Saved, but extension "${pbxExtension}" was not found on the PBX. Verify the extension number.` },
                    { status: 400 },
                );
            }
        }

        return NextResponse.json({ success: true, voipConfig });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { voipConfig: true },
    });

    return NextResponse.json({ voipConfig: user?.voipConfig || {} });
}
