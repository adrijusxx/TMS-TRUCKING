import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { VendorType } from '@prisma/client';
import { VendorDirectoryManager } from '@/lib/managers/VendorDirectoryManager';
import { z } from 'zod';

const createVendorSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().optional().nullable(),
  hourlyRate: z.number().min(0).optional().nullable(),
  specialties: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.enum(['REPAIR_SHOP', 'SERVICE_PROVIDER', 'PARTS_VENDOR', 'SUPPLIER', 'OTHER']).optional().default('REPAIR_SHOP'),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/fleet/vendors
 * Get all vendors for the company.
 *
 * Query params:
 * - type: filter by VendorType
 * - specialization: filter by service tag (TIRES, ENGINE, etc.)
 * - state, city, search: additional filters
 * - nearest: set to "true" with lat/lng to find nearest vendors
 * - lat, lng: latitude/longitude for nearest vendor search
 * - limit: max results for nearest search (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Nearest vendor search mode
    if (searchParams.get('nearest') === 'true') {
      const lat = parseFloat(searchParams.get('lat') || '');
      const lng = parseFloat(searchParams.get('lng') || '');
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'lat and lng are required for nearest search' } },
          { status: 400 }
        );
      }
      const specialization = searchParams.get('specialization') || undefined;
      const limit = parseInt(searchParams.get('limit') || '10');

      const vendors = await VendorDirectoryManager.findNearestVendor(
        session.user.companyId,
        { latitude: lat, longitude: lng },
        specialization,
        limit
      );
      return NextResponse.json({ success: true, data: vendors });
    }

    // Specialization tag addition via PATCH-like query (action=addSpecialization)
    const action = searchParams.get('action');
    if (action === 'specializations') {
      const specializations = VendorDirectoryManager.getValidSpecializations();
      return NextResponse.json({ success: true, data: specializations });
    }

    // Standard vendor listing with filters
    const type = searchParams.get('type');
    const specialization = searchParams.get('specialization');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    // Use VendorDirectoryManager if any advanced filters are present
    if (specialization || state || city || search) {
      const vendors = await VendorDirectoryManager.listVendors(session.user.companyId, {
        type: type || undefined,
        specialization: specialization || undefined,
        state: state || undefined,
        city: city || undefined,
        search: search || undefined,
      });
      return NextResponse.json({ success: true, data: vendors });
    }

    // Fallback: original query for backward compatibility
    const vendors = await prisma.vendor.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        ...(type && Object.values(VendorType).includes(type as VendorType) && {
          type: type as VendorType
        }),
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any, // Type assertion: Prisma client may need regeneration
    });

    return NextResponse.json({ success: true, data: vendors });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch vendors',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fleet/vendors
 * Add specialization tags to a vendor.
 * Body: { vendorId: string, tags: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'vendors.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vendorId, tags } = body;

    if (!vendorId || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'vendorId and tags[] are required' } },
        { status: 400 }
      );
    }

    const result = await VendorDirectoryManager.addSpecialization(vendorId, tags);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error?.code === 'BAD_REQUEST' || error?.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode || 400 }
      );
    }
    console.error('Error updating vendor specializations:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update vendor' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fleet/vendors
 * Create a new vendor
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

    if (!hasPermission(session.user.role, 'vendors.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createVendorSchema.parse(body);

    // Generate vendor number
    const lastVendor = await prisma.vendor.findFirst({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
      select: { vendorNumber: true },
    });

    const lastNumber = lastVendor ? parseInt(lastVendor.vendorNumber.split('-')[1]) || 0 : 0;
    const vendorNumber = `VEN-${String(lastNumber + 1).padStart(6, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        vendorNumber,
        companyId: session.user.companyId,
        createdById: session.user.id,
      } as any, // Type assertion: Prisma client may need regeneration
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any, // Type assertion: Prisma client may need regeneration
    });

    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
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
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create vendor',
        },
      },
      { status: 500 }
    );
  }
}

