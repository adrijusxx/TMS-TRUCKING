import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    const where: any = {
      companyId: session.user.companyId
    };

    const [nearMisses, total] = await Promise.all([
      prisma.nearMiss.findMany({
        where,
        include: {
          driver: {
            include: {
              user: true
            }
          },
          truck: true
        },
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.nearMiss.count({ where })
    ]);

    return NextResponse.json({
      nearMisses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching near misses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch near misses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const nearMiss = await prisma.nearMiss.create({
      data: {
        companyId: session.user.companyId,
        driverId: body.driverId,
        truckId: body.truckId,
        reportDate: new Date(body.reportDate),
        location: body.location,
        description: body.description,
        contributingFactors: body.contributingFactors,
        suggestions: body.suggestions,
        patternIdentified: body.patternIdentified || false,
        trainingNeeded: body.trainingNeeded || false,
        policyChangeNeeded: body.policyChangeNeeded || false,
        actionItems: body.actionItems,
        isAnonymous: body.isAnonymous || false,
        reportedBy: body.isAnonymous ? null : session.user.id
      },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        truck: true
      }
    });

    return NextResponse.json({ nearMiss }, { status: 201 });
  } catch (error) {
    console.error('Error creating near miss:', error);
    return NextResponse.json(
      { error: 'Failed to create near miss' },
      { status: 500 }
    );
  }
}

