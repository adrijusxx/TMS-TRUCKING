import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const searchLoadBoardSchema = z.object({
  originCity: z.string().optional(),
  originState: z.string().length(2).optional(),
  destinationCity: z.string().optional(),
  destinationState: z.string().length(2).optional(),
  equipmentType: z.string().optional(),
  minRate: z.number().min(0).optional(),
  maxRate: z.number().min(0).optional(),
  maxDistance: z.number().min(0).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    searchLoadBoardSchema.parse(body);

    // External loadboard integration (DAT, Truckstop.com) is not yet configured.
    // When API keys are available, this will query real loadboard data.
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        configured: false,
        message: 'External loadboard integration not configured. Add DAT or Truckstop.com API credentials in Settings > Integrations.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid search parameters', details: error.issues } },
        { status: 400 }
      );
    }

    logger.error('Load board search error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
