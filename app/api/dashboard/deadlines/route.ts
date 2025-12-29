import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';

/**
 * Get upcoming deadlines for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const deadlines: Array<{
      id: string;
      type: string;
      title: string;
      date: Date;
      entityId: string;
      entityType: string;
      priority: string;
    }> = [];

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Build MC filters - Load uses mcNumberId, Customer/Invoice use mcNumber string
    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const driverFilter = await buildMcNumberIdWhereClause(session, request);
    
    // Convert for Customer/Invoice (uses mcNumber string)
    const customerMcWhere = await convertMcNumberIdToMcNumberString(loadMcWhere);

    // Upcoming load pickups (next 7 days) - Load uses mcNumberId
    const upcomingPickups = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        pickupDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: {
          in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        pickupDate: true,
        pickupCity: true,
        pickupState: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        pickupDate: 'asc',
      },
    });

    for (const load of upcomingPickups) {
      if (!load.pickupDate) continue;
      const daysUntil = Math.ceil(
        (new Date(load.pickupDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlines.push({
        id: `pickup-${load.id}`,
        type: 'LOAD_PICKUP',
        title: `Pickup: ${load.loadNumber} - ${load.customer.name}`,
        date: load.pickupDate,
        entityId: load.id,
        entityType: 'Load',
        priority: daysUntil <= 1 ? 'HIGH' : daysUntil <= 3 ? 'MEDIUM' : 'LOW',
      });
    }

    // Upcoming load deliveries (next 7 days) - Load uses mcNumberId
    const upcomingDeliveries = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deliveryDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: {
          in: ['LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        deliveryDate: true,
        deliveryCity: true,
        deliveryState: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        deliveryDate: 'asc',
      },
    });

    for (const load of upcomingDeliveries) {
      if (!load.deliveryDate) continue;
      const daysUntil = Math.ceil(
        (new Date(load.deliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlines.push({
        id: `delivery-${load.id}`,
        type: 'LOAD_DELIVERY',
        title: `Delivery: ${load.loadNumber} - ${load.customer.name}`,
        date: load.deliveryDate,
        entityId: load.id,
        entityType: 'Load',
        priority: daysUntil <= 1 ? 'HIGH' : daysUntil <= 3 ? 'MEDIUM' : 'LOW',
      });
    }

    // Overdue and upcoming invoice due dates (next 7 days)
    // Filter customers by MC number first (Customer uses mcNumber string)
    const customerFilter: any = {
      ...customerMcWhere,
      isActive: true,
      deletedAt: null,
    };
    
    // If filtering by MC number, include both matching MC number and null MC numbers
    if (customerMcWhere.mcNumber) {
      customerFilter.AND = [
        {
          OR: [
            { mcNumber: customerMcWhere.mcNumber },
            { mcNumber: null },
          ],
        },
      ];
      const { mcNumber, ...customerFilterWithoutMc } = customerFilter;
      Object.assign(customerFilter, customerFilterWithoutMc);
    }
    
    const companyCustomers = await prisma.customer.findMany({
      where: customerFilter,
      select: { id: true },
    });
    const customerIds = companyCustomers.map((c) => c.id);

    // Invoice uses mcNumber string
    const invoiceMcWhere = customerMcWhere.mcNumber 
      ? { mcNumber: customerMcWhere.mcNumber }
      : {};

    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        customerId: { in: customerIds },
        ...invoiceMcWhere,
        dueDate: {
          lte: sevenDaysFromNow,
        },
        status: {
          not: 'PAID',
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        total: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: {
        dueDate: 'asc',
      },
    });

    for (const invoice of upcomingInvoices) {
      const daysUntil = Math.ceil(
        (new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlines.push({
        id: `invoice-${invoice.id}`,
        type: 'INVOICE_DUE',
        title: `Invoice Due: ${invoice.invoiceNumber} - ${invoice.customer.name}`,
        date: invoice.dueDate,
        entityId: invoice.id,
        entityType: 'Invoice',
        priority: daysUntil < 0 ? 'HIGH' : daysUntil === 0 ? 'HIGH' : daysUntil <= 3 ? 'MEDIUM' : 'LOW',
      });
    }

    // Expiring documents (next 30 days)
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        ...driverFilter,
        isActive: true,
        deletedAt: null,
        OR: [
          {
            licenseExpiry: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
          {
            medicalCardExpiry: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10,
    });

    for (const driver of expiringDrivers) {
      if (driver.licenseExpiry && driver.licenseExpiry <= sevenDaysFromNow) {
        const daysUntil = Math.ceil(
          (new Date(driver.licenseExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        deadlines.push({
          id: `license-${driver.id}`,
          type: 'DOCUMENT_EXPIRY',
          title: `License Expiring: ${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`,
          date: driver.licenseExpiry,
          entityId: driver.id,
          entityType: 'Driver',
          priority: daysUntil <= 7 ? 'HIGH' : daysUntil <= 14 ? 'MEDIUM' : 'LOW',
        });
      }
      if (driver.medicalCardExpiry && driver.medicalCardExpiry <= sevenDaysFromNow) {
        const daysUntil = Math.ceil(
          (new Date(driver.medicalCardExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        deadlines.push({
          id: `medical-${driver.id}`,
          type: 'DOCUMENT_EXPIRY',
          title: `Medical Card Expiring: ${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`,
          date: driver.medicalCardExpiry,
          entityId: driver.id,
          entityType: 'Driver',
          priority: daysUntil <= 7 ? 'HIGH' : daysUntil <= 14 ? 'MEDIUM' : 'LOW',
        });
      }
    }

    // Sort by date (soonest first)
    deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Return top 15
    return NextResponse.json({
      success: true,
      data: deadlines.slice(0, 15),
    });
  } catch (error) {
    console.error('Deadlines fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

