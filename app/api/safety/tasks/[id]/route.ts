import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { safetyTaskManager } from '@/lib/managers/SafetyTaskManager';
import { updateSafetyTaskSchema } from '@/lib/validations/safety-task';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const task = await prisma.safetyTask.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        truck: { select: { id: true, truckNumber: true } },
        trailer: { select: { id: true, trailerNumber: true } },
        mcNumber: { select: { id: true, number: true, companyName: true } },
        load: { select: { id: true, loadNumber: true } },
        documents: true,
        incident: true,
        roadsideInspection: true,
        insuranceClaim: true,
        citation: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Safety task not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Error fetching safety task:', error);
    return NextResponse.json({ error: 'Failed to fetch safety task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSafetyTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
    }

    const task = await safetyTaskManager.updateTask(id, session.user.companyId, parsed.data);
    return NextResponse.json({ data: task });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update safety task';
    console.error('Error updating safety task:', error);
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await safetyTaskManager.deleteTask(id, session.user.companyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete safety task';
    console.error('Error deleting safety task:', error);
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 400 });
  }
}
