import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { LiveMapService } from '@/lib/maps/live-map-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const service = new LiveMapService(session.user.companyId);
    const data = await service.getSnapshot();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Live map error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to load live map data' },
      },
      { status: 500 }
    );
  }
}

