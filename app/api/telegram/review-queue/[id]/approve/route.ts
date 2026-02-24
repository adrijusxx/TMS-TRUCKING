import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { TelegramCaseCreator } from '@/lib/managers/telegram/TelegramCaseCreator';

/**
 * POST /api/telegram/review-queue/[id]/approve
 * Approve a review item — optionally links driver and creates a case
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = (session.user as any).companyId;
        const userId = (session.user as any).id;
        const body = await request.json();
        const { driverId, createCase = true, note, assignedToUserId, assignmentRole } = body;

        // Fetch the item and verify ownership + pending status
        const item = await prisma.telegramReviewItem.findUnique({ where: { id } });
        if (!item || item.companyId !== companyId) {
            return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
        }
        if (item.status !== 'PENDING') {
            return NextResponse.json({ error: 'Item already resolved' }, { status: 400 });
        }

        let linkedDriverId = item.driverId || driverId;
        let breakdownId: string | undefined;

        // Step 1: Link driver if needed
        if (item.type === 'DRIVER_LINK_NEEDED' && driverId) {
            await prisma.telegramDriverMapping.upsert({
                where: { telegramId: item.telegramChatId },
                create: {
                    telegramId: item.telegramChatId,
                    driverId,
                    isActive: true,
                },
                update: { driverId, isActive: true },
            });
            linkedDriverId = driverId;
        }

        // Step 2: Create case if requested
        // When user explicitly clicks "Approve & Create Case", always create the breakdown
        // regardless of AI classification — the user's action is the authority.
        if (createCase) {
            if (!linkedDriverId) {
                return NextResponse.json(
                    { error: 'Cannot create case: no driver linked. Please select a driver first.' },
                    { status: 400 }
                );
            }

            const analysis = (item.aiAnalysis as any) || {};

            // Look up driver's truck for the breakdown
            const driver = await prisma.driver.findUnique({
                where: { id: linkedDriverId },
                include: { currentTruck: { select: { id: true, samsaraId: true, mcNumberId: true } } },
            });

            if (!driver?.currentTruck?.id) {
                return NextResponse.json(
                    { error: 'Cannot create breakdown case: driver has no assigned truck. Please assign a truck first.' },
                    { status: 400 }
                );
            }

            const caseCreator = new TelegramCaseCreator(companyId);
            const breakdown = await caseCreator.createBreakdownCase(
                linkedDriverId,
                driver.currentTruck.id,
                driver.currentTruck.samsaraId,
                analysis,
                item.messageContent
            );
            breakdownId = breakdown.id;

            // Assign team member to the case if specified
            if (assignedToUserId && breakdownId) {
                try {
                    await prisma.breakdownAssignment.create({
                        data: {
                            breakdownId,
                            userId: assignedToUserId,
                            role: assignmentRole || 'Support',
                            assignedBy: userId,
                        },
                    });
                } catch (assignErr) {
                    console.warn('[API] Failed to create case assignment:', assignErr);
                }
            }
        }

        // Step 3: Mark as approved
        const updated = await prisma.telegramReviewItem.update({
            where: { id },
            data: {
                status: 'APPROVED',
                resolvedAt: new Date(),
                resolvedById: userId,
                resolvedNote: note,
                driverId: linkedDriverId || undefined,
                breakdownId,
            },
            include: {
                breakdown: { select: { id: true, breakdownNumber: true, status: true } },
                resolvedBy: { select: { firstName: true, lastName: true } },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[API] Error approving review item:', error);
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
    }
}
