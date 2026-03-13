import { AIService } from '../AIService';
import { Lead } from '@prisma/client';

interface OutreachConfig {
    tone: 'professional' | 'casual' | 'urgent';
    goal: string;
    maxChars?: number;
}

interface EmailResult {
    subject: string;
    body: string;
}

type LeadData = Pick<Lead, 'firstName' | 'lastName' | 'cdlClass' | 'yearsExperience' |
    'endorsements' | 'freightTypes' | 'state' | 'source' | 'status'>;

export class AIRecruitingOutreachService extends AIService {

    constructor() {
        super();
    }

    async generateSMS(lead: LeadData, config: OutreachConfig): Promise<string> {
        const systemPrompt = `You are a trucking company recruiter writing an SMS to a driver candidate.
Tone: ${config.tone}. Keep it concise — SMS should be under ${config.maxChars || 160} characters.
Do NOT include any JSON. Output ONLY the message text.`;

        const userPrompt = this.buildLeadContext(lead, config.goal);

        const result = await this.callAI<string>(userPrompt, {
            systemPrompt,
            temperature: 0.7,
            maxTokens: 150,
            jsonMode: false,
        });

        return typeof result.data === 'string'
            ? result.data.trim()
            : String(result.data);
    }

    async generateEmail(lead: LeadData, config: OutreachConfig): Promise<EmailResult> {
        const systemPrompt = `You are a trucking company recruiter writing an email to a driver candidate.
Tone: ${config.tone}. Be concise but warm. Return valid JSON only.`;

        const userPrompt = `${this.buildLeadContext(lead, config.goal)}

Output JSON format:
{
    "subject": "Email subject line",
    "body": "Full email body text"
}`;

        const result = await this.callAI<EmailResult>(userPrompt, {
            systemPrompt,
            temperature: 0.7,
            maxTokens: 500,
            jsonMode: true,
        });

        return result.data;
    }

    private buildLeadContext(lead: LeadData, goal: string): string {
        return `Goal: ${goal}

Candidate Info:
- Name: ${lead.firstName} ${lead.lastName}
- CDL Class: ${lead.cdlClass || 'Unknown'}
- Experience: ${lead.yearsExperience ?? 'Unknown'} years
- Endorsements: ${lead.endorsements?.join(', ') || 'None'}
- Freight Types: ${lead.freightTypes?.join(', ') || 'None'}
- State: ${lead.state || 'Unknown'}
- Source: ${lead.source || 'Unknown'}
- Current Status: ${lead.status}`;
    }
}
