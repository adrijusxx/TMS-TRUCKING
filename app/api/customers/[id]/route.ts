import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateCustomerSchema } from '@/lib/validations/customer';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

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
    const customer = await prisma.customer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        customerNumber: true,
        name: true,
        type: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        contactNumber: true,
        email: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingEmail: true,
        billingEmails: true,
        billingType: true,
        paymentTerms: true,
        paymentTermsType: true,
        discountPercentage: true,
        discountDays: true,
        creditLimit: true,
        creditAlertThreshold: true,
        creditHold: true,
        creditHoldReason: true,
        creditHoldDate: true,
        creditRate: true,
        creditLimitNotes: true,
        rateConfirmationRequired: true,
        status: true,
        warning: true,
        riskLevel: true,
        comments: true,
        scac: true,
        portalEnabled: true,
        portalUserId: true,
        ediEnabled: true,
        ediId: true,
        rating: true,
        totalLoads: true,
        totalRevenue: true,
        detentionFreeTimeHours: true,
        detentionRate: true,
        isActive: true,
        mcNumber: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        loads: {
          where: { deletedAt: null },
          select: {
            id: true,
            loadNumber: true,
            status: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
            revenue: true,
            pickupDate: true,
            deliveryDate: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        contacts: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
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
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to edit customers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'customers.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit customers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateCustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id: resolvedParams.id },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      data: customer,
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

    console.error('Customer update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete customers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'customers.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete customers',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.customer.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Customer deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

