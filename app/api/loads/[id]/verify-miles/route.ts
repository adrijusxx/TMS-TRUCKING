import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SamsaraMileageService } from '@/lib/services/SamsaraMileageService';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: loadId } = params;

        const mileageService = new SamsaraMileageService();
        const result = await mileageService.calculateLoadActualMiles(loadId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || result.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Error verifying miles:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
