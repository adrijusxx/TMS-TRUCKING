import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  loadAssigned: z.boolean().optional(),
  loadUpdated: z.boolean().optional(),
  maintenanceDue: z.boolean().optional(),
  hosViolation: z.boolean().optional(),
  documentExpiring: z.boolean().optional(),
  invoicePaid: z.boolean().optional(),
  systemAlert: z.boolean().optional(),
});

/**
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updatePreferencesSchema.parse(body);

    // Ensure preferences exist
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: session.user.id,
          ...validated,
        },
      });
    } else {
      preferences = await prisma.notificationPreferences.update({
        where: { userId: session.user.id },
        data: validated,
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
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

    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

