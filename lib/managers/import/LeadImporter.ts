import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { LEAD_STATUS_MAP, LEAD_PRIORITY_MAP, LEAD_SOURCE_MAP, CDL_CLASS_MAP } from './utils/enum-maps';
import { parseImportDate, parseTags, parseImportNumber } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class LeadImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.lead; }
    protected useCreateMany() { return true; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const existingLeads = await this.prisma.lead.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true, phone: true, email: true, leadNumber: true },
        });

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

        const mcNumberId = await this.resolveMcNumberId(_ctx.options.currentMcNumber || null);

        return {
            existingLeads,
            existingPhones: new Set(existingLeads.map(l => l.phone?.replace(/\D/g, '')).filter(Boolean)),
            existingEmails: new Set(existingLeads.map(l => l.email?.toLowerCase()).filter(Boolean)),
            nextNum,
            mcNumberId,
            seenPhones: new Set<string>(),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, importBatchId, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { existingLeads, existingPhones, existingEmails, seenPhones, mcNumberId } = ctx.lookups;
        const mapping = columnMapping;
        const warnings: RowProcessResult['warnings'] = [];

        const csvRowNum = rowNum + 1; // 1-indexed + header row (matching original behavior)

        const firstName = this.getValue(row, 'firstName', mapping, ['First Name', 'first_name', 'FirstName', 'First', 'first', 'FName'])?.trim();
        const lastName = this.getValue(row, 'lastName', mapping, ['Last Name', 'last_name', 'LastName', 'Last', 'last', 'LName'])?.trim();
        const phone = this.getValue(row, 'phone', mapping, ['Phone', 'phone', 'Phone Number', 'phone_number', 'Mobile', 'Cell', 'Contact', 'contact_number'])?.trim();
        const email = this.getValue(row, 'email', mapping, ['Email', 'email', 'Email Address', 'email_address', 'E-mail'])?.trim()?.toLowerCase();

        if (!firstName && !lastName) {
            return { action: 'skip', error: this.error(csvRowNum, 'First name or last name is required') };
        }
        if (!phone && !email) {
            return { action: 'skip', error: this.error(csvRowNum, 'Phone or email is required for dedup') };
        }

        // File dedup (phone)
        const normalizedPhone = phone?.replace(/\D/g, '') || '';
        if (normalizedPhone && seenPhones.has(normalizedPhone)) {
            return { action: 'skip', error: this.warning(csvRowNum, `Duplicate phone ${phone} in file, skipping`), warnings };
        }
        if (normalizedPhone) seenPhones.add(normalizedPhone);

        // DB dedup
        const isPhoneDupe = normalizedPhone && existingPhones.has(normalizedPhone);
        const isEmailDupe = email && existingEmails.has(email);
        if (isPhoneDupe || isEmailDupe) {
            if (updateExisting) {
                const existing = existingLeads.find((l: any) =>
                    (normalizedPhone && l.phone?.replace(/\D/g, '') === normalizedPhone) ||
                    (email && l.email?.toLowerCase() === email)
                );
                if (existing) {
                    const updateData = this.buildLeadData(row, mapping, csvRowNum, warnings, dateHint);
                    return { action: 'update', data: { id: existing.id, ...updateData }, warnings };
                }
            }
            return {
                action: 'skip',
                error: this.warning(csvRowNum, `Lead with ${isPhoneDupe ? 'phone ' + phone : 'email ' + email} already exists, skipping`),
                warnings,
            };
        }

        const leadData = this.buildLeadData(row, mapping, csvRowNum, warnings, dateHint);
        const leadNumber = `CRM-${String(ctx.lookups.nextNum++).padStart(3, '0')}`;

        return {
            action: 'create',
            data: {
                ...leadData,
                leadNumber,
                firstName: firstName || '',
                lastName: lastName || '',
                phone: phone || '',
                email: email || null,
                companyId: this.companyId,
                mcNumberId,
                createdById: this.userId,
                importBatchId: importBatchId || undefined,
            },
            warnings,
        };
    }

    /**
     * Leads update by ID (from existing lead lookup).
     */
    protected async batchUpdate(items: any[], ctx: ImportContext): Promise<number> {
        let updatedCount = 0;
        for (const item of items) {
            const { id, ...updateData } = item;
            try {
                await this.prisma.lead.update({ where: { id }, data: updateData });
                updatedCount++;
            } catch (err: any) {
                ctx.errors.push(this.error(0, `Failed to update lead ${id}: ${err.message}`));
            }
        }
        return updatedCount;
    }

    private buildLeadData(
        row: any,
        mapping: Record<string, string> | undefined,
        rowNum: number,
        warnings: NonNullable<RowProcessResult['warnings']>,
        dateHint?: Parameters<typeof parseImportDate>[1]
    ): Record<string, any> {
        const data: Record<string, any> = {};

        // Address fields
        const address = this.getValue(row, 'address', mapping, ['Address', 'address', 'Street', 'street']);
        const city = this.getValue(row, 'city', mapping, ['City', 'city']);
        const stateRaw = this.getValue(row, 'state', mapping, ['State', 'state']);
        const zip = this.getValue(row, 'zip', mapping, ['ZIP', 'zip', 'Zip Code', 'zip_code', 'Postal Code']);
        if (address) data.address = address.trim();
        if (city) data.city = city.trim();
        if (stateRaw) data.state = normalizeState(stateRaw.trim()) || stateRaw.trim();
        if (zip) data.zip = zip.trim();

        // CDL fields
        const cdlNumber = this.getValue(row, 'cdlNumber', mapping, ['CDL Number', 'cdl_number', 'CDL', 'License Number', 'DL Number']);
        const cdlClassRaw = this.getValue(row, 'cdlClass', mapping, ['CDL Class', 'cdl_class', 'Class', 'License Class']);
        const cdlExpRaw = this.getValue(row, 'cdlExpiration', mapping, ['CDL Expiration', 'cdl_expiration', 'CDL Exp', 'License Expiry']);
        const endorsementsRaw = this.getValue(row, 'endorsements', mapping, ['Endorsements', 'endorsements', 'CDL Endorsements']);

        if (cdlNumber) data.cdlNumber = cdlNumber.trim();
        if (cdlClassRaw) {
            const normalized = CDL_CLASS_MAP[cdlClassRaw.trim().toLowerCase()];
            data.cdlClass = normalized || cdlClassRaw.trim().toUpperCase();
        }
        if (cdlExpRaw) {
            const parsed = parseImportDate(cdlExpRaw, dateHint);
            if (parsed) data.cdlExpiration = parsed;
            else warnings.push(this.warning(rowNum, `Invalid CDL expiration date: ${cdlExpRaw}`, 'cdlExpiration'));
        }
        if (endorsementsRaw) {
            data.endorsements = this.parseEndorsements(endorsementsRaw);
        }

        // Experience
        const yearsExpRaw = this.getValue(row, 'yearsExperience', mapping, ['Years Experience', 'years_experience', 'Experience', 'Yrs Exp', 'Years']);
        if (yearsExpRaw) {
            const num = parseImportNumber(yearsExpRaw);
            if (num !== null) data.yearsExperience = Math.round(num);
        }

        const prevEmployers = this.getValue(row, 'previousEmployers', mapping, ['Previous Employers', 'previous_employers', 'Past Employers', 'Employers']);
        if (prevEmployers) data.previousEmployers = prevEmployers.trim();

        const freightTypesRaw = this.getValue(row, 'freightTypes', mapping, ['Freight Types', 'freight_types', 'Equipment', 'Freight']);
        if (freightTypesRaw) data.freightTypes = parseTags(freightTypesRaw) || [];

        // DOB
        const dobRaw = this.getValue(row, 'dateOfBirth', mapping, ['Date of Birth', 'date_of_birth', 'DOB', 'dob', 'Birthday']);
        if (dobRaw) {
            const parsed = parseImportDate(dobRaw, dateHint);
            if (parsed) data.dateOfBirth = parsed;
        }

        // Status, priority, source
        const statusRaw = this.getValue(row, 'status', mapping, ['Status', 'status', 'Lead Status', 'lead_status']);
        if (statusRaw) {
            const normalized = LEAD_STATUS_MAP[statusRaw.trim().toLowerCase()];
            if (normalized) data.status = normalized;
            else warnings.push(this.warning(rowNum, `Unknown status "${statusRaw}", defaulting to NEW`, 'status'));
        }

        const priorityRaw = this.getValue(row, 'priority', mapping, ['Priority', 'priority', 'Lead Priority', 'lead_priority']);
        if (priorityRaw) {
            const normalized = LEAD_PRIORITY_MAP[priorityRaw.trim().toLowerCase()];
            if (normalized) data.priority = normalized;
            else warnings.push(this.warning(rowNum, `Unknown priority "${priorityRaw}", defaulting to WARM`, 'priority'));
        }

        const sourceRaw = this.getValue(row, 'source', mapping, ['Source', 'source', 'Lead Source', 'lead_source', 'Channel']);
        if (sourceRaw) {
            const normalized = LEAD_SOURCE_MAP[sourceRaw.trim().toLowerCase()];
            if (normalized) data.source = normalized;
            else warnings.push(this.warning(rowNum, `Unknown source "${sourceRaw}", defaulting to OTHER`, 'source'));
        }

        // Tags
        const tagsRaw = this.getValue(row, 'tags', mapping, ['Tags', 'tags', 'Labels']);
        if (tagsRaw) data.tags = parseTags(tagsRaw) || [];

        return data;
    }

    private parseEndorsements(value: any): string[] {
        if (!value) return [];
        const str = String(value).trim().toUpperCase();
        if (str.includes(',')) return str.split(',').map(e => e.trim()).filter(Boolean);
        if (str.includes(' ')) return str.split(/\s+/).filter(Boolean);
        return str.split('').filter(c => /[HNTPSX]/.test(c));
    }
}
