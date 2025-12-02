import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission, type UserRole } from '@/lib/permissions';

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
    const document = await prisma.document.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        load: {
          select: {
            loadNumber: true,
          },
        },
        driver: {
          select: {
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
            truckNumber: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Document fetch error:', error);
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
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to edit documents
    const role = session.user.role as UserRole;
    if (!hasPermission(role, 'documents.upload')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit documents',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileName } = body;

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: resolvedParams.id },
      data: {
        ...(fileName !== undefined && { fileName }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('Document update error:', error);
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
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete documents
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    
    // Dispatchers can only delete BOL, POD, and RATE_CONFIRMATION documents
    // Other roles need full documents.delete permission
    if (role === 'DISPATCHER') {
      const allowedTypes = ['BOL', 'POD', 'RATE_CONFIRMATION'];
      if (!allowedTypes.includes(existingDocument.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Dispatchers can only delete BOL, POD, and Rate Confirmation documents',
            },
          },
          { status: 403 }
        );
      }
    } else if (!hasPermission(role, 'documents.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete documents',
          },
        },
        { status: 403 }
      );
    }

    // For critical documents (BOL, POD, RATE_CONFIRMATION), handle accounting sync implications
    const isCriticalDocument = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(existingDocument.type);
    const loadId = existingDocument.loadId;

    // Soft delete
    await prisma.document.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    // If deleting a rate confirmation, also remove the link from RateConfirmation model
    if (existingDocument.type === 'RATE_CONFIRMATION' && loadId) {
      try {
        await prisma.rateConfirmation.updateMany({
          where: {
            loadId: loadId,
            documentId: resolvedParams.id,
          },
          data: {
            documentId: null,
          },
        });
      } catch (error) {
        // Log but don't fail - document is already deleted
        console.error('Error updating RateConfirmation after document deletion:', error);
      }
    }

    // If deleting POD and load is delivered, note that accounting sync may need review
    if (existingDocument.type === 'POD' && loadId) {
      try {
        const load = await prisma.load.findFirst({
          where: { id: loadId },
          select: { status: true },
        });
        
        if (load?.status === 'DELIVERED') {
          // Update load to indicate POD was removed (accounting may need to review)
          await prisma.load.update({
            where: { id: loadId },
            data: {
              podUploadedAt: null,
              accountingSyncStatus: 'REQUIRES_REVIEW', // Flag for accounting review
            },
          });
        }
      } catch (error) {
        // Log but don't fail - document is already deleted
        console.error('Error updating load after POD deletion:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

