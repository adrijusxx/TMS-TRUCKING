import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCitationSchema } from '@/lib/validations/citation';

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
    const driverId = searchParams.get('driverId');
    const search = searchParams.get('search');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (driverId) where.driverId = driverId;

    if (search) {
      where.OR = [
        { citationNumber: { contains: search, mode: 'insensitive' } },
        { citationType: { contains: search, mode: 'insensitive' } },
        { issuingAgency: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [citations, totalCount] = await Promise.all([
      prisma.citation.findMany({
        where,
        include: {
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          truck: { select: { id: true, truckNumber: true } },
          trailer: { select: { id: true, trailerNumber: true } },
        },
        orderBy: { citationDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.citation.count({ where }),
    ]);

    return NextResponse.json({
      data: citations,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching citations:', error);
    return NextResponse.json({ error: 'Failed to fetch citations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const citation = await prisma.citation.create({
      data: {
        companyId: session.user.companyId,
        citationNumber: parsed.data.citationNumber,
        citationType: parsed.data.citationType,
        citationDate: parsed.data.citationDate,
        driverId: parsed.data.driverId ?? null,
        truckId: parsed.data.truckId ?? null,
        trailerId: parsed.data.trailerId ?? null,
        courtDate: parsed.data.courtDate ?? null,
        courtLocation: parsed.data.courtLocation ?? null,
        fineAmount: parsed.data.fineAmount ?? null,
        violationCode: parsed.data.violationCode ?? null,
        issuingAgency: parsed.data.issuingAgency ?? null,
        officerName: parsed.data.officerName ?? null,
        officerBadge: parsed.data.officerBadge ?? null,
        recordable: parsed.data.recordable ?? false,
        pointsAssessed: parsed.data.pointsAssessed ?? null,
      },
    });

    return NextResponse.json({ data: citation }, { status: 201 });
  } catch (error) {
    console.error('Error creating citation:', error);
    return NextResponse.json({ error: 'Failed to create citation' }, { status: 500 });
  }
}
