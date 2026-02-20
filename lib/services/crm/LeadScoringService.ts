import { AIService, AICallResult } from '../AIService';
import { prisma } from '@/lib/prisma';
import { Lead, LeadNote, LeadActivity } from '@prisma/client';

export interface LeadScoreResult {
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
    recommendedAction: 'HIRE' | 'INTERVIEW' | 'HOLD' | 'REJECT';
}

type LeadWithDetails = Lead & {
    notes: LeadNote[];
    activities: LeadActivity[];
};

export class LeadScoringService extends AIService {

    constructor() {
        super();
    }

    /**
     * Calculate AI Score for a lead
     */
    async scoreLead(leadId: string): Promise<LeadScoreResult | null> {
        try {
            // Fetch full lead details
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                include: {
                    notes: { orderBy: { createdAt: 'desc' }, take: 5 },
                    activities: {
                        where: { type: 'STATUS_CHANGE' },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            });

            if (!lead) throw new Error('Lead not found');

            const score = await this.analyzeLead(lead);

            // Update lead with score
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    aiScore: score.score,
                    aiScoreSummary: score.summary,
                    aiScoreUpdatedAt: new Date()
                }
            });

            return score;

        } catch (error) {
            console.error('[LeadScoringService] Error scoring lead:', error);
            throw error;
        }
    }

    /**
     * Generate a short card-friendly summary from lead data + metadata.
     * Distinct from aiScoreSummary (which is hiring-recommendation focused).
     */
    async generateSummary(leadId: string): Promise<string> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                notes: { orderBy: { createdAt: 'desc' }, take: 3 },
            },
        });

        if (!lead) throw new Error('Lead not found');

        const metadataStr = lead.metadata
            ? Object.entries(lead.metadata as Record<string, unknown>)
                .slice(0, 10)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')
            : 'None';

        const userPrompt = `Summarize this driver candidate in 1-2 short sentences for a recruiter's quick glance:

Name: ${lead.firstName} ${lead.lastName}
Experience: ${lead.yearsExperience ?? 'Unknown'} years
CDL Class: ${lead.cdlClass || 'Unknown'}
Endorsements: ${lead.endorsements.join(', ') || 'None'}
Freight Types: ${lead.freightTypes.join(', ') || 'None'}
State: ${lead.state || 'Unknown'}
Source: ${lead.source || 'Unknown'}
Import Metadata: ${metadataStr}
Recent Notes: ${lead.notes.map(n => n.content).join(' | ') || 'None'}

Output a plain text 1-2 sentence brief. No JSON, no formatting.`;

        const result = await this.callAI<string>(userPrompt, {
            systemPrompt: 'You produce concise, factual summaries of trucking driver candidates. Output only the summary text.',
            temperature: 0.3,
            maxTokens: 100,
        });

        const summary = typeof result.data === 'string' ? result.data : String(result.data);

        await prisma.lead.update({
            where: { id: leadId },
            data: { aiSummary: summary },
        });

        return summary;
    }

    private async analyzeLead(lead: LeadWithDetails): Promise<LeadScoreResult> {
        const systemPrompt = `You are an expert Trucking Recruiter AI. 
        Your goal is to evaluate driver candidates associated with a Motor Carrier.
        High scores (80-100) are for experienced drivers with clean records, relevant CDL experience, and stability.
        Low scores (<50) are for inexperienced drivers, job hoppers, or those with missing critical info.
        
        Return valid JSON only.`;

        const userPrompt = `Evaluate this driver candidate:

        Name: ${lead.firstName} ${lead.lastName}
        Experience: ${lead.yearsExperience || 'Unknown'} years
        CDL Class: ${lead.cdlClass || 'Unknown'}
        Endorsements: ${lead.endorsements.join(', ') || 'None'}
        Freight Types: ${lead.freightTypes.join(', ') || 'None'}
        State: ${lead.state || 'Unknown'}
        
        Recent Notes:
        ${lead.notes.map(n => `- ${n.content}`).join('\n')}
        
        Output JSON format:
        {
            "score": number (0-100),
            "summary": "Short 2 sentence summary",
            "pros": ["pro1", "pro2"],
            "cons": ["con1", "con2"],
            "recommendedAction": "HIRE" | "INTERVIEW" | "HOLD" | "REJECT"
        }`;

        const result = await this.callAI<LeadScoreResult>(userPrompt, {
            systemPrompt,
            temperature: 0.2,
            jsonMode: true
        });

        return result.data;
    }
}
