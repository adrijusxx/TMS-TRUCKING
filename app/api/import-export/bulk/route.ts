import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';
import { BulkImportManager } from '@/lib/managers/import/BulkImportManager';

/**
 * POST /api/import-export/bulk
 * Bulk import all Excel files from EXCEL-FILES folder
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

    // Check permission - admin only for bulk import
    if (!hasPermission(session.user.role, 'settings.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const excelFilesDir = join(process.cwd(), 'EXCEL-FILES');
    const files = [
      { name: 'customers_2025_11_13_19_58_24.xlsx', entity: 'customers' },
      { name: 'trucks_2025_11_13_19_57_59.xlsx', entity: 'trucks' },
      { name: 'trailers_2025_11_13_19_58_14.xlsx', entity: 'trailers' },
      { name: 'vendors_bills_2025_11_13_19_58_28.xlsx', entity: 'vendors' },
      { name: 'locations_2025_11_13_19_58_33.xlsx', entity: 'locations' },
      { name: 'loads-and-trips_2025_11_13_19_59_11.xlsx', entity: 'loads' },
    ];

    const results: any = {};

    for (const fileInfo of files) {
      const filePath = join(excelFilesDir, fileInfo.name);
      try {
        const fileBuffer = await readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length <= 1) {
          results[fileInfo.entity] = { success: false, error: 'No data rows found' };
          continue;
        }

        const headers = data[0] as string[];
        const rows = data.slice(1) as any[];

        // Get current MC state for this import session
        const { mcNumberId: currentMcNumberId } = await getCurrentMcNumber(session, request);

        const importResult = await BulkImportManager.importEntityData(
          fileInfo.entity,
          headers,
          rows,
          session.user.companyId,
          currentMcNumberId
        );

        results[fileInfo.entity] = importResult;
      } catch (error: any) {
        results[fileInfo.entity] = {
          success: false,
          error: error.message || 'Failed to import file',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to perform bulk import',
        },
      },
      { status: 500 }
    );
  }
}
