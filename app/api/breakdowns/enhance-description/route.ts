import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { BreakdownCaseAssistant } from '@/lib/services/BreakdownCaseAssistant';

/**
 * POST /api/breakdowns/enhance-description
 * Enhance a breakdown description with AI
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await request.json();
        const { description } = body;

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const assistant = new BreakdownCaseAssistant(user.companyId);
        const enhanced = await assistant.enhanceDescription(description);
        const detectedType = await assistant.detectBreakdownType(description);

        return NextResponse.json({
            success: true,
            data: {
                enhanced,
                detectedType,
            },
        });
    } catch (error: any) {
        console.error('[API] Error enhancing description:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to enhance description' },
            { status: 500 }
        );
    }
}
