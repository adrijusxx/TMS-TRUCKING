/**
 * LeadAssignmentManager
 *
 * Handles automatic lead assignment strategies:
 * - ROUND_ROBIN: rotate through active recruiters in order of lastAssignedAt
 * - WEIGHTED: assign proportionally based on recruiter weight (1-10 scale)
 * - LEAST_LOADED: assign to the recruiter with the fewest active leads
 */

import { prisma } from '@/lib/prisma';

export type AssignmentStrategy = 'ROUND_ROBIN' | 'WEIGHTED' | 'LEAST_LOADED';

interface RecruiterCandidate {
    userId: string;
    weight: number;
    lastAssignedAt: Date | null;
    activeLeadCount: number;
    maxCapacity: number;
}

export class LeadAssignmentManager {
    /**
     * Auto-assign a lead based on the company's assignment config.
     * Returns the assigned userId, or null if auto-assignment is disabled/unavailable.
     */
    async autoAssign(leadId: string, companyId: string, source?: string): Promise<string | null> {
        const config = await prisma.recruiterAssignmentConfig.findUnique({
            where: { companyId },
        });

        if (!config?.enabled) return null;

        // Filter by allowed sources if configured
        if (config.assignOnSources.length > 0 && source) {
            if (!config.assignOnSources.includes(source)) return null;
        }

        const recruiters = await this.getEligibleRecruiters(companyId);
        if (recruiters.length === 0) return null;

        const strategy = config.strategy as AssignmentStrategy;
        const selected = this.selectRecruiter(recruiters, strategy);
        if (!selected) return null;

        // Update lead assignment and recruiter lastAssignedAt atomically
        await Promise.all([
            prisma.lead.update({
                where: { id: leadId },
                data: { assignedToId: selected.userId },
            }),
            prisma.recruiterProfile.update({
                where: { userId: selected.userId },
                data: { lastAssignedAt: new Date() },
            }),
        ]);

        return selected.userId;
    }

    /**
     * Manually assign a specific lead to a specific recruiter.
     */
    async assignTo(leadId: string, recruiterId: string): Promise<void> {
        await Promise.all([
            prisma.lead.update({
                where: { id: leadId },
                data: { assignedToId: recruiterId },
            }),
            prisma.recruiterProfile.updateMany({
                where: { userId: recruiterId },
                data: { lastAssignedAt: new Date() },
            }),
        ]);
    }

    /**
     * Get all active recruiters for a company with their current load counts.
     */
    private async getEligibleRecruiters(companyId: string): Promise<RecruiterCandidate[]> {
        const profiles = await prisma.recruiterProfile.findMany({
            where: { companyId, isActive: true },
            select: {
                userId: true,
                weight: true,
                lastAssignedAt: true,
                maxCapacity: true,
            },
        });

        if (profiles.length === 0) return [];

        // Get active lead counts for each recruiter
        const userIds = profiles.map((p) => p.userId);
        const loadCounts = await prisma.lead.groupBy({
            by: ['assignedToId'],
            where: {
                assignedToId: { in: userIds },
                deletedAt: null,
                status: { notIn: ['HIRED', 'REJECTED'] },
            },
            _count: { id: true },
        });

        const countMap = new Map(loadCounts.map((c) => [c.assignedToId, c._count.id]));

        return profiles
            .map((p) => ({
                userId: p.userId,
                weight: p.weight,
                lastAssignedAt: p.lastAssignedAt,
                activeLeadCount: countMap.get(p.userId) ?? 0,
                maxCapacity: p.maxCapacity,
            }))
            .filter((p) => p.activeLeadCount < p.maxCapacity); // Exclude at-capacity recruiters
    }

    private selectRecruiter(
        candidates: RecruiterCandidate[],
        strategy: AssignmentStrategy
    ): RecruiterCandidate | null {
        if (candidates.length === 0) return null;

        switch (strategy) {
            case 'ROUND_ROBIN':
                return this.roundRobin(candidates);
            case 'WEIGHTED':
                return this.weighted(candidates);
            case 'LEAST_LOADED':
                return this.leastLoaded(candidates);
            default:
                return this.roundRobin(candidates);
        }
    }

    /** Assign to the recruiter who was assigned least recently */
    private roundRobin(candidates: RecruiterCandidate[]): RecruiterCandidate {
        return candidates.sort((a, b) => {
            if (!a.lastAssignedAt) return -1;
            if (!b.lastAssignedAt) return 1;
            return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
        })[0];
    }

    /** Assign proportionally by weight using weighted random selection */
    private weighted(candidates: RecruiterCandidate[]): RecruiterCandidate {
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        for (const candidate of candidates) {
            random -= candidate.weight;
            if (random <= 0) return candidate;
        }
        return candidates[candidates.length - 1];
    }

    /** Assign to the recruiter with the fewest active leads */
    private leastLoaded(candidates: RecruiterCandidate[]): RecruiterCandidate {
        return candidates.sort((a, b) => a.activeLeadCount - b.activeLeadCount)[0];
    }

    /**
     * Get the current assignment config for a company.
     */
    async getConfig(companyId: string) {
        return prisma.recruiterAssignmentConfig.findUnique({
            where: { companyId },
        });
    }

    /**
     * Upsert assignment config for a company.
     */
    async saveConfig(
        companyId: string,
        data: {
            enabled: boolean;
            strategy: AssignmentStrategy;
            assignOnSources: string[];
        }
    ) {
        return prisma.recruiterAssignmentConfig.upsert({
            where: { companyId },
            create: { companyId, ...data },
            update: data,
        });
    }

    /**
     * List all recruiter profiles for a company with user details.
     */
    async listRecruiters(companyId: string) {
        return prisma.recruiterProfile.findMany({
            where: { companyId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
                },
            },
            orderBy: { user: { firstName: 'asc' } },
        });
    }

    /**
     * Upsert a recruiter profile (create or update weight/capacity/active).
     */
    async upsertRecruiter(
        companyId: string,
        userId: string,
        data: { isActive?: boolean; weight?: number; maxCapacity?: number }
    ) {
        return prisma.recruiterProfile.upsert({
            where: { userId },
            create: { companyId, userId, ...data },
            update: data,
        });
    }

    /**
     * Remove a recruiter profile.
     */
    async removeRecruiter(userId: string) {
        return prisma.recruiterProfile.delete({ where: { userId } });
    }
}
