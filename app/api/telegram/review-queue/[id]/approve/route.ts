import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TelegramCaseCreator } from '@/lib/managers/telegram/TelegramCaseCreator';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

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
            const user = session.user as any;
            const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);
            const existing = await prisma.telegramDriverMapping.findFirst({
                where: { telegramId: item.telegramChatId, companyId: scope.companyId, mcNumberId: scope.mcNumberId },
            });
            if (existing) {
                await prisma.telegramDriverMapping.update({
                    where: { id: existing.id },
                    data: { driverId, isActive: true },
                });
            } else {
                await prisma.telegramDriverMapping.create({
                    data: {
                        telegramId: item.telegramChatId, driverId, isActive: true,
                        companyId: scope.companyId, mcNumberId: scope.mcNumberId,
                    },
                });
            }
            linkedDriverId = driverId;
        }

        // Step 2: Create case if requested — route to correct case type based on AI category
        if (createCase) {
            if (!linkedDriverId) {
                return NextResponse.json(
                    { error: 'Cannot create case: no driver linked. Please select a driver first.' },
                    { status: 400 }
                );
            }

            const analysis = (item.aiAnalysis as any) || {};
            const driver = await prisma.driver.findUnique({
                where: { id: linkedDriverId },
                include: { currentTruck: { select: { id: true, samsaraId: true, mcNumberId: true } } },
            });

            const caseCreator = new TelegramCaseCreator(companyId);
            const category = item.aiCategory || analysis.category || '';

            if (category === 'SAFETY' || analysis.isSafetyIncident) {
                const incident = await caseCreator.createSafetyIncident(
                    linkedDriverId, driver?.currentTruck?.id, analysis, item.messageContent,
                );
                breakdownId = incident.id;
            } else if (category === 'MAINTENANCE' || analysis.isMaintenanceRequest) {
                if (!driver?.currentTruck?.id) {
                    return NextResponse.json(
                        { error: 'Cannot create maintenance case: driver has no assigned truck.' },
                        { status: 400 },
                    );
                }
                const record = await caseCreator.createMaintenanceRequest(
                    linkedDriverId, driver.currentTruck.id, analysis, item.messageContent,
                );
                breakdownId = record.id;
            } else {
                // Default to breakdown
                if (!driver?.currentTruck?.id) {
                    return NextResponse.json(
                        { error: 'Cannot create breakdown case: driver has no assigned truck.' },
                        { status: 400 },
                    );
                }
                const breakdown = await caseCreator.createBreakdownCase(
                    linkedDriverId, driver.currentTruck.id, driver.currentTruck.samsaraId,
                    analysis, item.messageContent,
                );
                breakdownId = breakdown.id;
            }

            // Assign team member if specified
            if (assignedToUserId && breakdownId) {
                try {
                    await prisma.breakdownAssignment.create({
                        data: { breakdownId, userId: assignedToUserId, role: assignmentRole || 'Support', assignedBy: userId },
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
