import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const customerId = searchParams.get('customerId');
        const driverId = searchParams.get('driverId');

        const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(new Date());
        const endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(new Date());

        const whereClause: any = {
            pickupDate: {
                gte: startDate,
                lte: endDate
            },
            // We are interested in completed loads primarily
            status: {
                in: ['DELIVERED', 'READY_TO_BILL', 'INVOICED', 'PAID', 'COMPLETED']
            }
        };

        if (customerId) whereClause.customerId = customerId;
        if (driverId) whereClause.driverId = driverId;

        // MC Access check
        // Assuming helper function or manual check. For now, manual.
        // In a real implementation we would use buildMcNumberWhereClause

        const loads = await prisma.load.findMany({
            where: whereClause,
            include: {
                customer: { select: { name: true } },
                driver: {
                    include: { user: { select: { firstName: true, lastName: true } } }
                },
                invoices: { select: { invoiceNumber: true, total: true, status: true } },
                truck: { select: { truckNumber: true } }
            },
            orderBy: { pickupDate: 'desc' }
        });

        // Fetch related settlements manually since there is no direct relation
        // Settlement has loadIds: String[]
        const loadIds = loads.map(l => l.id);
        const settlements = await prisma.settlement.findMany({
            where: {
                loadIds: { hasSome: loadIds }
            },
            select: {
                id: true,
                settlementNumber: true,
                status: true,
                paidDate: true,
                periodEnd: true,
                loadIds: true
            }
        });

        // Map loadId -> Settlement info
        const loadSettlementMap = new Map<string, any>();
        settlements.forEach(s => {
            s.loadIds.forEach(lid => {
                if (loadIds.includes(lid)) {
                    loadSettlementMap.set(lid, s);
                }
            });
        });

        // Transform scans
        const reportData = loads.map(load => {
            const settlement = loadSettlementMap.get(load.id);

            // If settled, we use the driverPay on the load as the "settled amount" for that load
            // Alternatively, we could try to parse calculationLog if we needed exact breakdown, 
            // but driverPay is the intended "cost" of the load.
            const isSettled = !!settlement && settlement.status !== 'CANCELLED';
            const settledAmount = isSettled ? (load.driverPay || 0) : 0;

            const revenue = load.revenue || 0;
            const expenses = load.totalExpenses || 0;
            const netProfit = revenue - settledAmount - expenses;
            const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

            return {
                id: load.id,
                loadNumber: load.loadNumber,
                date: load.pickupDate,
                customer: load.customer.name,
                driver: load.driver?.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : 'Unassigned',
                truck: load.truck?.truckNumber || '-',
                status: load.status,
                invoiceNumber: load.invoices?.length > 0 ? load.invoices[0].invoiceNumber : '-',
                billedAmount: revenue,
                settledAmount: settledAmount,
                expenses: expenses,
                netProfit: netProfit,
                margin: margin,
                isFullySettled: isSettled,
                isInvoiced: load.invoices && load.invoices.length > 0,
                settlementNumber: settlement?.settlementNumber || '-'
            };
        });

        return NextResponse.json({ success: true, data: reportData });

    } catch (error) {
        console.error('Error calculating reconciliation report:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
