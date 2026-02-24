import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const DEFAULT_ADDRESS_MARKER = 'P.O. Box (Update in Settings)';

/**
 * GET /api/onboarding - Returns onboarding status with entity counts and validation
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;

    const [company, drivers, trucks, trailers, customers, loads, users, placeholders] =
      await Promise.all([
        prisma.company.findUnique({
          where: { id: companyId },
          select: { onboardingComplete: true, address: true, city: true, state: true },
        }),
        prisma.driver.count({ where: { companyId, deletedAt: null } }),
        prisma.truck.count({ where: { companyId, deletedAt: null } }),
        prisma.trailer.count({ where: { companyId, deletedAt: null } }),
        prisma.customer.count({ where: { companyId, deletedAt: null } }),
        prisma.load.count({ where: { companyId, deletedAt: null } }),
        prisma.user.count({
          where: {
            companyId,
            deletedAt: null,
            role: { notIn: ['DRIVER', 'CUSTOMER'] },
          },
        }),
        getPlaceholderCounts(companyId),
      ]);

    const companySettingsValid =
      !!company?.address &&
      company.address !== DEFAULT_ADDRESS_MARKER &&
      !!company.city &&
      !!company.state;

    return NextResponse.json({
      success: true,
      data: {
        dismissed: company?.onboardingComplete ?? false,
        counts: { drivers, trucks, trailers, customers, loads, users },
        companySettingsValid,
        dataQuality: placeholders,
      },
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

async function getPlaceholderCounts(
  companyId: string
): Promise<Record<string, { placeholders: number; total: number }>> {
  try {
    const [driverTotal, driverPlaceholders, truckTotal, truckPlaceholders] = await Promise.all([
      prisma.driver.count({ where: { companyId, deletedAt: null } }),
      prisma.driver.count({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { licenseNumber: 'PENDING' },
            { licenseState: 'XX' },
          ],
        },
      }),
      prisma.truck.count({ where: { companyId, deletedAt: null } }),
      prisma.truck.count({
        where: {
          companyId,
          deletedAt: null,
          OR: [{ make: 'Unknown' }, { model: 'Unknown' }, { licensePlate: 'UNKNOWN' }],
        },
      }),
    ]);

    return {
      drivers: { placeholders: driverPlaceholders, total: driverTotal },
      trucks: { placeholders: truckPlaceholders, total: truckTotal },
    };
  } catch {
    return {};
  }
}

/**
 * POST /api/onboarding - Dismiss onboarding guide permanently
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

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding dismiss error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
