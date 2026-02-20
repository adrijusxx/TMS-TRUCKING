import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateBatchNumber } from '@/lib/utils/batch-numbering';
import { BillingHoldManager } from '@/lib/managers/BillingHoldManager';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';
import { validateLoadForAccounting } from '@/lib/validations/load';
import { z } from 'zod';

const fromLoadsSchema = z.object({
  loadIds: z.array(z.string()).min(1, 'At least one load is required'),
  mcNumber: z.string().optional(),
  notes: z.string().optional(),
});

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
    const validated = fromLoadsSchema.parse(body);

    // Fetch all selected loads
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: {
          select: { id: true, name: true, type: true, paymentTerms: true, factoringCompanyId: true },
        },
      },
    });

    if (loads.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No valid loads found' } },
        { status: 404 }
      );
    }

    // Separate loads: DELIVERED (need invoicing) vs already INVOICED (have invoices)
    const loadsNeedInvoicing = loads.filter((l) => l.status !== 'INVOICED' && l.status !== 'READY_TO_BILL');
    const loadsAlreadyInvoiced = loads.filter((l) => l.status === 'INVOICED' || l.status === 'READY_TO_BILL');

    // Validate loads that need invoicing
    const validationErrors = await validateLoadsForInvoicing(loadsNeedInvoicing);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some loads have issues that must be resolved',
            details: validationErrors,
          },
        },
        { status: 400 }
      );
    }

    // Generate invoices for DELIVERED loads
    const generatedInvoiceIds: string[] = [];
    if (loadsNeedInvoicing.length > 0) {
      const invoiceManager = new InvoiceManager();
      const grouped = groupLoadsByCustomerAndMc(loadsNeedInvoicing);

      for (const [, group] of Object.entries(grouped)) {
        const data = group as { customerId: string; customer: any; loadIds: string[] };
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}${generatedInvoiceIds.length > 0 ? `-${generatedInvoiceIds.length + 1}` : ''}`;
        const dueDate = new Date(Date.now() + (data.customer.paymentTerms || 30) * 24 * 60 * 60 * 1000);

        const result = await invoiceManager.generateInvoice(
          data.loadIds,
          { invoiceNumber, dueDate }
        );

        if (result.success && result.invoice) {
          generatedInvoiceIds.push(result.invoice.id);
        } else {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVOICE_GENERATION_FAILED',
                message: `Failed to generate invoice: ${result.error || 'Unknown error'}`,
              },
            },
            { status: 500 }
          );
        }
      }
    }

    // Find existing invoices for already-invoiced loads
    const existingInvoiceIds: string[] = [];
    if (loadsAlreadyInvoiced.length > 0) {
      const loadIds = loadsAlreadyInvoiced.map((l) => l.id);
      const existingInvoices = await prisma.invoice.findMany({
        where: {
          OR: [
            { loadId: { in: loadIds } },
            { loadIds: { hasSome: loadIds } },
          ],
          customer: { companyId: session.user.companyId },
        },
        select: { id: true },
      });
      existingInvoiceIds.push(...existingInvoices.map((inv) => inv.id));
    }

    // Combine all invoice IDs
    const allInvoiceIds = [...generatedInvoiceIds, ...existingInvoiceIds];

    if (allInvoiceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_INVOICES', message: 'No invoices could be created or found for the selected loads' } },
        { status: 400 }
      );
    }

    // Check none are already in a batch
    const existingBatchItems = await prisma.invoiceBatchItem.findMany({
      where: { invoiceId: { in: allInvoiceIds } },
      select: { invoiceId: true },
    });
    const alreadyBatched = new Set(existingBatchItems.map((i) => i.invoiceId));
    const unbatchedInvoiceIds = allInvoiceIds.filter((id) => !alreadyBatched.has(id));

    if (unbatchedInvoiceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'ALL_BATCHED', message: 'All invoices from these loads are already in batches' } },
        { status: 400 }
      );
    }

    // Calculate total from invoices
    const invoicesForTotal = await prisma.invoice.findMany({
      where: { id: { in: unbatchedInvoiceIds } },
      select: { total: true, mcNumber: true },
    });
    const totalAmount = invoicesForTotal.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Create the batch
    const batchNumber = await generateBatchNumber(session.user.companyId);
    const mcNumber = validated.mcNumber || invoicesForTotal[0]?.mcNumber || null;

    const batch = await prisma.invoiceBatch.create({
      data: {
        batchNumber,
        companyId: session.user.companyId,
        createdById: session.user.id,
        mcNumber,
        totalAmount,
        notes: validated.notes,
        items: {
          create: unbatchedInvoiceIds.map((invoiceId) => ({ invoiceId })),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            invoice: {
              include: { customer: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...batch, invoiceCount: batch.items.length },
        message: `Created batch ${batchNumber} with ${batch.items.length} invoice(s)`,
        meta: {
          generatedInvoices: generatedInvoiceIds.length,
          existingInvoices: existingInvoiceIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Create batch from loads error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

async function validateLoadsForInvoicing(loads: any[]) {
  const errors: Array<{ loadNumber: string; reason: string }> = [];
  const billingHoldManager = new BillingHoldManager();
  const invoiceManager = new InvoiceManager();

  for (const load of loads) {
    // Accounting validation
    const acctResult = validateLoadForAccounting({
      loadNumber: load.loadNumber,
      customerId: load.customerId,
      revenue: load.revenue,
      weight: load.weight,
      driverId: load.driverId,
      totalMiles: load.totalMiles,
      driverPay: load.driverPay,
      fuelAdvance: load.fuelAdvance,
    });
    if (!acctResult.canInvoice) {
      errors.push({
        loadNumber: load.loadNumber,
        reason: acctResult.errors.length > 0
          ? acctResult.errors.join('; ')
          : `Missing: ${acctResult.missingForInvoice.join(', ')}`,
      });
      continue;
    }

    // Billing hold check
    const eligibility = await billingHoldManager.checkInvoicingEligibility(load.id);
    if (!eligibility.eligible) {
      errors.push({ loadNumber: load.loadNumber, reason: eligibility.reason || 'Billing hold' });
      continue;
    }

    // Ready to bill check
    const readyToBill = await invoiceManager.isReadyToBill(load.id, {
      allowBrokerageSplit: load.customer?.type === 'BROKER',
    });
    if (!readyToBill.ready) {
      errors.push({
        loadNumber: load.loadNumber,
        reason: readyToBill.reasons?.join('; ') || 'Not ready to bill',
      });
    }
  }

  return errors;
}

function groupLoadsByCustomerAndMc(loads: any[]) {
  return loads.reduce((acc, load) => {
    const key = `${load.customerId}_${load.mcNumberId || 'null'}`;
    if (!acc[key]) {
      acc[key] = { customerId: load.customerId, customer: load.customer, loadIds: [] };
    }
    acc[key].loadIds.push(load.id);
    return acc;
  }, {} as Record<string, { customerId: string; customer: any; loadIds: string[] }>);
}
