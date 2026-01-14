import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { FieldPromotionService } from '@/lib/services/FieldPromotionService';
import { promotionRequestSchema } from '@/lib/validations/migration';
import type { PromotionRequest } from '@/lib/types/migration';

/**
 * POST /api/migration/promote
 * Promote metadata field to CustomField or schema column
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
    const validated = promotionRequestSchema.parse(body);

    // Validate promotion
    const validation = await FieldPromotionService.validatePromotion(
      validated.entityType,
      validated.fieldName,
      validated.promotionType
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Promotion validation failed',
            details: validation.errors,
            warnings: validation.warnings,
          },
        },
        { status: 400 }
      );
    }

    let result;

    if (validated.promotionType === 'customField') {
      // Promote to CustomField
      result = await FieldPromotionService.promoteToCustomField(
        session.user.companyId,
        validated.entityType,
        validated.fieldName,
        validated.label || validated.fieldName,
        validated.dataType || 'string',
        validated.required || false
      );
    } else {
      // Promote to schema column
      const { migrationSql, migrationId } = await FieldPromotionService.promoteToSchemaColumn(
        validated.entityType,
        validated.fieldName,
        validated.dataType || 'string',
        validated.required || false
      );

      // Migrate data from metadata to new field
      const migrationResult = await FieldPromotionService.migrateMetadataToField(
        validated.entityType,
        validated.fieldName,
        validated.fieldName
      );

      result = {
        success: migrationResult.success,
        promotionType: 'schemaColumn' as const,
        migrationId,
        migrationSql,
        recordsMigrated: migrationResult.recordsMigrated,
        errors: migrationResult.errors,
      };
    }

    return NextResponse.json({
      success: result.success,
      data: result,
      warnings: validation.warnings,
    });
  } catch (error: any) {
    console.error('Field promotion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to promote field',
        },
      },
      { status: 500 }
    );
  }
}








