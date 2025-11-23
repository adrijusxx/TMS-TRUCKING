import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL']),
  entityType: z.enum(['LOAD', 'DRIVER', 'CUSTOMER', 'TRUCK', 'TRAILER', 'INVOICE']),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
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

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    const customFields = await prisma.customField.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Convert options from JSON to array
    const fields = customFields.map((field) => ({
      ...field,
      options: field.options ? (field.options as any) : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error('Get custom fields error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
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
    const validated = customFieldSchema.parse(body);

    // Check if field with same name and entityType already exists
    const existing = await prisma.customField.findFirst({
      where: {
        companyId: session.user.companyId,
        name: validated.name,
        entityType: validated.entityType,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_FIELD',
            message: `A custom field with name "${validated.name}" already exists for ${validated.entityType}`,
          },
        },
        { status: 400 }
      );
    }

    // Get max order for this entity type
    const maxOrderField = await prisma.customField.findFirst({
      where: {
        companyId: session.user.companyId,
        entityType: validated.entityType,
      },
      orderBy: { order: 'desc' },
    });

    const customField = await prisma.customField.create({
      data: {
        companyId: session.user.companyId,
        name: validated.name,
        label: validated.label,
        type: validated.type,
        entityType: validated.entityType,
        required: validated.required ?? false,
        defaultValue: validated.defaultValue,
        options: validated.options || undefined,
        placeholder: validated.placeholder,
        helpText: validated.helpText,
        isActive: validated.isActive ?? true,
        order: validated.order ?? (maxOrderField ? maxOrderField.order + 1 : 0),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...customField,
        options: customField.options ? (customField.options as any) : undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Create custom field error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

