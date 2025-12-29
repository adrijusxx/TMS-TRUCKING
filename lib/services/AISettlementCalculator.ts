/**
 * Smart Settlement Calculator Service
 * Auto-calculates settlements with AI verification
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { AIVerificationService } from './AIVerificationService';

interface SettlementCalculation {
  driverId: string;
  periodStart: Date;
  periodEnd: Date;
  loads: Array<{
    loadId: string;
    loadNumber: string;
    revenue: number;
    driverPay: number;
    deductions: number;
  }>;
  calculatedSettlement: {
    grossPay: number;
    totalDeductions: number;
    advances: number;
    netPay: number;
  };
  aiVerification: {
    verified: boolean;
    discrepancies: string[];
    confidence: number;
    recommendations: string[];
  };
}

const verificationService = new AIVerificationService();

export class AISettlementCalculator extends AIService {
  async calculateSettlement(
    companyId: string,
    driverId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<SettlementCalculation> {
    // Fetch loads for the period
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        companyId,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: periodStart, lte: periodEnd } },
          { deliveryDate: { gte: periodStart, lte: periodEnd } },
          { deliveredAt: { gte: periodStart, lte: periodEnd } },
        ],
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        driverPay: true,
        expenses: true,
        fuelAdvance: true,
      },
    });

    // Fetch advances
    const advances = await prisma.driverAdvance.findMany({
      where: {
        driverId,
        approvalStatus: 'APPROVED',
        settlementId: null,
        requestDate: { gte: periodStart, lte: periodEnd },
      },
      select: {
        amount: true,
      },
    });

    // Calculate settlement
    const grossPay = loads.reduce((sum, load) => sum + (load.driverPay || 0), 0);
    const totalDeductions = loads.reduce((sum, load) => sum + (load.expenses || 0) + (load.fuelAdvance || 0), 0);
    const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);
    const netPay = grossPay - totalDeductions - totalAdvances;

    const calculatedSettlement = {
      grossPay,
      totalDeductions,
      advances: totalAdvances,
      netPay,
    };

    // AI verification
    const prompt = `Verify settlement calculation for a truck driver.

SETTLEMENT PERIOD: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}

LOADS (${loads.length} loads):
${JSON.stringify(loads, null, 2)}

ADVANCES: $${totalAdvances.toFixed(2)}

CALCULATED SETTLEMENT:
- Gross Pay: $${grossPay.toFixed(2)}
- Total Deductions: $${totalDeductions.toFixed(2)}
- Advances: $${totalAdvances.toFixed(2)}
- Net Pay: $${netPay.toFixed(2)}

VERIFY:
1. Gross pay calculation (sum of driverPay from loads)
2. Deductions calculation (expenses + fuel advances)
3. Advances calculation
4. Net pay calculation (grossPay - deductions - advances)
5. Check for any missing loads or incorrect amounts

Return JSON with:
- verified: boolean
- discrepancies: string[] (any issues found)
- confidence: number (0-100)
- recommendations: string[]`;

    const verification = await this.callAI<{
      verified: boolean;
      discrepancies: string[];
      confidence: number;
      recommendations: string[];
    }>(
      prompt,
      {
        temperature: 0.1,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in settlement calculations. Verify the math and logic. Return ONLY valid JSON.',
      }
    );

    // Create suggestion if discrepancies found
    if (verification.data.discrepancies.length > 0 || !verification.data.verified) {
      await verificationService.createSuggestion({
        companyId,
        suggestionType: 'SETTLEMENT_CALCULATION',
        entityType: 'SETTLEMENT',
        entityId: undefined, // Will be set when settlement is created
        aiConfidence: verification.data.confidence,
        aiReasoning: verification.data.recommendations.join('; '),
        suggestedValue: calculatedSettlement,
        originalValue: calculatedSettlement, // Same for now, will be compared to manual calculation
      });
    }

    return {
      driverId,
      periodStart,
      periodEnd,
      loads: loads.map(load => ({
        loadId: load.id,
        loadNumber: load.loadNumber,
        revenue: load.revenue,
        driverPay: load.driverPay || 0,
        deductions: (load.expenses || 0) + (load.fuelAdvance || 0),
      })),
      calculatedSettlement,
      aiVerification: verification.data,
    };
  }
}



