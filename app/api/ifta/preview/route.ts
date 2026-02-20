/**
 * IFTA Calculation Preview API
 *
 * Returns a count and summary of loads that qualify for IFTA calculation
 * in a given quarter, before actually running the calculation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const previewSchema = z.object({
  quarter: z.coerce.number().min(1).max(4),
  year: z.coerce.number().min(2020).max(2100),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  forceRecalculate: z.coerce.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'ifta.calculate'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = previewSchema.parse({
      quarter: searchParams.get('quarter'),
      year: searchParams.get('year'),
      driverId: searchParams.get('driverId') || undefined,
      truckId: searchParams.get('truckId') || undefined,
      forceRecalculate: searchParams.get('forceRecalculate') || 'false',
    });

    const companyId = session.user.companyId;
    const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
    const periodStart = new Date(params.year, monthMap[params.quarter], 1);
    const periodEnd = new Date(params.year, monthMap[params.quarter] + 3, 0);

    // Build where clause — cast to `any` so dynamic driverId/truckId overrides don't strip type inference
    const where: any = {
      companyId,
      deletedAt: null,
      driverId: { not: null },
      OR: [
        { deliveredAt: { gte: periodStart, lte: periodEnd } },
        { deliveryDate: { gte: periodStart, lte: periodEnd } },
      ],
    };

    if (params.driverId) where.driverId = params.driverId;
    if (params.truckId) where.truckId = params.truckId;

    const loads = await prisma.load.findMany({
      where,
      select: {
        id: true,
        loadNumber: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        driverId: true,
        driver: { select: { user: { select: { firstName: true, lastName: true } } } },
        truckId: true,
        truck: { select: { truckNumber: true } },
        iftaEntry: { select: { id: true, isCalculated: true } },
      },
      orderBy: { loadNumber: 'asc' },
    });

    const alreadyCalculated = loads.filter((l) => l.iftaEntry?.isCalculated);
    const pending = loads.filter((l) => !l.iftaEntry?.isCalculated);
    const missingLocation = loads.filter(
      (l) => !l.pickupCity || !l.pickupState || !l.deliveryCity || !l.deliveryState
    );

    const toProcess = params.forceRecalculate ? loads.length : pending.length;

    return NextResponse.json({
      success: true,
      data: {
        quarter: params.quarter,
        year: params.year,
        totalLoads: loads.length,
        alreadyCalculated: alreadyCalculated.length,
        pendingCalculation: pending.length,
        missingLocation: missingLocation.length,
        toProcess,
        loads: loads.slice(0, 50).map((l) => ({
          id: l.id,
          loadNumber: l.loadNumber,
          route: `${l.pickupCity || '?'}, ${l.pickupState || '?'} → ${l.deliveryCity || '?'}, ${l.deliveryState || '?'}`,
          driver: l.driver?.user ? `${l.driver.user.firstName} ${l.driver.user.lastName}` : 'N/A',
          truck: l.truck?.truckNumber || 'N/A',
          calculated: l.iftaEntry?.isCalculated || false,
          missingLocation: !l.pickupCity || !l.pickupState || !l.deliveryCity || !l.deliveryState,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('IFTA preview error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.issues } },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
