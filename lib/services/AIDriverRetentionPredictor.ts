/**
 * Driver Retention Predictor Service
 * Identifies drivers at risk of leaving
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface DriverRetentionPrediction {
  driverId: string;
  driverName: string;
  turnoverRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number; // 0-100
    riskFactors: string[];
  };
  satisfactionScore: number; // 0-100
  retentionRecommendations: string[];
  predictedRetentionProbability: number; // 0-100
}

export class AIDriverRetentionPredictor extends AIService {
  async predictDriverRetention(companyId: string, driverId: string): Promise<DriverRetentionPrediction> {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId, companyId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        settlements: {
          orderBy: { periodEnd: 'desc' },
          take: 12,
          select: {
            grossPay: true,
            netPay: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        loads: {
          orderBy: { pickupDate: 'desc' },
          take: 20,
          select: {
            revenue: true,
            driverPay: true,
            pickupDate: true,
            deliveryDate: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
          },
        },
        safetyIncidents: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            date: true,
            incidentType: true,
            severity: true,
          },
        },
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const prompt = `Predict driver retention risk based on historical data.

DRIVER: ${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}
DRIVER NUMBER: ${driver.driverNumber}
STATUS: ${driver.status}
HIRE DATE: ${driver.hireDate || 'Not available'}

SETTLEMENT HISTORY (${driver.settlements.length} settlements):
${JSON.stringify(driver.settlements, null, 2)}

LOAD HISTORY (${driver.loads.length} loads):
${JSON.stringify(driver.loads, null, 2)}

SAFETY INCIDENTS (${driver.safetyIncidents.length} incidents):
${JSON.stringify(driver.safetyIncidents, null, 2)}

RETENTION FACTORS TO CONSIDER:
1. Pay satisfaction (settlement amounts, frequency, consistency)
2. Load assignments (home time, route preferences, profitability)
3. Safety incidents and violations
4. Performance metrics
5. Time with company
6. Recent changes in load assignments or pay

Return JSON with:
- driverId: string
- driverName: string
- turnoverRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    riskScore: number (0-100),
    riskFactors: string[]
  }
- satisfactionScore: number (0-100)
- retentionRecommendations: string[]
- predictedRetentionProbability: number (0-100, probability of staying)`;

    const result = await this.callAI<DriverRetentionPrediction>(
      prompt,
      {
        temperature: 0.4,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in driver retention and workforce management. Return ONLY valid JSON.',
      }
    );

    return {
      ...result.data,
      driverId,
      driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
    };
  }
}



