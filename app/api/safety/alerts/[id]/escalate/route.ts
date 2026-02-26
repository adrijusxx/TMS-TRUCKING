import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertService } from '@/lib/services/safety/AlertService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const alertService = new AlertService(prisma, session.user.companyId);
    const alert = await alertService.escalateAlert(id);

    return NextResponse.json({ data: alert });
  } catch (error) {
    console.error('Error escalating alert:', error);
    return NextResponse.json(
      { error: 'Failed to escalate alert' },
      { status: 500 }
    );
  }
}
