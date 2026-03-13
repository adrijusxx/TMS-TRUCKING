import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DriverAssignmentManager } from '@/lib/managers/DriverAssignmentManager';

/** PATCH: Accept or dismiss a suggestion */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action as 'accept' | 'dismiss';
    const note = body.note as string | undefined;

    if (action !== 'accept' && action !== 'dismiss') {
      return NextResponse.json({ success: false, error: 'action must be accept or dismiss' }, { status: 400 });
    }

    const suggestion = await prisma.importAssignmentSuggestion.findFirst({
      where: { id, companyId: session.user.companyId, status: 'PENDING' },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, error: 'Suggestion not found or already processed' }, { status: 404 });
    }

    if (action === 'accept') {
      await applyAssignment(suggestion);
    }

    const updated = await prisma.importAssignmentSuggestion.update({
      where: { id },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DISMISSED',
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[suggestions] PATCH error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function applyAssignment(suggestion: {
  driverId: string;
  companyId: string;
  suggestionType: string;
  suggestedTruckId: string | null;
  suggestedTrailerId: string | null;
  suggestedDispatcherId: string | null;
}) {
  const opts: {
    newTruckId?: string | null;
    newTrailerId?: string | null;
    newDispatcherId?: string | null;
    reason?: string;
  } = { reason: 'Applied from import equipment suggestion' };

  switch (suggestion.suggestionType) {
    case 'TRUCK_CHANGE':
    case 'NEW_ASSIGNMENT':
      if (suggestion.suggestedTruckId) opts.newTruckId = suggestion.suggestedTruckId;
      if (suggestion.suggestedTrailerId) opts.newTrailerId = suggestion.suggestedTrailerId;
      break;
    case 'TRAILER_CHANGE':
      if (suggestion.suggestedTrailerId) opts.newTrailerId = suggestion.suggestedTrailerId;
      break;
    case 'DISPATCHER_LINK':
      if (suggestion.suggestedDispatcherId) opts.newDispatcherId = suggestion.suggestedDispatcherId;
      break;
  }

  await DriverAssignmentManager.assignEquipment(
    prisma,
    suggestion.driverId,
    suggestion.companyId,
    opts
  );
}
