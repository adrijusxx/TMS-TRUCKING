import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { MigrationImportService } from '@/lib/services/MigrationImportService';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';
import { importRequestSchema } from '@/lib/validations/migration';
import type { EntityType, FieldMappingConfig } from '@/lib/types/migration';

/**
 * POST /api/migration/import
 * Import entity data with field mapping
 */
export async function POST(request: NextRequest) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = importRequestSchema.parse(body);

    const { entityType, data, mappingConfig, sourceSystem } = validated;

    // Get current MC number
    const { mcNumberId } = await getCurrentMcNumber(session, request);

    // Import with mapping
    const result = await MigrationImportService.importWithMapping(
      entityType as EntityType,
      data,
      mappingConfig as FieldMappingConfig | null,
      session.user.companyId,
      mcNumberId || null,
      sourceSystem || 'ThirdPartyTMS'
    );

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('Migration import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to import data',
        },
      },
      { status: 500 }
    );
  }
}

