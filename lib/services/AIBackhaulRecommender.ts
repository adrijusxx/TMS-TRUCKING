/**
 * AI Backhaul Recommender Service
 * Suggests backhaul opportunities when drivers complete deliveries
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface BackhaulRecommendationInput {
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date;
  equipmentType?: string;
  companyId: string;
}

interface BackhaulRecommendation {
  loadId: string;
  loadNumber: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  distance: number;
  revenue: number;
  ratePerMile: number;
  matchScore: number;
  reasoning: string;
  factors: {
    proximity: number;
    timing: number;
    equipmentMatch: boolean;
    historicalLane: boolean;
  };
}

interface BackhaulRecommendationResult {
  recommendations: BackhaulRecommendation[];
  summary: {
    totalOpportunities: number;
    avgRatePerMile: number;
    totalPotentialRevenue: number;
  };
}

export class AIBackhaulRecommender extends AIService {
  /**
   * Get backhaul recommendations
   */
  async getBackhaulRecommendations(input: BackhaulRecommendationInput): Promise<BackhaulRecommendationResult> {
    // Find available loads near delivery location
    const availableLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        status: 'PENDING',
        pickupCity: { equals: input.deliveryCity, mode: 'insensitive' },
        pickupState: input.deliveryState,
        pickupDate: {
          gte: input.deliveryDate,
          lte: new Date(input.deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Within 3 days
        },
        deletedAt: null,
        revenue: { gt: 0 },
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
      take: 20,
    });

    // Also check loads in nearby cities
    const nearbyLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        status: 'PENDING',
        pickupState: input.deliveryState,
        pickupDate: {
          gte: input.deliveryDate,
          lte: new Date(input.deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
        deletedAt: null,
        revenue: { gt: 0 },
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
      take: 30,
    });

    // Check historical backhaul patterns
    const historicalBackhauls = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        pickupCity: { equals: input.deliveryCity, mode: 'insensitive' },
        pickupState: input.deliveryState,
        status: { in: ['DELIVERED', 'PAID'] },
        deletedAt: null,
      },
      select: {
        deliveryCity: true,
        deliveryState: true,
        revenue: true,
        totalMiles: true,
      },
      take: 50,
    });

    // Build AI prompt
    const prompt = `Recommend backhaul opportunities for a truck completing delivery. Return JSON with recommendations.

CURRENT DELIVERY:
- Location: ${input.deliveryCity}, ${input.deliveryState}
- Date: ${input.deliveryDate.toISOString().split('T')[0]}
- Equipment Type: ${input.equipmentType || 'Any'}

AVAILABLE LOADS (Same City):
${availableLoads.slice(0, 10).map((load, i) => `
Load ${i + 1}:
- Load Number: ${load.loadNumber}
- Pickup: ${load.pickupCity}, ${load.pickupState}
- Delivery: ${load.deliveryCity}, ${load.deliveryState}
- Distance: ${load.totalMiles || 'N/A'} miles
- Revenue: $${load.revenue.toFixed(2)}
- Rate/Mile: ${load.totalMiles ? `$${(load.revenue / load.totalMiles).toFixed(2)}` : 'N/A'}
- Equipment: ${load.equipmentType || 'N/A'}
- Pickup Date: ${load.pickupDate?.toISOString().split('T')[0] || 'N/A'}
`).join('\n')}

NEARBY LOADS (Same State):
${nearbyLoads.filter(l => l.pickupCity !== input.deliveryCity).slice(0, 10).map((load, i) => `
Load ${i + 1}:
- Load Number: ${load.loadNumber}
- Pickup: ${load.pickupCity}, ${load.pickupState}
- Delivery: ${load.deliveryCity}, ${load.deliveryState}
- Distance: ${load.totalMiles || 'N/A'} miles
- Revenue: $${load.revenue.toFixed(2)}
- Equipment: ${load.equipmentType || 'N/A'}
`).join('\n')}

HISTORICAL BACKHAUL PATTERNS:
${historicalBackhauls.slice(0, 10).map((load, i) => `
Pattern ${i + 1}: ${input.deliveryCity} → ${load.deliveryCity}, ${load.deliveryState}
- Revenue: $${load.revenue.toFixed(2)}
- Miles: ${load.totalMiles || 'N/A'}
`).join('\n')}

Return JSON with:
- recommendations: array of {
    loadId: string,
    loadNumber: string,
    pickupCity: string,
    pickupState: string,
    deliveryCity: string,
    deliveryState: string,
    distance: number,
    revenue: number,
    ratePerMile: number,
    matchScore: number (0-100),
    reasoning: string,
    factors: {
      proximity: number (0-100, how close pickup is to delivery location),
      timing: number (0-100, how well timing matches),
      equipmentMatch: boolean,
      historicalLane: boolean (if this lane has been used before)
    }
  }
- summary: {
    totalOpportunities: number,
    avgRatePerMile: number,
    totalPotentialRevenue: number
  }

Rank by matchScore (higher = better match). Consider:
1. Proximity to delivery location (minimize empty miles)
2. Timing (pickup date should be soon after delivery)
3. Equipment compatibility
4. Rate per mile (higher is better)
5. Historical success of this lane`;

    const result = await this.callAI<BackhaulRecommendationResult>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in backhaul load matching. Analyze opportunities and return ONLY valid JSON with recommendations.',
      }
    );

    // Enrich with actual load data
    const enrichedRecommendations = result.data.recommendations.map(rec => {
      const load = [...availableLoads, ...nearbyLoads].find(l => l.id === rec.loadId);
      if (load) {
        return {
          ...rec,
          loadNumber: load.loadNumber,
          pickupCity: load.pickupCity || '',
          pickupState: load.pickupState || '',
          deliveryCity: load.deliveryCity || '',
          deliveryState: load.deliveryState || '',
          distance: load.totalMiles || 0,
          revenue: load.revenue || 0,
          ratePerMile: load.totalMiles && load.totalMiles > 0 ? load.revenue / load.totalMiles : 0,
        };
      }
      return rec;
    }).filter(rec => rec.loadId);

    return {
      ...result.data,
      recommendations: enrichedRecommendations.slice(0, 10),
    };
  }
}

