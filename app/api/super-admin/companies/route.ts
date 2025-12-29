import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/super-admin/companies
 * List all companies with pagination and search
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        // Only SUPER_ADMIN can access
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { dotNumber: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                include: {
                    _count: {
                        select: { mcNumbers: true, users: true },
                    },
                    subscription: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.company.count({ where }),
        ]);

        return NextResponse.json({
            companies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/super-admin/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, dotNumber, mcNumber, email, phone, address, city, state, zip } = body;

        // Create company
        const company = await prisma.company.create({
            data: {
                name,
                dotNumber,
                email,
                phone: phone || '000-000-0000',
                address: address || 'TBD',
                city: city || 'TBD',
                state: state || 'TX',
                zip: zip || '00000',
                subscriptionStatus: 'FREE',
            },
        });

        // Create default MC number
        const mc = await prisma.mcNumber.create({
            data: {
                companyId: company.id,
                number: mcNumber,
                companyName: company.name,
                type: 'CARRIER',
                isDefault: true,
            },
        });

        // Create free subscription
        await prisma.subscription.create({
            data: {
                companyId: company.id,
                planId: 'starter-free',
                status: 'FREE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_COMPANY',
                entityType: 'Company',
                entityId: company.id,
                metadata: { companyName: company.name, dotNumber, mcNumber },
            },
        });

        return NextResponse.json({ company, mcNumber: mc }, { status: 201 });
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
