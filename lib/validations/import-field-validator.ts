import { schemaReference, getModelFields } from '../schema-reference';

export interface MissingFieldWarning {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  severity: 'error' | 'warning' | 'info';
  potentialIssues: string[];
  suggestedCsvHeaders: string[];
}

interface ImportValidationResult {
  isValid: boolean;
  missingRequiredFields: MissingFieldWarning[];
  missingOptionalFields: MissingFieldWarning[];
  warnings: string[];
  errors: string[];
}

/**
 * Validates import data against schema requirements
 * @param modelName - The model name to validate against
 * @param csvHeaders - Original CSV/Excel column headers
 * @param sampleData - Optional sample data row
 * @param columnMapping - Optional mapping of CSV columns to system fields (e.g., { "Pickup Address": "pickupAddress" })
 */
export function validateImportData(
  modelName: string,
  csvHeaders: string[],
  sampleData?: Record<string, any>,
  columnMapping?: Record<string, string>,
  providedFields: string[] = []
): ImportValidationResult {
  const model = schemaReference.models[modelName];
  if (!model) {
    return {
      isValid: false,
      missingRequiredFields: [],
      missingOptionalFields: [],
      warnings: [`Model '${modelName}' not found in schema`],
      errors: [`Model '${modelName}' not found in schema`],
    };
  }

  const fields = getModelFields(modelName);
  const missingRequiredFields: MissingFieldWarning[] = [];
  const missingOptionalFields: MissingFieldWarning[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Normalize CSV headers for matching
  const normalizedHeaders = csvHeaders.map(h =>
    h.toLowerCase().trim().replace(/[_\s-]/g, '')
  );

  // Create reverse mapping: system field -> CSV column
  // This allows us to check if a system field is mapped to a CSV column
  const reverseMapping: Record<string, string> = {};
  if (columnMapping) {
    Object.entries(columnMapping).forEach(([csvCol, systemField]) => {
      if (systemField) {
        reverseMapping[systemField.toLowerCase().replace(/[_\s-]/g, '')] = csvCol;
      }
    });
  }

  // Check each field in the schema
  for (const field of fields) {
    // Skip auto-generated and internal fields
    if (
      field.name === 'id' ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt' ||
      field.name === 'deletedAt' ||
      field.name === 'userId'
    ) {
      continue;
    }

    // Special handling for internal fields that CAN be provided but usually aren't
    const isInternalField = field.name === 'companyId' || field.name === 'mcNumberId';
    if (isInternalField && !providedFields.includes(field.name)) {
      // If it's internal and NOT provided, we generally skip it UNLESS we want to force manual input
      // For now, let's skip companyId as it's session-bound, but check mcNumberId if it's required by schema?
      // Actually, user wants to see them if they are missing.
      // But typically companyId is ALWAYS handled by backend.
      if (field.name === 'companyId') continue;

      // For mcNumberId, if it's not provided via selector (providedFields), and not in CSV, we SHOULD flag it?
      // But wait, the backend defaults to session MC if not provided.
      // So technically it's not "missing" in a fatal way usually.
      // However, if the user explicitly WANTS to see it, we might need a way.
      // Current behavior: hiding it. User says "its not showing anymore missing fields".
      // We will skip here, but we should make sure the UI allows selecting it.
    }

    // Skip if field is in providedFields (handled externally)
    if (providedFields.includes(field.name)) {
      continue;
    }

    // Skip relation fields (handled separately)
    if (field.isRelation) {
      continue;
    }

    // Check if field is mapped via column mapping
    const normalizedFieldName = field.name.toLowerCase().replace(/[_\s-]/g, '');
    const isMapped = reverseMapping[normalizedFieldName] !== undefined;

    // Check if field is in CSV headers (either directly or via mapping)
    const isInCsv = isMapped || normalizedHeaders.some(h =>
      h === normalizedFieldName ||
      h.includes(normalizedFieldName) ||
      normalizedFieldName.includes(h)
    );

    // Generate suggested CSV header names
    const suggestedCsvHeaders = generateSuggestedHeaders(field.name);

    if (!field.isOptional && !field.defaultValue && !field.isArray) {
      // Required field without default
      if (!isInCsv) {
        const potentialIssues: string[] = [];

        if (field.type === 'String' && !field.isArray) {
          potentialIssues.push('Database will reject records without this field');
          potentialIssues.push('Import will fail with NULL constraint error');
        } else if (field.type === 'Float' || field.type === 'Int') {
          potentialIssues.push('Numeric field required - import will fail');
          potentialIssues.push('Database constraint violation');
        } else if (field.type.startsWith('enum:')) {
          potentialIssues.push('Enum field requires valid value');
          potentialIssues.push('Import will fail without valid enum value');
        } else if (field.type === 'Boolean') {
          potentialIssues.push('Boolean field required');
          potentialIssues.push('Import will fail without true/false value');
        } else if (field.type === 'DateTime') {
          potentialIssues.push('Date field required');
          potentialIssues.push('Import will fail without date value');
        }

        missingRequiredFields.push({
          fieldName: field.name,
          fieldType: field.type,
          isRequired: true,
          hasDefault: false,
          severity: 'error',
          potentialIssues,
          suggestedCsvHeaders,
        });

        errors.push(`Required field '${field.name}' (${field.type}) is missing from import`);
      }
    } else if (!field.isOptional && field.defaultValue) {
      // Required field with default (less critical but should still be imported)
      if (!isInCsv) {
        missingRequiredFields.push({
          fieldName: field.name,
          fieldType: field.type,
          isRequired: true,
          hasDefault: true,
          defaultValue: field.defaultValue,
          severity: 'warning',
          potentialIssues: [
            `Field has default value: ${field.defaultValue || 'system default'}`,
            'Import will work but may not have correct values',
            'Consider importing this field for data accuracy',
          ],
          suggestedCsvHeaders,
        });

        warnings.push(`Field '${field.name}' has default but should be imported for accuracy`);
      }
    } else if (field.isOptional) {
      // Optional field
      if (!isInCsv) {
        missingOptionalFields.push({
          fieldName: field.name,
          fieldType: field.type,
          isRequired: false,
          hasDefault: !!field.defaultValue,
          defaultValue: field.defaultValue,
          severity: 'info',
          potentialIssues: [
            'Optional field - import will work without it',
            'Consider importing for complete data',
          ],
          suggestedCsvHeaders,
        });
      }
    }
  }

  return {
    isValid: missingRequiredFields.filter(f => f.severity === 'error').length === 0,
    missingRequiredFields,
    missingOptionalFields,
    warnings,
    errors,
  };
}

/**
 * Generate suggested CSV header names for a field
 */
function generateSuggestedHeaders(fieldName: string): string[] {
  const suggestions: string[] = [];

  // Add the field name itself
  suggestions.push(fieldName);

  // Add camelCase version
  const camelCase = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
  if (camelCase !== fieldName) {
    suggestions.push(camelCase);
  }

  // Add with spaces
  const withSpaces = fieldName.replace(/([A-Z])/g, ' $1').trim();
  suggestions.push(withSpaces);

  // Add with underscores
  const withUnderscores = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  suggestions.push(withUnderscores);

  // Add with hyphens
  const withHyphens = fieldName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  suggestions.push(withHyphens);

  // Common variations
  if (fieldName.includes('Id')) {
    suggestions.push(fieldName.replace('Id', ' ID'));
    suggestions.push(fieldName.replace('Id', '_id'));
    suggestions.push(fieldName.replace('Id', ' #'));
    suggestions.push(fieldName.replace('Id', ' Number'));
    suggestions.push(fieldName.replace('Id', ' No'));
  }

  // Common Trucking & System Abbreviations
  const abbreviations: Record<string, string[]> = {
    'weight': ['wt', 'wgt', 'mass', 'gross weight', 'net weight'],
    'rateAmount': ['rate', 'cost', 'pay', 'amount', 'flat rate', 'line haul'],
    'detentionAmount': ['detention', 'detention pay'],
    'layoverAmount': ['layover', 'layover pay'],
    'lumperAmount': ['lumper', 'lumper fee'],
    'stopOffAmount': ['stop off', 'stop pay', 'extra stop'],
    'pickupDate': ['pickup', 'pu date', 'origin date', 'ship date', 'start date'],
    'deliveryDate': ['delivery', 'del date', 'dest date', 'drop date', 'end date'],
    'customerName': ['customer', 'cust name', 'client', 'shipper', 'broker'],
    'customerReference': ['ref', 'reference', 'cust ref', 'shipper ref'],
    'billOfLading': ['bol', 'b.o.l.', 'bill of lading', 'paperwork'],
    'purchaseOrder': ['po', 'p.o.', 'purchase order'],
    'driverName': ['driver', 'operator'],
    'truckNumber': ['truck', 'tractor', 'unit', 'power unit'],
    'trailerNumber': ['trailer'],
    'mcNumber': ['mc', 'authority'],
    'dotNumber': ['dot', 'usdot'],
    'originAddress': ['origin', 'pickup address', 'shipper address'],
    'destinationAddress': ['destination', 'dest', 'drop address', 'consignee address', 'receiver address'],
    'originCity': ['origin city', 'pickup city'],
    'originState': ['origin state', 'pickup state'],
    'destinationCity': ['dest city', 'drop city', 'delivery city'],
    'destinationState': ['dest state', 'drop state', 'delivery state'],
    'status': ['state', 'current status'],
    'notes': ['comments', 'remarks', 'description']
  };

  // Add specific suggestions if field name matches a key
  Object.entries(abbreviations).forEach(([key, values]) => {
    if (fieldName === key || fieldName.toLowerCase() === key.toLowerCase()) {
      suggestions.push(...values);
    }
  });

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Get entity model name from entity type
 */
export function getModelNameFromEntityType(entityType: string): string {
  const mapping: Record<string, string> = {
    'loads': 'Load',
    'drivers': 'Driver',
    'trucks': 'Truck',
    'trailers': 'Trailer',
    'customers': 'Customer',
    'invoices': 'Invoice',
    'vendors': 'Vendor',
    'employees': 'Driver', // Employees are drivers
    'users': 'User',
    'batches': 'Batch',
    'breakdowns': 'Breakdown',
    'rate-confirmations': 'RateConfirmation',
    'factoring-companies': 'FactoringCompany',

    return mapping[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
  }

