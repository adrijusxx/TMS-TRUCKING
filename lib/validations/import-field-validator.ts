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
  columnMapping?: Record<string, string>
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
    // Skip auto-generated fields
    if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt' || field.name === 'deletedAt') {
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

    if (!field.isOptional && !field.defaultValue) {
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
  }
  
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
  };
  
  return mapping[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

