import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { validateFileUpload, sanitizeFileName, getFileSizeLimit } from '@/lib/utils/file-upload-validation';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';

const uploadSchema = z.object({
  loadId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  truckId: z.string().cuid().optional(),
  type: z.enum(['BOL', 'POD', 'INVOICE', 'RATE_CONFIRMATION', 'DRIVER_LICENSE', 'MEDICAL_CARD', 'INSURANCE', 'REGISTRATION', 'INSPECTION', 'LEASE_AGREEMENT', 'W9', 'COI', 'OTHER']),
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
    
    // Get file if provided (for validation)
    const file = formData.get('file') as File | null;
    const fileUrl = formData.get('fileUrl')?.toString();
    
    // If file is provided, validate it
    if (file && file instanceof File) {
      const maxSize = getFileSizeLimit(file.type);
      const validation = validateFileUpload(file, {
        maxSize,
        requireExtension: true,
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error || 'File validation failed',
            },
          },
          { status: 400 }
        );
      }
    }

    // Extract form data
    const fileName = file 
      ? sanitizeFileName(file.name) 
      : sanitizeFileName(formData.get('fileName')?.toString() || '');
    
    const body = {
      loadId: formData.get('loadId')?.toString(),
      driverId: formData.get('driverId')?.toString(),
      truckId: formData.get('truckId')?.toString(),
      type: formData.get('type')?.toString(),
      fileName: fileName || '',
      title: formData.get('title')?.toString() || fileName || 'Untitled Document',
      fileUrl: fileUrl || formData.get('fileUrl')?.toString(),
      fileSize: file 
        ? file.size 
        : (formData.get('fileSize') ? parseInt(formData.get('fileSize')!.toString()) : undefined),
      mimeType: file 
        ? file.type 
        : formData.get('mimeType')?.toString(),
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
        type: validated.type,
        title: validated.title,
        description: validated.description || null,
        fileName: validated.fileName,
        fileUrl: validated.fileUrl,
        fileSize: validated.fileSize || 0,
        mimeType: validated.mimeType || 'application/octet-stream',
        companyId: session.user.companyId,
        uploadedBy: session.user.id,
        loadId: validated.loadId || null,
        driverId: validated.driverId || null,
        truckId: validated.truckId || null,
      },
    });

    // Handle accounting sync for critical documents (BOL, POD, RATE_CONFIRMATION)
    // These documents are essential for driver settlements and accounting workflows
    if (validated.loadId && ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(validated.type)) {
      try {
        const load = await prisma.load.findFirst({
          where: {
            id: validated.loadId,
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            deliveredAt: true,
          },
        });

        if (load) {
          const completionManager = new LoadCompletionManager();

          // For POD: Use the dedicated POD upload handler
          if (validated.type === 'POD') {
            await completionManager.handlePODUpload(validated.loadId, document.id);
            
            // If load is delivered, trigger full completion workflow
            if (load.status === 'DELIVERED') {
              await completionManager.handleLoadCompletion(validated.loadId);
            }
          }
          // For BOL and RATE_CONFIRMATION: Trigger accounting sync if load is delivered
          else if (load.status === 'DELIVERED') {
            // Trigger accounting sync to ensure documents are included in settlement calculations
            await completionManager.handleLoadCompletion(validated.loadId);
          }

          // For RATE_CONFIRMATION: Link to RateConfirmation model if it exists
          if (validated.type === 'RATE_CONFIRMATION' && validated.loadId) {
            // Check if RateConfirmation exists for this load
            const rateConfirmation = await prisma.rateConfirmation.findUnique({
              where: { loadId: validated.loadId },
            });

            if (rateConfirmation) {
              // Update RateConfirmation with document reference
              await prisma.rateConfirmation.update({
                where: { id: rateConfirmation.id },
                data: {
                  documentId: document.id,
                },
              });
            } else {
              // Create RateConfirmation record linked to the document
              // Note: This creates a basic record - rate details should be entered separately
              // Use upsert to handle case where rateConfirmation already exists
              await prisma.rateConfirmation.upsert({
                where: { loadId: validated.loadId },
                update: {
                  documentId: document.id,
                },
                create: {
                  companyId: session.user.companyId,
                  loadId: validated.loadId,
                  documentId: document.id,
                  baseRate: 0, // Will be updated when rate details are entered
                  fuelSurcharge: 0,
                  accessorialCharges: 0,
                  totalRate: 0,
                  paymentTerms: 30,
                },
              });
            }
          }
        }
      } catch (syncError: any) {
        // Log error but don't fail the document upload
        // The document is still created, sync can be retried
        console.error('Accounting sync error after document upload:', syncError);
        // Continue with successful document creation response
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: document,
        accountingSyncTriggered: validated.loadId && ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(validated.type),
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
            details: error.issues,
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

