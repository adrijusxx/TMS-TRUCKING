/**
 * IFTA Calculation API
 *
 * Processes loads directly via Google Maps routing to calculate state-by-state mileage.
 * Supports optional driver/truck filters and force recalculate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { iftaCalculatorService } from '@/lib/services/IFTACalculatorService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const calculateSchema = z.object({
  quarter: z.number().min(1).max(4),
  year: z.number().min(2020).max(2100),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  forceRecalculate: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { quarter, year, driverId, truckId, forceRecalculate } = calculateSchema.parse(body);
    const companyId = session.user.companyId;

    // Always use direct calculation so we can return real results to the UI.
    // Inngest is used for scheduled cron jobs only.
    const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
    const periodStart = new Date(year, monthMap[quarter], 1);
    const periodEnd = new Date(year, monthMap[quarter] + 3, 0);

    const where: any = {
      companyId,
      deletedAt: null,
      driverId: { not: null },
      OR: [
        { deliveredAt: { gte: periodStart, lte: periodEnd } },
        { deliveryDate: { gte: periodStart, lte: periodEnd } },
      ],
    };

    if (driverId) where.driverId = driverId;
    if (truckId) where.truckId = truckId;

    const loads = await prisma.load.findMany({
      where,
      select: {
        id: true,
        loadNumber: true,
        iftaEntry: { select: { id: true, isCalculated: true } },
      },
    });

    let calculated = 0;
    let skipped = 0;
    let errors = 0;

    for (const load of loads) {
      if (!forceRecalculate && load.iftaEntry?.isCalculated) {
        skipped++;
        continue;
      }
      try {
        await iftaCalculatorService.calculateAndStoreForLoad(load.id, companyId, quarter, year);
        calculated++;
      } catch (err) {
        errors++;
        console.error(`IFTA calc error for load ${load.loadNumber}:`, err instanceof Error ? err.message : err);
      }
    }

    const parts = [`${calculated} calculated`];
    if (skipped > 0) parts.push(`${skipped} skipped (already done)`);
    if (errors > 0) parts.push(`${errors} errors`);

    return NextResponse.json({
      success: true,
      data: {
        message: `Q${quarter} ${year}: ${parts.join(', ')}`,
        quarter,
        year,
        totalLoads: loads.length,
        calculated,
        skipped,
        errors,
      },
    });
  } catch (error: unknown) {
    console.error('Error triggering IFTA calculation:', error);

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
