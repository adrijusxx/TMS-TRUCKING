import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIComplianceMonitor } from '@/lib/services/AIComplianceMonitor';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const monitor = new AIComplianceMonitor();
    const result = await monitor.getComplianceRisk(session.user.companyId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Compliance Monitor error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get compliance risk',
        },
      },
      { status: 500 }
    );
  }
}



