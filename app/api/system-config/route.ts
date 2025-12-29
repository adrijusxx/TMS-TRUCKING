import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const systemConfigSchema = z.object({
  defaultDetentionRate: z.number().min(0).optional(),
  defaultFreeTimeMinutes: z.number().min(0).optional(),
  standardTonuFee: z.number().min(0).optional(),
  factoringActive: z.boolean().optional(),
  factoringCompanyName: z.string().optional().nullable(),
  factoringCompanyAddress: z.string().optional().nullable(),
  payDriverOnFuelSurcharge: z.boolean().optional(),
  companyFuelTaxRate: z.number().min(0).max(100).optional().nullable(),
});

/**
 * GET /api/system-config
 * Fetch system configuration for the current company
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

    // Fetch or create default config
    let config = await prisma.systemConfig.findUnique({
      where: { companyId: session.user.companyId },
    });

    // If no config exists, create default
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          companyId: session.user.companyId,
          // Defaults are set in schema
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch system configuration' },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/system-config
 * Update system configuration (Admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check role: Only ADMIN or ACCOUNTANT can update system config
    const role = session.user.role as 'ADMIN' | 'ACCOUNTANT' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';
    if (role !== 'ADMIN' && role !== 'ACCOUNTANT') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Only administrators and accountants can update system configuration' 
          } 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = systemConfigSchema.parse(body);

    // Update or create config
    const config = await prisma.systemConfig.upsert({
      where: { companyId: session.user.companyId },
      update: validated,
      create: {
        companyId: session.user.companyId,
        ...validated,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
      message: 'System configuration updated successfully',
    });
  } catch (error: any) {
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

    console.error('Error updating system config:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update system configuration' },
      },
      { status: 500 }
    );
  }
}

