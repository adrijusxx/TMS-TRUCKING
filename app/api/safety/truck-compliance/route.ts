import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'trucks.view')) {
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
          { truckNumber: { contains: search, mode: 'insensitive' } },
          { vin: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [trucks, totalCount] = await Promise.all([
      prisma.truck.findMany({
        where,
        select: {
          id: true,
          truckNumber: true,
          make: true,
          model: true,
          year: true,
          ownership: true,
          registrationExpiry: true,
          insuranceExpiry: true,
          inspectionExpiry: true,
          mcNumber: { select: { id: true, companyName: true } },
          documents: {
            where: { deletedAt: null, type: { in: ['REGISTRATION', 'INSURANCE', 'INSPECTION'] } },
            select: { id: true, type: true, expiryDate: true, fileName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { truckNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.truck.count({ where }),
    ]);

    const data = trucks.map((truck) => {
      const regDoc = truck.documents.find((d) => d.type === 'REGISTRATION');
      const insDoc = truck.documents.find((d) => d.type === 'INSURANCE');
      const inspDoc = truck.documents.find((d) => d.type === 'INSPECTION');

      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        name: `${truck.year} ${truck.make} ${truck.model}`,
        ownership: truck.ownership || 'Company',
        mcNumber: truck.mcNumber?.companyName || null,
        registrationExpiry: truck.registrationExpiry,
        registrationUploaded: !!regDoc,
        insuranceExpiry: truck.insuranceExpiry,
        insuranceUploaded: !!insDoc,
        inspectionExpiry: truck.inspectionExpiry,
        inspectionUploaded: !!inspDoc,
      };
    });

    return NextResponse.json({
      data,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('[TRUCK_COMPLIANCE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch truck compliance' }, { status: 500 });
  }
}
