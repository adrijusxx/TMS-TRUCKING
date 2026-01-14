import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { MigrationAnalysisService } from '@/lib/services/MigrationAnalysisService';
import { entityTypeSchema } from '@/lib/validations/migration';
import type { EntityType } from '@/lib/types/migration';

/**
 * GET /api/migration/analysis
 * Get migration analysis report
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityTypeParam = searchParams.get('entityType');
    const entityType = entityTypeParam
      ? (entityTypeSchema.parse(entityTypeParam) as EntityType)
      : undefined;

    // Get analysis
    const analyses = await MigrationAnalysisService.analyzeMetadataUsage(
      session.user.companyId,
      entityType
    );

    // Get promotion recommendations
    const recommendations =
      await MigrationAnalysisService.generatePromotionRecommendations(
        session.user.companyId,
        entityType
      );

    // Special analysis for accounting entities
    let accountingAnalysis = null;
    if (!entityType || ['INVOICE', 'SETTLEMENT', 'PAYMENT'].includes(entityType)) {
      accountingAnalysis = await MigrationAnalysisService.analyzeAccountingFields(
        session.user.companyId
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analyses,
        recommendations,
        accountingAnalysis,
      },
    });
  } catch (error: any) {
    console.error('Migration analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to analyze migration data',
        },
      },
      { status: 500 }
    );
  }
}








