import { schemaReference, getModelFields } from '../schema-reference';

export interface ApiResponseValidationResult {
  isValid: boolean;
  missingFields: string[];
  extraFields: string[];
  typeMismatches: Array<{ field: string; expected: string; actual: string }>;
}

/**
 * Validates that an API response matches the expected schema structure
 * This helps catch cases where API responses are missing expected fields
 */
export function validateApiResponse(
  modelName: string,
  response: any,
  requiredFields?: string[]
): ApiResponseValidationResult {
  const missingFields: string[] = [];
  const extraFields: string[] = [];
  const typeMismatches: Array<{ field: string; expected: string; actual: string }> = [];

  const model = schemaReference.models[modelName];
  if (!model) {
    return {
      isValid: false,
      missingFields: [`Model '${modelName}' does not exist`],
      extraFields: [],
      typeMismatches: [],
    };
  }

  const fields = getModelFields(modelName);
  const fieldMap = new Map(fields.map((f) => [f.name, f]));

  // Check for missing required fields
  const required = requiredFields || fields.filter((f) => !f.isOptional && !f.isId).map((f) => f.name);
  for (const fieldName of required) {
    if (!(fieldName in response) && response[fieldName] !== null && response[fieldName] !== undefined) {
      missingFields.push(fieldName);
    }
  }

  // Check for extra fields (fields in response that don't exist in schema)
  for (const fieldName of Object.keys(response)) {
    if (!fieldMap.has(fieldName) && !fieldName.startsWith('_')) {
      extraFields.push(fieldName);
    }
  }

  // Check type mismatches (basic check)
  for (const [fieldName, value] of Object.entries(response)) {
    const field = fieldMap.get(fieldName);
    if (field && value !== null && value !== undefined) {
      const expectedType = field.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      // Basic type checking
      if (expectedType === 'Boolean' && actualType !== 'boolean') {
        typeMismatches.push({ field: fieldName, expected: 'boolean', actual: actualType });
      } else if (expectedType === 'Int' && actualType !== 'number') {
        typeMismatches.push({ field: fieldName, expected: 'number', actual: actualType });
      } else if (expectedType === 'Float' && actualType !== 'number') {
        typeMismatches.push({ field: fieldName, expected: 'number', actual: actualType });
      } else if (expectedType === 'String' && actualType !== 'string') {
        typeMismatches.push({ field: fieldName, expected: 'string', actual: actualType });
      } else if (expectedType === 'DateTime' && !(value instanceof Date) && actualType !== 'string') {
        typeMismatches.push({ field: fieldName, expected: 'Date | string', actual: actualType });
      }
    }
  }

  return {
    isValid: missingFields.length === 0 && extraFields.length === 0 && typeMismatches.length === 0,
    missingFields,
    extraFields,
    typeMismatches,
  };
}

/**
 * Creates a warning message for missing fields in API responses
 */
export function createMissingFieldsWarning(
  modelName: string,
  missingFields: string[]
): string {
  if (missingFields.length === 0) return '';

  return `⚠️  API Response Warning: Model '${modelName}' response is missing expected fields: ${missingFields.join(', ')}. This may cause runtime errors when these fields are accessed.`;
}



