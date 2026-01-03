import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

    // Get Key Metrics & Granular Alerts
    const [
      activeDrivers,
      activeVehicles,
      daysSinceAccident,
      csascores,
    ] = await Promise.all([
      // Active drivers
      prisma.driver.count({
        where: { ...mcWhere, isActive: true, deletedAt: null }
      }),
      // Active vehicles
      prisma.truck.count({
        where: { ...mcWhere, isActive: true, deletedAt: null }
      }),
      // Days since last accident
      calculator.calculateDaysSinceLastAccident(companyId),
      // CSA scores
      prisma.cSAScore.findMany({
        where: {
          companyId: mcWhere.companyId,
          scoreDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
        },
        orderBy: { scoreDate: 'desc' },
        take: 7
      }),
    ]);

    // Fetch granular expiring documents with Driver names
    const expiringDocsRaw = await prisma.document.findMany({
      where: {
        ...documentMcFilter,
        expiryDate: {
          lte: new Date(new Date().setDate(new Date().getDate() + 30)),
          gte: new Date()
        },
        deletedAt: null
      },
      include: {
        driver: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } }
          }
        },
        truck: { select: { truckNumber: true } }
      }
    });

    const expiringDocuments = expiringDocsRaw.length;

    // Generate Dynamic Alerts for Expirations
    const dynamicAlerts = expiringDocsRaw.map(doc => {
      const entityName = doc.driver ? `${doc.driver.user.firstName} ${doc.driver.user.lastName}`
        : doc.truck ? `Truck ${doc.truck.truckNumber}`
          : 'Unknown Asset';
      return {
        id: `expiry-${doc.id}`,
        alertType: 'EXPIRY',
        severity: 'HIGH', // High because it's expiring soon
        title: `${doc.type} Expiring`,
        message: `${entityName}'s ${doc.type} expires on ${doc.expiryDate?.toLocaleDateString()}`,
        createdAt: new Date().toISOString()
      };
    });

    // Get existing system alerts
    const systemAlerts = await alertService.getActiveAlerts();

    // Combine alerts (prioritizing hard expirations)
    const activeAlerts = [...dynamicAlerts, ...systemAlerts];

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

