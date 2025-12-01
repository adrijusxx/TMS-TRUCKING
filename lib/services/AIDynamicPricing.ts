/**
 * Dynamic Pricing Engine Service
 * Real-time market rate analysis and pricing recommendations
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { AIVerificationService } from './AIVerificationService';
import { EquipmentType } from '@prisma/client';

interface DynamicPricingRecommendation {
  lane: string; // e.g., "CA-TX"
  recommendedRatePerMile: number;
  marketRateRange: {
    min: number;
    max: number;
    average: number;
  };
  confidence: number; // 0-100
  factors: {
    seasonality: number; // Seasonal adjustment factor
    marketDemand: 'LOW' | 'MEDIUM' | 'HIGH';
    competition: 'LOW' | 'MEDIUM' | 'HIGH';
    fuelCosts: number;
  };
  reasoning: string;
  suggestedTotalRate: number;
}

const verificationService = new AIVerificationService();

export class AIDynamicPricing extends AIService {
  async getDynamicPricing(
    companyId: string,
    pickupState: string,
    deliveryState: string,
    equipmentType: string,
    totalMiles: number,
    loadId?: string
  ): Promise<DynamicPricingRecommendation> {
    // Fetch recent loads for this lane
    const recentLoads = await prisma.load.findMany({
      where: {
        companyId,
        pickupState,
        deliveryState,
        equipmentType: equipmentType as EquipmentType,
        revenue: { gt: 0 },
        totalMiles: { gt: 0 },
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        revenue: true,
        totalMiles: true,
        createdAt: true,
      },
      take: 50,
    });

    const lane = `${pickupState}-${deliveryState}`;
    const historicalRates = recentLoads
      .filter(load => load.totalMiles && load.totalMiles > 0)
      .map(load => load.revenue / (load.totalMiles || 1));

    const prompt = `Provide dynamic pricing recommendation for a trucking load based on current market conditions.

LANE: ${pickupState} → ${deliveryState}
EQUIPMENT: ${equipmentType}
DISTANCE: ${totalMiles.toLocaleString()} miles

HISTORICAL DATA (${recentLoads.length} loads in last 90 days):
${historicalRates.length > 0 ? `
- Average Rate: $${(historicalRates.reduce((a, b) => a + b, 0) / historicalRates.length).toFixed(2)}/mile
- Min Rate: $${Math.min(...historicalRates).toFixed(2)}/mile
- Max Rate: $${Math.max(...historicalRates).toFixed(2)}/mile
` : 'Limited historical data available'}

MARKET FACTORS TO CONSIDER:
1. Current season (holidays, peak shipping times)
2. Fuel costs (current diesel ~$3.50-$4.50/gallon)
3. Market demand and supply
4. Competition level for this lane
5. Equipment type premiums
6. Historical performance on this lane

Return JSON with:
- lane: string
- recommendedRatePerMile: number
- marketRateRange: {min: number, max: number, average: number}
- confidence: number (0-100)
- factors: {
    seasonality: number (seasonal adjustment factor, 1.0 = no adjustment),
    marketDemand: 'LOW' | 'MEDIUM' | 'HIGH',
    competition: 'LOW' | 'MEDIUM' | 'HIGH',
    fuelCosts: number (estimated fuel cost per mile)
  }
- reasoning: string
- suggestedTotalRate: number`;

    const result = await this.callAI<DynamicPricingRecommendation>(
      prompt,
      {
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in dynamic freight pricing. Return ONLY valid JSON.',
      }
    );

    // Create suggestion if loadId provided (requires approval)
    if (loadId) {
      await verificationService.createSuggestion({
        companyId,
        suggestionType: 'DYNAMIC_PRICING',
        entityType: 'LOAD',
        entityId: loadId,
        aiConfidence: result.data.confidence,
        aiReasoning: result.data.reasoning,
        suggestedValue: {
          revenue: result.data.suggestedTotalRate,
          ratePerMile: result.data.recommendedRatePerMile,
        },
      });
    }

    return result.data;
  }
}

