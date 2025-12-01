/**
 * Load Board Intelligence Service
 * Scores loads by profitability and filters low-quality loads
 */

import { AIService } from './AIService';

export interface LoadBoardLoad {
  loadId: string;
  loadNumber: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  equipmentType: string;
  weight: number;
  rate: number;
  distance: number;
  pickupDate: string;
  deliveryDate: string;
  commodity?: string;
  hazmat?: boolean;
}

interface LoadScore {
  loadId: string;
  loadNumber: string;
  profitabilityScore: number; // 0-100
  qualityScore: number; // 0-100
  overallScore: number; // 0-100
  factors: {
    ratePerMile: number;
    distance: number;
    equipmentMatch: boolean;
    timeWindow: 'GOOD' | 'TIGHT' | 'FLEXIBLE';
    commodityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendations: string[];
  backhaulOpportunity: boolean;
  rateNegotiationRecommendation?: {
    suggestedRate: number;
    reasoning: string;
  };
}

export class AILoadBoardIntelligence extends AIService {
  async scoreLoads(loads: LoadBoardLoad[]): Promise<LoadScore[]> {
    const prompt = `Score and analyze loads from a load board for profitability and quality.

LOADS TO ANALYZE:
${JSON.stringify(loads, null, 2)}

SCORING FACTORS:
1. Rate per mile (higher is better)
2. Distance (longer hauls often more profitable)
3. Equipment type match
4. Time window (flexible is better)
5. Commodity risk (hazmat, perishable, etc.)
6. Backhaul opportunity potential

Return JSON array of scores, each with:
- loadId: string
- loadNumber: string
- profitabilityScore: number (0-100)
- qualityScore: number (0-100)
- overallScore: number (0-100, weighted average)
- factors: {
    ratePerMile: number,
    distance: number,
    equipmentMatch: boolean,
    timeWindow: 'GOOD' | 'TIGHT' | 'FLEXIBLE',
    commodityRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  }
- recommendations: string[]
- backhaulOpportunity: boolean
- rateNegotiationRecommendation?: {
    suggestedRate: number,
    reasoning: string
  }`;

    const result = await this.callAI<LoadScore[]>(
      prompt,
      {
        temperature: 0.3,
        maxTokens: 4000,
        systemPrompt: 'You are an expert in load board analysis and freight profitability. Return ONLY valid JSON array.',
      }
    );

    return result.data;
  }
}



