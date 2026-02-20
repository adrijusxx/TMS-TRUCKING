import { prisma } from '@/lib/prisma';
import { createGoogleSheetsClient, SheetRow } from '@/lib/integrations/google/sheets';
import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { inngest } from '@/lib/inngest/client';

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
    // Remove whitespace, dots, and underscores to normalize (e.g. "phone_number" -> "phonenumber")
    return header.replace(/[\s\._]+/g, '').toLowerCase();
}

function readMappedValue(
    row: SheetRow,
    field: string,
    columnMap: ColumnMappings,
    synonyms: string[] = []
): string {
    const mappedKey = columnMap[field];
    const keysToCheck = [
        mappedKey,
        ...synonyms,
        field,
    ].filter(Boolean) as string[];

    for (const key of keysToCheck) {
        // Try exact match first
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }

        // Try sanitized match if no exact match
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
    if (parts.length === 0) {
        return { firstName: '', lastName: '' };
    }
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function parseList(value: string): string[] {
    return value
        .split(/[,;]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

// Get all known/mapped field keys (sanitized)
const KNOWN_FIELDS = new Set(
    Object.values(HEADER_SYNONYMS).flat().map(s => sanitizeHeader(s))
);

/**
 * Collect unmapped columns from a row as metadata
 * These are extra fields like Facebook form responses that don't map to standard Lead fields
 */
function collectMetadata(row: SheetRow): Record<string, any> {
    const metadata: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
        const sanitized = sanitizeHeader(key);
        // Skip if it's a known/mapped field or empty value
        if (KNOWN_FIELDS.has(sanitized) || !value || String(value).trim() === '') {
            continue;
        }
        // Store with original key for readability
        metadata[key] = String(value).trim();
    }

    return Object.keys(metadata).length > 0 ? metadata : {};
}

function normalizeStatus(status?: string): LeadStatus {
    if (!status) return 'NEW';
    const upperStatus = status.toUpperCase().replace(/\s+/g, '_');
    const validStatuses = Object.values(LeadStatus);
    return validStatuses.includes(upperStatus as LeadStatus) ? (upperStatus as LeadStatus) : 'NEW';
}

function normalizePriority(priority?: string): LeadPriority {
    if (!priority) return 'WARM';
    const upperPriority = priority.toUpperCase();
    const validPriorities = Object.values(LeadPriority);
    return validPriorities.includes(upperPriority as LeadPriority) ? (upperPriority as LeadPriority) : 'WARM';
}

function normalizeSource(source?: string): LeadSource {
    if (!source) return 'FACEBOOK'; // Default to something common? Or OTHER? Let's use OTHER as safer default if not Facebook
    const upperSource = source.toUpperCase();
    const validSources = Object.values(LeadSource);
    // Common mappings
    if (upperSource.includes('FB') || upperSource.includes('FACEBOOK')) return 'FACEBOOK';
    if (upperSource.includes('WEB')) return 'WEBSITE';
    if (upperSource.includes('REF')) return 'REFERRAL';

    return validSources.includes(upperSource as LeadSource) ? (upperSource as LeadSource) : 'OTHER';
}

interface ImportResult {
    created: number;
    duplicates: number;
    errors: Array<{ row: number; message: string }>;
    lastImportedRow: number;
}

/**
 * Process CRM Integration for a specific configuration
 */
export async function processCrmIntegration(integrationId: string, triggeredByUserId?: string): Promise<ImportResult> {
    const integration = await prisma.crmIntegration.findUnique({
        where: { id: integrationId },
        include: {
            mcNumber: true,
        },
    });

    if (!integration) {
        throw new Error('Integration not found');
    }

    if (!integration.enabled) {
        throw new Error('Integration is disabled');
    }

    // Find a user for attribution if not provided
    let userId = triggeredByUserId;
    if (!userId) {
        const adminUser = await prisma.user.findFirst({
            where: {
                companyId: integration.mcNumber.companyId,
                role: { in: ['SUPER_ADMIN', 'ADMIN'] }
            }
        });
        userId = adminUser?.id;
    }

    if (!userId) {
        throw new Error('No valid user found to attribute import activities');
    }

    const config = integration.config as Record<string, any> || {};
    const sheetId = config.sheetId;
    const sheetName = config.sheetName || 'Sheet1';
    const columnMap = config.columnMapping || {};
    const lastImportedRow = config.lastImportedRow || 0;

    if (!sheetId) {
        throw new Error('Sheet ID not configured');
    }

    const client = await createGoogleSheetsClient();
    const totalRows = await client.getRowCount(sheetId, sheetName);

    if (totalRows <= lastImportedRow) {
        return {
            created: 0,
            duplicates: 0,
            errors: [],
            lastImportedRow,
        };
    }

    // Read new rows
    const rows = await client.readSheetRange(
        sheetId,
        lastImportedRow + 1,
        totalRows,
        sheetName
    );

    const result: ImportResult = {
        created: 0,
        duplicates: 0,
        errors: [],
        lastImportedRow: lastImportedRow + rows.length,
    };

    const createdLeads = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = lastImportedRow + i + 1;

        try {
            // Map fields
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
                result.errors.push({ row: rowNumber, message: 'Missing name' });
                continue;
            }

            if (!phone && !email) {
                result.errors.push({ row: rowNumber, message: 'Missing phone and email' });
                continue;
            }

            // Check duplicates
            const existingLead = await prisma.lead.findFirst({
                where: {
                    companyId: integration.mcNumber.companyId,
                    OR: [
                        phone ? { phone } : {},
                        email ? { email } : {},
                    ],
                    deletedAt: null,
                },
            });

            if (existingLead) {
                result.duplicates++;
                continue;
            }

            // Generate lead number
            // Note: In a loop this could be slow, or cause conflicts. 
            // Ideally we lock or generate differently. For MVP import, sequential is fine but transaction is better.
            // We'll rely on Prisma default or simple count + 1 for now.
            const leadCount = await prisma.lead.count({
                where: { companyId: integration.mcNumber.companyId },
            });
            const leadNumber = `CRM-IMP-${integration.mcNumber.number}-${Date.now()}-${i}`; // Unique fallback

            // Collect unmapped columns as metadata
            const metadata = collectMetadata(row);

            // Create Lead
            console.log(`[DEBUG] Creating lead for row ${rowNumber}. userId:`, userId, typeof userId);
            const lead = await prisma.lead.create({
                data: {
                    leadNumber, // Temporary, or make this smarter
                    companyId: integration.mcNumber.companyId,
                    mcNumberId: integration.mcNumberId,
                    firstName: firstName || 'Unknown',
                    lastName: lastName || 'Unknown',
                    email: email || null,
                    phone: phone || '', // Required field
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

                    // Store extra columns as metadata (Facebook form responses, etc.)
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,

                    createdById: userId, // Indicates system import (attributed to admin)
                },
            });

            // Create Activity
            await prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    type: 'NOTE',
                    content: `Imported from Google Sheets (Row ${rowNumber})`,
                    userId: userId
                }
            });

            // Fire-and-forget: generate AI summary for imported lead
            inngest.send({
                name: 'crm/generate-lead-summary',
                data: { leadId: lead.id },
            }).catch(() => {});

            result.created++;
            createdLeads.push(lead);

        } catch (error: any) {
            result.errors.push({ row: rowNumber, message: error.message || 'Unknown error' });
        }
    }

    // Update integration config
    await prisma.crmIntegration.update({
        where: { id: integrationId },
        data: {
            config: {
                ...config,
                lastImportedRow: result.lastImportedRow,
            },
            lastSyncAt: new Date(),
        },
    });

    return result;
}
