import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSamsaraGeofences, transformSamsaraGeofences } from '@/lib/integrations/samsara/geofences';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const addresses = await getSamsaraGeofences(session.user.companyId);
    const geofences = transformSamsaraGeofences(addresses);

    return NextResponse.json({ success: true, data: geofences });
  } catch (error) {
    console.error('[API] Geofences error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
