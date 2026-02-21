import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { FleetInventoryManager } from '@/lib/managers/fleet-monitoring/FleetInventoryManager';

/**
 * GET /api/fleet/monitoring/inventory
 * Paginated fleet inventory with monitoring enrichments (last load, Samsara location, OOS info)
 */
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
    const type = searchParams.get('type') || 'truck';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || (type === 'truck' ? 'truckNumber' : 'trailerNumber');
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const mcNumberId = searchParams.get('mcNumberId') || undefined;

    const manager = new FleetInventoryManager(session.user.companyId);
    const params = { page, limit, sortBy, sortOrder, status, search, mcNumberId };

    const data = type === 'trailer'
      ? await manager.getTrailerInventory(params)
      : await manager.getTruckInventory(params);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching fleet inventory:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch inventory' } },
      { status: 500 }
    );
  }
}
