import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

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
    const dateParam = searchParams.get('date');
    const startDate = dateParam ? new Date(dateParam) : new Date();

    // Get the week range (Sunday to Saturday)
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(startDate, { weekStartsOn: 0 });

    // Get all drivers for the company
    const drivers = await prisma.driver.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        driverNumber: true,
        payType: true,
        payRate: true,
        status: true,
        homeTerminal: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { driverNumber: 'asc' },
    });

    // Get all loads for the week
    const loads = await prisma.load.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        OR: [
          {
            pickupDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          {
            deliveryDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          {
            AND: [
              {
                pickupDate: { lte: weekStart },
              },
              {
                deliveryDate: { gte: weekEnd },
              },
            ],
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            status: true,
            homeTerminal: true,
            payRate: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
      },
      orderBy: { pickupDate: 'asc' },
    });

    // Group loads by driver and date
    const driverSchedules: Record<string, any> = {};
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Initialize all drivers
    drivers.forEach((driver) => {
      driverSchedules[driver.id] = {
        driver: {
          id: driver.id,
          driverNumber: driver.driverNumber,
          firstName: driver.user?.firstName ?? '',
          lastName: driver.user?.lastName ?? '',
          phone: driver.user?.phone ?? null,
          status: driver.status,
          companyName: driver.company.name,
          currentTruck: driver.currentTruck,
          homeTerminal: driver.homeTerminal,
        },
        loadsByDate: {} as Record<string, any[]>,
        summary: {
          trips: 0,
          totalMiles: 0,
          loadedMiles: 0,
          emptyMiles: 0,
          rate: driver.payRate || 0,
          totalDriverGross: 0,
          totalGross: 0,
          serviceFees: 0,
        },
      };

      // Initialize all days
      weekDays.forEach((day) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        driverSchedules[driver.id].loadsByDate[dayKey] = [];
      });
    });

    // Assign loads to drivers and dates
    loads.forEach((load) => {
      if (!load.driverId) return;

      const driverSchedule = driverSchedules[load.driverId];
      if (!driverSchedule) return;

      // Determine which days this load spans
      const loadStart = load.pickupDate ? new Date(load.pickupDate) : weekStart;
      const loadEnd = load.deliveryDate ? new Date(load.deliveryDate) : weekEnd;

      weekDays.forEach((day) => {
        const dayDate = new Date(day);
        if (dayDate >= loadStart && dayDate <= loadEnd) {
          const dayKey = format(day, 'yyyy-MM-dd');
          // Calculate driver pay: use load.driverPay if set, otherwise calculate from current driver payRate
          const driver = drivers.find(d => d.id === load.driverId);
          let calculatedDriverPay = load.driverPay || 0;
          if (!calculatedDriverPay && driver) {
            const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
            if (driver.payType === 'PER_MILE' && miles > 0) {
              calculatedDriverPay = miles * driver.payRate;
            } else if (driver.payType === 'PER_LOAD') {
              calculatedDriverPay = driver.payRate;
            } else if (driver.payType === 'PERCENTAGE') {
              calculatedDriverPay = (load.revenue || 0) * (driver.payRate / 100);
            } else if (driver.payType === 'HOURLY') {
              const estimatedHours = miles > 0 ? miles / 50 : 10;
              calculatedDriverPay = estimatedHours * driver.payRate;
            } else if (driver.payType === 'WEEKLY') {
              // WEEKLY pay is calculated at settlement level, not per load
              calculatedDriverPay = 0; // Don't show per-load pay for weekly drivers
            }
          }

          driverSchedule.loadsByDate[dayKey].push({
            id: load.id,
            loadNumber: load.loadNumber,
            pickupCity: load.pickupCity,
            pickupState: load.pickupState,
            deliveryCity: load.deliveryCity,
            deliveryState: load.deliveryState,
            revenue: load.revenue || 0,
            driverPay: calculatedDriverPay,
            serviceFee: load.serviceFee || 0,
            loadedMiles: load.loadedMiles || 0,
            emptyMiles: load.emptyMiles || 0,
            totalMiles: load.totalMiles || 0,
            status: load.status,
            customerName: load.customer.name,
            dispatchNotes: load.dispatchNotes,
          });
        }
      });

      // Calculate driver pay: use load.driverPay if set, otherwise calculate from current driver payRate
      let calculatedDriverPay = 0;
      if (load.driverPay && load.driverPay > 0) {
        calculatedDriverPay = load.driverPay;
      } else {
        // Calculate from current driver pay rate
        const driver = drivers.find(d => d.id === load.driverId);
        if (driver) {
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          if (driver.payType === 'PER_MILE' && miles > 0) {
            calculatedDriverPay = miles * driver.payRate;
          } else if (driver.payType === 'PER_LOAD') {
            calculatedDriverPay = driver.payRate;
          } else if (driver.payType === 'PERCENTAGE') {
            calculatedDriverPay = (load.revenue || 0) * (driver.payRate / 100);
          } else if (driver.payType === 'HOURLY') {
            const estimatedHours = miles > 0 ? miles / 50 : 10;
            calculatedDriverPay = estimatedHours * driver.payRate;
          }
        }
      }

      // Update summary
      driverSchedule.summary.trips += 1;
      driverSchedule.summary.totalMiles += load.totalMiles || 0;
      driverSchedule.summary.loadedMiles += load.loadedMiles || 0;
      driverSchedule.summary.emptyMiles += load.emptyMiles || 0;
      driverSchedule.summary.totalDriverGross += calculatedDriverPay;
      driverSchedule.summary.totalGross += load.revenue || 0;
      driverSchedule.summary.serviceFees += load.serviceFee || 0;
    });

    // Calculate overall statistics
    const overallStats = {
      totalMiles: 0,
      loadedMiles: 0,
      emptyMiles: 0,
      totalGross: 0,
      totalDriverGross: 0,
      serviceFees: 0,
      coveredDrivers: 0,
      totalDrivers: drivers.length,
    };

    const statusCounts: Record<string, number> = {
      AVAILABLE: 0,
      ON_DUTY: 0,
      DRIVING: 0,
      OFF_DUTY: 0,
      SLEEPER_BERTH: 0,
      ON_LEAVE: 0,
      INACTIVE: 0,
    };

    Object.values(driverSchedules).forEach((schedule: any) => {
      const hasLoads = Object.values(schedule.loadsByDate).some(
        (loads: any) => loads.length > 0
      );
      if (hasLoads) {
        overallStats.coveredDrivers += 1;
      }

      overallStats.totalMiles += schedule.summary.totalMiles;
      overallStats.loadedMiles += schedule.summary.loadedMiles;
      overallStats.emptyMiles += schedule.summary.emptyMiles;
      overallStats.totalGross += schedule.summary.totalGross;
      overallStats.totalDriverGross += schedule.summary.totalDriverGross;
      overallStats.serviceFees += schedule.summary.serviceFees;

      const status = schedule.driver.status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }
    });

    const averageRate =
      overallStats.totalMiles > 0
        ? overallStats.totalGross / overallStats.totalMiles
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        weekDays: weekDays.map((day) => format(day, 'yyyy-MM-dd')),
        drivers: Object.values(driverSchedules),
        overallStats: {
          ...overallStats,
          averageRate: averageRate.toFixed(2),
          coverageRatio:
            overallStats.totalDrivers > 0
              ? (
                (overallStats.coveredDrivers / overallStats.totalDrivers) *
                100
              ).toFixed(1)
              : '0.0',
        },
        statusCounts,
      },
    });
  } catch (error) {
    console.error('Weekly schedule error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

