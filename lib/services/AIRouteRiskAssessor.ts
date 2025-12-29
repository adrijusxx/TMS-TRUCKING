/**
 * Weather & Route Risk Assessment Service
 * Predicts weather impact and suggests alternative routes
 */

import { AIService } from './AIService';

interface RouteRiskAssessment {
  route: {
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    totalMiles: number;
  };
  weatherImpact: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    weatherConditions: string[];
    impactDescription: string;
    delayProbability: number; // 0-100
    estimatedDelayHours: number;
  };
  alternativeRoutes: Array<{
    route: string;
    additionalMiles: number;
    additionalTime: number; // hours
    riskReduction: string;
    recommendation: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';
  }>;
  safetyRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    recommendations: string[];
  };
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class AIRouteRiskAssessor extends AIService {
  async assessRouteRisk(
    route: {
      pickupCity: string;
      pickupState: string;
      deliveryCity: string;
      deliveryState: string;
      totalMiles: number;
      pickupDate: Date;
      deliveryDate: Date;
    }
  ): Promise<RouteRiskAssessment> {
    const prompt = `Assess route risk including weather impact and safety factors.

ROUTE:
- From: ${route.pickupCity}, ${route.pickupState}
- To: ${route.deliveryCity}, ${route.deliveryState}
- Distance: ${route.totalMiles.toLocaleString()} miles
- Pickup Date: ${route.pickupDate.toISOString().split('T')[0]}
- Delivery Date: ${route.deliveryDate.toISOString().split('T')[0]}

WEATHER CONSIDERATIONS:
- Current season and typical weather patterns
- Historical weather data for this route
- Potential for delays due to weather

SAFETY CONSIDERATIONS:
- Road conditions
- Traffic patterns
- Mountain passes or challenging terrain
- Urban vs rural routes

Return JSON with:
- route: {pickupCity, pickupState, deliveryCity, deliveryState, totalMiles}
- weatherImpact: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    weatherConditions: string[],
    impactDescription: string,
    delayProbability: number (0-100),
    estimatedDelayHours: number
  }
- alternativeRoutes: array of {
    route: string (description),
    additionalMiles: number,
    additionalTime: number (hours),
    riskReduction: string,
    recommendation: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED'
  }
- safetyRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    riskFactors: string[],
    recommendations: string[]
  }
- overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`;

    const result = await this.callAI<RouteRiskAssessment>(
      prompt,
      {
        temperature: 0.4,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in route planning and weather risk assessment for trucking. Return ONLY valid JSON.',
      }
    );

    return result.data;
  }
}



