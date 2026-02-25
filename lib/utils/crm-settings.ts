import { prisma } from '@/lib/prisma';

export interface CrmGeneralSettings {
    recruiterSeeOnlyOwnLeads?: boolean;
    defaultLeadStatus?: string;
    defaultLeadPriority?: string;
    defaultTags?: string[];
    duplicateDetection?: {
        enabled?: boolean;
        matchFields?: string[];
    };
    autoArchival?: {
        enabled?: boolean;
        archiveAfterDays?: number;
        archiveStatuses?: string[];
    };
    followUpReminders?: {
        enabled?: boolean;
        reminderHoursBefore?: number;
    };
}

export async function getCrmGeneralSettings(companyId: string): Promise<CrmGeneralSettings> {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
        select: { generalSettings: true },
    });

    const generalSettings = (settings?.generalSettings as any) || {};
    return (generalSettings.crm || {}) as CrmGeneralSettings;
}
