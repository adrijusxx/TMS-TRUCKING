import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRecognitionSchema } from '@/lib/validations/safety-recognition';

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

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    const [recognitions, totalCount] = await Promise.all([
      prisma.safetyRecognition.findMany({
        where,
        include: {
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { recognitionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.safetyRecognition.count({ where }),
    ]);

    return NextResponse.json({
      data: recognitions,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching recognitions:', error);
    return NextResponse.json({ error: 'Failed to fetch recognitions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRecognitionSchema.parse(body);

    const recognition = await prisma.safetyRecognition.create({
      data: {
        companyId: session.user.companyId,
        driverId: parsed.driverId,
        recognitionType: parsed.recognitionType,
        achievement: parsed.achievement,
        recognitionDate: parsed.recognitionDate,
        awardAmount: parsed.awardAmount ?? undefined,
      },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return NextResponse.json({ data: recognition }, { status: 201 });
  } catch (error) {
    console.error('Error creating recognition:', error);
    return NextResponse.json({ error: 'Failed to create recognition' }, { status: 500 });
  }
}
