import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { FactoringStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { factoringCompanyId, notes } = body;

    // Check permission
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to submit invoices to factor',
          },
        },
        { status: 403 }
      );
    }

    // Verify invoice belongs to company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            factoringCompanyId: true,
          },
        },
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

    // Check if invoice can be factored
    if (invoice.factoringStatus !== 'NOT_FACTORED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Invoice is already ${invoice.factoringStatus.toLowerCase().replace(/_/g, ' ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (invoice.balance <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Invoice has no outstanding balance',
          },
        },
        { status: 400 }
      );
    }

    // Determine factoring company
    const finalFactoringCompanyId = factoringCompanyId || invoice.customer.factoringCompanyId;
    
    if (!finalFactoringCompanyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FACTORING_COMPANY',
            message: 'No factoring company specified. Please select a factoring company or assign one to the customer.',
          },
        },
        { status: 400 }
      );
    }

    // Verify factoring company exists and belongs to company
    const factoringCompany = await prisma.factoringCompany.findFirst({
      where: {
        id: finalFactoringCompanyId,
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    if (!factoringCompany) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Factoring company not found',
          },
        },
        { status: 404 }
      );
    }

    // Update invoice with factoring information
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
        factoringCompanyId: finalFactoringCompanyId,
        submittedToFactorAt: new Date(),
        invoiceNote: notes ? `${invoice.invoiceNote || ''}\n${notes}`.trim() : invoice.invoiceNote,
      },
      include: {
        factoringCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Export to factoring company (API or file)
    try {
      const { submitInvoicesToFactor, generateFactoringExport } = await import(
        '@/lib/integrations/factoring-api'
      );

      // Try API submission first if configured
      if (
        factoringCompany.apiProvider &&
        factoringCompany.apiEndpoint &&
        factoringCompany.apiKey
      ) {
        const apiResult = await submitInvoicesToFactor(factoringCompany, [updatedInvoice]);
        if (apiResult.success && apiResult.submissionId) {
          // API submission successful
          console.log(
            `[Factoring] Invoice ${invoice.invoiceNumber} submitted via API: ${apiResult.submissionId}`
          );
        } else {
          // API submission failed, fall back to file export
          console.warn(
            `[Factoring] API submission failed, falling back to file export: ${apiResult.error}`
          );
          const exportResult = await generateFactoringExport({
            format:
              (factoringCompany.exportFormat as 'CSV' | 'EDI' | 'Excel' | 'JSON') || 'CSV',
            invoices: [updatedInvoice],
            factoringCompany,
          });
          if (exportResult.success && exportResult.filePath) {
            console.log(`[Factoring] Export file generated: ${exportResult.filePath}`);
          }
        }
      } else {
        // No API configured, generate export file
        const exportResult = await generateFactoringExport({
          format: (factoringCompany.exportFormat as 'CSV' | 'EDI' | 'Excel' | 'JSON') || 'CSV',
          invoices: [updatedInvoice],
          factoringCompany,
        });
        if (exportResult.success && exportResult.filePath) {
          console.log(`[Factoring] Export file generated: ${exportResult.filePath}`);
        }
      }
    } catch (error) {
      // Log error but don't fail the request - invoice is already marked as submitted
      console.error('[Factoring] Error during export/API submission:', error);
    }

    // Log activity
    const { createActivityLog } = await import('@/lib/activity-log');
    const requestHeaders = request.headers;
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'EXPORT',
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber} submitted to ${factoringCompany.name}`,
      ipAddress: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || undefined,
      userAgent: requestHeaders.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Invoice ${invoice.invoiceNumber} has been submitted to ${factoringCompany.name}`,
        invoice: updatedInvoice,
      },
    });
  } catch (error) {
    console.error('Submit to factor error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

