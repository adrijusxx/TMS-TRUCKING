import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { LiveMapService } from '@/lib/maps/live-map-service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    console.log('[API] Starting live map snapshot for company:', session.user.companyId);
    const service = new LiveMapService(session.user.companyId);
    const data = await service.getSnapshot();
    const duration = Date.now() - startTime;

    console.log('[API] Live map snapshot completed:', {
      duration: `${duration}ms`,
      loads: data.loads?.length || 0,
      trucks: data.trucks?.length || 0,
      trailers: data.trailers?.length || 0,
      trailersWithLocations: data.trailers?.filter(t => t.location).length || 0,
    });

    // Check if Samsara key is actually configured for this company
    // (We do this check separately to avoid full config load overhead if possible, 
    // but getSamsaraConfig is safe)
    const { getSamsaraConfig } = await import('@/lib/integrations/samsara');
    const config = await getSamsaraConfig(session.user.companyId);

    console.log('[API] Samsara Config Check:', {
      hasConfig: !!config,
      hasApiKey: !!config?.apiKey,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        samsaraConfigured: !!config?.apiKey,
        samsaraVehiclesFound: data.trucks?.some(t => t.matchSource?.includes('samsara')) || false,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[API] Live map error after', `${duration}ms:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to load live map data' },
      },
      { status: 500 }
    );
  }
}

