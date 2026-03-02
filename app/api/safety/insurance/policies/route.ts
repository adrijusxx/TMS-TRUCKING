import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createInsurancePolicySchema } from '@/lib/validations/insurance-policy';

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
    const policyType = searchParams.get('policyType');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (policyType) where.policyType = policyType;
    if (search) {
      where.OR = [
        { policyNumber: { contains: search, mode: 'insensitive' } },
        { insuranceCompany: { contains: search, mode: 'insensitive' } },
        { agentName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [policies, totalCount] = await Promise.all([
      prisma.insurancePolicy.findMany({
        where,
        include: {
          claims: { select: { id: true, claimNumber: true, status: true } },
          certificates: { select: { id: true } },
        },
        orderBy: { renewalDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.insurancePolicy.count({ where }),
    ]);

    return NextResponse.json({
      data: policies,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createInsurancePolicySchema.parse(body);

    const policy = await prisma.insurancePolicy.create({
      data: {
        companyId: session.user.companyId,
        policyType: parsed.policyType,
        policyNumber: parsed.policyNumber,
        insuranceCompany: parsed.insuranceCompany,
        agentName: parsed.agentName ?? undefined,
        agentPhone: parsed.agentPhone ?? undefined,
        agentEmail: parsed.agentEmail ?? undefined,
        coverageLimit: parsed.coverageLimit ?? undefined,
        deductible: parsed.deductible ?? undefined,
        effectiveDate: parsed.effectiveDate,
        renewalDate: parsed.renewalDate,
      },
    });

    return NextResponse.json({ data: policy }, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance policy:', error);
    return NextResponse.json({ error: 'Failed to create insurance policy' }, { status: 500 });
  }
}
