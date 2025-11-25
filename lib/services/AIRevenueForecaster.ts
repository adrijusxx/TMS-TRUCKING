/**
 * AI Revenue Forecaster Service
 * Enhances revenue forecasting with AI-powered predictions
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

export interface RevenueForecastInput {
  companyId: string;
  months: number;
  forecastMonths: number;
}

export interface EnhancedForecast {
  month: string;
  revenue: number;
  confidence: string;
  factors: {
    seasonalAdjustment?: number;
    trendAdjustment?: number;
    marketConditions?: string;
  };
  recommendations?: string[];
}

export interface AIRevenueForecastResult {
  historical: Array<{ month: string; revenue: number }>;
  forecast: EnhancedForecast[];
  insights: {
    trend: string;
    seasonality: string;
    marketFactors: string[];
  };
}

export class AIRevenueForecaster extends AIService {
  /**
   * Generate enhanced revenue forecast with AI
   */
  async forecastRevenue(input: RevenueForecastInput): Promise<AIRevenueForecastResult> {
    // Fetch historical data (same as existing endpoint)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - input.months);
    const endDate = new Date();

    const loads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: startDate, lte: endDate } },
          { deliveryDate: { gte: startDate, lte: endDate } },
          { deliveredAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        pickupDate: true,
        deliveryDate: true,
        deliveredAt: true,
        revenue: true,
        customer: {
          select: { name: true },
        },
      },
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    loads.forEach((load) => {
      let date: Date | null = null;
      if (load.deliveredAt) {
        date = new Date(load.deliveredAt);
      } else if (load.deliveryDate) {
        date = new Date(load.deliveryDate);
      } else if (load.pickupDate) {
        date = new Date(load.pickupDate);
      }
      
      if (date) {
        const month = date.toISOString().slice(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (load.revenue || 0);
      }
    });

    const historical = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Build AI prompt
    const prompt = `Analyze revenue trends and generate enhanced forecast. Return JSON with forecast and insights.

HISTORICAL REVENUE DATA (${input.months} months):
${historical.map(d => `- ${d.month}: $${d.revenue.toLocaleString()}`).join('\n')}

FORECAST PERIOD: Next ${input.forecastMonths} months

Return JSON with:
- forecast: array of {
    month: string (YYYY-MM),
    revenue: number (projected revenue),
    confidence: string (high, medium, low),
    factors: {
      seasonalAdjustment: number (percentage adjustment for seasonality),
      trendAdjustment: number (percentage adjustment for trend),
      marketConditions: string (description of market factors)
    },
    recommendations: array of strings (optional revenue optimization suggestions)
  }
- insights: {
    trend: string (description of revenue trend),
    seasonality: string (description of seasonal patterns),
    marketFactors: array of strings (key market factors affecting revenue)
  }

Consider:
1. Historical trends and growth patterns
2. Seasonal variations (holidays, peak shipping seasons)
3. Market conditions (fuel prices, demand, competition)
4. Customer patterns and retention
5. Economic factors affecting trucking industry`;

    const result = await this.callAI<{ forecast: EnhancedForecast[]; insights: any }>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in revenue forecasting for trucking companies. Analyze trends and return ONLY valid JSON with enhanced forecasts.',
      }
    );

    return {
      historical,
      forecast: result.data.forecast || [],
      insights: result.data.insights || {
        trend: 'Stable',
        seasonality: 'No significant seasonal patterns detected',
        marketFactors: [],
      },
    };
  }
}



