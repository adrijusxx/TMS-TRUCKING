import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { TariffManager } from '@/lib/managers/TariffManager';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// ============================================
// Validation Schemas
// ============================================

const tariffRowSchema = z.object({
  name: z.string().min(1),
  origin: z.string().optional(),
  destination: z.string().optional(),
  rate: z.coerce.number().min(0),
  fuelSurcharge: z.coerce.number().min(0).optional(),
  effectiveDate: z.string().optional(),
  type: z.string().optional(),
  minimumRate: z.coerce.number().min(0).optional(),
});

const bulkUploadSchema = z.object({
  tariffs: z.array(tariffRowSchema).min(1).max(5000),
  effectiveDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

// ============================================
// POST /api/settings/tariffs/bulk-upload
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'settings.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') ?? '';

    // Handle CSV upload
    if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      return await handleCSVUpload(request, session.user.companyId, session.user.id);
    }

    // Handle JSON upload
    const body = await request.json();
    const validated = bulkUploadSchema.parse(body);

    const result = await TariffManager.bulkUploadTariffs(
      session.user.companyId,
      validated.tariffs,
      new Date(validated.effectiveDate),
      session.user.id
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues },
        },
        { status: 400 }
      );
    }

    logger.error('Tariff bulk upload error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload tariffs' } },
      { status: 500 }
    );
  }
}

// ============================================
// CSV Handler
// ============================================

async function handleCSVUpload(request: NextRequest, companyId: string, userId: string) {
  try {
    let csvText: string;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }

    const effectiveDateStr =
      new URL(request.url).searchParams.get('effectiveDate') ?? new Date().toISOString();

    const tariffRows = TariffManager.parseCSV(csvText);
    const result = await TariffManager.bulkUploadTariffs(
      companyId,
      tariffRows,
      new Date(effectiveDateStr),
      userId
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('CSV upload parsing error', {
      error: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : 'Failed to parse CSV';
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message } },
      { status: 400 }
    );
  }
}

// ============================================
// GET /api/settings/tariffs/bulk-upload
// Version history
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'settings.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const history = await TariffManager.getTariffVersionHistory(
      session.user.companyId,
      { limit, offset }
    );

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    logger.error('Tariff version history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch history' } },
      { status: 500 }
    );
  }
}
