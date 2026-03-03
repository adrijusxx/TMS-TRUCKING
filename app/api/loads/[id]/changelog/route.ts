import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { AuditTrailManager } from '@/lib/managers/AuditTrailManager';

/**
 * GET /api/loads/[id]/changelog
 * Fetch audit trail / change log for a specific load.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'loads.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { id: loadId } = await params;

    // Verify the load exists and belongs to this company
    const load = await prisma.load.findFirst({
      where: { id: loadId, companyId: session.user.companyId },
      select: { id: true },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Parse pagination from query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const history = await AuditTrailManager.getHistory('Load', loadId, { limit, offset });

    // Format the response for frontend consumption
    const entries = history.map((entry) => {
      const meta = entry.metadata as Record<string, unknown> | null;
      const changes = (meta?.changes as Array<{
        field: string;
        oldValue: unknown;
        newValue: unknown;
      }>) || [];

      return {
        id: entry.id,
        action: entry.action,
        description: entry.description,
        user: entry.user
          ? {
              id: entry.user.id,
              name: `${entry.user.firstName} ${entry.user.lastName}`,
              email: entry.user.email,
            }
          : null,
        changes,
        createdAt: entry.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    console.error('Error fetching load changelog:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch load changelog',
        },
      },
      { status: 500 }
    );
  }
}
