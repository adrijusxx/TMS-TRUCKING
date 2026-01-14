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
     * OPTIMIZED: Runs KB search and similar cases in parallel, uses faster model
     */
    async suggestSolution(input: {
        description: string;
        problem?: string;
        truckId?: string;
        breakdownType?: string;
        faultCodes?: Array<{ code: string; description?: string; active?: boolean }>;
    }): Promise<SolutionSuggestion> {
        const startTime = Date.now();

        try {
            // Run KB search and similar cases IN PARALLEL for speed
            const searchQuery = `${input.description} ${input.problem || ''} ${input.breakdownType || ''}`.trim();

            const [similarCases, kbDocs] = await Promise.all([
                this.findSimilarCases(input.description, {
                    truckId: input.truckId,
                    breakdownType: input.breakdownType,
                    limit: 3,
                }).catch(err => {
                    console.warn('[BreakdownAssistant] Similar cases search failed:', err.message);
                    return [] as SimilarCase[];
                }),
                new KnowledgeBaseService(this.companyId).search(searchQuery, 3).catch(err => {
                    console.warn('[BreakdownAssistant] KB search failed:', err.message);
                    return [];
                }),
            ]);

            // DEBUG: Log what we found
            console.log(`[BreakdownAssistant] Search completed in ${Date.now() - startTime}ms`);
            console.log(`[BreakdownAssistant] Found ${kbDocs.length} KB documents, ${similarCases.length} similar cases`);
            if (kbDocs.length > 0) {
                console.log(`[BreakdownAssistant] KB docs: ${kbDocs.map(d => d.documentTitle).join(', ')}`);
            }

            const kbContext = kbDocs.length > 0
                ? `📚 KNOWLEDGE BASE DOCUMENTS (MUST USE FOR PRICING & TROUBLESHOOTING):\n${kbDocs.map(d =>
                    `Document: "${d.documentTitle}"\n${d.content.substring(0, 500)}`
                ).join('\n\n---\n\n')}`
                : '⚠️ No relevant documents found in knowledge base.';

            // Build context from similar cases
            const context = similarCases.length > 0
                ? `📋 SIMILAR PAST CASES:\n${similarCases.map(c =>
                    `- ${c.breakdownNumber}: ${c.problem}\n  Solution: ${c.solution}\n  Time: ${c.resolutionTimeHours}h, Cost: $${c.totalCost}`
                ).join('\n')}`
                : 'No similar cases found in history.';

            const faultCodesText = input.faultCodes && input.faultCodes.length > 0
                ? `🔧 ACTIVE FAULT CODES:\n${input.faultCodes.map(f => `- ${f.code}: ${f.description}`).join('\n')}`
                : 'No active fault codes detected.';

            const prompt = `You are a truck maintenance expert. Your PRIMARY source of information is the KNOWLEDGE BASE DOCUMENTS below.

CURRENT BREAKDOWN:
- Problem: ${input.problem || 'Unknown'}
- Description: ${input.description} (THIS IS THE PRIMARY SYMPTOM)
- Type: ${input.breakdownType || 'Unknown'}

${faultCodesText}

${kbContext}

${context}

CRITICAL INSTRUCTIONS:
1. **FOCUS ON DESCRIPTION**: The "Description" is what the driver is seeing. Solve THAT issue first.
2. **FAULT CODES**: Only use "ACTIVE FAULT CODES" if they explain the "Description".
   - If fault codes are unrelated (e.g. NOx sensor code during a tire blowout), ignore them for the Root Cause but mention them as "Secondary Issues".
3. **KNOWLEDGE BASE**: Use the troubleshooting steps and pricing from KB documents if they match the Description.
4. **ESTIMATES**: Estimated costs MUST match the pricing in the KB documents, not generic estimates.
5. **STEPS**: If the KB has repair procedures, include those exact steps.

Provide your response in this exact JSON format:
{
  "rootCause": "Primary cause based on Description (explain if fault codes are related or coincidental)...",
  "recommendedSteps": ["Step 1 from KB...", "Step 2..."],
  "estimatedTimeHours": 4,
  "estimatedCost": 500,
  "requiredParts": ["Part mentioned in KB..."],
  "urgencyLevel": "HIGH|MEDIUM|LOW",
  "confidence": 0.85,
  "sourceDocuments": ["Document title from KB that was used"]
}`;

            // Use gpt-4o-mini for faster responses (still high quality)
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });

            const content = response.choices[0].message.content || '{}';
            const suggestion = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

            console.log(`[BreakdownAssistant] Total suggestion time: ${Date.now() - startTime}ms`);

            return {
                ...suggestion,
                similarCaseIds: similarCases.map(c => c.id),
                kbDocumentsUsed: kbDocs.length,
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
    kbDocumentsUsed?: number;
    sourceDocuments?: string[];
}
