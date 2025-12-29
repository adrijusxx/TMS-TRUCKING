import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadStatus } from '@prisma/client';
import { BillingHoldManager } from '@/lib/managers/BillingHoldManager';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';
import { z } from 'zod';
import { invoiceReadyLoadSchema, validateLoadForAccounting } from '@/lib/validations/load';

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
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
            paymentTerms: true,
            factoringCompanyId: true,
          },
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
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

    // 🔒 ACCOUNTING VALIDATION: Verify all loads have required fields for invoicing
    const accountingErrors: Array<{ loadId: string; loadNumber: string; errors: string[] }> = [];
    const accountingWarnings: Array<{ loadId: string; loadNumber: string; warnings: string[] }> = [];

    for (const load of loads) {
      // Validate using accounting schema
      const accountingResult = validateLoadForAccounting({
        loadNumber: load.loadNumber,
        customerId: load.customerId,
        revenue: load.revenue,
        weight: load.weight,
        driverId: load.driverId,
        totalMiles: load.totalMiles,
        driverPay: load.driverPay,
        fuelAdvance: load.fuelAdvance,
      });

      // Check if load can be invoiced
      if (!accountingResult.canInvoice) {
        accountingErrors.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          errors: accountingResult.errors.length > 0 
            ? accountingResult.errors 
            : [`Missing fields: ${accountingResult.missingForInvoice.join(', ')}`],
        });
      }

      // Collect warnings
      if (accountingResult.warnings.length > 0) {
        accountingWarnings.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          warnings: accountingResult.warnings,
        });
      }
    }

    // If any loads have critical accounting errors, return error
    if (accountingErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNTING_VALIDATION_ERROR',
            message: 'One or more loads are missing required accounting fields',
            details: accountingErrors.map(e => ({
              loadNumber: e.loadNumber,
              reason: e.errors.join('; '),
            })),
          },
        },
        { status: 400 }
      );
    }

    // Log accounting warnings (but don't block invoicing)
    if (accountingWarnings.length > 0) {
      console.log('[Invoice Generate] Accounting warnings:', accountingWarnings);
    }

    // 🔥 CRITICAL: Check billing hold eligibility for each load
    const billingHoldManager = new BillingHoldManager();
    const invoiceManager = new InvoiceManager();
    const ineligibleLoads: Array<{ loadId: string; loadNumber: string; reason: string }> = [];

    for (const load of loads) {
      // Check 1: Billing hold eligibility
      const eligibility = await billingHoldManager.checkInvoicingEligibility(load.id);
      
      if (!eligibility.eligible) {
        ineligibleLoads.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          reason: eligibility.reason || 'Load is not eligible for invoicing',
        });
        continue; // Skip ready-to-bill check if billing hold
      }

      // Check 2: "Clean Load" validation gate
      const readyToBill = await invoiceManager.isReadyToBill(load.id, {
        allowBrokerageSplit: (load.customer as any).type === 'BROKER', // Allow brokerage split for BROKER customers
      });

      if (!readyToBill.ready) {
        ineligibleLoads.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          reason: `Load validation failed: ${readyToBill.reasons?.join('; ') || 'Not ready to bill'}`,
        });
      }
    }

    // If any loads are on billing hold, return error
    if (ineligibleLoads.length > 0) {
      const billingHoldLoads = ineligibleLoads.filter(l => {
        const load = loads.find(load => load.id === l.loadId);
        // Check billing hold flag (may need type assertion if Prisma types are stale)
        return (load as any)?.isBillingHold === true;
      });

      if (billingHoldLoads.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BILLING_HOLD',
              message: 'One or more loads are on billing hold and cannot be invoiced',
              details: billingHoldLoads.map(l => ({
                loadNumber: l.loadNumber,
                reason: l.reason,
              })),
            },
          },
          { status: 400 }
        );
      }

      // Other ineligibility reasons (status, etc.)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVOICING_NOT_ELIGIBLE',
            message: 'One or more loads are not eligible for invoicing',
            details: ineligibleLoads.map(l => ({
              loadNumber: l.loadNumber,
              reason: l.reason,
            })),
          },
        },
        { status: 400 }
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

      // Build contact information for invoice notes
      const contactInfo: string[] = [];
      
      // Collect unique dispatchers, drivers, trucks, and trailers from all loads
      const dispatchers = new Map<string, { name: string; phone: string | null }>();
      const drivers = new Map<string, { name: string; driverNumber: string | null; phone: string | null }>();
      const trucks = new Set<string>();
      const trailers = new Set<string>();

      for (const load of data.loads) {
        // Dispatcher info
        if (load.dispatcher) {
          const dispatcherName = `${load.dispatcher.firstName} ${load.dispatcher.lastName}`.trim();
          if (dispatcherName && !dispatchers.has(load.dispatcher.id)) {
            dispatchers.set(load.dispatcher.id, {
              name: dispatcherName,
              phone: load.dispatcher.phone || null,
            });
          }
        }

        // Driver info
        if (load.driver) {
          const driverName = load.driver.user
            ? `${load.driver.user.firstName} ${load.driver.user.lastName}`.trim()
            : null;
          if (driverName && !drivers.has(load.driver.id)) {
            drivers.set(load.driver.id, {
              name: driverName,
              driverNumber: load.driver.driverNumber || null,
              phone: load.driver.user?.phone || null,
            });
          }
        }

        // Truck info
        if (load.truck?.truckNumber) {
          trucks.add(load.truck.truckNumber);
        }

        // Trailer info
        if (load.trailerNumber) {
          trailers.add(load.trailerNumber);
        }
      }

      // Format contact information
      if (dispatchers.size > 0) {
        const dispatcherList = Array.from(dispatchers.values())
          .map((d) => `${d.name}${d.phone ? ` (${d.phone})` : ''}`)
          .join(', ');
        contactInfo.push(`Dispatcher(s): ${dispatcherList}`);
      }

      if (drivers.size > 0) {
        const driverList = Array.from(drivers.values())
          .map((d) => {
            const namePart = d.driverNumber ? `${d.name} (#${d.driverNumber})` : d.name;
            return `${namePart}${d.phone ? ` (${d.phone})` : ''}`;
          })
          .join(', ');
        contactInfo.push(`Driver(s): ${driverList}`);
      }

      if (trucks.size > 0) {
        contactInfo.push(`Truck(s): ${Array.from(trucks).join(', ')}`);
      }

      if (trailers.size > 0) {
        contactInfo.push(`Trailer(s): ${Array.from(trailers).join(', ')}`);
      }

      // Combine user notes with contact information
      const invoiceNotes = [
        validated.notes,
        contactInfo.length > 0 ? `\n\nContact Information:\n${contactInfo.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('');

      const invoice = await prisma.invoice.create({
        data: {
          companyId: session.user.companyId,
          invoiceNumber,
          customerId,
          invoiceDate: new Date(),
          dueDate,
          subtotal: totalAmount,
          tax: taxAmount,
          total: totalWithTax,
          balance: totalWithTax,
          status: 'DRAFT',
          notes: invoiceNotes || undefined,
          loadIds: data.loads.map((l: any) => l.id),
        },
      });

      // Link loads to invoice
      await prisma.load.updateMany({
        where: {
          id: { in: data.loads.map((l: any) => l.id) },
        },
        data: {
          invoicedAt: new Date(),
          status: LoadStatus.INVOICED,
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
        meta: {
          accountingWarnings: accountingWarnings.length > 0 ? accountingWarnings : undefined,
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

