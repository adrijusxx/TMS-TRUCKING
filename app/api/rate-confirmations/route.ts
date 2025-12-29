import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    const loadId = searchParams.get('loadId');
    const invoiceId = searchParams.get('invoiceId');
    const matched = searchParams.get('matched');
    const search = searchParams.get('search');

    const where: any = {
      companyId: session.user.companyId,
    };

    if (loadId) {
      where.loadId = loadId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (matched === 'true') {
      where.loadId = { not: null };
    } else if (matched === 'false') {
      where.loadId = null;
    }

    if (search) {
      where.OR = [
        { rateConfNumber: { contains: search, mode: 'insensitive' } },
        { load: { loadNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [confirmations, total] = await Promise.all([
      prisma.rateConfirmation.findMany({
        where,
        include: {
          load: {
            select: {
              id: true,
              loadNumber: true,
              customer: {
                select: {
                  name: true,
                  customerNumber: true,
                },
              },
            },
          },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        matchedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
          document: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rateConfirmation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: confirmations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Rate confirmations list error:', error);
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

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      loadId,
      rateConfNumber,
      baseRate,
      fuelSurcharge,
      accessorialCharges,
      totalRate,
      paymentTerms,
      paymentMethod,
      documentId,
      invoiceId,
      notes,
    } = body;

    if (!loadId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Load ID is required' },
        },
        { status: 400 }
      );
    }

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Check if rate confirmation already exists for this load
    const existing = await prisma.rateConfirmation.findUnique({
      where: { loadId },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE',
            message: 'Rate confirmation already exists for this load',
          },
        },
        { status: 400 }
      );
    }

    // Calculate total if not provided
    const finalTotalRate =
      totalRate ||
      (baseRate || 0) + (fuelSurcharge || 0) + (accessorialCharges || 0);

    // Create rate confirmation
    const confirmation = await prisma.rateConfirmation.create({
      data: {
        companyId: session.user.companyId,
        loadId,
        rateConfNumber: rateConfNumber || `RC-${Date.now()}`,
        baseRate: baseRate || 0,
        fuelSurcharge: fuelSurcharge || 0,
        accessorialCharges: accessorialCharges || 0,
        totalRate: finalTotalRate,
        paymentTerms: paymentTerms || 30,
        paymentMethod: paymentMethod || null,
        documentId: documentId || null,
        invoiceId: invoiceId || null,
        matchedToInvoice: !!invoiceId,
        notes: notes || null,
      },
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: confirmation,
    });
  } catch (error) {
    console.error('Create rate confirmation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

