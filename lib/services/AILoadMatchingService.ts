/**
 * AI Load Matching Service
 * Uses AI to intelligently match loads to drivers and trucks
 */

import { AIService, AICallResult } from './AIService';
import { prisma } from '@/lib/prisma';

interface LoadMatchInput {
  loadId: string;
  availableDriverIds?: string[];
  availableTruckIds?: string[];
}

interface LoadMatchRecommendation {
  driverId: string;
  driverNumber: string;
  driverName: string;
  truckId?: string;
  truckNumber?: string;
  matchScore: number;
  reasoning: string;
  factors: {
    locationProximity?: number;
    equipmentCompatibility?: boolean;
    historicalPerformance?: number;
    hosCompliance?: boolean;
    driverPreference?: number;
  };
}

interface LoadMatchResult {
  recommendations: LoadMatchRecommendation[];
  loadDetails: {
    loadNumber: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    equipmentType: string;
    hazmat: boolean;
    temperature?: string;
    weight?: number;
  };
}

export class AILoadMatchingService extends AIService {
  /**
   * Get intelligent load matching recommendations
   */
  async getLoadMatches(input: LoadMatchInput): Promise<LoadMatchResult> {
    // Fetch load details
    const load = await prisma.load.findUnique({
      where: { id: input.loadId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
      },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Fetch available drivers
    const drivers = await prisma.driver.findMany({
      where: {
        id: input.availableDriverIds ? { in: input.availableDriverIds } : undefined,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
            equipmentType: true,
            currentLocation: true,
          },
        },
        loads: {
          where: {
            status: { in: ['DELIVERED', 'PAID'] },
            deliveryDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          select: {
            id: true,
            status: true,
            customer: {
              select: {
                id: true,
              },
            },
          },
          take: 20,
        },
        hosRecords: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          select: {
            driveTime: true,
            onDutyTime: true,
            violations: true,
          },
          take: 7,
        },
      },
    });

    // Fetch available trucks if specified
    let trucks = null;
    if (input.availableTruckIds) {
      trucks = await prisma.truck.findMany({
        where: {
          id: { in: input.availableTruckIds },
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          truckNumber: true,
          equipmentType: true,
          currentLocation: true,
        },
      });
    }

    // Prepare data for AI analysis
    const loadData = {
      loadNumber: load.loadNumber,
      pickupCity: load.pickupCity || '',
      pickupState: load.pickupState || '',
      deliveryCity: load.deliveryCity || '',
      deliveryState: load.deliveryState || '',
      equipmentType: load.equipmentType || 'DRY_VAN',
      hazmat: load.hazmat || false,
      temperature: load.temperature || null,
      weight: load.weight || null,
      totalMiles: load.totalMiles || null,
      pickupDate: load.pickupDate?.toISOString() || null,
      customerId: load.customer?.id || null,
      customerName: load.customer?.name || null,
    };

    const driversData = drivers.map((driver) => {
      const recentLoads = (driver as any).loads || [];
      const onTimeRate = recentLoads.length > 0
        ? recentLoads.filter((l: any) => l.status === 'DELIVERED').length / recentLoads.length
        : 0.95; // Default to 95% if no history

      const hosRecords = (driver as any).hosRecords || [];
      const avgDriveTime = hosRecords.length > 0
        ? hosRecords.reduce((sum: number, r: any) => sum + (r.driveTime || 0), 0) / hosRecords.length
        : 0;
      const hasViolations = hosRecords.some((r: any) => r.violations && Object.keys(r.violations as object).length > 0);

      return {
        id: driver.id,
        driverNumber: driver.driverNumber,
        name: `${(driver as any).user?.firstName || ''} ${(driver as any).user?.lastName || ''}`.trim(),
        currentTruck: (driver as any).currentTruck ? {
          id: (driver as any).currentTruck.id,
          truckNumber: (driver as any).currentTruck.truckNumber,
          equipmentType: (driver as any).currentTruck.equipmentType,
          location: (driver as any).currentTruck.currentLocation || null,
        } : null,
        onTimeDeliveryRate: onTimeRate,
        recentLoadCount: recentLoads.length,
        avgDriveTime: avgDriveTime,
        hasHOSViolations: hasViolations,
        payType: driver.payType,
        payRate: driver.payRate,
      };
    });

    const trucksData = trucks ? trucks.map(truck => ({
      id: truck.id,
      truckNumber: truck.truckNumber,
      equipmentType: truck.equipmentType,
      location: truck.currentLocation || null,
    })) : null;

    // Build AI prompt
    const prompt = `Analyze load-to-driver matching for a trucking company. Return JSON with recommendations ranked by match score (0-100).

LOAD DETAILS:
- Load Number: ${loadData.loadNumber}
- Pickup: ${loadData.pickupCity}, ${loadData.pickupState}
- Delivery: ${loadData.deliveryCity}, ${loadData.deliveryState}
- Equipment Type: ${loadData.equipmentType}
- Hazmat: ${loadData.hazmat}
- Temperature: ${loadData.temperature || 'N/A'}
- Weight: ${loadData.weight || 'N/A'} lbs
- Total Miles: ${loadData.totalMiles || 'N/A'}
- Pickup Date: ${loadData.pickupDate || 'N/A'}

AVAILABLE DRIVERS:
${driversData.map((d, i) => `
Driver ${i + 1}:
- ID: ${d.id}
- Number: ${d.driverNumber}
- Name: ${d.name}
- Current Truck: ${d.currentTruck?.truckNumber || 'None'} (${d.currentTruck?.equipmentType || 'N/A'})
- Current Location: ${d.currentTruck?.location || 'Unknown'}
- On-Time Delivery Rate: ${(d.onTimeDeliveryRate * 100).toFixed(1)}%
- Recent Loads: ${d.recentLoadCount}
- Avg Daily Drive Time: ${d.avgDriveTime.toFixed(1)} hours
- HOS Violations: ${d.hasHOSViolations ? 'Yes' : 'No'}
- Pay Type: ${d.payType}
- Pay Rate: ${d.payRate}
`).join('\n')}

${trucksData ? `AVAILABLE TRUCKS:
${trucksData.map((t, i) => `
Truck ${i + 1}:
- ID: ${t.id}
- Number: ${t.truckNumber}
- Equipment Type: ${t.equipmentType}
- Location: ${t.location || 'Unknown'}
`).join('\n')}` : ''}

MATCHING CRITERIA (in order of importance):
1. Equipment compatibility (driver's truck matches load requirements)
2. Location proximity (driver/truck location to pickup)
3. Historical performance (on-time delivery rate)
4. HOS compliance (driver has available hours)
5. Driver preference (pay type compatibility, experience with similar loads)

Return JSON array of recommendations with:
- driverId: string
- matchScore: number (0-100)
- reasoning: string (brief explanation)
- factors: object with locationProximity (0-100), equipmentCompatibility (boolean), historicalPerformance (0-100), hosCompliance (boolean), driverPreference (0-100)

Sort by matchScore descending. Include top 5 matches.`;

    const result = await this.callAI<{ recommendations: LoadMatchRecommendation[] }>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert logistics AI. Analyze load-to-driver matching and return ONLY valid JSON with recommendations.',
      }
    );

    // Enrich recommendations with driver details
    const enrichedRecommendations: LoadMatchRecommendation[] = result.data.recommendations
      .map((rec: any) => {
        const driver = driversData.find(d => d.id === rec.driverId);
        if (!driver) return null as any;

        return {
          driverId: rec.driverId,
          driverNumber: driver.driverNumber,
          driverName: driver.name,
          truckId: driver.currentTruck?.id,
          truckNumber: driver.currentTruck?.truckNumber,
          matchScore: rec.matchScore || 0,
          reasoning: rec.reasoning || '',
          factors: {
            locationProximity: rec.factors?.locationProximity,
            equipmentCompatibility: rec.factors?.equipmentCompatibility,
            historicalPerformance: rec.factors?.historicalPerformance,
            hosCompliance: rec.factors?.hosCompliance,
            driverPreference: rec.factors?.driverPreference,
          },
        };
      })
      .filter((rec: LoadMatchRecommendation | null): rec is LoadMatchRecommendation => rec !== null)
      .slice(0, 5);

    return {
      recommendations: enrichedRecommendations,
      loadDetails: {
        loadNumber: loadData.loadNumber,
        pickupCity: loadData.pickupCity,
        pickupState: loadData.pickupState,
        deliveryCity: loadData.deliveryCity,
        deliveryState: loadData.deliveryState,
        equipmentType: loadData.equipmentType,
        hazmat: loadData.hazmat,
        temperature: loadData.temperature || undefined,
        weight: loadData.weight || undefined,
      },
    };
  }
}

