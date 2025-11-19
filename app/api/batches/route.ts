import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateBatchNumber } from '@/lib/utils/batch-numbering';
import { z } from 'zod';

const createBatchSchema = z.object({
  batchNumber: z.string().optional(),
  mcNumber: z.string().optional(),
  invoiceIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const postStatus = searchParams.get('postStatus');
    const search = searchParams.get('search');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (postStatus) {
      where.postStatus = postStatus;
    }

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { mcNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [batches, total] = await Promise.all([
      prisma.invoiceBatch.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoiceBatch.count({ where }),
    ]);

    // Calculate invoice counts and totals
    const batchesWithStats = batches.map((batch) => {
      const invoiceCount = batch.items.length;
      const calculatedTotal = batch.items.reduce(
        (sum, item) => sum + (item.invoice.total || 0),
        0
      );

      return {
        ...batch,
        invoiceCount,
        totalAmount: calculatedTotal,
      };
    });

    return NextResponse.json({
      success: true,
      data: batchesWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Batch list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createBatchSchema.parse(body);

    // Verify all invoices belong to the company
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: validated.invoiceIds },
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: true,
      },
    });

    if (invoices.length !== validated.invoiceIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INVOICES',
            message: 'Some invoices not found or do not belong to your company',
          },
        },
        { status: 400 }
      );
    }

    // Check if invoices are already in a batch
    const existingBatchItems = await prisma.invoiceBatchItem.findMany({
      where: {
        invoiceId: { in: validated.invoiceIds },
      },
    });

    if (existingBatchItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVOICES_IN_BATCH',
            message: 'Some invoices are already in a batch',
          },
        },
        { status: 400 }
      );
    }

    // Generate batch number if not provided
    const batchNumber = validated.batchNumber || (await generateBatchNumber(session.user.companyId));

    // Calculate total amount
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Get MC number from first invoice or use provided
    const mcNumber = validated.mcNumber || invoices[0]?.mcNumber || null;

    // Create batch with items
    const batch = await prisma.invoiceBatch.create({
      data: {
        batchNumber,
        companyId: session.user.companyId,
        createdById: session.user.id,
        mcNumber,
        totalAmount,
        notes: validated.notes,
        items: {
          create: validated.invoiceIds.map((invoiceId) => ({
            invoiceId,
          })),
        },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...batch,
          invoiceCount: batch.items.length,
        },
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
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Create batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

