import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const generalSettingsSchema = z.object({
  timezone: z.string().min(1).optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  currency: z.string().length(3).optional(),
  currencySymbol: z.string().min(1).optional(),
  businessDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  businessHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  businessHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezoneOffset: z.number().optional(),
  defaultPaymentTerms: z.number().min(0).max(365).optional(),
  defaultLoadType: z.enum(['FTL', 'LTL', 'PARTIAL', 'INTERMODAL']).optional(),
  defaultEquipmentType: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT']).optional(),
  autoCalculateMiles: z.boolean().optional(),
  autoAssignDrivers: z.boolean().optional(),
  requirePOD: z.boolean().optional(),
  enableLoadTemplates: z.boolean().optional(),
  loadNumberPrefix: z.string().optional(),
  loadNumberFormat: z.enum(['SEQUENTIAL', 'DATE_SEQUENTIAL', 'CUSTOM']).optional(),
  invoiceNumberPrefix: z.string().optional(),
  invoiceNumberFormat: z.enum(['SEQUENTIAL', 'DATE_SEQUENTIAL', 'CUSTOM']).optional(),
  dispatcherSeeAllLoads: z.boolean().optional(), // Allow dispatchers to see all loads (default: true)
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
          generalSettings: {
            timezone: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            currency: 'USD',
            currencySymbol: '$',
            businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            businessHoursStart: '08:00',
            businessHoursEnd: '17:00',
            timezoneOffset: 0,
            defaultPaymentTerms: 30,
            defaultLoadType: 'FTL',
            defaultEquipmentType: 'DRY_VAN',
            autoCalculateMiles: true,
            autoAssignDrivers: false,
            requirePOD: false,
            enableLoadTemplates: true,
            loadNumberPrefix: '',
            loadNumberFormat: 'DATE_SEQUENTIAL',
            invoiceNumberPrefix: '',
            invoiceNumberFormat: 'DATE_SEQUENTIAL',
            dispatcherSeeAllLoads: true, // Default: dispatchers see all loads
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.generalSettings || {},
    });
  } catch (error) {
    console.error('Get general settings error:', error);
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
    const validated = generalSettingsSchema.parse(body);

    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          generalSettings: validated,
        },
      });
    } else {
      const currentSettings = (companySettings.generalSettings || {}) as Record<string, any>;
      companySettings = await prisma.companySettings.update({
        where: { companyId: session.user.companyId },
        data: {
          generalSettings: {
            ...currentSettings,
            ...validated,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.generalSettings,
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

    console.error('Update general settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

