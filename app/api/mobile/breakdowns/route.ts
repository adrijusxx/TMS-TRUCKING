import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateBreakdownCaseNumber } from '@/lib/utils/breakdown-numbering';
import { z } from 'zod';

const reportBreakdownSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  odometerReading: z.number().nonnegative().optional(),
  breakdownType: z.enum([
    'ENGINE_FAILURE',
    'TRANSMISSION_FAILURE',
    'BRAKE_FAILURE',
    'TIRE_FLAT',
    'TIRE_BLOWOUT',
    'ELECTRICAL_ISSUE',
    'COOLING_SYSTEM',
    'FUEL_SYSTEM',
    'SUSPENSION',
    'ACCIDENT_DAMAGE',
    'WEATHER_RELATED',
    'OTHER',
  ]).default('OTHER'), // Default to OTHER, fleet department will update
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'), // Default to MEDIUM, fleet department will update
  description: z.string().min(1, 'Description is required'),
  mediaUrls: z.array(z.string()).optional(), // Photos/videos from mobile app
  loadId: z.string().optional(),
});

/**
 * POST /api/mobile/breakdowns
 * Driver reports a breakdown from mobile app
 * This automatically creates a breakdown case and a communication entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        currentTruck: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    // Parse request body with size limit handling
    let body;
    try {
      const bodyText = await request.text();
      const bodySizeMB = new Blob([bodyText]).size / 1024 / 1024;
      
      // Check request size (50MB limit)
      if (bodySizeMB > 50) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: `Request is too large (${bodySizeMB.toFixed(2)}MB). Maximum size is 50MB. Please reduce the number or size of attachments.`,
            },
          },
          { status: 413 }
        );
      }

      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError);
      if (parseError.message?.includes('JSON') || parseError.message?.includes('Unexpected')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: 'Invalid JSON in request body. The request may be too large or malformed.',
            },
          },
          { status: 400 }
        );
      }
      throw parseError;
    }

    // Validate and limit mediaUrls size
    if (body.mediaUrls && Array.isArray(body.mediaUrls)) {
      const totalMediaSize = body.mediaUrls.reduce((sum: number, url: string) => {
        // Base64 is ~33% larger than original, estimate size
        return sum + (url.length * 0.75);
      }, 0);
      const totalMediaSizeMB = totalMediaSize / 1024 / 1024;
      
      if (totalMediaSizeMB > 40) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MEDIA_TOO_LARGE',
              message: `Total attachment size (${totalMediaSizeMB.toFixed(2)}MB) exceeds limit. Maximum is 40MB. Please reduce the number or size of attachments.`,
            },
          },
          { status: 413 }
        );
      }

      // Limit number of media files
      if (body.mediaUrls.length > 10) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOO_MANY_FILES',
              message: `Too many attachments (${body.mediaUrls.length}). Maximum is 10 files.`,
            },
          },
          { status: 400 }
        );
      }
    }

    const validated = reportBreakdownSchema.parse(body);

    // Verify truck belongs to driver's company
    const truck = await prisma.truck.findFirst({
      where: {
        id: validated.truckId,
        companyId: driver.companyId,
      },
    });

    if (!truck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Truck not found' },
        },
        { status: 404 }
      );
    }

    // Generate breakdown case number
    const breakdownNumber = await generateBreakdownCaseNumber(driver.companyId);

    // Create breakdown case
    const breakdown = await prisma.breakdown.create({
      data: {
        companyId: driver.companyId,
        truckId: validated.truckId,
        driverId: driver.id,
        loadId: validated.loadId,
        breakdownNumber,
        location: validated.location,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zip: validated.zip,
        latitude: validated.latitude,
        longitude: validated.longitude,
        odometerReading: validated.odometerReading || truck.odometerReading || 0,
        breakdownType: validated.breakdownType,
        priority: validated.priority,
        description: validated.description,
        status: 'REPORTED',
        reportedBy: session.user.id,
      },
    });

    // Create communication entry for the breakdown report
    // Handle case where Communication model doesn't exist yet
    try {
      await prisma.communication.create({
      data: {
        companyId: driver.companyId,
        breakdownId: breakdown.id,
        driverId: driver.id,
        channel: 'MOBILE_APP',
        type: 'BREAKDOWN_REPORT',
        direction: 'INBOUND',
        content: `Breakdown reported via mobile app:\n\n${validated.description}\n\nLocation: ${validated.location}${validated.address ? `\n${validated.address}` : ''}${validated.city ? `, ${validated.city}, ${validated.state}` : ''}`,
        mediaUrls: validated.mediaUrls || [],
        location: validated.latitude && validated.longitude
          ? {
              lat: validated.latitude,
              lng: validated.longitude,
              address: validated.address || validated.location,
            }
          : undefined,
        status: 'DELIVERED',
        autoCreated: true,
        createdById: session.user.id,
      },
    });
    } catch (error: any) {
      // If Communication model doesn't exist yet, that's okay - breakdown was created
      // Just log it and continue
      console.warn('Communication model not available:', error?.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        breakdown: {
          id: breakdown.id,
          breakdownNumber: breakdown.breakdownNumber,
          status: breakdown.status,
          priority: breakdown.priority,
          reportedAt: breakdown.reportedAt,
        },
        message: `Breakdown case ${breakdown.breakdownNumber} created successfully. Our team will contact you shortly.`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Mobile breakdown report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to report breakdown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mobile/breakdowns
 * Get driver's breakdown cases
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      driverId: driver.id,
      companyId: driver.companyId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    // Fetch breakdowns
    const breakdowns = await prisma.breakdown.findMany({
      where,
      include: {
        truck: {
          select: {
            truckNumber: true,
            make: true,
            model: true,
            year: true,
          },
        },
        load: {
          select: {
            loadNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        breakdowns: breakdowns.map((bd) => ({
          id: bd.id,
          breakdownNumber: bd.breakdownNumber,
          status: bd.status,
          priority: bd.priority,
          breakdownType: bd.breakdownType,
          description: bd.description,
          location: bd.location,
          address: bd.address,
          city: bd.city,
          state: bd.state,
          truck: {
            number: bd.truck.truckNumber,
            make: bd.truck.make,
            model: bd.truck.model,
            year: bd.truck.year,
          },
          load: bd.load
            ? {
                loadNumber: bd.load.loadNumber,
                customer: bd.load.customer.name,
              }
            : null,
          reportedAt: bd.reportedAt,
          dispatchedAt: bd.dispatchedAt,
          repairCompletedAt: bd.repairCompletedAt,
          truckReadyAt: bd.truckReadyAt,
        })),
        total: breakdowns.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Mobile breakdowns error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch breakdowns',
        },
      },
      { status: 500 }
    );
  }
}

