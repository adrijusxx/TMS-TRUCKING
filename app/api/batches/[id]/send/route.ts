import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendBatchSchema = z.object({
  factoringCompany: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
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
    const validated = sendBatchSchema.parse(body);

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
      include: {
        items: {
          include: {
            invoice: true,
          },
        },
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

    if (batch.postStatus === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot send a PAID batch',
          },
        },
        { status: 400 }
      );
    }

    // Update batch status and send information
    const updated = await prisma.invoiceBatch.update({
      where: { id: id },
      data: {
        postStatus: 'POSTED',
        sentToFactoringAt: new Date(),
        factoringCompanyId: validated.factoringCompany || null,
        notes: validated.notes || batch.notes,
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
        invoiceCount: updated.items?.length || 0,
      },
      message: 'Batch sent successfully',
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

    console.error('Send batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

