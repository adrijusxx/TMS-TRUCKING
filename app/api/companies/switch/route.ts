import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
            companyId: actualCompanyId,
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

    // Check if user has access to this company (either primary or in userCompanies)
    const hasAccess =
      user.companyId === actualCompanyId ||
      user.userCompanies.some((uc) => uc.companyId === actualCompanyId);

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
          ? 'MC Number switched successfully. Please refresh to see changes.'
          : 'Company switched successfully. Please refresh to see changes.',
      },
    });

    // Set cookies for MC number selection (readable by API routes)
    if (mcNumberId && mcNumber) {
      response.cookies.set('currentMcNumberId', mcNumberId, {
        httpOnly: false, // Allow client-side access too
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      response.cookies.set('currentMcNumber', mcNumber, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    } else {
      // Clear cookies if switching to regular company or MC number doesn't belong to company
      response.cookies.delete('currentMcNumberId');
      response.cookies.delete('currentMcNumber');
    }

    return response;
  } catch (error) {
    console.error('Company switch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
