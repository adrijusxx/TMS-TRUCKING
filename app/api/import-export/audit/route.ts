import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { ImportAuditManager } from '@/lib/managers/import/ImportAuditManager';

/**
 * GET /api/import-export/audit
 * GET /api/import-export/audit?entity=drivers
 * GET /api/import-export/audit?entity=drivers&type=data-quality
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'settings.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const type = searchParams.get('type');
    const companyId = session.user.companyId;
    const auditManager = new ImportAuditManager(prisma);

    // Data quality only for a specific entity
    if (entity && type === 'data-quality') {
      const checks = await auditManager.auditDataQuality(entity, companyId);
      return NextResponse.json({ success: true, data: { entity, checks } });
    }

    // Single entity full audit
    if (entity) {
      const result = await auditManager.auditEntity(entity, companyId, true);
      return NextResponse.json({ success: true, data: result });
    }

    // Full audit of all entities
    const result = await auditManager.auditAll(companyId, true);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[ImportAudit] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Audit failed' } },
      { status: 500 }
    );
  }
}
