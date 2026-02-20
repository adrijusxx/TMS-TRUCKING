import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateLoadSchema } from '@/lib/validations/load';
import { z } from 'zod';
import { LoadStatus } from '@prisma/client';
import { LoadUpdateManager } from '@/lib/managers/LoadUpdateManager';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/api/route-helpers';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';

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
    const loadId = resolvedParams.id;

    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            creditLimit: true,
            creditHold: true,
            paymentTerms: true,
            mcNumber: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        coDriver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        truck: true,
        trailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        stops: {
          orderBy: { sequence: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        segments: {
          orderBy: { sequence: 'asc' },
          include: {
            driver: {
              select: {
                id: true,
                driverNumber: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            truck: {
              select: {
                id: true,
                truckNumber: true,
              },
            },
          },
        },
        rateConfirmation: {
          select: {
            id: true,
            rateConfNumber: true,
            baseRate: true,
            fuelSurcharge: true,
            accessorialCharges: true,
            totalRate: true,
            paymentTerms: true,
            paymentMethod: true,
            notes: true,
          },
        },
        loadExpenses: {
          orderBy: { date: 'desc' },
        },
        accessorialCharges: true,
        driverAdvances: {
          orderBy: { requestDate: 'desc' },
        },
        route: true,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: load,
    });
  } catch (error) {
    return handleApiError(error);
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

    const { load, meta } = await LoadUpdateManager.updateLoad(resolvedParams.id, body, session);

    return NextResponse.json({
      success: true,
      data: load,
      meta
    });
  } catch (error: unknown) {
    // Map LoadUpdateManager plain Error messages to proper AppErrors
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      if (error.message === 'Load not found') {
        return handleApiError(new NotFoundError('Load'));
      }
      if (error.message.startsWith('Forbidden')) {
        return handleApiError(new ForbiddenError(error.message));
      }
      if (error.message.includes('Missing documents') || error.message.includes('not found')) {
        return handleApiError(new ValidationError(error.message));
      }
    }
    return handleApiError(error);
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

    // Handle Next.js 15+ params which can be a Promise
    const resolvedParams = await params;
    const loadId = resolvedParams.id;

    // Verify load exists and belongs to company
    const existingLoad = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingLoad) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete loads
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete loads',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.load.update({
      where: { id: loadId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Load deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

