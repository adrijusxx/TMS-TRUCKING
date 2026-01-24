import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SettlementManager } from '@/lib/managers/SettlementManager';

const generateSettlementSchema = z.object({
  driverId: z.string().cuid(),
  loadIds: z.array(z.string().cuid()).min(1, 'At least one load is required'),
  settlementNumber: z.string().optional(),
  deductions: z.number().min(0).default(0), // Kept for schema compatibility, but ignored in favor of Manager logic
  advances: z.number().min(0).default(0),   // Kept for schema compatibility, but ignored in favor of Manager logic
  notes: z.string().optional(),
});

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
    const validated = generateSettlementSchema.parse(body);

    // Fetch loads to determine period dates
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        driverId: validated.driverId,
        companyId: session.user.companyId,
      },
      select: {
        deliveryDate: true,
        pickupDate: true,
      }
    });

    if (loads.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No valid loads found' } },
        { status: 404 }
      );
    }

    // Determine period from loads
    const loadDates = loads
      .map((l) => l.deliveryDate || l.pickupDate)
      .filter((d): d is Date => d !== null && d instanceof Date);

    const periodStart = loadDates.length > 0
      ? new Date(Math.min(...loadDates.map((d) => d.getTime())))
      : new Date();
    const periodEnd = loadDates.length > 0
      ? new Date(Math.max(...loadDates.map((d) => d.getTime())))
      : new Date();

    // Use SettlementManager to generate settlement
    // This ensures consistent logic with the Preview and single-generation flows
    const manager = new SettlementManager();
    const settlement = await manager.generateSettlement({
      driverId: validated.driverId,
      periodStart,
      periodEnd,
      settlementNumber: validated.settlementNumber,
      notes: validated.notes,
      loadIds: validated.loadIds, // Pass explicit load IDs
      forceIncludeNotReady: true, // Trust frontend validation since we are passing specific IDs
    });

    console.log(`[Settlement Generate] Successfully generated settlement via Manager: ${settlement?.settlementNumber}`);

    return NextResponse.json(
      {
        success: true,
        data: settlement,
        message: 'Settlement generated successfully',
      },
      { status: 201 }
    );

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

    console.error('Settlement generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

