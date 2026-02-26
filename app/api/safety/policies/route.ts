import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createSafetyPolicySchema } from '@/lib/validations/safety-policy';
import { safetyPolicyManager } from '@/lib/managers/SafetyPolicyManager';

const POLICY_INCLUDES = {
  acknowledgments: {
    include: {
      driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { policyName: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [policies, totalCount] = await Promise.all([
      prisma.safetyPolicy.findMany({
        where,
        include: POLICY_INCLUDES,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.safetyPolicy.count({ where }),
    ]);

    return NextResponse.json({
      data: policies,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching safety policies:', error);
    return NextResponse.json({ error: 'Failed to fetch safety policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSafetyPolicySchema.parse(body);
    const policy = await safetyPolicyManager.createPolicy(session.user.companyId, parsed);

    return NextResponse.json({ data: policy }, { status: 201 });
  } catch (error) {
    console.error('Error creating safety policy:', error);
    return NextResponse.json({ error: 'Failed to create safety policy' }, { status: 500 });
  }
}
