import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const factoringCompanies = await prisma.factoringCompany.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: factoringCompanies,
    });
  } catch (error) {
    console.error('Factoring companies list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
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

    const body = await request.json();
    const {
      name,
      accountNumber,
      reservePercentage,
      reserveHoldDays,
      apiProvider,
      apiEndpoint,
      apiKey,
      apiSecret,
      exportFormat,
      contactName,
      contactEmail,
      contactPhone,
    } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Company name is required',
          },
        },
        { status: 400 }
      );
    }

    const factoringCompany = await prisma.factoringCompany.create({
      data: {
        companyId: session.user.companyId,
        name,
        accountNumber,
        reservePercentage: reservePercentage || 10,
        reserveHoldDays: reserveHoldDays || 90,
        apiProvider,
        apiEndpoint,
        apiKey,
        apiSecret,
        exportFormat,
        contactName,
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json({
      success: true,
      data: factoringCompany,
    });
  } catch (error) {
    console.error('Create factoring company error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

