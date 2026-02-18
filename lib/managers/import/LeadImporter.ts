import { PrismaClient } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { parseImportDate, parseTags, parseImportNumber } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

const STATUS_MAP: Record<string, string> = {
    new: 'NEW', contacted: 'CONTACTED', qualified: 'QUALIFIED',
    'docs pending': 'DOCUMENTS_PENDING', 'documents pending': 'DOCUMENTS_PENDING', documents_pending: 'DOCUMENTS_PENDING',
    'docs collected': 'DOCUMENTS_COLLECTED', 'documents collected': 'DOCUMENTS_COLLECTED', documents_collected: 'DOCUMENTS_COLLECTED',
    interview: 'INTERVIEW', offer: 'OFFER', hired: 'HIRED', rejected: 'REJECTED',
};

const PRIORITY_MAP: Record<string, string> = {
    hot: 'HOT', high: 'HOT', warm: 'WARM', medium: 'WARM', cold: 'COLD', low: 'COLD',
};

const SOURCE_MAP: Record<string, string> = {
    facebook: 'FACEBOOK', fb: 'FACEBOOK', 'facebook ads': 'FACEBOOK', instagram: 'FACEBOOK',
    referral: 'REFERRAL', 'word of mouth': 'REFERRAL', referred: 'REFERRAL',
    direct: 'DIRECT', 'walk-in': 'DIRECT', 'walk in': 'DIRECT', phone: 'DIRECT',
    website: 'WEBSITE', web: 'WEBSITE', online: 'WEBSITE',
    other: 'OTHER',
};

const CDL_CLASS_MAP: Record<string, string> = {
    a: 'A', 'class a': 'A', 'cdl a': 'A', b: 'B', 'class b': 'B', 'cdl b': 'B',
    c: 'C', 'class c': 'C', 'cdl c': 'C',
};

export class LeadImporter extends BaseImporter {
    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        super(prisma, companyId, userId);
    }

    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
    }): Promise<ImportResult> {
        const errors: ImportResult['errors'] = [];
        const warnings: ImportResult['warnings'] = [];
        const mapping = options.columnMapping;

        // Pre-fetch existing leads for dedup (phone + email)
        const existingLeads = await this.prisma.lead.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true, phone: true, email: true, leadNumber: true },
        });
        const existingPhones = new Set(existingLeads.map(l => l.phone?.replace(/\D/g, '')).filter(Boolean));
        const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()).filter(Boolean));

        // Get next lead number
        const lastLead = await this.prisma.lead.findFirst({
            where: { companyId: this.companyId },
            orderBy: { createdAt: 'desc' },
            select: { leadNumber: true },
        });
        let nextNum = 1;
        if (lastLead?.leadNumber) {
            const match = lastLead.leadNumber.match(/CRM-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }

        // Resolve MC number
        const mcNumberId = await this.resolveMcNumberId(options.currentMcNumber || null);

        const toCreate: any[] = [];
        const toUpdate: Array<{ id: string; data: any }> = [];
        const seenPhones = new Set<string>();
        let skipped = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // 1-indexed + header row

            const firstName = this.val(row, 'firstName', mapping, ['First Name', 'first_name', 'FirstName', 'First', 'first', 'FName'])?.trim();
            const lastName = this.val(row, 'lastName', mapping, ['Last Name', 'last_name', 'LastName', 'Last', 'last', 'LName'])?.trim();
            const phone = this.val(row, 'phone', mapping, ['Phone', 'phone', 'Phone Number', 'phone_number', 'Mobile', 'Cell', 'Contact', 'contact_number'])?.trim();
            const email = this.val(row, 'email', mapping, ['Email', 'email', 'Email Address', 'email_address', 'E-mail'])?.trim()?.toLowerCase();

            // Validate required fields
            if (!firstName && !lastName) {
                errors.push(this.error(rowNum, 'First name or last name is required'));
                continue;
            }
            if (!phone && !email) {
                errors.push(this.error(rowNum, 'Phone or email is required for dedup'));
                continue;
            }

            // Dedup: check file duplicates
            const normalizedPhone = phone?.replace(/\D/g, '') || '';
            if (normalizedPhone && seenPhones.has(normalizedPhone)) {
                warnings.push(this.warning(rowNum, `Duplicate phone ${phone} in file, skipping`));
                skipped++;
                continue;
            }
            if (normalizedPhone) seenPhones.add(normalizedPhone);

            // Dedup: check database duplicates
            const isPhoneDupe = normalizedPhone && existingPhones.has(normalizedPhone);
            const isEmailDupe = email && existingEmails.has(email);
            if (isPhoneDupe || isEmailDupe) {
                if (options.updateExisting) {
                    const existing = existingLeads.find(l =>
                        (normalizedPhone && l.phone?.replace(/\D/g, '') === normalizedPhone) ||
                        (email && l.email?.toLowerCase() === email)
                    );
                    if (existing) {
                        const updateData = this.buildLeadData(row, mapping, rowNum, warnings);
                        toUpdate.push({ id: existing.id, data: updateData });
                        continue;
                    }
                }
                warnings.push(this.warning(rowNum, `Lead with ${isPhoneDupe ? 'phone ' + phone : 'email ' + email} already exists, skipping`));
                skipped++;
                continue;
            }

            const leadData = this.buildLeadData(row, mapping, rowNum, warnings);
            const leadNumber = `CRM-${String(nextNum++).padStart(3, '0')}`;

            toCreate.push({
                ...leadData,
                leadNumber,
                firstName: firstName || '',
                lastName: lastName || '',
                phone: phone || '',
                email: email || null,
                companyId: this.companyId,
                mcNumberId,
                createdById: this.userId,
                importBatchId: options.importBatchId || undefined,
            });
        }

        // Preview mode
        if (options.previewOnly) {
            return {
                success: true,
                preview: toCreate.slice(0, 10),
                errors,
                warnings,
                summary: {
                    total: data.length,
                    created: toCreate.length,
                    updated: toUpdate.length,
                    skipped,
                    errors: errors.length,
                },
            };
        }

        // Batch create
        let createdCount = 0;
        for (let i = 0; i < toCreate.length; i += this.BATCH_SIZE) {
            const batch = toCreate.slice(i, i + this.BATCH_SIZE);
            try {
                const result = await this.prisma.lead.createMany({ data: batch, skipDuplicates: true });
                createdCount += result.count;
            } catch (err: any) {
                // Fallback to individual creates
                for (const item of batch) {
                    try {
                        await this.prisma.lead.create({ data: item });
                        createdCount++;
                    } catch (innerErr: any) {
                        errors.push(this.error(0, `Failed to create lead ${item.leadNumber}: ${innerErr.message}`));
                    }
                }
            }
        }

        // Process updates
        let updatedCount = 0;
        for (const { id, data: updateData } of toUpdate) {
            try {
                await this.prisma.lead.update({ where: { id }, data: updateData });
                updatedCount++;
            } catch (err: any) {
                errors.push(this.error(0, `Failed to update lead ${id}: ${err.message}`));
            }
        }

        return this.success(
            { total: data.length, created: createdCount, updated: updatedCount, skipped, errors: errors.length },
            toCreate,
            errors,
            warnings,
        );
    }

    private buildLeadData(row: any, mapping: Record<string, string> | undefined, rowNum: number, warnings: ImportResult['warnings']): Record<string, any> {
        const data: Record<string, any> = {};

        // Address fields
        const address = this.val(row, 'address', mapping, ['Address', 'address', 'Street', 'street']);
        const city = this.val(row, 'city', mapping, ['City', 'city']);
        const stateRaw = this.val(row, 'state', mapping, ['State', 'state']);
        const zip = this.val(row, 'zip', mapping, ['ZIP', 'zip', 'Zip Code', 'zip_code', 'Postal Code']);
        if (address) data.address = address.trim();
        if (city) data.city = city.trim();
        if (stateRaw) data.state = normalizeState(stateRaw.trim()) || stateRaw.trim();
        if (zip) data.zip = zip.trim();

        // CDL fields
        const cdlNumber = this.val(row, 'cdlNumber', mapping, ['CDL Number', 'cdl_number', 'CDL', 'License Number', 'DL Number']);
        const cdlClassRaw = this.val(row, 'cdlClass', mapping, ['CDL Class', 'cdl_class', 'Class', 'License Class']);
        const cdlExpRaw = this.val(row, 'cdlExpiration', mapping, ['CDL Expiration', 'cdl_expiration', 'CDL Exp', 'License Expiry']);
        const endorsementsRaw = this.val(row, 'endorsements', mapping, ['Endorsements', 'endorsements', 'CDL Endorsements']);

        if (cdlNumber) data.cdlNumber = cdlNumber.trim();
        if (cdlClassRaw) {
            const normalized = CDL_CLASS_MAP[cdlClassRaw.trim().toLowerCase()];
            data.cdlClass = normalized || cdlClassRaw.trim().toUpperCase();
        }
        if (cdlExpRaw) {
            const parsed = parseImportDate(cdlExpRaw);
            if (parsed) data.cdlExpiration = parsed;
            else warnings.push(this.warning(rowNum, `Invalid CDL expiration date: ${cdlExpRaw}`, 'cdlExpiration'));
        }
        if (endorsementsRaw) {
            data.endorsements = this.parseEndorsements(endorsementsRaw);
        }

        // Experience
        const yearsExpRaw = this.val(row, 'yearsExperience', mapping, ['Years Experience', 'years_experience', 'Experience', 'Yrs Exp', 'Years']);
        if (yearsExpRaw) {
            const num = parseImportNumber(yearsExpRaw);
            if (num !== null) data.yearsExperience = Math.round(num);
        }

        const prevEmployers = this.val(row, 'previousEmployers', mapping, ['Previous Employers', 'previous_employers', 'Past Employers', 'Employers']);
        if (prevEmployers) data.previousEmployers = prevEmployers.trim();

        const freightTypesRaw = this.val(row, 'freightTypes', mapping, ['Freight Types', 'freight_types', 'Equipment', 'Freight']);
        if (freightTypesRaw) {
            data.freightTypes = parseTags(freightTypesRaw) || [];
        }

        // DOB
        const dobRaw = this.val(row, 'dateOfBirth', mapping, ['Date of Birth', 'date_of_birth', 'DOB', 'dob', 'Birthday']);
        if (dobRaw) {
            const parsed = parseImportDate(dobRaw);
            if (parsed) data.dateOfBirth = parsed;
        }

        // Status, priority, source
        const statusRaw = this.val(row, 'status', mapping, ['Status', 'status', 'Lead Status', 'lead_status']);
        if (statusRaw) {
            const normalized = STATUS_MAP[statusRaw.trim().toLowerCase()];
            if (normalized) data.status = normalized;
            else warnings.push(this.warning(rowNum, `Unknown status "${statusRaw}", defaulting to NEW`, 'status'));
        }

        const priorityRaw = this.val(row, 'priority', mapping, ['Priority', 'priority', 'Lead Priority', 'lead_priority']);
        if (priorityRaw) {
            const normalized = PRIORITY_MAP[priorityRaw.trim().toLowerCase()];
            if (normalized) data.priority = normalized;
            else warnings.push(this.warning(rowNum, `Unknown priority "${priorityRaw}", defaulting to WARM`, 'priority'));
        }

        const sourceRaw = this.val(row, 'source', mapping, ['Source', 'source', 'Lead Source', 'lead_source', 'Channel']);
        if (sourceRaw) {
            const normalized = SOURCE_MAP[sourceRaw.trim().toLowerCase()];
            if (normalized) data.source = normalized;
            else warnings.push(this.warning(rowNum, `Unknown source "${sourceRaw}", defaulting to OTHER`, 'source'));
        }

        // Tags
        const tagsRaw = this.val(row, 'tags', mapping, ['Tags', 'tags', 'Labels']);
        if (tagsRaw) {
            data.tags = parseTags(tagsRaw) || [];
        }

        return data;
    }

    private parseEndorsements(value: any): string[] {
        if (!value) return [];
        const str = String(value).trim().toUpperCase();
        // Handle comma-separated: "H, N, T"
        if (str.includes(',')) return str.split(',').map(e => e.trim()).filter(Boolean);
        // Handle space-separated: "H N T"
        if (str.includes(' ')) return str.split(/\s+/).filter(Boolean);
        // Handle concatenated: "HNT" → ["H", "N", "T"]
        return str.split('').filter(c => /[HNTPSX]/.test(c));
    }

    /** Shorthand for this.getValue */
    private val(row: any, field: string, mapping: Record<string, string> | undefined, synonyms: string[]): any {
        return this.getValue(row, field, mapping, synonyms);
    }
}
