import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/review-queue
 * List review queue items with filters and counts
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status') || 'PENDING';
        const type = searchParams.get('type');
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = { companyId, status };
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { senderName: { contains: search, mode: 'insensitive' } },
                { chatTitle: { contains: search, mode: 'insensitive' } },
                { messageContent: { contains: search, mode: 'insensitive' } },
                { resolvedNote: { contains: search, mode: 'insensitive' } },
                { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
                { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        // Auto-expire PENDING items older than 24 hours
        const expiryThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await prisma.telegramReviewItem.updateMany({
            where: {
                companyId,
                status: 'PENDING',
                createdAt: { lt: expiryThreshold },
            },
            data: {
                status: 'DISMISSED',
                resolvedAt: new Date(),
                resolvedNote: 'Auto-expired after 24 hours',
            },
        });

        // Auto-cleanup old DISMISSED items based on company setting
        const companySettings = await prisma.companySettings.findUnique({
            where: { companyId },
            select: { generalSettings: true },
        });
        const telegramSettings = (companySettings?.generalSettings as any)?.telegram || {};
        const cleanupDays = telegramSettings.dismissedAutoCleanupDays || 0;
        if (cleanupDays > 0) {
            const cleanupThreshold = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000);
            await prisma.telegramReviewItem.deleteMany({
                where: { companyId, status: 'DISMISSED', resolvedAt: { lt: cleanupThreshold } },
            });
        }

        // Count-based auto-cleanup: keep at most N dismissed items
        const dismissedCountLimit = telegramSettings.dismissedCountLimit ?? 250;
        if (dismissedCountLimit > 0) {
            const totalDismissed = await prisma.telegramReviewItem.count({
                where: { companyId, status: 'DISMISSED' },
            });
            if (totalDismissed > dismissedCountLimit) {
                const oldest = await prisma.telegramReviewItem.findMany({
                    where: { companyId, status: 'DISMISSED' },
                    orderBy: { resolvedAt: 'asc' },
                    take: totalDismissed - dismissedCountLimit,
                    select: { id: true },
                });
                if (oldest.length > 0) {
                    await prisma.telegramReviewItem.deleteMany({
                        where: { id: { in: oldest.map((r: { id: string }) => r.id) } },
                    });
                }
            }
        }

        const [rawItems, total, counts, ignoredCount] = await Promise.all([
            pageSize > 0
                ? prisma.telegramReviewItem.findMany({
                    where,
                    include: {
                        driver: {
                            include: {
                                user: { select: { firstName: true, lastName: true, phone: true } },
                                currentTruck: { select: { id: true, truckNumber: true, samsaraId: true, currentLocation: true } },
                            },
                        },
                        suggestedDriver: {
                            include: {
                                user: { select: { firstName: true, lastName: true, phone: true } },
                                currentTruck: { select: { id: true, truckNumber: true } },
                            },
                        },
                        breakdown: { select: { id: true, breakdownNumber: true, status: true } },
                        resolvedBy: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                })
                : [],
            prisma.telegramReviewItem.count({ where }),
            prisma.telegramReviewItem.groupBy({
                by: ['status', 'type'],
                where: { companyId },
                _count: true,
            }),
            prisma.telegramIgnoredContact.count({ where: { companyId } }),
        ]);

        // Enrich items missing chatTitle/senderName from TelegramDriverMapping
        const itemsMissingNames = rawItems.filter(
            (i: any) => !i.chatTitle && !i.senderName && i.telegramChatId
        );
        let mappingLookup: Record<string, string> = {};
        if (itemsMissingNames.length > 0) {
            const chatIds = [...new Set(itemsMissingNames.map((i: any) => i.telegramChatId))];
            const mappings = await prisma.telegramDriverMapping.findMany({
                where: { telegramId: { in: chatIds } },
                select: { telegramId: true, firstName: true, lastName: true, username: true },
            });
            for (const m of mappings) {
                const parts = [m.firstName, m.lastName].filter(Boolean);
                mappingLookup[m.telegramId] = parts.length > 0
                    ? parts.join(' ')
                    : (m.username ? `@${m.username}` : '');
            }
        }
        const items = rawItems.map((item: any) => {
            if (!item.chatTitle && !item.senderName && mappingLookup[item.telegramChatId]) {
                return { ...item, chatTitle: mappingLookup[item.telegramChatId] };
            }
            return item;
        });

        // Aggregate counts
        const countMap = { pending: 0, approved: 0, dismissed: 0, ignored: ignoredCount, caseApproval: 0, driverLinkNeeded: 0 };
        for (const g of counts) {
            if (g.status === 'PENDING') countMap.pending += g._count;
            if (g.status === 'APPROVED') countMap.approved += g._count;
            if (g.status === 'DISMISSED') countMap.dismissed += g._count;
            if (g.status === 'PENDING' && g.type === 'CASE_APPROVAL') countMap.caseApproval += g._count;
            if (g.status === 'PENDING' && g.type === 'DRIVER_LINK_NEEDED') countMap.driverLinkNeeded += g._count;
        }

        return NextResponse.json({
            success: true,
            data: {
                items,
                counts: countMap,
                pagination: { page, pageSize, total, totalPages: Math.ceil(total / Math.max(pageSize, 1)) },
            },
        });
    } catch (error) {
        console.error('[API] Error fetching review queue:', error);
        return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
    }
}
