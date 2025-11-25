import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get user's primary company and all companies they have access to
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: true,
        userCompanies: {
          include: {
            company: true,
          },
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    // Get all companies user has access to
    const accessibleCompanyIds = [
      user.companyId,
      ...user.userCompanies.map((uc) => uc.companyId),
    ];

    // Get all MC numbers for accessible companies
    const mcNumbers = await prisma.mcNumber.findMany({
      where: {
        companyId: { in: accessibleCompanyIds },
        deletedAt: null,
      },
      orderBy: [
        { isDefault: 'desc' },
        { companyName: 'asc' },
        { number: 'asc' },
      ],
    });

    // Only return MC numbers (not regular companies)
    // Return all MC numbers for the user's company
    const companies = mcNumbers.map((mc) => ({
      id: `mc:${mc.id}`, // Prefix with 'mc:' to identify as MC number
      name: `${mc.companyName} (MC ${mc.number})`,
      isPrimary: mc.isDefault,
      role: user.role,
      isMcNumber: true,
      mcNumberId: mc.id,
      mcNumber: mc.number,
      companyId: mc.companyId,
    }));

    // Get current company and MC number from session or cookies
    const currentCompanyId =
      (session.user as any).currentCompanyId || user.companyId;
    
    // Check cookies for MC number selection
    const cookies = request.cookies;
    let currentMcNumberId = cookies.get('currentMcNumberId')?.value || (session.user as any)?.mcNumberId;
    let currentMcNumber = cookies.get('currentMcNumber')?.value || (session.user as any)?.mcNumber;
    
    // Verify that the MC number belongs to one of the accessible companies
    if (currentMcNumberId) {
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: currentMcNumberId },
        select: { companyId: true, number: true },
      });
      
      // If MC number doesn't belong to any accessible company, clear it
      if (!mcNumberRecord || !accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
        currentMcNumberId = null;
        currentMcNumber = null;
      } else {
        currentMcNumber = mcNumberRecord.number;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        companies,
        currentCompanyId,
        currentMcNumberId: currentMcNumberId || null,
        currentMcNumber: currentMcNumber || null,
      },
    });
  } catch (error) {
    console.error('Companies fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
