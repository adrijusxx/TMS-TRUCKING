import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ImportEquipmentAnalyzer } from '@/lib/managers/import/ImportEquipmentAnalyzer';

const SUGGESTION_INCLUDE = {
  driver: {
    select: {
      id: true,
      driverNumber: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  suggestedTruck: { select: { id: true, truckNumber: true } },
  suggestedTrailer: { select: { id: true, trailerNumber: true } },
  suggestedDispatcher: { select: { id: true, firstName: true, lastName: true } },
} as const;

/** POST: Trigger analysis for import batch IDs. GET: Fetch stored suggestions. */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const importBatchIds: string[] = body.importBatchIds;
    if (!importBatchIds?.length) {
      return NextResponse.json({ success: false, error: 'importBatchIds required' }, { status: 400 });
    }

    // Verify batches belong to this company
    const validBatches = await prisma.importBatch.findMany({
      where: { id: { in: importBatchIds }, companyId: session.user.companyId },
      select: { id: true },
    });
    const validIds = validBatches.map(b => b.id);
    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid batch IDs' }, { status: 404 });
    }

    const analyzer = new ImportEquipmentAnalyzer(prisma, session.user.companyId);
    await analyzer.analyzeAndPersist(validIds);

    // Fetch persisted suggestions with names
    const suggestions = await prisma.importAssignmentSuggestion.findMany({
      where: { importBatchId: validIds[0], companyId: session.user.companyId, status: 'PENDING' },
      include: SUGGESTION_INCLUDE,
      orderBy: { confidence: 'desc' },
    });

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('[analyze-assignments] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const importBatchId = searchParams.get('importBatchId');
    const status = searchParams.get('status') || 'PENDING';

    const where: any = { companyId: session.user.companyId, status };
    if (importBatchId) where.importBatchId = importBatchId;

    const suggestions = await prisma.importAssignmentSuggestion.findMany({
      where,
      include: SUGGESTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('[analyze-assignments] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
