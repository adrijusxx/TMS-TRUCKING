import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const notificationsSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailOnLoadCreated: z.boolean().optional(),
  emailOnLoadAssigned: z.boolean().optional(),
  emailOnLoadDelivered: z.boolean().optional(),
  emailOnInvoiceGenerated: z.boolean().optional(),
  emailOnSettlementReady: z.boolean().optional(),
  emailOnDriverAdvanceRequest: z.boolean().optional(),
  emailOnExpenseSubmitted: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  smsApiKey: z.string().optional(),
  smsApiSecret: z.string().optional(),
  smsFromNumber: z.string().optional(),
  smsOnLoadAssigned: z.boolean().optional(),
  smsOnLoadDelivered: z.boolean().optional(),
  smsOnSettlementReady: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  pushOnLoadAssigned: z.boolean().optional(),
  pushOnLoadDelivered: z.boolean().optional(),
  pushOnSettlementReady: z.boolean().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  webhookSecret: z.string().optional(),
  webhookOnLoadCreated: z.boolean().optional(),
  webhookOnLoadDelivered: z.boolean().optional(),
  webhookOnInvoiceGenerated: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
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
          notificationSettings: {
            emailEnabled: true,
            emailOnLoadCreated: true,
            emailOnLoadAssigned: true,
            emailOnLoadDelivered: true,
            emailOnInvoiceGenerated: true,
            emailOnSettlementReady: true,
            emailOnDriverAdvanceRequest: true,
            emailOnExpenseSubmitted: true,
            smsEnabled: false,
            smsApiKey: '',
            smsApiSecret: '',
            smsFromNumber: '',
            smsOnLoadAssigned: true,
            smsOnLoadDelivered: true,
            smsOnSettlementReady: false,
            pushEnabled: true,
            pushOnLoadAssigned: true,
            pushOnLoadDelivered: true,
            pushOnSettlementReady: true,
            webhookEnabled: false,
            webhookUrl: '',
            webhookSecret: '',
            webhookOnLoadCreated: false,
            webhookOnLoadDelivered: false,
            webhookOnInvoiceGenerated: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.notificationSettings || {},
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
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
    const validated = notificationsSettingsSchema.parse(body);

    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          notificationSettings: validated,
        },
      });
    } else {
      const currentSettings = (companySettings.notificationSettings || {}) as Record<string, any>;
      companySettings = await prisma.companySettings.update({
        where: { companyId: session.user.companyId },
        data: {
          notificationSettings: {
            ...currentSettings,
            ...validated,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.notificationSettings,
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

    console.error('Update notification settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

