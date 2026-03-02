import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { safetyTaskManager } from '@/lib/managers/SafetyTaskManager';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { locked } = await request.json();

    const task = await safetyTaskManager.toggleLock(id, session.user.companyId, locked);
    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Error toggling safety task lock:', error);
    return NextResponse.json({ error: 'Failed to toggle safety task lock' }, { status: 500 });
  }
}
