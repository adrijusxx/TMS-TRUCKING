import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';

/**
 * Fix existing delivered loads that are not marked as ready for settlement
 * POST /api/loads/fix-ready-for-settlement
 * 
 * This is a one-time fix for loads that were delivered before the completion workflow was triggered
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Only allow ADMIN, SUPER_ADMIN, or ACCOUNTANT
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ACCOUNTANT') {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Only ADMIN, SUPER_ADMIN, or ACCOUNTANT can run this fix' },
                },
                { status: 403 }
            );
        }

        // Find delivered loads that haven't been marked as ready for settlement
        const loadsToFix = await prisma.load.findMany({
            where: {
                companyId: session.user.companyId,
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                readyForSettlement: false,
                driverId: { not: null }, // Must have a driver assigned
                deletedAt: null,
            },
            select: {
                id: true,
                loadNumber: true,
                status: true,
                driverId: true,
                deliveredAt: true,
            },
        });

        console.log(`[Fix Ready For Settlement] Found ${loadsToFix.length} loads to fix for company ${session.user.companyId}`);

        // Fix each load
        const results = {
            fixed: 0,
            errors: [] as string[],
        };

        const completionManager = new LoadCompletionManager();

        for (const load of loadsToFix) {
            try {
                // Run the completion workflow to sync accounting and set readyForSettlement
                await completionManager.handleLoadCompletion(load.id);
                results.fixed++;
                console.log(`[Fix Ready For Settlement] Fixed load ${load.loadNumber}`);
            } catch (error: any) {
                // If completion workflow fails, at least set readyForSettlement directly
                try {
                    await prisma.load.update({
                        where: { id: load.id },
                        data: {
                            readyForSettlement: true,
                            deliveredAt: load.deliveredAt || new Date(),
                        },
                    });
                    results.fixed++;
                    console.log(`[Fix Ready For Settlement] Directly fixed load ${load.loadNumber}`);
                } catch (directError: any) {
                    results.errors.push(`Failed to fix load ${load.loadNumber}: ${directError.message}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                loadsFound: loadsToFix.length,
                loadsFixed: results.fixed,
                errors: results.errors.length > 0 ? results.errors : undefined,
            },
            message: `Fixed ${results.fixed} of ${loadsToFix.length} loads`,
        });
    } catch (error: any) {
        console.error('Error fixing loads:', error);
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
            },
            { status: 500 }
        );
    }
}
