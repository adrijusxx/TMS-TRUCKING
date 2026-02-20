import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/loads/document-status?loadIds=id1,id2,id3
 * Returns document availability (POD, BOL, Rate Con) for each load.
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
    const loadIdsParam = searchParams.get('loadIds');
    if (!loadIdsParam) {
      return NextResponse.json({ success: true, data: {} });
    }

    const loadIds = loadIdsParam.split(',').filter(Boolean);
    if (loadIds.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Fetch documents grouped by loadId and type
    const documents = await prisma.document.findMany({
      where: {
        loadId: { in: loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
        fileUrl: { not: '' },
      },
      select: {
        loadId: true,
        type: true,
      },
    });

    // Also check for rate confirmations via the RateConfirmation model
    const rateConfirmations = await prisma.rateConfirmation.findMany({
      where: {
        loadId: { in: loadIds },
      },
      select: { loadId: true },
    });
    const rcLoadIds = new Set(rateConfirmations.map((rc) => rc.loadId));

    // Build status map per load
    const statusMap: Record<string, { hasPOD: boolean; hasBOL: boolean; hasRateCon: boolean }> = {};

    for (const loadId of loadIds) {
      statusMap[loadId] = { hasPOD: false, hasBOL: false, hasRateCon: rcLoadIds.has(loadId) };
    }

    for (const doc of documents) {
      if (!doc.loadId || !statusMap[doc.loadId]) continue;
      if (doc.type === 'POD') statusMap[doc.loadId].hasPOD = true;
      if (doc.type === 'BOL') statusMap[doc.loadId].hasBOL = true;
      if (doc.type === 'RATE_CONFIRMATION') statusMap[doc.loadId].hasRateCon = true;
    }

    return NextResponse.json({ success: true, data: statusMap });
  } catch (error) {
    console.error('Document status check error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
