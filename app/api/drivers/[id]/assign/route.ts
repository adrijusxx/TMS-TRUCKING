import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DriverAssignmentManager } from '@/lib/managers/DriverAssignmentManager';

const assignDriverSchema = z.object({
  currentTruckId: z.string().cuid().nullable().optional(),
  currentTrailerId: z.string().cuid().nullable().optional(),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const role = session.user.role as string;
    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators and dispatchers can change driver assignments' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = assignDriverSchema.parse(body);

    const updatedDriver = await DriverAssignmentManager.assignEquipment(
      prisma,
      id,
      session.user.companyId,
      {
        newTruckId: validated.currentTruckId,
        newTrailerId: validated.currentTrailerId,
        reason: validated.reason,
      }
    );

    return NextResponse.json({ success: true, data: updatedDriver });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Something went wrong';
    const isNotFound = message.includes('not found');
    console.error('Driver assignment error:', error);
    return NextResponse.json(
      { success: false, error: { code: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR', message } },
      { status: isNotFound ? 404 : 500 }
    );
  }
}


























