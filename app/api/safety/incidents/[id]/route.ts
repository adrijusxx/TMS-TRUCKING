import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateSafetyIncidentSchema = z.object({
  driverId: z.string().optional().nullable(),
  truckId: z.string().optional().nullable(),
  loadId: z.string().optional().nullable(),
  incidentType: z.enum([
    'ACCIDENT',
    'COLLISION',
    'ROLLOVER',
    'FIRE',
    'SPILL',
    'INJURY',
    'FATALITY',
    'HAZMAT_INCIDENT',
    'EQUIPMENT_FAILURE',
    'DRIVER_ERROR',
    'OTHER',
  ]).optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL', 'FATAL']).optional(),
  date: z.string().datetime().optional(),
  time: z.string().optional().nullable(),
  location: z.string().min(1).optional(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  description: z.string().min(1).optional(),
  contributingFactors: z.string().optional().nullable(),
  weatherConditions: z.string().optional().nullable(),
  roadConditions: z.string().optional().nullable(),
  injuriesInvolved: z.boolean().optional(),
  fatalitiesInvolved: z.boolean().optional(),
  vehicleDamage: z.string().optional().nullable(),
  propertyDamage: z.string().optional().nullable(),
  status: z.enum(['REPORTED', 'UNDER_INVESTIGATION', 'INVESTIGATION_COMPLETE', 'RESOLVED', 'CLOSED']).optional(),
  investigationStatus: z.string().optional().nullable(),
  investigatorId: z.string().optional().nullable(),
  investigationNotes: z.string().optional().nullable(),
  rootCause: z.string().optional().nullable(),
  correctiveActions: z.string().optional().nullable(),
  dotReportable: z.boolean().optional(),
  dotReportNumber: z.string().optional().nullable(),
  policeReportNumber: z.string().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  insuranceClaimNumber: z.string().optional().nullable(),
});

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

    const incident = await prisma.safetyIncident.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
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
        load: {
          select: {
            id: true,
            loadNumber: true,
          },
        },
        documents: true,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety incident not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    console.error('Error fetching safety incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch safety incident',
        },
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

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateSafetyIncidentSchema.parse(body);

    const existing = await prisma.safetyIncident.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety incident not found' } },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData };
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }

    const incident = await prisma.safetyIncident.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
        load: {
          select: {
            id: true,
            loadNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating safety incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update safety incident',
        },
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

    if (!hasPermission(session.user.role, 'trucks.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const incident = await prisma.safetyIncident.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety incident not found' } },
        { status: 404 }
      );
    }

    await prisma.safetyIncident.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Safety incident deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting safety incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete safety incident',
        },
      },
      { status: 500 }
    );
  }
}

