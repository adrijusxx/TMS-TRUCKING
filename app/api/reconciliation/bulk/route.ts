import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkReconcileSchema = z.object({
  reconciliations: z.array(
    z.object({
      invoiceId: z.string(),
      paymentId: z.string().optional(),
      reconciledAmount: z.number().positive(),
      notes: z.string().optional(),
    })
  ).min(1),
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
    const validated = bulkReconcileSchema.parse(body);

    const results = {
      success: [] as any[],
      errors: [] as Array<{ invoiceId: string; error: string }>,
    };

    // Process each reconciliation
    for (const rec of validated.reconciliations) {
      try {
        // Verify invoice belongs to the company
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: rec.invoiceId,
            customer: {
              companyId: session.user.companyId,
            },
          },
          include: {
            reconciliations: true,
          },
        });

        if (!invoice) {
          results.errors.push({
            invoiceId: rec.invoiceId,
            error: 'Invoice not found',
          });
          continue;
        }

        // Verify payment if provided
        if (rec.paymentId) {
          const payment = await prisma.payment.findFirst({
            where: {
              id: rec.paymentId,
              invoiceId: rec.invoiceId,
            },
          });

          if (!payment) {
            results.errors.push({
              invoiceId: rec.invoiceId,
              error: 'Payment not found or does not belong to invoice',
            });
            continue;
          }
        }

        // Calculate total reconciled amount
        const totalReconciled = invoice.reconciliations.reduce(
          (sum, r) => sum + r.reconciledAmount,
          0
        );
        const newTotalReconciled = totalReconciled + rec.reconciledAmount;

        // Check if reconciled amount exceeds invoice total
        if (newTotalReconciled > invoice.total) {
          results.errors.push({
            invoiceId: rec.invoiceId,
            error: 'Reconciled amount exceeds invoice total',
          });
          continue;
        }

        // Create reconciliation
        const reconciliation = await prisma.reconciliation.create({
          data: {
            invoiceId: rec.invoiceId,
            paymentId: rec.paymentId || null,
            reconciledAmount: rec.reconciledAmount,
            reconciledAt: new Date(),
            reconciledById: session.user.id,
            notes: rec.notes,
          },
        });

        // Update invoice reconciliation status
        let reconciliationStatus = 'NOT_RECONCILED';
        if (newTotalReconciled >= invoice.total) {
          reconciliationStatus = 'FULLY_RECONCILED';
        } else if (newTotalReconciled > 0) {
          reconciliationStatus = 'PARTIALLY_RECONCILED';
        }

        await prisma.invoice.update({
          where: { id: rec.invoiceId },
          data: {
            reconciliationStatus: reconciliationStatus as any,
          },
        });

        results.success.push(reconciliation);
      } catch (error: any) {
        results.errors.push({
          invoiceId: rec.invoiceId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        successCount: results.success.length,
        errorCount: results.errors.length,
        successes: results.success,
        errors: results.errors,
      },
      message: `Reconciled ${results.success.length} of ${validated.reconciliations.length} invoices`,
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

    console.error('Bulk reconcile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

