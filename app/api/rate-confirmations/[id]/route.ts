import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
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
    const confirmation = await prisma.rateConfirmation.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
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
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        matchedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!confirmation) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rate confirmation not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: confirmation,
    });
  } catch (error) {
    console.error('Rate confirmation fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const {
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
      matchToInvoice,
    } = body;

    const existing = await prisma.rateConfirmation.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rate confirmation not found' },
        },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (rateConfNumber !== undefined) updateData.rateConfNumber = rateConfNumber;
    if (baseRate !== undefined) updateData.baseRate = baseRate;
    if (fuelSurcharge !== undefined) updateData.fuelSurcharge = fuelSurcharge;
    if (accessorialCharges !== undefined) updateData.accessorialCharges = accessorialCharges;
    if (totalRate !== undefined) updateData.totalRate = totalRate;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (documentId !== undefined) updateData.documentId = documentId;
    if (notes !== undefined) updateData.notes = notes;

    // Handle matching to invoice
    if (matchToInvoice === true && invoiceId) {
      // Verify invoice belongs to company and load
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          customer: {
            companyId: session.user.companyId,
          },
          loadIds: {
            has: existing.loadId,
          },
        },
      });

      if (!invoice) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invoice not found or does not belong to this load',
            },
          },
          { status: 400 }
        );
      }

      updateData.invoiceId = invoiceId;
      updateData.matchedToInvoice = true;
      updateData.matchedAt = new Date();
      updateData.matchedById = session.user.id;
    } else if (matchToInvoice === false) {
      // Unmatch
      updateData.invoiceId = null;
      updateData.matchedToInvoice = false;
      updateData.matchedAt = null;
      updateData.matchedById = null;
    }

    // Calculate total if not provided
    if (baseRate !== undefined || fuelSurcharge !== undefined || accessorialCharges !== undefined) {
      const finalBaseRate = baseRate !== undefined ? baseRate : existing.baseRate;
      const finalFuelSurcharge = fuelSurcharge !== undefined ? fuelSurcharge : existing.fuelSurcharge;
      const finalAccessorialCharges =
        accessorialCharges !== undefined ? accessorialCharges : existing.accessorialCharges;
      if (totalRate === undefined) {
        updateData.totalRate = finalBaseRate + finalFuelSurcharge + finalAccessorialCharges;
      }
    }

    const updated = await prisma.rateConfirmation.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        matchedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update rate confirmation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

