import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { ComplianceCalculatorService } from '@/lib/services/safety/ComplianceCalculatorService';
import { AlertService } from '@/lib/services/safety/AlertService';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId!;
    const calculator = new ComplianceCalculatorService(prisma, companyId);
    const alertService = new AlertService(prisma, companyId);

    // Build MC number filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // Build filter for models without direct mcNumberId (Document, RoadsideInspection)
    // Filter through related driver or truck's mcNumberId
    let documentMcFilter: any = { companyId: mcWhere.companyId };
    let inspectionMcFilter: any = { companyId: mcWhere.companyId };

    if (mcWhere.mcNumberId) {
      // If MC filtering is needed, filter through related driver/truck
      if (typeof mcWhere.mcNumberId === 'string') {
        // Single MC
        documentMcFilter.OR = [
          { driver: { mcNumberId: mcWhere.mcNumberId } },
          { truck: { mcNumberId: mcWhere.mcNumberId } },
          { load: { mcNumberId: mcWhere.mcNumberId } }
        ];
        inspectionMcFilter.OR = [
          { driver: { mcNumberId: mcWhere.mcNumberId } },
          { truck: { mcNumberId: mcWhere.mcNumberId } }
        ];
      } else if (typeof mcWhere.mcNumberId === 'object' && 'in' in mcWhere.mcNumberId) {
        // Multiple MCs
        documentMcFilter.OR = [
          { driver: { mcNumberId: { in: mcWhere.mcNumberId.in } } },
          { truck: { mcNumberId: { in: mcWhere.mcNumberId.in } } },
          { load: { mcNumberId: { in: mcWhere.mcNumberId.in } } }
        ];
        inspectionMcFilter.OR = [
          { driver: { mcNumberId: { in: mcWhere.mcNumberId.in } } },
          { truck: { mcNumberId: { in: mcWhere.mcNumberId.in } } }
        ];
      }
    }

    // Get key metrics
    let openViolations = 0;
    try {
      // Check if roadsideInspection model exists in Prisma client
      if (prisma.roadsideInspection && typeof prisma.roadsideInspection.count === 'function') {
        openViolations = await prisma.roadsideInspection.count({
          where: {
            ...inspectionMcFilter,
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
      // Active drivers - count ALL active drivers (not just AVAILABLE status)
      prisma.driver.count({
        where: {
          ...mcWhere,
          isActive: true,
          deletedAt: null
        }
      }),

      // Active vehicles - count ALL active vehicles (not just AVAILABLE status)
      prisma.truck.count({
        where: {
          ...mcWhere,
          isActive: true,
          deletedAt: null
        }
      }),

      // Days since last accident
      calculator.calculateDaysSinceLastAccident(companyId),

      // Expiring documents (next 30 days) - filter through related driver/truck/load MC
      prisma.document.count({
        where: {
          ...documentMcFilter,
          expiryDate: {
            lte: new Date(new Date().setDate(new Date().getDate() + 30)),
            gte: new Date()
          },
          deletedAt: null
        }
      }),

      // CSA scores - use companyId only (CSA scores are company-level, not MC-specific)
      prisma.cSAScore.findMany({
        where: {
          companyId: mcWhere.companyId,
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

