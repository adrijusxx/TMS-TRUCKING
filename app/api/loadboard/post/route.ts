import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postLoadSchema = z.object({
  loadId: z.string().cuid(),
  board: z.enum(['DAT', 'TRUCKSTOP', 'BOTH']).default('BOTH'),
  rate: z.number().positive().optional(),
  notes: z.string().optional(),
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
    const validated = postLoadSchema.parse(body);

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: validated.loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Placeholder implementation
    // In production, this would post to DAT API or Truckstop.com API
    // Example:
    // if (validated.board === 'DAT' || validated.board === 'BOTH') {
    //   await postToDAT(load, validated);
    // }
    // if (validated.board === 'TRUCKSTOP' || validated.board === 'BOTH') {
    //   await postToTruckstop(load, validated);
    // }

    return NextResponse.json({
      success: true,
      message: `Load posted to ${validated.board} (placeholder - connect API for actual posting)`,
      data: {
        loadId: validated.loadId,
        board: validated.board,
        postedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Load board post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

