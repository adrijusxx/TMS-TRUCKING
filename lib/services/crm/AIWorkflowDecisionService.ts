import { AIService } from '../AIService';
import { Lead } from '@prisma/client';

export interface BranchCondition {
    condition: 'ai_score_gte' | 'ai_score_lte' | 'ai_recommendation' | 'tag_exists';
    value: string | number;
}

export interface BranchDecision {
    branch: 'yes' | 'no';
    reason: string;
}

type LeadData = Pick<Lead, 'aiScore' | 'aiScoreSummary' | 'tags' | 'firstName' | 'lastName'>;

export class AIWorkflowDecisionService extends AIService {

    constructor() {
        super();
    }

    async evaluateBranch(lead: LeadData, condition: BranchCondition): Promise<BranchDecision> {
        switch (condition.condition) {
            case 'ai_score_gte':
                return {
                    branch: (lead.aiScore ?? 0) >= Number(condition.value) ? 'yes' : 'no',
                    reason: `AI score ${lead.aiScore ?? 0} ${(lead.aiScore ?? 0) >= Number(condition.value) ? '>=' : '<'} ${condition.value}`,
                };

            case 'ai_score_lte':
                return {
                    branch: (lead.aiScore ?? 0) <= Number(condition.value) ? 'yes' : 'no',
                    reason: `AI score ${lead.aiScore ?? 0} ${(lead.aiScore ?? 0) <= Number(condition.value) ? '<=' : '>'} ${condition.value}`,
                };

            case 'ai_recommendation': {
                const summary = (lead.aiScoreSummary || '').toUpperCase();
                const target = String(condition.value).toUpperCase();
                const matches = summary.includes(target);
                return {
                    branch: matches ? 'yes' : 'no',
                    reason: `AI recommendation ${matches ? 'matches' : 'does not match'} "${condition.value}"`,
                };
            }

            case 'tag_exists': {
                const tags = lead.tags || [];
                const hasTag = tags.includes(String(condition.value));
                return {
                    branch: hasTag ? 'yes' : 'no',
                    reason: `Tag "${condition.value}" ${hasTag ? 'found' : 'not found'} on lead`,
                };
            }

            default:
                return { branch: 'no', reason: `Unknown condition: ${condition.condition}` };
        }
    }
}
