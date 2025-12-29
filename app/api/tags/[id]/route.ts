import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const tag = await prisma.tag.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    console.error('Tag fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateTagSchema.parse(body);

    const existing = await prisma.tag.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({
        where: {
          companyId: session.user.companyId,
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Tag name already exists' } },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id: id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Tag update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const existing = await prisma.tag.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    await prisma.tag.update({
      where: { id: id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
