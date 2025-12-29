import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { BreakdownStatus, BreakdownType } from '@prisma/client';
import { KnowledgeBaseService } from './KnowledgeBaseService';

/**
 * Breakdown Case Assistant
 * AI-powered service to find similar cases and suggest solutions
 */
export class BreakdownCaseAssistant {
    private openai: OpenAI;
    private companyId: string;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Find similar historical breakdown cases
     */
    async findSimilarCases(
        description: string,
        options?: {
            truckId?: string;
            breakdownType?: string;
            limit?: number;
        }
    ): Promise<SimilarCase[]> {
        const limit = options?.limit || 5;

        try {
            // Get all resolved breakdown cases
            const historicalCases = await prisma.breakdown.findMany({
                where: {
                    companyId: this.companyId,
                    status: { in: [BreakdownStatus.RESOLVED, BreakdownStatus.COMPLETED] },
                    ...(options?.truckId && { truckId: options.truckId }),
                    ...(options?.breakdownType && { breakdownType: options.breakdownType as BreakdownType }),
                },
                include: {
                    truck: true,
                    driver: {
                        include: { user: true },
                    },
                    payments: true,
                },
                orderBy: { updatedAt: 'desc' },
                take: 50, // Get recent cases for analysis
            });

            if (historicalCases.length === 0) {
                return [];
            }

            // Use AI to find semantically similar cases
            const prompt = `Given this breakdown description: "${description}"

Find the most similar cases from this list and rank them by similarity (1-10 score):

${historicalCases.map((c, i) => `${i + 1}. ${c.breakdownNumber}: ${c.problem} - ${c.description}`).join('\n')}

Return ONLY a JSON array of the top ${limit} most similar cases with this format:
[{"index": 1, "similarity": 9, "reason": "Both involve engine overheating"}]`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });

            const content = response.choices[0].message.content || '[]';
            const matches = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

            // Map matches to full case data
            const similarCases: SimilarCase[] = matches.map((match: any) => {
                const caseData = historicalCases[match.index - 1];
                const totalCost = caseData.payments.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
                const resolutionTime = caseData.updatedAt && caseData.reportedAt
                    ? Math.round((caseData.updatedAt.getTime() - caseData.reportedAt.getTime()) / (1000 * 60 * 60))
                    : null;

                return {
                    id: caseData.id,
                    breakdownNumber: caseData.breakdownNumber,
                    problem: caseData.problem,
                    description: caseData.description,
                    solution: caseData.resolution || 'No resolution details',
                    breakdownType: caseData.breakdownType,
                    priority: caseData.priority,
                    truckNumber: caseData.truck.truckNumber,
                    resolvedAt: caseData.updatedAt,
                    resolutionTimeHours: resolutionTime,
                    totalCost,
                    similarity: match.similarity,
                    reason: match.reason,
                };
            });

            return similarCases;
        } catch (error) {
            console.error('[BreakdownAssistant] Error finding similar cases:', error);
            return [];
        }
    }

    /**
     * Suggest solution based on problem description and similar cases
     */
    async suggestSolution(input: {
        description: string;
        problem?: string;
        truckId?: string;
        breakdownType?: string;
        faultCodes?: Array<{ code: string; description?: string; active?: boolean }>;
    }): Promise<SolutionSuggestion> {
        try {
            // Find similar cases first
            const similarCases = await this.findSimilarCases(input.description, {
                truckId: input.truckId,
                breakdownType: input.breakdownType,
                limit: 3,
            });

            // Find relevant documents from Knowledge Base
            const kbService = new KnowledgeBaseService(this.companyId);
            const kbDocs = await kbService.search(`${input.description} ${input.problem || ''} ${input.breakdownType || ''}`, 3);

            const kbContext = kbDocs.length > 0
                ? `Reference Documents:\n${kbDocs.map(d =>
                    `- [${d.documentTitle}]: ${d.content.substring(0, 200)}...`
                ).join('\n')}`
                : 'No relevant documents found.';

            // Build context from similar cases
            const context = similarCases.length > 0
                ? `Similar past cases:\n${similarCases.map(c =>
                    `- ${c.breakdownNumber}: ${c.problem}\n  Solution: ${c.solution}\n  Time: ${c.resolutionTimeHours}h, Cost: $${c.totalCost}`
                ).join('\n')}`
                : 'No similar cases found in history.';

            const faultCodesText = input.faultCodes && input.faultCodes.length > 0
                ? `Active Fault Codes:\n${input.faultCodes.map(f => `- ${f.code}: ${f.description}`).join('\n')}`
                : 'No active fault codes detected.';

            const prompt = `You are a truck maintenance expert. Analyze this breakdown and suggest a solution.

Problem: ${input.problem || 'Unknown'}
Description: ${input.description}
Breakdown Type: ${input.breakdownType || 'Unknown'}

${faultCodesText}

${kbContext}

${context}

Provide a detailed solution suggestion in JSON format:
{
  "rootCause": "Most likely cause",
  "recommendedSteps": ["Step 1", "Step 2", "Step 3"],
  "estimatedTimeHours": 4,
  "estimatedCost": 500,
  "requiredParts": ["Part 1", "Part 2"],
  "urgencyLevel": "HIGH|MEDIUM|LOW",
  "confidence": 0.85
}`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
            });

            const content = response.choices[0].message.content || '{}';
            const suggestion = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

            return {
                ...suggestion,
                similarCaseIds: similarCases.map(c => c.id),
            };
        } catch (error) {
            console.error('[BreakdownAssistant] Error suggesting solution:', error);
            throw error;
        }
    }

    /**
     * Enhance a raw description with more details
     */
    async enhanceDescription(rawDescription: string): Promise<string> {
        try {
            const prompt = `You are a truck maintenance expert. Enhance this breakdown description to be more detailed and professional:

"${rawDescription}"

Make it clear, specific, and include relevant technical details. Keep it concise (2-3 sentences).`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 150,
            });

            return response.choices[0].message.content?.trim() || rawDescription;
        } catch (error) {
            console.error('[BreakdownAssistant] Error enhancing description:', error);
            return rawDescription;
        }
    }

    /**
     * Extract breakdown type from description
     */
    async detectBreakdownType(description: string): Promise<string> {
        try {
            const prompt = `Classify this truck breakdown into one category:
MECHANICAL, ELECTRICAL, TIRE, ACCIDENT, FUEL_SYSTEM, COOLING_SYSTEM, BRAKE_SYSTEM, TRANSMISSION, OTHER

Description: "${description}"

Return ONLY the category name.`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 20,
            });

            return response.choices[0].message.content?.trim() || 'OTHER';
        } catch (error) {
            console.error('[BreakdownAssistant] Error detecting type:', error);
            return 'OTHER';
        }
    }
}

// Types
export interface SimilarCase {
    id: string;
    breakdownNumber: string;
    problem: string;
    description: string;
    solution: string;
    breakdownType: string;
    priority: string;
    truckNumber: string;
    resolvedAt: Date | null;
    resolutionTimeHours: number | null;
    totalCost: number;
    similarity: number;
    reason: string;
}

export interface SolutionSuggestion {
    rootCause: string;
    recommendedSteps: string[];
    estimatedTimeHours: number;
    estimatedCost: number;
    requiredParts: string[];
    urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    similarCaseIds: string[];
}
