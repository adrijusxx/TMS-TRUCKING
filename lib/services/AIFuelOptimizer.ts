/**
 * Fuel Optimization Advisor Service
 * Provides optimal fuel stop recommendations and fuel cost optimization
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface FuelOptimization {
  routeId?: string;
  loadId?: string;
  optimalFuelStops: Array<{
    location: string;
    city: string;
    state: string;
    recommendedGallons: number;
    estimatedCostPerGallon: number;
    estimatedTotalCost: number;
    reason: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  fuelCardRecommendations: Array<{
    fuelCard: string;
    location: string;
    savings: number;
    reason: string;
  }>;
  idleTimeReduction: {
    currentEstimatedIdleHours: number;
    recommendedReduction: number;
    potentialSavings: number;
    recommendations: string[];
  };
  routeBasedFuelCost: {
    estimatedTotalCost: number;
    estimatedGallons: number;
    estimatedMPG: number;
    confidence: number;
  };
  totalPotentialSavings: number;
}

export class AIFuelOptimizer extends AIService {
  async getFuelOptimization(
    companyId: string,
    route: {
      pickupCity: string;
      pickupState: string;
      deliveryCity: string;
      deliveryState: string;
      totalMiles: number;
    },
    truckId?: string
  ): Promise<FuelOptimization> {
    // Fetch historical fuel data
    const fuelEntries = truckId
      ? await prisma.fuelEntry.findMany({
          where: {
            truckId,
            date: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            location: true,
            latitude: true,
            longitude: true,
            gallons: true,
            costPerGallon: true,
            totalCost: true,
            odometer: true,
            date: true,
          },
        })
      : [];

    const prompt = `Provide fuel optimization recommendations for a trucking route.

ROUTE:
- From: ${route.pickupCity}, ${route.pickupState}
- To: ${route.deliveryCity}, ${route.deliveryState}
- Distance: ${route.totalMiles.toLocaleString()} miles

${fuelEntries.length > 0 ? `
HISTORICAL FUEL DATA (${fuelEntries.length} entries):
${JSON.stringify(fuelEntries, null, 2)}
` : 'No historical fuel data available for this truck'}

OPTIMIZATION FACTORS:
1. Fuel prices vary by location (typically lower in states with lower taxes)
2. Fuel card discounts and loyalty programs
3. Optimal fuel stop locations along route
4. Idle time reduction opportunities
5. Route efficiency and MPG optimization

Return JSON with:
- optimalFuelStops: array of {
    location: string,
    city: string,
    state: string,
    recommendedGallons: number,
    estimatedCostPerGallon: number,
    estimatedTotalCost: number,
    reason: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  }
- fuelCardRecommendations: array of {
    fuelCard: string,
    location: string,
    savings: number,
    reason: string
  }
- idleTimeReduction: {
    currentEstimatedIdleHours: number,
    recommendedReduction: number,
    potentialSavings: number,
    recommendations: string[]
  }
- routeBasedFuelCost: {
    estimatedTotalCost: number,
    estimatedGallons: number,
    estimatedMPG: number,
    confidence: number (0-100)
  }
- totalPotentialSavings: number`;

    const result = await this.callAI<FuelOptimization>(
      prompt,
      {
        temperature: 0.3,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in fuel optimization for trucking. Return ONLY valid JSON.',
      }
    );

    return result.data;
  }
}

