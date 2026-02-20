import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { MenuVisibilityConfig } from '@/lib/managers/MenuVisibilityManager';
const menuVisibilityConfigSchema = z.object({
  config: z.record(z.string(), z.object({
    hiddenForRoles: z.array(z.string()).optional(),
    visibleForRoles: z.array(z.string()).optional(),
  })),
});

/**
 * GET /api/settings/menu-visibility
 * Fetch menu visibility configuration
 * Admin only
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

    // Only admin can view menu visibility config
    const roleSlug = session.user.roleSlug || session.user.role?.toLowerCase().replace('_', '-') || '';
    if (roleSlug !== 'admin' && roleSlug !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    // Get menu visibility config from CompanySettings generalSettings or use default
    const companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
      select: { generalSettings: true },
    });

    const generalSettings = companySettings?.generalSettings as any;
    const config: MenuVisibilityConfig = generalSettings?.menuVisibilityConfig || {};

    return NextResponse.json({
      success: true,
      data: { config },
    });
  } catch (error: any) {
    console.error('Error fetching menu visibility config:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch menu visibility configuration',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/menu-visibility
 * Update menu visibility configuration
 * Admin only
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

    // Only admin can update menu visibility config
    const roleSlug = session.user.roleSlug || session.user.role?.toLowerCase().replace('_', '-') || '';
    if (roleSlug !== 'admin' && roleSlug !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = menuVisibilityConfigSchema.parse(body);

    // Get existing generalSettings
    const existingSettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
      select: { generalSettings: true },
    });

    const existingGeneralSettings = (existingSettings?.generalSettings as any) || {};
    
    // Upsert company settings with menu visibility config in generalSettings
    await prisma.companySettings.upsert({
      where: { companyId: session.user.companyId },
      create: {
        companyId: session.user.companyId,
        generalSettings: {
          ...existingGeneralSettings,
          menuVisibilityConfig: validated.config,
        },
      },
      update: {
        generalSettings: {
          ...existingGeneralSettings,
          menuVisibilityConfig: validated.config,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Menu visibility configuration updated successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid configuration format',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating menu visibility config:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update menu visibility configuration',
        },
      },
      { status: 500 }
    );
  }
}

