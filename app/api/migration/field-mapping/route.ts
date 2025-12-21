import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { fieldMappingConfigSchema } from '@/lib/validations/migration';
import type { FieldMappingConfig, EntityType } from '@/lib/types/migration';

/**
 * GET /api/migration/field-mapping
 * Retrieve field mapping configurations
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
    const entityType = searchParams.get('entityType') as EntityType | null;

    // In a real implementation, this would query a FieldMappingConfig table
    // For now, return empty array
    const mappings: FieldMappingConfig[] = [];

    const filtered = entityType
      ? mappings.filter((m) => m.entityType === entityType)
      : mappings;

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    console.error('Get field mappings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/migration/field-mapping
 * Save field mapping configuration
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
    const validated = fieldMappingConfigSchema.parse({
      ...body,
      companyId: session.user.companyId,
    });

    // In a real implementation, this would save to a FieldMappingConfig table
    // For now, just return success
    // Transform functions can't be serialized, so we omit them when creating the saved config
    const { mappings, ...rest } = validated;
    const savedConfig: FieldMappingConfig = {
      ...rest,
      mappings: mappings.map((m: any) => {
        const { transform, ...mappingRest } = m;
        return {
          ...mappingRest,
          transform: transform as ((value: any) => any) | undefined,
        };
      }),
      id: `mapping-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: savedConfig,
    });
  } catch (error: any) {
    console.error('Save field mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/migration/field-mapping
 * Update field mapping configuration
 */
export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ID', message: 'Mapping ID is required' } },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the FieldMappingConfig table
    const updatedConfig: FieldMappingConfig = {
      ...updateData,
      id,
      companyId: session.user.companyId,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: updatedConfig,
    });
  } catch (error: any) {
    console.error('Update field mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/migration/field-mapping
 * Delete field mapping configuration
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ID', message: 'Mapping ID is required' } },
        { status: 400 }
      );
    }

    // In a real implementation, this would delete from FieldMappingConfig table
    return NextResponse.json({
      success: true,
      message: 'Field mapping deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete field mapping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

