import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DOTAuditService } from '@/lib/services/safety/DOTAuditService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const { searchParams } = new URL(request.url);
    const includeGaps = searchParams.get('includeGaps') === 'true';

    const service = new DOTAuditService(prisma, session.user.companyId);
    const auditPackage = await service.generateAuditPackage(driverId);

    let gaps = null;
    if (includeGaps) {
      gaps = await service.getGapAnalysis(driverId);
    }

    return NextResponse.json({ data: { ...auditPackage, gaps } });
  } catch (error) {
    console.error('Error generating audit package:', error);
    return NextResponse.json({ error: 'Failed to generate audit package' }, { status: 500 });
  }
}
