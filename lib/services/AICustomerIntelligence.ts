/**
 * Customer Relationship Intelligence Service
 * Predicts payment behavior, churn risk, and provides pricing recommendations
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

interface CustomerIntelligence {
  customerId: string;
  customerName: string;
  paymentBehavior: {
    averageDaysToPay: number;
    onTimePaymentRate: number;
    latePaymentRate: number;
    prediction: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  churnRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number; // 0-100
    riskFactors: string[];
  };
  pricingRecommendation?: {
    recommendedRatePerMile: number;
    confidence: number;
    reasoning: string;
  };
  lifetimeValue: {
    estimated: number;
    confidence: number;
  };
  recommendations: string[];
}

export class AICustomerIntelligence extends AIService {
  async getCustomerIntelligence(companyId: string, customerId: string): Promise<CustomerIntelligence> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, companyId },
      include: {
        invoices: {
          select: {
            total: true,
            amountPaid: true,
            balance: true,
            invoiceDate: true,
            dueDate: true,
            paidDate: true,
            status: true,
          },
          orderBy: { invoiceDate: 'desc' },
          take: 50,
        },
        loads: {
          where: { deletedAt: null },
          select: {
            revenue: true,
            totalMiles: true,
            pickupDate: true,
            status: true,
          },
          orderBy: { pickupDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    const prompt = `Analyze customer relationship data and provide intelligence insights.

CUSTOMER: ${customer.name}
PAYMENT TERMS: ${customer.paymentTerms || 'Not specified'}

INVOICE HISTORY (${customer.invoices.length} invoices):
${JSON.stringify(customer.invoices, null, 2)}

LOAD HISTORY (${customer.loads.length} loads):
${JSON.stringify(customer.loads, null, 2)}

Return JSON with:
- customerId: string
- customerName: string
- paymentBehavior: {
    averageDaysToPay: number,
    onTimePaymentRate: number (0-100),
    latePaymentRate: number (0-100),
    prediction: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  }
- churnRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    riskScore: number (0-100),
    riskFactors: string[]
  }
- pricingRecommendation?: {
    recommendedRatePerMile: number,
    confidence: number (0-100),
    reasoning: string
  }
- lifetimeValue: {
    estimated: number,
    confidence: number (0-100)
  }
- recommendations: string[]`;

    try {
      const result = await this.callAI<CustomerIntelligence>(
        prompt,
        {
          temperature: 0.3,
          maxTokens: 2000,
          systemPrompt: 'You are an expert in customer relationship management for trucking companies. Return ONLY valid JSON.',
        }
      );

      if (!result.data) {
        throw new Error('AI returned no customer intelligence data');
      }

      return { ...result.data, customerId, customerName: customer.name };
    } catch (error) {
      console.error('[AICustomerIntelligence] Failed to get customer intelligence:', error instanceof Error ? error.message : String(error));
      return {
        customerId,
        customerName: customer.name,
        paymentBehavior: { averageDaysToPay: 0, onTimePaymentRate: 0, latePaymentRate: 0, prediction: 'FAIR' as const },
        churnRisk: { riskLevel: 'MEDIUM' as const, riskScore: 50, riskFactors: ['AI analysis unavailable'] },
        lifetimeValue: { estimated: 0, confidence: 0 },
        recommendations: ['AI analysis unavailable. Manual review recommended.'],
      };
    }
  }
}

