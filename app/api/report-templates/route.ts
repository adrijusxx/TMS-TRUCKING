import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ReportType, ReportFormat, Prisma } from '@prisma/client';

const createReportTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(ReportType),
  description: z.string().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  template: z.any(),
  fields: z.any().optional(),
  filters: z.any().optional(),
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

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    const templates = await prisma.reportTemplate.findMany({
      where,
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Report templates fetch error:', error);
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
    const validatedData = createReportTemplateSchema.parse(body);

    const existing = await prisma.reportTemplate.findFirst({
      where: {
        companyId: session.user.companyId,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Report template already exists' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.reportTemplate.updateMany({
        where: {
          companyId: session.user.companyId,
          type: validatedData.type,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.reportTemplate.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        format: validatedData.format ?? ReportFormat.PDF,
        template: typeof validatedData.template === 'string' ? validatedData.template : JSON.stringify(validatedData.template),
        fields: validatedData.fields ? JSON.stringify(validatedData.fields) : Prisma.JsonNull,
        filters: validatedData.filters ? JSON.stringify(validatedData.filters) : Prisma.JsonNull,
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
    console.error('Report template create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
