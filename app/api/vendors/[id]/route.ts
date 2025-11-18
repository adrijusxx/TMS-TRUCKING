import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateVendorSchema = z.object({
  vendorNumber: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum([
    'SUPPLIER',
    'PARTS_VENDOR',
    'SERVICE_PROVIDER',
    'FUEL_VENDOR',
    'REPAIR_SHOP',
    'TIRE_SHOP',
    'OTHER',
  ]).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().optional().nullable(),
  billingZip: z.string().optional().nullable(),
  billingEmail: z.string().email().optional().nullable(),
  paymentTerms: z.number().int().nonnegative().optional(),
  creditLimit: z.number().nonnegative().optional().nullable(),
  taxId: z.string().optional().nullable(),
  w9OnFile: z.boolean().optional(),
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

    const resolvedParams = await params;
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        contacts: true,
        inventoryItems: {
          take: 10,
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch vendor',
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

    if (!hasPermission(session.user.role, 'customers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateVendorSchema.parse(body);

    const existing = await prisma.vendor.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        { status: 404 }
      );
    }

    const vendor = await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: validatedData,
      include: {
        contacts: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: vendor,
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

    console.error('Error updating vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update vendor',
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

    if (!hasPermission(session.user.role, 'customers.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        { status: 404 }
      );
    }

    await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete vendor',
        },
      },
      { status: 500 }
    );
  }
}

