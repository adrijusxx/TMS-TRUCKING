import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getLoadFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'loads.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Get column name from query params
    const { searchParams } = new URL(request.url);
    const column = searchParams.get('column');

    if (!column) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Column parameter is required' } },
        { status: 400 }
      );
    }

    // 4. Build MC Filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 5. Apply role-based filtering
    const roleFilter = await getLoadFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // 6. Build deleted records filter
    const includeDeleted = parseIncludeDeleted(request);
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    // 7. Merge filters
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }),
    };

    // 8. Fetch unique values based on column type
    let values: Array<{ value: string | null; label: string; count: number }> = [];

    switch (column) {
      case 'driverId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            driverId: true,
            driver: {
              select: {
                id: true,
                driverNumber: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        const isCuid = (v: string) => /^c[a-z0-9]{20,}$/i.test(v);
        const driverMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.driverId && load.driver) {
            const key = load.driverId;
            const driverNum = load.driver.driverNumber;
            const hasMeaningfulNumber = driverNum && !isCuid(driverNum);

            let label: string;
            if (load.driver.user) {
              const fullName = `${load.driver.user.firstName} ${load.driver.user.lastName}`.trim();
              label = hasMeaningfulNumber ? `${driverNum} - ${fullName}` : fullName;
            } else {
              label = hasMeaningfulNumber ? driverNum : `Driver (${driverNum.slice(0, 8)}...)`;
            }

            if (driverMap.has(key)) {
              driverMap.get(key)!.count++;
            } else {
              driverMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(driverMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      case 'customerId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            customerId: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const customerMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.customerId && load.customer) {
            const key = load.customerId;
            const label = load.customer.name;
            if (customerMap.has(key)) {
              customerMap.get(key)!.count++;
            } else {
              customerMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(customerMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      case 'truckId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            truckId: true,
            truck: {
              select: {
                id: true,
                truckNumber: true,
              },
            },
          },
        });

        const truckMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.truckId && load.truck) {
            const key = load.truckId;
            const label = load.truck.truckNumber;
            if (truckMap.has(key)) {
              truckMap.get(key)!.count++;
            } else {
              truckMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(truckMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      case 'trailerId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            trailerId: true,
            trailer: {
              select: {
                id: true,
                trailerNumber: true,
              },
            },
          },
        });

        const trailerMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.trailerId && load.trailer) {
            const key = load.trailerId;
            const label = load.trailer.trailerNumber;
            if (trailerMap.has(key)) {
              trailerMap.get(key)!.count++;
            } else {
              trailerMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(trailerMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      case 'status': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            status: true,
          },
        });

        const statusMap = new Map<string, number>();
        loads.forEach((load) => {
          const status = load.status;
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        values = Array.from(statusMap.entries()).map(([value, count]) => ({
          value,
          label: value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          count,
        }));
        break;
      }

      case 'dispatcherId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            dispatcherId: true,
            dispatcher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        const dispatcherMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.dispatcherId && load.dispatcher) {
            const key = load.dispatcherId;
            const label = `${load.dispatcher.firstName} ${load.dispatcher.lastName}`;
            if (dispatcherMap.has(key)) {
              dispatcherMap.get(key)!.count++;
            } else {
              dispatcherMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(dispatcherMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      case 'mcNumberId': {
        const loads = await prisma.load.findMany({
          where,
          select: {
            mcNumberId: true,
            mcNumber: {
              select: {
                id: true,
                number: true,
                companyName: true,
              },
            },
          },
        });

        const mcMap = new Map<string, { label: string; count: number }>();
        loads.forEach((load) => {
          if (load.mcNumberId && load.mcNumber) {
            const key = load.mcNumberId;
            const label = `MC# ${load.mcNumber.number}${load.mcNumber.companyName ? ` - ${load.mcNumber.companyName}` : ''}`;
            if (mcMap.has(key)) {
              mcMap.get(key)!.count++;
            } else {
              mcMap.set(key, { label, count: 1 });
            }
          }
        });

        values = Array.from(mcMap.entries()).map(([value, data]) => ({
          value,
          label: data.label,
          count: data.count,
        }));
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unsupported column: ${column}` } },
          { status: 400 }
        );
    }

    // Sort by count descending, then by label
    values.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (a.label || '').localeCompare(b.label || '');
    });

    return NextResponse.json({
      success: true,
      data: values,
    });
  } catch (error) {
    console.error('[Column Values API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred processing your request',
        },
      },
      { status: 500 }
    );
  }
}

