import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const readFilter = searchParams.get('read'); // 'true' | 'false' | null
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly || readFilter === 'false') {
      where.read = false;
    } else if (readFilter === 'true') {
      where.read = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Map category to notification types
      const categoryTypeMap: Record<string, string[]> = {
        loads: ['LOAD_ASSIGNED', 'LOAD_UPDATED', 'LOAD_DELIVERED', 'LOAD_CANCELLED', 'DETENTION_DETECTED', 'BILLING_HOLD', 'RATE_CON_MISSING'],
        accounting: ['INVOICE_PAID', 'INVOICE_CREATED', 'INVOICE_OVERDUE', 'SETTLEMENT_GENERATED', 'SETTLEMENT_APPROVED', 'SETTLEMENT_PAID'],
        fleet: ['MAINTENANCE_DUE', 'MAINTENANCE_COMPLETED', 'DORMANT_EQUIPMENT', 'DRIVER_IDLE_ALERT', 'TRUCK_OUT_OF_SERVICE'],
        safety: ['HOS_VIOLATION', 'DOCUMENT_EXPIRING'],
        crm: ['LEAD_FOLLOW_UP_DUE', 'LEAD_SLA_ALERT', 'LEAD_NEW_APPLICATION'],
        system: ['SYSTEM_ALERT'],
      };
      if (categoryTypeMap[category]) {
        where.type = { in: categoryTypeMap[category] };
      }
    }

    if (priority) {
      where.priority = priority;
    }

    if (startDate) {
      where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        unreadCount,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications updated',
    });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

