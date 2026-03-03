import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse, paginatedResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { ConflictError } from '@/lib/errors';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const GET = withAuth(async (request: NextRequest, session) => {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const skip = (page - 1) * limit;

  const where: any = {
    companyId: session.user.companyId,
    deletedAt: null,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.tag.count({ where }),
  ]);

  return paginatedResponse(tags, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const validatedData = createTagSchema.parse(body);

    const existing = await prisma.tag.findFirst({
      where: {
        companyId: session.user.companyId,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictError('Tag already exists');
    }

    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
      },
    });

    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});
