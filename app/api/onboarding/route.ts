import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding - Returns onboarding status with entity counts
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

    const [company, drivers, trucks, trailers, customers, loads] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { onboardingComplete: true },
      }),
      prisma.driver.count({ where: { companyId, deletedAt: null } }),
      prisma.truck.count({ where: { companyId, deletedAt: null } }),
      prisma.trailer.count({ where: { companyId, deletedAt: null } }),
      prisma.customer.count({ where: { companyId, deletedAt: null } }),
      prisma.load.count({ where: { companyId, deletedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dismissed: company?.onboardingComplete ?? false,
        counts: { drivers, trucks, trailers, customers, loads },
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
