import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getSamsaraVehicleLocationHistory, getSamsaraVehicles } from '@/lib/integrations/samsara';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get all Samsara vehicles for the company
    const vehicles = await getSamsaraVehicles(session.user.companyId);
    if (!vehicles?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const vehicleIds = vehicles.map(v => v.id);
    const history = await getSamsaraVehicleLocationHistory(
      vehicleIds,
      session.user.companyId,
      2 // last 2 hours
    );

    // Return with Samsara vehicle names so client can match by truck number
    const data = (history || []).map(entry => {
      const vehicle = vehicles.find(v => v.id === entry.vehicleId);
      return {
        vehicleId: entry.vehicleId,
        vehicleName: vehicle?.name || '',
        points: entry.points,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] Trail history error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trail history' } },
      { status: 500 }
    );
  }
}
