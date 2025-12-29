import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/super-admin/users
 * List all users with pagination and search
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
            ];
        }
        if (role) {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    company: { select: { name: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        // Remove passwords
        const sanitizedUsers = users.map(user => {
            const { password, ...rest } = user;
            return rest;
        });

        return NextResponse.json({
            users: sanitizedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/super-admin/users
 * Create a new user for any company
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { firstName, lastName, email, role, companyId, mcNumberId, password } = body;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password || 'Temporary2024!', 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                role: role || 'DISPATCHER',
                companyId,
                mcNumberId,
                password: hashedPassword,
                mcAccess: mcNumberId ? [mcNumberId] : [],
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_USER',
                entityType: 'User',
                entityId: user.id,
                metadata: { email, role, companyId },
            },
        });

        const { password: _, ...sanitized } = user;
        return NextResponse.json(sanitized, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
