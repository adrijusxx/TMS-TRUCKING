import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const factoringCompany = await prisma.factoringCompany.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            customers: true,
          },
        },
      },
    });

    if (!factoringCompany) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Factoring company not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: factoringCompany,
    });
  } catch (error) {
    console.error('Factoring company fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();

    const existingCompany = await prisma.factoringCompany.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Factoring company not found' },
        },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const allowedFields = [
      'name',
      'accountNumber',
      'reservePercentage',
      'reserveHoldDays',
      'apiProvider',
      'apiEndpoint',
      'apiKey',
      'apiSecret',
      'exportFormat',
      'contactName',
      'contactEmail',
      'contactPhone',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updatedCompany = await prisma.factoringCompany.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedCompany,
    });
  } catch (error) {
    console.error('Update factoring company error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;

    const existingCompany = await prisma.factoringCompany.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            customers: true,
          },
        },
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Factoring company not found' },
        },
        { status: 404 }
      );
    }

    // Check if company is in use
    if (existingCompany._count.invoices > 0 || existingCompany._count.customers > 0) {
      // Soft delete by setting isActive to false
      await prisma.factoringCompany.update({
        where: { id: resolvedParams.id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if not in use
      await prisma.factoringCompany.delete({
        where: { id: resolvedParams.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Factoring company deleted',
    });
  } catch (error) {
    console.error('Delete factoring company error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

