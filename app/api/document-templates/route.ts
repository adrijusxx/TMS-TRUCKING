import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { DocumentType, Prisma } from '@prisma/client';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(DocumentType),
  description: z.string().optional(),
  content: z.string().min(1),
  variables: z.any().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const where: any = {
      ...mcWhere,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Document templates fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        ...mcWhere,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Template already exists' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.documentTemplate.updateMany({
        where: {
          ...mcWhere,
          type: validatedData.type,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.documentTemplate.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        variables: validatedData.variables ? JSON.stringify(validatedData.variables) : Prisma.JsonNull,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Document template create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
