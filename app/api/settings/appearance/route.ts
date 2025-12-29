import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'amber', 'system']).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  sidebarCollapsed: z.boolean().optional(),
  sidebarPosition: z.enum(['left', 'right']).optional(),
  compactMode: z.boolean().optional(),
  density: z.enum(['comfortable', 'compact', 'spacious']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  fontFamily: z.enum(['system', 'inter', 'roboto', 'open-sans']).optional(),
  showBreadcrumbs: z.boolean().optional(),
  showPageHeaders: z.boolean().optional(),
  showTableStripes: z.boolean().optional(),
  showAnimations: z.boolean().optional(),
  dashboardLayout: z.enum(['grid', 'list', 'cards']).optional(),
  showQuickActions: z.boolean().optional(),
  showRecentActivity: z.boolean().optional(),
  showStats: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      // Create default settings
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          appearanceSettings: {
            theme: 'system',
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            accentColor: '#10b981',
            sidebarCollapsed: false,
            sidebarPosition: 'left',
            compactMode: false,
            density: 'comfortable',
            fontSize: 'medium',
            fontFamily: 'system',
            showBreadcrumbs: true,
            showPageHeaders: true,
            showTableStripes: true,
            showAnimations: true,
            dashboardLayout: 'grid',
            showQuickActions: true,
            showRecentActivity: true,
            showStats: true,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.appearanceSettings || {},
    });
  } catch (error) {
    console.error('Get appearance settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = appearanceSettingsSchema.parse(body);

    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          appearanceSettings: validated,
        },
      });
    } else {
      const currentSettings = (companySettings.appearanceSettings || {}) as Record<string, any>;
      companySettings = await prisma.companySettings.update({
        where: { companyId: session.user.companyId },
        data: {
          appearanceSettings: {
            ...currentSettings,
            ...validated,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.appearanceSettings,
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

    console.error('Update appearance settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

