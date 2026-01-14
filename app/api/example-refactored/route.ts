/**
 * Example refactored API route using new route helpers
 * This demonstrates the pattern for refactoring existing routes
 */
import { NextRequest } from 'next/server';
import { withPermission, withMcFilter, successResponse, paginatedResponse, getPaginationParams, validateRequest } from '@/lib/api/route-helpers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emitLoadStatusChanged } from '@/lib/realtime/emitEvent';

// Define validation schema
const createLoadSchema = z.object({
  loadNumber: z.string().min(1),
  customerId: z.string(),
  equipmentType: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT']),
  weight: z.number().positive(),
  revenue: z.number().positive(),
  status: z.enum(['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID', 'CANCELLED']).optional(),
});

/**
 * GET /api/example-refactored
 * Example of using route helpers for a GET endpoint
 */
export const GET = withPermission('loads:read', withMcFilter(async (request, session, mcWhere) => {
  const { page, limit } = getPaginationParams(request);
  const skip = (page - 1) * limit;

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where: {
        ...mcWhere,
        deletedAt: null,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        driver: true,
        truck: true,
      },
    }),
    prisma.load.count({
      where: {
        ...mcWhere,
        deletedAt: null,
      },
    }),
  ]);

  return paginatedResponse(loads, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}));

/**
 * POST /api/example-refactored
 * Example of using route helpers for a POST endpoint with validation
 */
export const POST = withPermission('loads:create', async (request, session) => {
  const body = await request.json();
  const data = validateRequest(createLoadSchema, body);

  const load = await prisma.load.create({
    data: {
      ...data,
      companyId: session.user.companyId,
      mcNumberId: session.user.mcNumberId,
      createdById: session.user.id,
    },
    include: {
      customer: true,
    },
  });

  // Emit real-time event
  emitLoadStatusChanged(load.id, load.status, load);

  return successResponse(load, 201);
});
























