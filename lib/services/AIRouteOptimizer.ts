/**
 * AI Route Optimizer Service
 * Enhances route optimization with AI-powered analysis
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface RouteOptimizationInput {
  loadIds: string[];
  optimizationType: 'DISTANCE' | 'TIME' | 'COST';
  startLocation?: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  driverId?: string; // For HOS constraint analysis
  companyId: string;
}

interface RouteOptimizationResult {
  optimizedSequence: string[];
  waypoints: Array<{
    loadId: string;
    city: string;
    state: string;
    type: 'pickup' | 'delivery';
    estimatedArrival?: string;
  }>;
  metrics: {
    totalDistance: number;
    estimatedTime: number;
    estimatedFuelCost: number;
    efficiencyScore: number;
    savings?: {
      distance?: number;
      time?: number;
      cost?: number;
    };
  };
  recommendations: string[];
  constraints: {
    hosCompliant: boolean;
    timeWindowCompliant: boolean;
    driverAvailable: boolean;
  };
}

export class AIRouteOptimizer extends AIService {
  /**
   * Optimize route with AI analysis
   */
  async optimizeRoute(input: RouteOptimizationInput): Promise<RouteOptimizationResult> {
    // Fetch loads
    const loads = await prisma.load.findMany({
      where: {
        id: { in: input.loadIds },
        companyId: input.companyId,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        route: {
          select: {
            totalDistance: true,
            estimatedTime: true,
            fuelCost: true,
          },
        },
      },
    });

    if (loads.length === 0) {
      throw new Error('No loads found');
    }

    // Fetch driver HOS data if driver specified
    let driverHOSData = null;
    if (input.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: input.driverId },
        include: {
          hosRecords: {
            where: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
            orderBy: { date: 'desc' },
            take: 7,
          },
        },
      });

      if (driver) {
        const recentRecords = driver.hosRecords || [];
        const avgDriveTime = recentRecords.length > 0
          ? recentRecords.reduce((sum, r) => sum + (r.driveTime || 0), 0) / recentRecords.length
          : 0;
        const weeklyDriveTime = recentRecords.length > 0
          ? recentRecords.reduce((sum, r) => sum + (r.weeklyDriveTime || 0), 0) / recentRecords.length
          : 0;

        driverHOSData = {
          avgDailyDriveTime: avgDriveTime,
          weeklyDriveTime,
          availableHours: Math.max(0, 11 - avgDriveTime), // 11 hour daily limit
          availableWeeklyHours: Math.max(0, 60 - weeklyDriveTime), // 60 hour weekly limit
        };
      }
    }

    // Build load data for AI
    const loadsData = loads.map(load => ({
      id: load.id,
      loadNumber: load.loadNumber,
      pickupCity: load.pickupCity || '',
      pickupState: load.pickupState || '',
      deliveryCity: load.deliveryCity || '',
      deliveryState: load.deliveryState || '',
      pickupDate: load.pickupDate?.toISOString() || null,
      deliveryDate: load.deliveryDate?.toISOString() || null,
      distance: load.route?.totalDistance || load.totalMiles || 0,
      revenue: load.revenue || 0,
      customerName: load.customer?.name || '',
    }));

    // Build AI prompt
    const prompt = `Optimize route for ${loads.length} trucking loads. Return JSON with optimized sequence and analysis.

OPTIMIZATION TYPE: ${input.optimizationType}
${input.startLocation ? `START LOCATION: ${input.startLocation.city}, ${input.startLocation.state}` : 'START LOCATION: Not specified'}

LOADS:
${loadsData.map((load, i) => `
Load ${i + 1}:
- ID: ${load.id}
- Number: ${load.loadNumber}
- Pickup: ${load.pickupCity}, ${load.pickupState} (${load.pickupDate || 'N/A'})
- Delivery: ${load.deliveryCity}, ${load.deliveryState} (${load.deliveryDate || 'N/A'})
- Distance: ${load.distance} miles
- Revenue: $${load.revenue.toFixed(2)}
- Customer: ${load.customerName}
`).join('\n')}

${driverHOSData ? `
DRIVER HOS CONSTRAINTS:
- Average Daily Drive Time: ${driverHOSData.avgDailyDriveTime.toFixed(1)} hours
- Weekly Drive Time: ${driverHOSData.weeklyDriveTime.toFixed(1)} hours
- Available Daily Hours: ${driverHOSData.availableHours.toFixed(1)} hours
- Available Weekly Hours: ${driverHOSData.availableWeeklyHours.toFixed(1)} hours
` : ''}

OPTIMIZATION CONSIDERATIONS:
1. ${input.optimizationType === 'DISTANCE' ? 'Minimize total distance traveled (primary)' : input.optimizationType === 'TIME' ? 'Minimize total time (primary)' : 'Minimize total cost including fuel (primary)'}
2. Respect pickup/delivery time windows
3. ${driverHOSData ? 'Ensure HOS compliance (11 hour daily limit, 60 hour weekly limit)' : 'Consider driver HOS limits'}
4. Minimize empty miles between loads
5. Consider fuel costs by region (higher in CA, NY, etc.)
6. Account for traffic patterns (avoid rush hours in major cities)
7. Consider weather conditions if applicable

Return JSON with:
- optimizedSequence: array of load IDs in optimal order
- metrics: {totalDistance, estimatedTime (hours), estimatedFuelCost, efficiencyScore (0-100), savings: {distance, time, cost}}
- recommendations: array of strings with optimization suggestions
- constraints: {hosCompliant (boolean), timeWindowCompliant (boolean), driverAvailable (boolean)}

Calculate efficiencyScore based on how well the route optimizes for the selected type (DISTANCE/TIME/COST).`;

    const result = await this.callAI<RouteOptimizationResult>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert logistics route optimizer. Analyze routes and return ONLY valid JSON with optimized sequence and metrics.',
      }
    );

    // Enrich with waypoints
    const optimizedSequence = result.data.optimizedSequence || [];
    const waypoints = optimizedSequence.flatMap(loadId => {
      const load = loads.find(l => l.id === loadId);
      if (!load || !load.pickupCity || !load.deliveryCity) return [];

      return [
        {
          loadId: load.id,
          city: load.pickupCity,
          state: load.pickupState || '',
          type: 'pickup' as const,
        },
        {
          loadId: load.id,
          city: load.deliveryCity,
          state: load.deliveryState || '',
          type: 'delivery' as const,
        },
      ];
    });

    // Calculate actual metrics
    let totalDistance = 0;
    let estimatedTime = 0;
    let estimatedFuelCost = 0;

    optimizedSequence.forEach(loadId => {
      const load = loads.find(l => l.id === loadId);
      if (load) {
        const distance = load.route?.totalDistance || load.totalMiles || 0;
        totalDistance += distance;
        estimatedTime += distance / 55; // Assuming 55 mph average
        estimatedFuelCost += distance * 0.5; // Assuming $0.50/mile fuel cost
      }
    });

    return {
      ...result.data,
      optimizedSequence,
      waypoints,
      metrics: {
        ...result.data.metrics,
        totalDistance: Math.round(totalDistance),
        estimatedTime: parseFloat(estimatedTime.toFixed(1)),
        estimatedFuelCost: parseFloat(estimatedFuelCost.toFixed(2)),
        efficiencyScore: result.data.metrics?.efficiencyScore || 75,
      },
    };
  }
}



