/**
 * AI Cash Flow Predictor Service
 * Predicts cash flow considering payment patterns, settlements, and invoices
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface CashFlowPredictionInput {
  companyId: string;
  days: number; // Number of days to predict
}

interface CashFlowPrediction {
  date: string;
  expectedInflow: number;
  expectedOutflow: number;
  netCashFlow: number;
  confidence: string;
  details: {
    invoices?: number;
    settlements?: number;
    advances?: number;
    otherInflows?: number;
    otherOutflows?: number;
  };
}

interface CashFlowPredictionResult {
  predictions: CashFlowPrediction[];
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    averageDailyFlow: number;
  };
  recommendations: string[];
}

export class AICashFlowPredictor extends AIService {
  /**
   * Predict cash flow
   */
  async predictCashFlow(input: CashFlowPredictionInput): Promise<CashFlowPredictionResult> {
    // Fetch pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: input.companyId,
        },
        status: { in: ['SENT', 'PARTIAL'] },
      },
      include: {
        customer: {
          select: {
            name: true,
            paymentTerms: true,
          },
        },
      },
    });

    // Fetch pending settlements (through driver)
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        driver: {
          companyId: input.companyId,
        },
      },
      include: {
        driver: {
          select: {
            driverNumber: true,
          },
        },
      },
    });

    // Fetch pending advances (through driver)
    const pendingAdvances = await prisma.driverAdvance.findMany({
      where: {
        approvalStatus: 'APPROVED',
        paidAt: null, // Not yet paid
        driver: {
          companyId: input.companyId,
        },
      },
      include: {
        driver: {
          select: {
            driverNumber: true,
          },
        },
      },
    });

    // Calculate payment patterns by customer
    const customerPaymentPatterns: Record<string, any> = {};
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: input.companyId,
        },
        status: 'PAID',
        paidDate: { not: null },
      },
      include: {
        customer: {
          select: {
            name: true,
            paymentTerms: true,
          },
        },
      },
      take: 100,
    });

    paidInvoices.forEach(inv => {
      if (inv.customer && inv.invoiceDate && inv.paidDate) {
        const customerId = inv.customer.name;
        if (!customerPaymentPatterns[customerId]) {
          customerPaymentPatterns[customerId] = {
            paymentTerms: inv.customer.paymentTerms || 30,
            actualDays: [],
          };
        }
        const daysToPay = Math.round(
          (inv.paidDate.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        customerPaymentPatterns[customerId].actualDays.push(daysToPay);
      }
    });

    // Calculate average payment days per customer
    Object.keys(customerPaymentPatterns).forEach(customerId => {
      const pattern = customerPaymentPatterns[customerId];
      pattern.avgDays = pattern.actualDays.length > 0
        ? pattern.actualDays.reduce((sum: number, d: number) => sum + d, 0) / pattern.actualDays.length
        : pattern.paymentTerms;
    });

    // Build AI prompt
    const prompt = `Predict cash flow for the next ${input.days} days. Return JSON with daily predictions.

PENDING INVOICES (Expected Inflow):
${pendingInvoices.slice(0, 20).map((inv, i) => `
Invoice ${i + 1}:
- Number: ${inv.invoiceNumber}
- Amount: $${inv.balance.toFixed(2)}
- Customer: ${inv.customer?.name || 'N/A'}
- Payment Terms: ${inv.customer?.paymentTerms || 30} days
- Invoice Date: ${inv.invoiceDate.toISOString().split('T')[0]}
- Due Date: ${inv.dueDate.toISOString().split('T')[0]}
`).join('\n')}

PENDING SETTLEMENTS (Expected Outflow):
${pendingSettlements.slice(0, 20).map((set, i) => `
Settlement ${i + 1}:
- Number: ${set.settlementNumber}
- Amount: $${set.netPay.toFixed(2)}
- Driver: ${set.driver?.driverNumber || 'N/A'}
- Status: ${set.status}
- Period: ${set.periodStart.toISOString().split('T')[0]} to ${set.periodEnd.toISOString().split('T')[0]}
`).join('\n')}

PENDING ADVANCES (Expected Outflow):
${pendingAdvances.slice(0, 10).map((adv, i) => `
Advance ${i + 1}:
- Amount: $${adv.amount.toFixed(2)}
- Driver: ${adv.driver?.driverNumber || 'N/A'}
- Request Date: ${adv.requestDate.toISOString().split('T')[0]}
`).join('\n')}

CUSTOMER PAYMENT PATTERNS:
${Object.entries(customerPaymentPatterns).slice(0, 10).map(([customer, pattern]: [string, any]) => `
- ${customer}: Terms ${pattern.paymentTerms} days, Actual avg ${pattern.avgDays?.toFixed(0) || 'N/A'} days
`).join('\n')}

Return JSON with:
- predictions: array of {
    date: string (ISO format YYYY-MM-DD),
    expectedInflow: number,
    expectedOutflow: number,
    netCashFlow: number,
    confidence: string (high, medium, low),
    details: {
      invoices: number (invoice payments expected),
      settlements: number (settlement payments),
      advances: number (advance payments),
      otherInflows: number,
      otherOutflows: number
    }
  }
- summary: {
    totalInflow: number,
    totalOutflow: number,
    netCashFlow: number,
    averageDailyFlow: number
  }
- recommendations: array of strings (cash flow optimization suggestions)

Consider:
1. Payment terms vs actual payment patterns
2. Settlement payment schedules
3. Advance payment timing
4. Seasonal payment variations
5. Customer reliability`;

    const result = await this.callAI<CashFlowPredictionResult>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in cash flow prediction for trucking companies. Analyze payment patterns and return ONLY valid JSON with predictions.',
      }
    );

    return result.data;
  }
}

