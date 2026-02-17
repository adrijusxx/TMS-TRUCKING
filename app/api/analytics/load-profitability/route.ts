import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any)?.role || 'CUSTOMER';
        if (!(await hasPermissionAsync(role, 'analytics.view'))) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const loadMcWhere = await buildMcNumberWhereClause(session, request);
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const loads = await prisma.load.findMany({
            where: {
                ...loadMcWhere,
                deletedAt: null,
                pickupDate: { gte: startDate },
                status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
            },
            select: {
                id: true,
                loadNumber: true,
                revenue: true,
                driverPay: true,
                totalExpenses: true,
                netProfit: true,
                customer: { select: { name: true } },
                deliveryDate: true
            },
            orderBy: { deliveryDate: 'desc' },
            take: 100 // Limit to recent 100 loads for chart/table
        });

        const data = loads.map(load => {
            const revenue = Number(load.revenue || 0);
            const profit = Number(load.netProfit || 0);
            return {
                loadNumber: load.loadNumber,
                revenue,
                totalCost: Number(load.driverPay || 0) + Number(load.totalExpenses || 0),
                profit,
                profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
                customer: load.customer?.name || 'Unknown',
                deliveredAt: load.deliveryDate ? load.deliveryDate.toISOString() : new Date().toISOString()
            };
        });

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Load profitability error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
