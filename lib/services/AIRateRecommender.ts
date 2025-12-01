/**
 * AI Rate Recommender Service
 * Provides AI-powered rate recommendations based on market and historical data
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { EquipmentType } from '@prisma/client';

interface RateRecommendationInput {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  equipmentType: string;
  weight?: number;
  hazmat?: boolean;
  temperature?: string;
  totalMiles?: number;
  companyId: string;
}

interface RateRecommendation {
  recommendedRate: number;
  ratePerMile: number;
  confidence: number;
  reasoning: string;
  factors: {
    laneHistory?: number;
    marketRate?: number;
    equipmentPremium?: number;
    hazmatPremium?: number;
    temperaturePremium?: number;
    fuelCost?: number;
  };
  comparison: {
    minHistoricalRate?: number;
    maxHistoricalRate?: number;
    avgHistoricalRate?: number;
    marketRange?: { min: number; max: number };
  };
}

export class AIRateRecommender extends AIService {
  /**
   * Get rate recommendations for a load
   */
  async getRateRecommendation(input: RateRecommendationInput): Promise<RateRecommendation> {
    // Fetch historical loads for this lane
    const historicalLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        pickupCity: { equals: input.pickupCity, mode: 'insensitive' },
        pickupState: input.pickupState,
        deliveryCity: { equals: input.deliveryCity, mode: 'insensitive' },
        deliveryState: input.deliveryState,
        revenue: { gt: 0 },
        deletedAt: null,
      },
      select: {
        revenue: true,
        totalMiles: true,
        equipmentType: true,
        hazmat: true,
        weight: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate historical rates
    const historicalRates = historicalLoads
      .filter(load => load.totalMiles && load.totalMiles > 0)
      .map(load => ({
        ratePerMile: load.revenue / (load.totalMiles || 1),
        totalRate: load.revenue,
        miles: load.totalMiles || 0,
        equipmentType: load.equipmentType,
        hazmat: load.hazmat,
      }));

    const avgHistoricalRate = historicalRates.length > 0
      ? historicalRates.reduce((sum, r) => sum + r.ratePerMile, 0) / historicalRates.length
      : 0;
    const minHistoricalRate = historicalRates.length > 0
      ? Math.min(...historicalRates.map(r => r.ratePerMile))
      : 0;
    const maxHistoricalRate = historicalRates.length > 0
      ? Math.max(...historicalRates.map(r => r.ratePerMile))
      : 0;

    // Fetch similar loads (same equipment type, similar distance)
    const similarLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        equipmentType: input.equipmentType as EquipmentType,
        revenue: { gt: 0 },
        totalMiles: input.totalMiles
          ? {
              gte: input.totalMiles * 0.8,
              lte: input.totalMiles * 1.2,
            }
          : undefined,
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        revenue: true,
        totalMiles: true,
        hazmat: true,
        createdAt: true,
      },
      take: 100,
    });

    const similarRates = similarLoads
      .filter(load => load.totalMiles && load.totalMiles > 0)
      .map(load => load.revenue / (load.totalMiles || 1));

    const avgSimilarRate = similarRates.length > 0
      ? similarRates.reduce((sum, r) => sum + r, 0) / similarRates.length
      : 0;

    // Build AI prompt
    const prompt = `Recommend a freight rate for this trucking load. Return JSON with rate recommendation.

LOAD DETAILS:
- Lane: ${input.pickupCity}, ${input.pickupState} → ${input.deliveryCity}, ${input.deliveryState}
- Distance: ${input.totalMiles ? `${input.totalMiles.toLocaleString()} miles` : 'Not specified'}
- Equipment Type: ${input.equipmentType}
- Weight: ${input.weight ? `${input.weight.toLocaleString()} lbs` : 'Not specified'}
- Hazmat: ${input.hazmat ? 'Yes' : 'No'}
- Temperature: ${input.temperature || 'N/A'}

HISTORICAL DATA FOR THIS LANE:
- Number of Historical Loads: ${historicalLoads.length}
- Average Rate Per Mile: $${avgHistoricalRate.toFixed(2)}/mile
- Min Rate Per Mile: $${minHistoricalRate.toFixed(2)}/mile
- Max Rate Per Mile: $${maxHistoricalRate.toFixed(2)}/mile
${historicalRates.length > 0 ? `
Recent Rates:
${historicalRates.slice(0, 10).map((r, i) => `  ${i + 1}. $${r.ratePerMile.toFixed(2)}/mile (${r.miles} miles, $${r.totalRate.toFixed(2)} total)`).join('\n')}
` : ''}

SIMILAR LOADS (Same Equipment, Similar Distance):
- Number of Similar Loads: ${similarLoads.length}
- Average Rate Per Mile: $${avgSimilarRate.toFixed(2)}/mile

RATE FACTORS TO CONSIDER:
1. Base rate per mile: $1.50-$3.50 (varies by region and market)
2. Equipment premiums:
   - Dry Van: Base rate
   - Reefer: +$0.20-$0.50/mile
   - Flatbed: +$0.15-$0.40/mile
   - Step Deck: +$0.20-$0.45/mile
   - Tanker: +$0.25-$0.60/mile
3. Hazmat premium: +$0.15-$0.35/mile
4. Temperature-controlled premium: +$0.10-$0.30/mile
5. Fuel costs: Current diesel ~$3.50-$4.50/gallon, factor $0.50-$0.70/mile
6. Market conditions: Supply/demand, seasonal factors
7. Lane factors: Popular lanes (CA-TX, IL-FL) may have lower rates due to competition

Return JSON with:
- recommendedRate: number (total rate in dollars)
- ratePerMile: number (rate per mile)
- confidence: number (0-100, based on data availability)
- reasoning: string (explanation of recommendation)
- factors: {
    laneHistory: number (rate based on historical lane data),
    marketRate: number (estimated market rate),
    equipmentPremium: number (equipment type premium),
    hazmatPremium: number (if hazmat),
    temperaturePremium: number (if temperature controlled),
    fuelCost: number (estimated fuel cost)
  }
- comparison: {
    minHistoricalRate: number,
    maxHistoricalRate: number,
    avgHistoricalRate: number,
    marketRange: {min: number, max: number}
  }

If historical data is limited, use market rates and adjust based on equipment/hazmat factors.`;

    const result = await this.callAI<RateRecommendation>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in freight rate pricing. Analyze load details and historical data to recommend rates. Return ONLY valid JSON.',
      }
    );

    return {
      ...result.data,
      comparison: {
        ...result.data.comparison,
        minHistoricalRate: minHistoricalRate > 0 ? minHistoricalRate : undefined,
        maxHistoricalRate: maxHistoricalRate > 0 ? maxHistoricalRate : undefined,
        avgHistoricalRate: avgHistoricalRate > 0 ? avgHistoricalRate : undefined,
      },
    };
  }
}

