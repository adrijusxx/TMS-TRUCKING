import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const changeStatusSchema = z.object({
  postStatus: z.enum(['UNPOSTED', 'POSTED', 'PAID']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = changeStatusSchema.parse(body);

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    // Reopening a posted/paid batch requires batches.reopen permission
    const isReopening = batch.postStatus !== 'UNPOSTED' && validated.postStatus === 'UNPOSTED';
    if (isReopening) {
      const role = session.user.role as string;
      if (!hasPermission(role, 'batches.reopen')) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not have permission to reopen posted batches' },
          },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.invoiceBatch.update({
      where: { id: id },
      data: {
        postStatus: validated.postStatus,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        invoiceCount: updated.items.length,
      },
      message: 'Batch status updated successfully',
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

    console.error('Change batch status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

