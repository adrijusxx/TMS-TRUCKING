import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { ComplianceCalculatorService } from '@/lib/services/safety/ComplianceCalculatorService';
import { AlertService } from '@/lib/services/safety/AlertService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId!;
    const calculator = new ComplianceCalculatorService(prisma, companyId);
    const alertService = new AlertService(prisma, companyId);

    // Get key metrics
    let openViolations = 0;
    try {
      // Check if roadsideInspection model exists in Prisma client
      if (prisma.roadsideInspection && typeof prisma.roadsideInspection.count === 'function') {
        openViolations = await prisma.roadsideInspection.count({
          where: {
            companyId,
            violationsFound: true,
            violations: {
              some: {
                dataQStatus: { not: 'ACCEPTED' }
              }
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error counting roadside inspections, returning 0:', error);
      openViolations = 0;
    }

    const [
      activeDrivers,
      activeVehicles,
      daysSinceAccident,
      expiringDocuments,
      csascores,
      activeAlerts
    ] = await Promise.all([
      // Active drivers
      prisma.driver.count({
        where: {
          companyId,
          status: 'AVAILABLE',
          employeeStatus: 'ACTIVE',
          deletedAt: null
        }
      }),

      // Active vehicles
      prisma.truck.count({
        where: {
          companyId,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null
        }
      }),

      // Days since last accident
      calculator.calculateDaysSinceLastAccident(companyId),

      // Expiring documents (next 30 days)
      prisma.document.count({
        where: {
          companyId,
          expiryDate: {
            lte: new Date(new Date().setDate(new Date().getDate() + 30)),
            gte: new Date()
          },
          deletedAt: null
        }
      }),

      // CSA scores
      prisma.cSAScore.findMany({
        where: {
          companyId,
          scoreDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        },
        orderBy: { scoreDate: 'desc' },
        take: 7
      }),

      // Active alerts
      alertService.getActiveAlerts()
    ]);

    // Format CSA scores by BASIC category
    const csaByCategory = csascores.reduce((acc: any, score) => {
      acc[score.basicCategory] = {
        percentile: score.percentile,
        trend: score.trend,
        score: score.score
      };
      return acc;
    }, {});

    return NextResponse.json({
      metrics: {
        activeDrivers,
        activeVehicles,
        daysSinceAccident,
        openViolations,
        expiringDocuments,
        csaScores: csaByCategory
      },
      alerts: activeAlerts
    });
  } catch (error) {
    console.error('Error fetching safety dashboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch safety dashboard';
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

