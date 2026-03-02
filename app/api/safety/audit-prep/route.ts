import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DOTAuditService } from '@/lib/services/safety/DOTAuditService';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new DOTAuditService(prisma, session.user.companyId);
    const readiness = await service.getAuditReadiness(session.user.companyId);

    return NextResponse.json({ data: readiness });
  } catch (error) {
    console.error('Error fetching audit readiness:', error);
    return NextResponse.json({ error: 'Failed to fetch audit readiness' }, { status: 500 });
  }
}
