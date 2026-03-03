import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ProjectStatus, ProjectPriority } from '@prisma/client';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tasks: {
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  return successResponse(project);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const existing = await prisma.project.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Project');
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.project.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Project');
  }

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return successResponse({ message: 'Project deleted successfully' });
});
