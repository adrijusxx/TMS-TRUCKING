import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const generateInvoiceSchema = z.object({
  loadIds: z.array(z.string().cuid()).min(1, 'At least one load is required'),
  invoiceNumber: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
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
    const validated = generateInvoiceSchema.parse(body);

    // Fetch all loads
    // Allow all loads to be invoiced (not just delivered ones)
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
        // Removed status restriction - allow invoicing any load
      },
      include: {
        customer: true,
      },
    });

    if (loads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No valid loads found for invoicing',
          },
        },
        { status: 404 }
      );
    }

    // Verify all loads belong to the same company
    const companyIds = new Set(loads.map((load) => load.companyId));
    if (companyIds.size > 1 || !companyIds.has(session.user.companyId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All loads must belong to your company',
          },
        },
        { status: 400 }
      );
    }

    // Group loads by customer
    const loadsByCustomer = loads.reduce((acc, load) => {
      const customerId = load.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: load.customer,
          loads: [],
          totalRevenue: 0,
        };
      }
      acc[customerId].loads.push(load);
      acc[customerId].totalRevenue += load.revenue;
      return acc;
    }, {} as Record<string, any>);

    // Generate invoice for each customer
    const invoices = [];

    for (const [customerId, data] of Object.entries(loadsByCustomer)) {
      const customer = data.customer;
      const totalAmount = data.totalRevenue;
      const taxAmount = totalAmount * 0.08; // 8% tax (configurable)
      const totalWithTax = totalAmount + taxAmount;

      // Generate invoice number if not provided
      const invoiceNumber =
        validated.invoiceNumber ||
        `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Calculate due date (default to customer payment terms)
      const dueDate = validated.dueDate
        ? new Date(validated.dueDate)
        : new Date(
            Date.now() + (customer.paymentTerms || 30) * 24 * 60 * 60 * 1000
          );

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          invoiceDate: new Date(),
          dueDate,
          subtotal: totalAmount,
          tax: taxAmount,
          total: totalWithTax,
          balance: totalWithTax,
          status: 'DRAFT',
          notes: validated.notes,
          loadIds: data.loads.map((l: any) => l.id),
        },
      });

      // Link loads to invoice
      await prisma.load.updateMany({
        where: {
          id: { in: data.loads.map((l: any) => l.id) },
        },
        data: {
          invoiceId: invoice.id,
          status: 'INVOICED',
        },
      });

      // Note: InvoiceLineItem model doesn't exist in schema
      // Line items are stored in the loadIds array and can be retrieved via loads relation

      invoices.push(invoice);
    }

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        message: `Generated ${invoices.length} invoice(s)`,
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

    console.error('Invoice generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

