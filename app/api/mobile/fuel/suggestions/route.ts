import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { FuelSuggestionManager } from '@/lib/managers/FuelSuggestionManager';
import { getSamsaraVehicleStats } from '@/lib/integrations/samsara/telematics';

/**
 * GET /api/mobile/fuel/suggestions
 *
 * Query params:
 *   loadId (required) — active load
 *   lat, lng (required) — driver's current position
 *   fuelPercent (optional) — override Samsara fuel level
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });
    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const fuelPercentParam = searchParams.get('fuelPercent');

    if (!loadId || !lat || !lng) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'loadId, lat, and lng required' } },
        { status: 400 }
      );
    }

    // Verify driver owns this load
    const load = await prisma.load.findFirst({
      where: { id: loadId, driverId: driver.id, deletedAt: null },
      include: { truck: { select: { samsaraId: true, companyId: true } } },
    });
    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Get fuel level from Samsara if not provided
    let fuelPercent = fuelPercentParam ? parseFloat(fuelPercentParam) : undefined;
    if (fuelPercent == null && load.truck?.samsaraId) {
      const stats = await getSamsaraVehicleStats(
        [load.truck.samsaraId],
        load.truck.companyId
      );
      if (stats?.[0]?.fuelPercent != null) {
        fuelPercent = stats[0].fuelPercent;
      }
    }

    const manager = new FuelSuggestionManager();
    const suggestions = await manager.getSmartSuggestions(
      loadId,
      parseFloat(lat),
      parseFloat(lng),
      fuelPercent
    );

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        fuelPercent: fuelPercent ?? null,
      },
    });
  } catch (error) {
    console.error('Fuel suggestions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
