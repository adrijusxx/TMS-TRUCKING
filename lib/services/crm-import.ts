import { prisma } from '@/lib/prisma';
import { createGoogleSheetsClient, GoogleSheetsClient, SheetRow } from '@/lib/integrations/google/sheets';
import { LeadPriority, LeadSource, LeadStatus, CrmIntegration, McNumber } from '@prisma/client';
import { inngest } from '@/lib/inngest/client';
import { normalizeCrmConfig, SheetConfig, CrmSheetsConfig } from '@/lib/utils/crm-config';

type ColumnMappings = Record<string, string>;

const HEADER_SYNONYMS: Record<string, string[]> = {
    firstName: ['firstname', 'contactname', 'name', 'drivername', 'leadname', 'first_name'],
    lastName: ['lastname', 'contactname', 'name', 'drivername', 'leadname', 'last_name'],
    fullName: ['fullname', 'contactname', 'name', 'opportunityname', 'full_name'],
    email: ['email', 'emailaddress', 'email_address'],
    phone: ['phone', 'phonenumber', 'contactphone', 'mobile', 'phone_number'],
    status: ['status', 'stage', 'pipelinestage', 'pipeline', 'lead_status'],
    priority: ['priority', 'rating', 'score'],
    source: ['source', 'leadsource', 'channel', 'platform'],
    tags: ['tags', 'labels', 'segments'],
    yearsExperience: ['yearsofexperience', 'experience', 'driveryears', 'years'],
    'address.street': ['addressstreet', 'street', 'address', 'line1'],
    'address.city': ['addresscity', 'city', 'town'],
    'address.state': ['addressstate', 'state', 'province', 'region'],
    'address.zip': ['zipcode', 'zip', 'postal', 'postalcode'],
    cdlNumber: ['cdlnumber', 'cdl', 'license'],
    cdlClass: ['cdlclass', 'class', 'licenseclass'],
};

function sanitizeHeader(header: string): string {
    return header.replace(/[\s\._]+/g, '').toLowerCase();
}

function readMappedValue(row: SheetRow, field: string, columnMap: ColumnMappings, synonyms: string[] = []): string {
    const keysToCheck = [columnMap[field], ...synonyms, field].filter(Boolean) as string[];
    for (const key of keysToCheck) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
        const sanitizedKey = sanitizeHeader(key);
        for (const [rowKey, rowValue] of Object.entries(row)) {
            if (sanitizeHeader(rowKey) === sanitizedKey && rowValue && String(rowValue).trim() !== '') {
                return String(rowValue).trim();
            }
        }
    }
    return '';
}

function splitFullName(value: string): { firstName: string; lastName: string } {
    const parts = value.trim().split(/\s+/);
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function parseList(value: string): string[] {
    return value.split(/[,;]+/).map(e => e.trim()).filter(Boolean);
}

const KNOWN_FIELDS = new Set(
    Object.values(HEADER_SYNONYMS).flat().map(s => sanitizeHeader(s))
);

function collectMetadata(row: SheetRow): Record<string, any> {
    const metadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        const sanitized = sanitizeHeader(key);
        if (KNOWN_FIELDS.has(sanitized) || !value || String(value).trim() === '') continue;
        metadata[key] = String(value).trim();
    }
    return Object.keys(metadata).length > 0 ? metadata : {};
}

function normalizeStatus(status?: string): LeadStatus {
    if (!status) return 'NEW';
    const upper = status.toUpperCase().replace(/\s+/g, '_');
    return Object.values(LeadStatus).includes(upper as LeadStatus) ? (upper as LeadStatus) : 'NEW';
}

function normalizePriority(priority?: string): LeadPriority {
    if (!priority) return 'WARM';
    const upper = priority.toUpperCase();
    return Object.values(LeadPriority).includes(upper as LeadPriority) ? (upper as LeadPriority) : 'WARM';
}

function normalizeSource(source?: string): LeadSource {
    if (!source) return 'FACEBOOK';
    const upper = source.toUpperCase();
    if (upper.includes('FB') || upper.includes('FACEBOOK')) return 'FACEBOOK';
    if (upper.includes('WEB')) return 'WEBSITE';
    if (upper.includes('REF')) return 'REFERRAL';
    return Object.values(LeadSource).includes(upper as LeadSource) ? (upper as LeadSource) : 'OTHER';
}

interface SheetImportResult {
    created: number;
    duplicates: number;
    errors: Array<{ row: number; sheet: string; message: string }>;
    updatedConfig: SheetConfig;
}

export interface ImportResult {
    created: number;
    duplicates: number;
    errors: Array<{ row: number; sheet?: string; message: string }>;
    lastImportedRow: number;
    perSheet?: Record<string, { created: number; duplicates: number; lastImportedRow: number }>;
}

async function processSheet(
    client: GoogleSheetsClient,
    sheetId: string,
    sheetName: string,
    sheetConfig: SheetConfig,
    integration: CrmIntegration & { mcNumber: McNumber },
    userId: string,
): Promise<SheetImportResult> {
    const columnMap = sheetConfig.columnMapping || {};
    const lastImportedRow = sheetConfig.lastImportedRow || 0;
    const totalRows = await client.getRowCount(sheetId, sheetName);

    if (totalRows <= lastImportedRow) {
        return { created: 0, duplicates: 0, errors: [], updatedConfig: sheetConfig };
    }

    const rows = await client.readSheetRange(sheetId, lastImportedRow + 1, totalRows, sheetName);
    const result: SheetImportResult = {
        created: 0,
        duplicates: 0,
        errors: [],
        updatedConfig: { ...sheetConfig, lastImportedRow: lastImportedRow + rows.length },
    };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = lastImportedRow + i + 1;

        try {
            const firstNameRaw = readMappedValue(row, 'firstName', columnMap, HEADER_SYNONYMS.firstName);
            const lastNameRaw = readMappedValue(row, 'lastName', columnMap, HEADER_SYNONYMS.lastName);
            const fullNameRaw = readMappedValue(row, 'fullName', columnMap, HEADER_SYNONYMS.fullName);
            const email = readMappedValue(row, 'email', columnMap, HEADER_SYNONYMS.email);
            const phone = readMappedValue(row, 'phone', columnMap, HEADER_SYNONYMS.phone);

            let firstName = firstNameRaw || fullNameRaw;
            let lastName = lastNameRaw;

            if (!firstName && fullNameRaw) {
                const split = splitFullName(fullNameRaw);
                firstName = split.firstName;
                lastName = split.lastName;
            }

            if (firstName && (!lastName || firstName === lastName)) {
                const split = splitFullName(`${firstName} ${lastName ?? ''}`.trim());
                firstName = split.firstName;
                lastName = split.lastName;
            }

            if (!firstName && !lastName) {
                result.errors.push({ row: rowNumber, sheet: sheetName, message: 'Missing name' });
                continue;
            }
            if (!phone && !email) {
                result.errors.push({ row: rowNumber, sheet: sheetName, message: 'Missing phone and email' });
                continue;
            }

            const existingLead = await prisma.lead.findFirst({
                where: {
                    companyId: integration.mcNumber.companyId,
                    OR: [phone ? { phone } : {}, email ? { email } : {}],
                    deletedAt: null,
                },
            });

            if (existingLead) {
                result.duplicates++;
                continue;
            }

            const leadNumber = `CRM-IMP-${integration.mcNumber.number}-${Date.now()}-${i}`;
            const metadata = collectMetadata(row);

            const lead = await prisma.lead.create({
                data: {
                    leadNumber,
                    companyId: integration.mcNumber.companyId,
                    mcNumberId: integration.mcNumberId,
                    firstName: firstName || 'Unknown',
                    lastName: lastName || 'Unknown',
                    email: email || null,
                    phone: phone || '',
                    status: normalizeStatus(readMappedValue(row, 'status', columnMap, HEADER_SYNONYMS.status)),
                    priority: normalizePriority(readMappedValue(row, 'priority', columnMap, HEADER_SYNONYMS.priority)),
                    source: normalizeSource(readMappedValue(row, 'source', columnMap, HEADER_SYNONYMS.source)),
                    address: readMappedValue(row, 'address.street', columnMap, HEADER_SYNONYMS['address.street']) || null,
                    city: readMappedValue(row, 'address.city', columnMap, HEADER_SYNONYMS['address.city']) || null,
                    state: readMappedValue(row, 'address.state', columnMap, HEADER_SYNONYMS['address.state']) || null,
                    zip: readMappedValue(row, 'address.zip', columnMap, HEADER_SYNONYMS['address.zip']) || null,
                    cdlNumber: readMappedValue(row, 'cdlNumber', columnMap, HEADER_SYNONYMS.cdlNumber) || null,
                    cdlClass: readMappedValue(row, 'cdlClass', columnMap, HEADER_SYNONYMS.cdlClass) || null,
                    yearsExperience: parseInt(readMappedValue(row, 'yearsExperience', columnMap, HEADER_SYNONYMS.yearsExperience)) || null,
                    tags: parseList(readMappedValue(row, 'tags', columnMap, HEADER_SYNONYMS.tags)),
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                    createdById: userId,
                },
            });

            await prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    type: 'NOTE',
                    content: `Imported from Google Sheets — ${sheetName} (Row ${rowNumber})`,
                    userId,
                },
            });

            inngest.send({
                name: 'crm/generate-lead-summary',
                data: { leadId: lead.id },
            }).catch(() => {});

            result.created++;
        } catch (error: any) {
            result.errors.push({ row: rowNumber, sheet: sheetName, message: error.message || 'Unknown error' });
        }
    }

    return result;
}

/**
 * Process CRM Integration — loops over all configured sheets
 */
export async function processCrmIntegration(integrationId: string, triggeredByUserId?: string): Promise<ImportResult> {
    const integration = await prisma.crmIntegration.findUnique({
        where: { id: integrationId },
        include: { mcNumber: true },
    });

    if (!integration) throw new Error('Integration not found');
    if (!integration.enabled) throw new Error('Integration is disabled');

    let userId = triggeredByUserId;
    if (!userId) {
        const adminUser = await prisma.user.findFirst({
            where: {
                companyId: integration.mcNumber.companyId,
                role: { in: ['SUPER_ADMIN', 'ADMIN'] },
            },
        });
        userId = adminUser?.id;
    }
    if (!userId) throw new Error('No valid user found to attribute import activities');

    const rawConfig = (integration.config as Record<string, any>) || {};
    const config = normalizeCrmConfig(rawConfig);

    if (!config.sheetId) throw new Error('Sheet ID not configured');

    const client = await createGoogleSheetsClient();
    const sheetNames = Object.keys(config.sheets);

    if (sheetNames.length === 0) throw new Error('No sheets selected');

    const aggregated: ImportResult = { created: 0, duplicates: 0, errors: [], lastImportedRow: 0, perSheet: {} };
    const updatedSheets: Record<string, SheetConfig> = {};

    for (const name of sheetNames) {
        const sheetResult = await processSheet(client, config.sheetId, name, config.sheets[name], integration, userId);
        aggregated.created += sheetResult.created;
        aggregated.duplicates += sheetResult.duplicates;
        aggregated.errors.push(...sheetResult.errors);
        updatedSheets[name] = sheetResult.updatedConfig;
        aggregated.perSheet![name] = {
            created: sheetResult.created,
            duplicates: sheetResult.duplicates,
            lastImportedRow: sheetResult.updatedConfig.lastImportedRow,
        };
    }

    aggregated.lastImportedRow = Object.values(updatedSheets).reduce((sum, s) => sum + s.lastImportedRow, 0);

    await prisma.crmIntegration.update({
        where: { id: integrationId },
        data: {
            config: { sheetId: config.sheetId, sheets: updatedSheets } as any,
            lastSyncAt: new Date(),
        },
    });

    return aggregated;
}
