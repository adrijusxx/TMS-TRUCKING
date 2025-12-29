import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { McStateManager } from '@/lib/managers/McStateManager';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Company ID is required' },
        },
        { status: 400 }
      );
    }

    // Check if this is an MC number (prefixed with 'mc:')
    const isMcNumber = companyId.startsWith('mc:');
    let actualCompanyId: string;
    let mcNumberId: string | null = null;

    if (isMcNumber) {
      mcNumberId = companyId.replace('mc:', '');
      // Get the MC number to find its associated company
      if (!mcNumberId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid MC number ID' },
          },
          { status: 400 }
        );
      }
      const mcNumber = await prisma.mcNumber.findUnique({
        where: { id: mcNumberId },
      });
      
      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'MC number not found' },
          },
          { status: 404 }
        );
      }
      actualCompanyId = mcNumber.companyId;
    } else {
      actualCompanyId = companyId;
    }

    // Verify user has access to this company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userCompanies: {
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

    // Get all accessible company IDs
    const accessibleCompanyIds = [
      user.companyId,
      ...user.userCompanies.map((uc) => uc.companyId),
    ];

    // Check if user has access to this company (either primary or in userCompanies)
    // For MC numbers, also verify the MC number belongs to an accessible company
    const hasAccess = accessibleCompanyIds.includes(actualCompanyId);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this company',
          },
        },
        { status: 403 }
      );
    }

    // Additional check for MC numbers: verify the MC number exists and belongs to accessible company
    if (isMcNumber && mcNumberId) {
      const mcNumberRecord = await prisma.mcNumber.findFirst({
        where: {
          id: mcNumberId,
          companyId: { in: accessibleCompanyIds },
          deletedAt: null,
        },
      });

      if (!mcNumberRecord) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'MC number not found or you do not have access to it',
            },
          },
          { status: 403 }
        );
      }
    }

    // Get MC number value if switching to an MC number
    let mcNumber: string | null = null;
    if (mcNumberId) {
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcNumberId },
        select: { number: true, companyId: true },
      });
      
      // Verify MC number belongs to the company user has access to
      if (mcNumberRecord && mcNumberRecord.companyId === actualCompanyId) {
        // Normalize MC number: trim whitespace
        mcNumber = mcNumberRecord.number?.trim() || null;
      } else {
        // MC number doesn't belong to this company, clear it
        mcNumberId = null;
        mcNumber = null;
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        companyId: actualCompanyId,
        mcNumberId: mcNumberId || null,
        mcNumber: mcNumber || null,
        isMcNumber,
        message: isMcNumber 
          ? 'MC Number switched successfully'
          : 'Company switched successfully',
      },
    });

    // Use McStateManager to set cookies consistently
    McStateManager.setMcStateCookies(response, {
      mcNumberId: mcNumberId || null,
      mcNumber: mcNumber || null,
      viewMode: mcNumberId ? 'filtered' : 'all',
    });

    return response;
  } catch (error) {
    console.error('Company switch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
