import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCustomFieldSchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL']).optional(),
  entityType: z.enum(['LOAD', 'DRIVER', 'CUSTOMER', 'TRUCK', 'TRAILER', 'INVOICE']).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const customField = await prisma.customField.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!customField) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Custom field not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customField,
        options: customField.options ? (customField.options as any) : undefined,
      },
    });
  } catch (error) {
    console.error('Get custom field error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateCustomFieldSchema.parse(body);

    // Check if field exists and belongs to company
    const existing = await prisma.customField.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Custom field not found' },
        },
        { status: 404 }
      );
    }

    // If name or entityType is being changed, check for duplicates
    if (validated.name || validated.entityType) {
      const newName = validated.name || existing.name;
      const newEntityType = validated.entityType || existing.entityType;

      if (newName !== existing.name || newEntityType !== existing.entityType) {
      const duplicate = await prisma.customField.findFirst({
        where: {
          companyId: session.user.companyId,
          name: newName,
          entityType: newEntityType,
        },
      });

        if (duplicate && duplicate.id !== id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'DUPLICATE_FIELD',
                message: `A custom field with name "${newName}" already exists for ${newEntityType}`,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.label !== undefined) updateData.label = validated.label;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.entityType !== undefined) updateData.entityType = validated.entityType;
    if (validated.required !== undefined) updateData.required = validated.required;
    if (validated.defaultValue !== undefined) updateData.defaultValue = validated.defaultValue;
    if (validated.options !== undefined) updateData.options = validated.options.length > 0 ? validated.options : null;
    if (validated.placeholder !== undefined) updateData.placeholder = validated.placeholder;
    if (validated.helpText !== undefined) updateData.helpText = validated.helpText;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.order !== undefined) updateData.order = validated.order;

    const customField = await prisma.customField.update({
      where: { id },
      data: updateData,
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

    console.error('Update custom field error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const customField = await prisma.customField.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!customField) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Custom field not found' },
        },
        { status: 404 }
      );
    }

    await prisma.customField.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    console.error('Delete custom field error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

