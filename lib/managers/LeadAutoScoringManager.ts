/**
 * Lead Auto-Scoring Manager
 *
 * Determines whether a lead should be automatically scored by AI
 * based on data completeness and status progression.
 */

import { prisma } from '@/lib/prisma';

const SCOREABLE_STATUSES = ['QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER'];
const CDL_DOCUMENT_TYPES = ['CDL_LICENSE', 'MEDICAL_CARD'];

export class LeadAutoScoringManager {
    /**
     * Check if a lead should be auto-scored after a status change
     */
    static async shouldScoreOnStatusChange(
        leadId: string,
        newStatus: string,
        previousStatus: string
    ): Promise<boolean> {
        // Only score when advancing to qualified+ stages
        if (!SCOREABLE_STATUSES.includes(newStatus)) return false;

        // Don't re-score if moving between qualified+ stages (already scored)
        if (SCOREABLE_STATUSES.includes(previousStatus)) return false;

        return this.leadHasMinimumData(leadId);
    }

    /**
     * Check if a lead should be auto-scored after a document upload
     */
    static async shouldScoreOnDocumentUpload(
        leadId: string,
        documentType: string
    ): Promise<boolean> {
        if (!CDL_DOCUMENT_TYPES.includes(documentType)) return false;
        return this.leadHasMinimumData(leadId);
    }

    /**
     * Check if the lead has enough data to make scoring meaningful
     */
    private static async leadHasMinimumData(leadId: string): Promise<boolean> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: {
                firstName: true,
                lastName: true,
                phone: true,
                cdlClass: true,
                yearsExperience: true,
                aiScore: true,
                aiScoreUpdatedAt: true,
            },
        });

        if (!lead) return false;

        // Require at minimum: name + phone + (CDL class OR experience)
        const hasBasicInfo = lead.firstName && lead.lastName && lead.phone;
        const hasCDLOrExperience = lead.cdlClass || (lead.yearsExperience && lead.yearsExperience > 0);

        if (!hasBasicInfo || !hasCDLOrExperience) return false;

        // Don't re-score if scored within the last 24 hours
        if (lead.aiScoreUpdatedAt) {
            const hoursSinceScore = (Date.now() - new Date(lead.aiScoreUpdatedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceScore < 24) return false;
        }

        return true;
    }
}
