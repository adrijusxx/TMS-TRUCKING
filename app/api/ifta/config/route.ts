import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { z } from 'zod';

const configSchema = z.object({
  stateRates: z.record(z.string(), z.number()),
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

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'ifta.view'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    let config = await prisma.iFTAConfig.findUnique({
      where: { companyId: session.user.companyId },
    });

    // Create default if doesn't exist
    if (!config) {
      config = await prisma.iFTAConfig.create({
        data: {
          companyId: session.user.companyId,
          stateRates: {
            KY: 0.0285,
            NM: 0.04378,
            OR: 0.237,
            NY: 0.0546,
            CT: 0.1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('IFTA config GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get IFTA config',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'ifta.manage'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = configSchema.parse(body);

    const config = await prisma.iFTAConfig.upsert({
      where: { companyId: session.user.companyId },
      update: {
        stateRates: validated.stateRates,
      },
      create: {
        companyId: session.user.companyId,
        stateRates: validated.stateRates,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('IFTA config POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update IFTA config',
        },
      },
      { status: 500 }
    );
  }
}







