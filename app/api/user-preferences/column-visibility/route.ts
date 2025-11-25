import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ColumnPreferenceManager } from '@/lib/managers/ColumnPreferenceManager';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const savePreferencesSchema = z.object({
  entityType: z.string().min(1),
  preferences: z.record(
    z.string(),
    z.object({
      visible: z.boolean(),
      width: z.number().optional(),
      order: z.number().optional(),
    })
  ),
});

/**
 * GET /api/user-preferences/column-visibility
 * Get user's column preferences for an entity type
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

    // Check permission
    if (!hasPermission(session.user.role as any, 'data.column_visibility')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'entityType is required' } },
        { status: 400 }
      );
    }

    const preferences = await ColumnPreferenceManager.getUserColumnPreferences(
      session.user.id,
      entityType
    );

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error fetching column preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch column preferences',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-preferences/column-visibility
 * Save user's column preferences for an entity type
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(session.user.role as any, 'data.column_visibility')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = savePreferencesSchema.parse(body);

    await ColumnPreferenceManager.saveUserColumnPreferences(
      session.user.id,
      validated.entityType,
      validated.preferences
    );

    return NextResponse.json({
      success: true,
      message: 'Column preferences saved successfully',
    });
  } catch (error: any) {
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

    console.error('Error saving column preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to save column preferences',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-preferences/column-visibility
 * Delete user's column preferences for an entity type (reset to defaults)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(session.user.role as any, 'data.column_visibility')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'entityType is required' } },
        { status: 400 }
      );
    }

    await ColumnPreferenceManager.deleteUserColumnPreferences(
      session.user.id,
      entityType
    );

    return NextResponse.json({
      success: true,
      message: 'Column preferences reset successfully',
    });
  } catch (error: any) {
    console.error('Error deleting column preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to reset column preferences',
        },
      },
      { status: 500 }
    );
  }
}

