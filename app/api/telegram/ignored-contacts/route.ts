import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/telegram/ignored-contacts
 * List permanently ignored Telegram contacts for the company.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session.user as any).companyId;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = { companyId };
        if (search) {
            where.OR = [
                { senderName: { contains: search, mode: 'insensitive' } },
                { telegramChatId: { contains: search, mode: 'insensitive' } },
                { reason: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.telegramIgnoredContact.findMany({
                where,
                include: {
                    ignoredBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.telegramIgnoredContact.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items,
                total,
                pagination: { page, pageSize, total, totalPages: Math.ceil(total / Math.max(pageSize, 1)) },
            },
        });
    } catch (error) {
        console.error('[API] Error fetching ignored contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch ignored contacts' }, { status: 500 });
    }
}
