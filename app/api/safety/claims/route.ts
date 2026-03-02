import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CLAIM_INCLUDES = {
  driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  truck: { select: { id: true, truckNumber: true } },
  trailer: { select: { id: true, trailerNumber: true } },
  incident: { select: { id: true, incidentNumber: true } },
  policy: { select: { id: true, policyNumber: true } },
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
    const status = searchParams.get('status');
    const claimType = searchParams.get('claimType');
    const search = searchParams.get('search');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (claimType) where.claimType = claimType;

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { adjusterName: { contains: search, mode: 'insensitive' } },
        { insuranceCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [claims, totalCount] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        include: CLAIM_INCLUDES,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    return NextResponse.json({
      data: claims,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance claims' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const claim = await prisma.insuranceClaim.create({
      data: {
        companyId: session.user.companyId,
        claimNumber: body.claimNumber || `CLM-${Date.now()}`,
        claimType: body.claimType,
        dateOfLoss: new Date(body.dateOfLoss),
        insuranceCompany: body.insuranceCompany,
        adjusterName: body.adjusterName,
        adjusterPhone: body.adjusterPhone,
        adjusterEmail: body.adjusterEmail,
        policyId: body.policyId,
        incidentId: body.incidentId,
        driverId: body.driverId,
        truckId: body.truckId,
        trailerId: body.trailerId,
        hasPoliceReport: body.hasPoliceReport ?? false,
        hasTowing: body.hasTowing ?? false,
        recordable: body.recordable ?? false,
        coverageType: body.coverageType,
        estimatedLoss: body.estimatedLoss,
        driverCompStatus: body.driverCompStatus,
        driverAmount: body.driverAmount,
        vendorCompStatus: body.vendorCompStatus,
        vendorAmount: body.vendorAmount,
        totalCharge: body.totalCharge,
        totalFee: body.totalFee,
        status: body.status || 'OPEN',
      },
      include: CLAIM_INCLUDES,
    });

    return NextResponse.json({ data: claim }, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    return NextResponse.json({ error: 'Failed to create insurance claim' }, { status: 500 });
  }
}
