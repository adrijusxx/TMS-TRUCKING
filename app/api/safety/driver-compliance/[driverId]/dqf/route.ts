import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { DQFService } from '@/lib/services/safety/DQFService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'drivers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { driverId } = await params;
    const body = await request.json();

    const dqfService = new DQFService(prisma, session.user.companyId);
    const dqf = await dqfService.getOrCreateDQF(driverId, session.user.companyId);

    // Update DQF document
    if (body.documentType && body.documentId) {
      const dqfDocument = await prisma.dQFDocument.upsert({
        where: {
          dqfId_documentType: {
            dqfId: dqf.id,
            documentType: body.documentType,
          },
        },
        update: {
          documentId: body.documentId,
          status: body.status || 'COMPLETE',
          expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
          issueDate: body.issueDate ? new Date(body.issueDate) : null,
        },
        create: {
          dqfId: dqf.id,
          documentId: body.documentId,
          documentType: body.documentType,
          status: body.status || 'COMPLETE',
          expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
          issueDate: body.issueDate ? new Date(body.issueDate) : null,
        },
      });

      // Recalculate DQF status
      await dqfService.updateDQFStatus(dqf.id);

      return NextResponse.json({
        success: true,
        data: dqfDocument,
      });
    }

    // Update DQF dates
    if (body.lastReviewDate !== undefined || body.nextReviewDate !== undefined) {
      const updated = await prisma.driverQualificationFile.update({
        where: { id: dqf.id },
        data: {
          lastReviewDate: body.lastReviewDate ? new Date(body.lastReviewDate) : null,
          nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid update data' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating DQF:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update DQF',
        },
      },
      { status: 500 }
    );
  }
}

