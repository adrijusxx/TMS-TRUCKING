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
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
    };

    if (search) {
      where.OR = [
        { materialName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [materials, totalCount] = await Promise.all([
      prisma.trainingMaterial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trainingMaterial.count({ where }),
    ]);

    return NextResponse.json({
      data: materials,
      meta: { totalCount, totalPages: Math.ceil(totalCount / limit), page, pageSize: limit },
    });
  } catch (error) {
    console.error('Error fetching training materials:', error);
    return NextResponse.json({ error: 'Failed to fetch training materials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const material = await prisma.trainingMaterial.create({
      data: {
        companyId: session.user.companyId,
        materialName: body.materialName || body.title,
        category: body.category ?? 'GENERAL',
        description: body.description ?? undefined,
        materialType: body.materialType ?? 'DOCUMENT',
        documentId: body.documentId,
      },
    });

    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    console.error('Error creating training material:', error);
    return NextResponse.json({ error: 'Failed to create training material' }, { status: 500 });
  }
}
