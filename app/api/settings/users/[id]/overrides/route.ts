import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleApiError, successResponse, getRequestBody } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { PermissionResolutionEngine } from '@/lib/managers/PermissionResolutionEngine';
import { z } from 'zod';

const createOverrideSchema = z.object({
  permission: z.string().min(1),
  type: z.enum(['GRANT', 'REVOKE']),
  reason: z.string().max(500).optional(),
});

const deleteOverrideSchema = z.object({
  permission: z.string().min(1),
});

/**
 * GET /api/settings/users/[id]/overrides — Get user's permission overrides
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const overrides = await prisma.userPermissionOverride.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(overrides);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/settings/users/[id]/overrides — Add permission override
 */
export const POST = withPermission('users.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await getRequestBody(request);
    const data = createOverrideSchema.parse(body);

    const override = await prisma.userPermissionOverride.upsert({
      where: {
        userId_permission: { userId: id, permission: data.permission },
      },
      update: {
        type: data.type,
        reason: data.reason,
        grantedBy: session.user.id,
      },
      create: {
        userId: id,
        permission: data.permission,
        type: data.type,
        reason: data.reason,
        grantedBy: session.user.id,
      },
    });

    PermissionResolutionEngine.invalidateUser(id);

    return successResponse(override, 201);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * DELETE /api/settings/users/[id]/overrides — Remove permission override
 */
export const DELETE = withPermission('users.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await getRequestBody(request);
    const data = deleteOverrideSchema.parse(body);

    await prisma.userPermissionOverride.deleteMany({
      where: { userId: id, permission: data.permission },
    });

    PermissionResolutionEngine.invalidateUser(id);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
});
