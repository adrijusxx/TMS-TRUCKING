import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const confirmation = await prisma.rateConfirmation.findFirst({
    where: {
      id,
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
    throw new NotFoundError('Rate confirmation');
  }

  return successResponse(confirmation);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
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
      id,
      companyId: session.user.companyId,
    },
  });

  if (!existing) {
    throw new NotFoundError('Rate confirmation');
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
      throw new BadRequestError('Invoice not found or does not belong to this load');
    }

    updateData.invoiceId = invoiceId;
    updateData.matchedToInvoice = true;
    updateData.matchedAt = new Date();
    updateData.matchedById = session.user.id;
  } else if (matchToInvoice === false) {
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
    where: { id },
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

  return successResponse(updated);
});
