import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { BreakdownCaseAssistant } from '@/lib/services/BreakdownCaseAssistant';

/**
 * POST /api/breakdowns/suggest-solution
 * Get AI-powered solution suggestions for a breakdown
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
        const { description, problem, truckId, breakdownType, faultCodes } = body;

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const assistant = new BreakdownCaseAssistant(user.companyId);
        const suggestion = await assistant.suggestSolution({
            description,
            problem,
            truckId,
            breakdownType,
            faultCodes,
        });

        return NextResponse.json({
            success: true,
            data: suggestion,
        });
    } catch (error: any) {
        console.error('[API] Error suggesting solution:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to suggest solution' },
            { status: 500 }
        );
    }
}
