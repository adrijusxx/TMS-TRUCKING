import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/super-admin/mc-numbers
 * List all MC Numbers
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where = search
            ? {
                OR: [
                    { number: { contains: search, mode: 'insensitive' as const } },
                    { companyName: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [mcNumbers, total] = await Promise.all([
            prisma.mcNumber.findMany({
                where,
                include: {
                    company: { select: { name: true } },
                    _count: {
                        select: { users: true, loads: true }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.mcNumber.count({ where }),
        ]);

        return NextResponse.json({
            mcNumbers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching MC numbers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/super-admin/mc-numbers
 * Create a new MC Number for a company
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { number, companyId, companyName, type } = body;

        if (!number || !companyId || !companyName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if MC number already exists
        const existing = await prisma.mcNumber.findFirst({
            where: { number },
        });

        if (existing) {
            return NextResponse.json({ error: 'MC Number already exists' }, { status: 400 });
        }

        // Create MC Number
        const result = await prisma.mcNumber.create({
            data: {
                number,
                companyId,
                companyName,
                type: type || 'CARRIER',
                isDefault: false, // User can change this later
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_MC_NUMBER',
                entityType: 'McNumber',
                entityId: result.id,
                metadata: { number, companyId, companyName },
            },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating MC number:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
