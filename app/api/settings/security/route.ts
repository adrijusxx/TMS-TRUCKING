import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const securitySettingsSchema = z.object({
  minPasswordLength: z.number().min(8).max(32).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  passwordExpiryDays: z.number().min(0).max(365).optional(),
  sessionTimeout: z.number().min(5).max(1440).optional(),
  maxConcurrentSessions: z.number().min(1).max(10).optional(),
  require2FA: z.boolean().optional(),
  require2FAForAdmin: z.boolean().optional(),
  maxLoginAttempts: z.number().min(3).max(10).optional(),
  lockoutDuration: z.number().min(5).max(60).optional(),
  enableAuditLog: z.boolean().optional(),
  logRetentionDays: z.number().min(30).max(3650).optional(),
  enableDataEncryption: z.boolean().optional(),
  allowRemoteAccess: z.boolean().optional(),
  ipWhitelist: z.string().optional(),
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
          securitySettings: {
            minPasswordLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            passwordExpiryDays: 90,
            sessionTimeout: 60,
            maxConcurrentSessions: 3,
            require2FA: false,
            require2FAForAdmin: true,
            maxLoginAttempts: 5,
            lockoutDuration: 15,
            enableAuditLog: true,
            logRetentionDays: 365,
            enableDataEncryption: true,
            allowRemoteAccess: true,
            ipWhitelist: '',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.securitySettings || {},
    });
  } catch (error) {
    console.error('Get security settings error:', error);
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
    const validated = securitySettingsSchema.parse(body);

    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyId: session.user.companyId,
          securitySettings: validated,
        },
      });
    } else {
      const currentSettings = (companySettings.securitySettings || {}) as Record<string, any>;
      companySettings = await prisma.companySettings.update({
        where: { companyId: session.user.companyId },
        data: {
          securitySettings: {
            ...currentSettings,
            ...validated,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: companySettings.securitySettings,
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

    console.error('Update security settings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

