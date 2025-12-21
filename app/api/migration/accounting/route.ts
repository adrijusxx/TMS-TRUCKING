import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { AccountingMigrationService } from '@/lib/services/AccountingMigrationService';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';
import type { FieldMappingConfig } from '@/lib/types/migration';

/**
 * POST /api/migration/accounting/bulk-import
 * Bulk import accounting entities in correct order
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
    const {
      data,
      mappingConfigs,
      sourceSystem,
    }: {
      data: {
        invoices?: Array<Record<string, any>>;
        invoiceBatches?: Array<Record<string, any>>;
        settlements?: Array<Record<string, any>>;
        payments?: Array<Record<string, any>>;
        reconciliations?: Array<Record<string, any>>;
        accessorialCharges?: Array<Record<string, any>>;
        rateConfirmations?: Array<Record<string, any>>;
        driverAdvances?: Array<Record<string, any>>;
        loadExpenses?: Array<Record<string, any>>;
      };
      mappingConfigs?: Record<string, FieldMappingConfig | null>;
      sourceSystem?: string;
    } = body;

    // Get current MC number
    const { mcNumberId } = await getCurrentMcNumber(session, request);

    // Bulk import accounting entities
    const result = await AccountingMigrationService.bulkImportAccounting(
      data,
      mappingConfigs || {},
      session.user.companyId,
      mcNumberId || null,
      sourceSystem || 'ThirdPartyTMS'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Accounting bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to import accounting data',
        },
      },
      { status: 500 }
    );
  }
}

