import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settlementSettingsSchema = z.object({
  payPeriodStartDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  payPeriodEndDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  enableAutoGeneration: z.boolean(),
  autoGenerationDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  autoGenerationTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  autoEmailSettlements: z.boolean(),
  emailToDrivers: z.boolean(),
  emailToAccounting: z.boolean(),
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

    // Get or create company settings
    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          generalSettings: {},
        },
      });
    }

    // Extract settlement settings from generalSettings JSON
    const generalSettings = (companySettings.generalSettings as any) || {};
    const settlementSettings = generalSettings.settlementAutomation || {
      payPeriodStartDay: 'monday',
      payPeriodEndDay: 'sunday',
      enableAutoGeneration: false,
      autoGenerationDay: 'monday',
      autoGenerationTime: '00:00',
      autoEmailSettlements: false,
      emailToDrivers: true,
      emailToAccounting: true,
    };

    return NextResponse.json({
      success: true,
      data: settlementSettings,
    });
  } catch (error) {
    console.error('Error fetching settlement settings:', error);
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

    // Only ADMIN can update settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only administrators can update settings' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = settlementSettingsSchema.parse(body);

    // Get or create company settings
    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    const generalSettings = (companySettings?.generalSettings as any) || {};
    generalSettings.settlementAutomation = validated;

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          generalSettings,
        },
      });
    } else {
      companySettings = await prisma.companySettings.update({
        where: { companyId: session.user.companyId },
        data: {
          generalSettings,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: validated,
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

    console.error('Error updating settlement settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
























