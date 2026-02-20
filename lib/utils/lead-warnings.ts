/**
 * Pure utility for computing warning states on CRM leads.
 * Used by both the leads table (LeadWarningCell) and the sidebar (LeadOverviewTab).
 */

export type WarningType =
    | 'OVERDUE_FOLLOWUP'
    | 'UPCOMING_FOLLOWUP'
    | 'SLA_VIOLATION'
    | 'NO_CONTACT'
    | 'STALE_LEAD';

export type WarningSeverity = 'critical' | 'warning' | 'info';

export interface LeadWarning {
    type: WarningType;
    severity: WarningSeverity;
    message: string;
    detail?: string;
}

export interface SLAConfig {
    status: string;
    maxDays: number;
    enabled: boolean;
}

interface LeadWarningInput {
    status: string;
    nextFollowUpDate: string | null;
    nextFollowUpNote?: string | null;
    lastContactedAt: string | null;
    lastCallAt: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    updatedAt: string;
}

const TERMINAL_STATUSES = ['HIRED', 'REJECTED'];
const NO_CONTACT_DAYS = 3;
const STALE_NEW_HOURS = 48;

/** Compute all warnings for a lead, sorted by severity (critical first). */
export function computeLeadWarnings(
    lead: LeadWarningInput,
    slaConfigs?: SLAConfig[]
): LeadWarning[] {
    const warnings: LeadWarning[] = [];
    const now = new Date();

    // Skip all warnings for terminal statuses
    if (TERMINAL_STATUSES.includes(lead.status)) return warnings;

    // 1. Overdue follow-up (critical)
    if (lead.nextFollowUpDate) {
        const followUp = new Date(lead.nextFollowUpDate);
        if (followUp < now) {
            const hoursOverdue = Math.round((now.getTime() - followUp.getTime()) / (1000 * 60 * 60));
            warnings.push({
                type: 'OVERDUE_FOLLOWUP',
                severity: 'critical',
                message: 'Follow-up overdue',
                detail: hoursOverdue >= 24
                    ? `${Math.floor(hoursOverdue / 24)}d overdue`
                    : `${hoursOverdue}h overdue`,
            });
        } else {
            // 2. Upcoming follow-up within 24h (info)
            const hoursUntil = (followUp.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntil <= 24) {
                warnings.push({
                    type: 'UPCOMING_FOLLOWUP',
                    severity: 'info',
                    message: 'Follow-up soon',
                    detail: hoursUntil < 1
                        ? `in ${Math.round(hoursUntil * 60)} min`
                        : `in ${Math.round(hoursUntil)}h`,
                });
            }
        }
    }

    // 3. SLA violation
    if (slaConfigs?.length) {
        const result = checkSLAViolation(lead.status, lead.updatedAt, slaConfigs);
        if (result?.violated) {
            warnings.push({
                type: 'SLA_VIOLATION',
                severity: result.daysInStatus > result.maxDays * 1.5 ? 'critical' : 'warning',
                message: `SLA: ${result.daysInStatus}d in ${formatStatus(lead.status)}`,
                detail: `Max ${result.maxDays} days allowed`,
            });
        }
    }

    // 4. No contact warning
    const daysSince = daysSinceLastContact(lead);
    if (daysSince !== null && daysSince >= NO_CONTACT_DAYS) {
        warnings.push({
            type: 'NO_CONTACT',
            severity: 'warning',
            message: `No contact ${daysSince}d`,
            detail: lead.lastContactedAt ? 'Since last contact' : 'Never contacted',
        });
    }

    // 5. Stale NEW lead (>48h with no activity)
    if (lead.status === 'NEW') {
        const hoursOld = (now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursOld >= STALE_NEW_HOURS && !lead.lastContactedAt) {
            warnings.push({
                type: 'STALE_LEAD',
                severity: 'warning',
                message: 'Stale lead',
                detail: `New for ${Math.floor(hoursOld / 24)}d, never contacted`,
            });
        }
    }

    // Sort: critical first, then warning, then info
    const order: Record<WarningSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return warnings.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Get the most severe warning level from a list. */
export function getMostSevereWarning(warnings: LeadWarning[]): WarningSeverity | null {
    if (warnings.length === 0) return null;
    if (warnings.some(w => w.severity === 'critical')) return 'critical';
    if (warnings.some(w => w.severity === 'warning')) return 'warning';
    return 'info';
}

/** Days since last contact, or days since creation if never contacted. Returns null for terminal statuses. */
export function daysSinceLastContact(
    lead: Pick<LeadWarningInput, 'lastContactedAt' | 'createdAt' | 'status'>
): number | null {
    if (TERMINAL_STATUSES.includes(lead.status)) return null;

    const ref = lead.lastContactedAt
        ? new Date(lead.lastContactedAt)
        : new Date(lead.createdAt);

    return Math.floor((Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

/** Check if a lead's current status violates SLA. Uses updatedAt as proxy for status entry time. */
export function checkSLAViolation(
    status: string,
    statusEnteredAt: string,
    slaConfigs: SLAConfig[]
): { violated: boolean; daysInStatus: number; maxDays: number } | null {
    const config = slaConfigs.find(c => c.status === status && c.enabled);
    if (!config) return null;

    const daysInStatus = Math.floor(
        (Date.now() - new Date(statusEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
        violated: daysInStatus > config.maxDays,
        daysInStatus,
        maxDays: config.maxDays,
    };
}

function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase();
}
