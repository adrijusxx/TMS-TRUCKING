import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

const uploadSchema = z.object({
  loadId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  truckId: z.string().cuid().optional(),
  type: z.enum(['BOL', 'POD', 'INVOICE', 'RATE_CONFIRMATION', 'SETTLEMENT', 'LICENSE', 'MEDICAL_CARD', 'INSURANCE', 'INSPECTION', 'MAINTENANCE', 'OTHER']),
  fileName: z.string().min(1),
  title: z.string().min(1), // Required title field
  fileUrl: z.string().min(1), // Accept URL or path
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to upload documents
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'documents.upload')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to upload documents',
          },
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Extract form data
    const fileName = formData.get('fileName')?.toString();
    const body = {
      loadId: formData.get('loadId')?.toString(),
      driverId: formData.get('driverId')?.toString(),
      truckId: formData.get('truckId')?.toString(),
      type: formData.get('type')?.toString(),
      fileName: fileName || '',
      title: formData.get('title')?.toString() || fileName || 'Untitled Document',
      fileUrl: formData.get('fileUrl')?.toString(),
      fileSize: formData.get('fileSize') ? parseInt(formData.get('fileSize')!.toString()) : undefined,
      mimeType: formData.get('mimeType')?.toString(),
      description: formData.get('description')?.toString(),
    };

    const validated = uploadSchema.parse(body);

    // Verify load/driver/truck belongs to company if provided
    if (validated.loadId) {
      const load = await prisma.load.findFirst({
        where: {
          id: validated.loadId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });
      if (!load) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
          { status: 404 }
        );
      }
    }

    if (validated.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });
      if (!driver) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
          { status: 404 }
        );
      }
    }

    if (validated.truckId) {
      const truck = await prisma.truck.findFirst({
        where: {
          id: validated.truckId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });
      if (!truck) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Truck not found' } },
          { status: 404 }
        );
      }
    }

    const document = await prisma.document.create({
      data: {
        ...validated,
        companyId: session.user.companyId,
        uploadedBy: session.user.id, // uploadedBy is a String field, not a relation
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: document,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

