import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'trailers.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const ownership = searchParams.get('ownership');

    const where: any = {
      ...mcWhere,
      deletedAt: null,
      isActive: true,
      ...(ownership && { ownership }),
      ...(search && {
        OR: [
          { trailerNumber: { contains: search, mode: 'insensitive' } },
          { vin: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [trailers, totalCount] = await Promise.all([
      prisma.trailer.findMany({
        where,
        select: {
          id: true,
          trailerNumber: true,
          make: true,
          model: true,
          year: true,
          ownership: true,
          registrationExpiry: true,
          insuranceExpiry: true,
          inspectionExpiry: true,
          mcNumber: { select: { id: true, companyName: true } },
        },
        orderBy: { trailerNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.trailer.count({ where }),
    ]);

    const data = trailers.map((trailer) => ({
      id: trailer.id,
      trailerNumber: trailer.trailerNumber,
      name: [trailer.year, trailer.make, trailer.model].filter(Boolean).join(' '),
      ownership: trailer.ownership || 'Company',
      mcNumber: trailer.mcNumber?.companyName || null,
      insuranceExpiry: trailer.insuranceExpiry,
      registrationExpiry: trailer.registrationExpiry,
      inspectionExpiry: trailer.inspectionExpiry,
    }));

    return NextResponse.json({
      data,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('[TRAILER_COMPLIANCE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch trailer compliance' }, { status: 500 });
  }
}
