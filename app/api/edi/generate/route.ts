import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateEDI204, generateEDI214, generateEDI210 } from '@/lib/edi/parser';
import { z } from 'zod';

const generateEDISchema = z.object({
  type: z.enum(['204', '210', '214']),
  loadId: z.string().cuid().optional(),
  invoiceId: z.string().cuid().optional(),
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

    const body = await request.json();
    const validated = generateEDISchema.parse(body);

    let ediContent: string;

    if (validated.type === '204') {
      // Load Tender
      if (!validated.loadId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'MISSING_LOAD_ID', message: 'loadId required for EDI 204' },
          },
          { status: 400 }
        );
      }

      const load = await prisma.load.findFirst({
        where: {
          id: validated.loadId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
        include: {
          customer: true,
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

      // Validate required fields for EDI 204
      if (!load.pickupCity || !load.pickupState || !load.pickupDate || 
          !load.deliveryCity || !load.deliveryState || !load.deliveryDate) {
        return NextResponse.json(
          {
            success: false,
            error: { 
              code: 'INVALID_DATA', 
              message: 'Load is missing required fields for EDI 204 (pickup/delivery location and dates)' 
            },
          },
          { status: 400 }
        );
      }

      // Extract values after null check to help TypeScript narrow types
      const pickupCity = load.pickupCity;
      const pickupState = load.pickupState;
      const pickupDate = load.pickupDate;
      const deliveryCity = load.deliveryCity;
      const deliveryState = load.deliveryState;
      const deliveryDate = load.deliveryDate;

      ediContent = generateEDI204({
        loadNumber: load.loadNumber,
        customer: {
          name: load.customer.name,
          scac: load.customer.scac || undefined,
        },
        pickupCity,
        pickupState,
        pickupDate,
        deliveryCity,
        deliveryState,
        deliveryDate,
        commodity: load.commodity || undefined,
        weight: load.weight || undefined,
        revenue: load.revenue,
      });
    } else if (validated.type === '214') {
      // Shipment Status
      if (!validated.loadId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'MISSING_LOAD_ID', message: 'loadId required for EDI 214' },
          },
          { status: 400 }
        );
      }

      const load = await prisma.load.findFirst({
        where: {
          id: validated.loadId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
        include: {
          customer: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
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

      const latestStatus = load.statusHistory[0];

      ediContent = generateEDI214({
        loadNumber: load.loadNumber,
        status: load.status,
        location: latestStatus?.location || undefined,
        timestamp: latestStatus?.createdAt || load.updatedAt,
        customer: {
          scac: load.customer.scac || undefined,
        },
      });
    } else if (validated.type === '210') {
      // Invoice
      if (!validated.invoiceId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'MISSING_INVOICE_ID', message: 'invoiceId required for EDI 210' },
          },
          { status: 400 }
        );
      }

      const invoice = await prisma.invoice.findFirst({
        where: {
          id: validated.invoiceId,
          customer: {
            companyId: session.user.companyId,
          },
        },
        include: {
          customer: true,
        },
      });

      if (!invoice) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Invoice not found' },
          },
          { status: 404 }
        );
      }

      // Fetch loads
      const loads = await prisma.load.findMany({
        where: {
          id: { in: invoice.loadIds },
        },
        select: {
          loadNumber: true,
          revenue: true,
        },
      });

      ediContent = generateEDI210({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customer: {
          name: invoice.customer.name,
          scac: invoice.customer.scac || undefined,
        },
        loads: loads.map((l) => ({
          loadNumber: l.loadNumber,
          revenue: l.revenue,
        })),
        total: invoice.total,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid EDI type' },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type: validated.type,
        content: ediContent,
        filename: `EDI_${validated.type}_${Date.now()}.edi`,
      },
    });
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

    console.error('EDI generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

