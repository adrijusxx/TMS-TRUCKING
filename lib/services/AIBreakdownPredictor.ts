/**
 * Predictive Breakdown Prevention Service
 * Predicts breakdown types and timing, recommends preventive maintenance
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface BreakdownPrediction {
  truckId: string;
  truckNumber: string;
  predictedBreakdowns: Array<{
    type: string;
    predictedDate: string; // ISO date
    confidence: number; // 0-100
    reason: string;
    estimatedCost: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  preventiveMaintenanceRecommendations: Array<{
    type: string;
    recommendedDate: string; // ISO date
    estimatedCost: number;
    costBenefitAnalysis: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  overallRiskScore: number; // 0-100
}

export class AIBreakdownPredictor extends AIService {
  async predictBreakdowns(companyId: string, truckId: string): Promise<BreakdownPrediction> {
    const truck = await prisma.truck.findUnique({
      where: { id: truckId, companyId },
      include: {
        maintenanceRecords: {
          where: {
            status: 'COMPLETED',
          },
          orderBy: { date: 'desc' },
          take: 20,
          select: {
            type: true,
            description: true,
            cost: true,
            odometer: true,
            date: true,
          },
        },
        breakdowns: {
          orderBy: { reportedAt: 'desc' },
          take: 10,
          select: {
            breakdownType: true,
            problem: true,
            totalCost: true,
            reportedAt: true,
            odometerReading: true,
          },
        },
        fuelEntries: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            date: true,
            odometer: true,
            gallons: true,
            costPerGallon: true,
          },
        },
      },
    });

    if (!truck) {
      throw new Error('Truck not found');
    }

    const prompt = `Predict breakdown risks and recommend preventive maintenance for this truck.

TRUCK: ${truck.truckNumber}
MAKE/MODEL: ${truck.make} ${truck.model}
YEAR: ${truck.year}
ODOMETER: ${truck.odometerReading?.toLocaleString() || 'N/A'} miles

MAINTENANCE HISTORY (${truck.maintenanceRecords.length} records):
${JSON.stringify(truck.maintenanceRecords, null, 2)}

BREAKDOWN HISTORY (${truck.breakdowns.length} breakdowns):
${JSON.stringify(truck.breakdowns, null, 2)}

FUEL CONSUMPTION (${truck.fuelEntries.length} entries):
${JSON.stringify(truck.fuelEntries, null, 2)}

ANALYSIS FACTORS:
1. Mileage and age
2. Maintenance patterns and gaps
3. Breakdown history and types
4. Fuel consumption patterns (may indicate engine issues)
5. Time since last major maintenance
6. Common failure points for this make/model

Return JSON with:
- truckId: string
- truckNumber: string
- predictedBreakdowns: array of {
    type: string,
    predictedDate: string (ISO),
    confidence: number (0-100),
    reason: string,
    estimatedCost: number,
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
- preventiveMaintenanceRecommendations: array of {
    type: string,
    recommendedDate: string (ISO),
    estimatedCost: number,
    costBenefitAnalysis: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  }
- overallRiskScore: number (0-100)`;

    const result = await this.callAI<BreakdownPrediction>(
      prompt,
      {
        temperature: 0.4,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in truck maintenance and breakdown prevention. Return ONLY valid JSON.',
      }
    );

    return { ...result.data, truckId, truckNumber: truck.truckNumber };
  }
}



