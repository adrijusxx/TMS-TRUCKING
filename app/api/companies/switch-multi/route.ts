import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { McStateManager } from '@/lib/managers/McStateManager';
import { z } from 'zod';

const switchMultiMcSchema = z.object({
  mcNumberIds: z.array(z.string()).min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = switchMultiMcSchema.parse(body);
    const { mcNumberIds } = validated;

    const companyId = session.user.companyId || (session.user as any).currentCompanyId;
    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Company ID is required' },
        },
        { status: 400 }
      );
    }

    // If no MC numbers selected, clear multi-select mode
    if (mcNumberIds.length === 0) {
      const response = NextResponse.json({
        success: true,
        data: {
          mcNumberIds: [],
          message: 'Multi-MC view cleared',
        },
      });

      McStateManager.clearMcStateCookies(response);
      return response;
    }

    // Validate that all MC number IDs belong to the user's company
    const validation = await McStateManager.validateMcNumberIds(mcNumberIds, companyId);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_MC_NUMBERS',
            message: `Some MC numbers are invalid or don't belong to your company`,
            invalidIds: validation.invalidIds,
          },
        },
        { status: 400 }
      );
    }

    // Get MC number values for the selected IDs
    const mcNumberValues = await McStateManager.getMcNumberValues(mcNumberIds);

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        mcNumberIds,
        mcNumberValues,
        message: `Viewing ${mcNumberIds.length} MC number(s)`,
      },
    });

    // Set cookies for multi-MC selection
    McStateManager.setMcStateCookies(response, {
      mcNumberIds,
      viewMode: 'filtered',
    });

    return response;
  } catch (error) {
    console.error('Multi-MC switch error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
      },
      { status: 500 }
    );
  }
}

