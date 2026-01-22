import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { makeCall } from '@/lib/services/yoko/client';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { destination } = body;

        if (!destination) {
            return NextResponse.json({ error: 'Destination number required' }, { status: 400 });
        }

        const result = await makeCall(session.user.id, destination);

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to initiate call' }, { status: 500 });
        }

        return NextResponse.json({ success: true, callId: result.callId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
