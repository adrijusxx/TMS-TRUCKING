import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';

const setViewSchema = z.object({
  mcNumberId: z.string().nullable(),
  mcNumberIds: z.array(z.string()).default([]),
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
    const validated = setViewSchema.parse(body);

    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const userMcAccess = (session?.user as any)?.mcAccess || [];

    // Validate MC access
    if (!isAdmin) {
      // Non-admins can only view MCs they have access to
      if (validated.mcNumberId && !userMcAccess.includes(validated.mcNumberId)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have access to this MC number',
            },
          },
          { status: 403 }
        );
      }

      if (validated.mcNumberIds.length > 0) {
        const invalidIds = validated.mcNumberIds.filter(id => !userMcAccess.includes(id));
        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You do not have access to some of the selected MC numbers',
              },
            },
            { status: 403 }
          );
        }
      }
    }

    // Fetch MC number string if single MC selected
    let mcNumber: string | null = null;
    if (validated.mcNumberId) {
      const mcRecord = await prisma.mcNumber.findUnique({
        where: { id: validated.mcNumberId },
        select: { number: true },
      });
      mcNumber = mcRecord?.number?.trim() || null;
    }

    // Set cookies for MC state
    const cookieStore = await cookies();
    
    if (validated.mcNumberId) {
      // Single MC view
      cookieStore.set('currentMcNumberId', validated.mcNumberId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      if (mcNumber) {
        cookieStore.set('currentMcNumber', mcNumber, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      cookieStore.set('mcViewMode', 'filtered', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      // Clear multi-select
      cookieStore.delete('selectedMcNumberIds');
    } else if (validated.mcNumberIds.length > 0) {
      // Multi-MC view
      cookieStore.set('selectedMcNumberIds', JSON.stringify(validated.mcNumberIds), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      cookieStore.set('mcViewMode', 'multi', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      // Clear single MC
      cookieStore.delete('currentMcNumberId');
      cookieStore.delete('currentMcNumber');
    } else {
      // "All MCs" view (admin only)
      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only admins can view all MCs',
            },
          },
          { status: 403 }
        );
      }

      cookieStore.set('mcViewMode', 'all', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      // Clear all MC selections
      cookieStore.delete('currentMcNumberId');
      cookieStore.delete('currentMcNumber');
      cookieStore.delete('selectedMcNumberIds');
    }

    return NextResponse.json({
      success: true,
      data: {
        mcNumberId: validated.mcNumberId,
        mcNumber,
        mcNumberIds: validated.mcNumberIds,
        viewMode: validated.mcNumberId ? 'filtered' : validated.mcNumberIds.length > 0 ? 'filtered' : 'all',
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

    console.error('Set MC view error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while setting MC view',
        },
      },
      { status: 500 }
    );
  }
}

