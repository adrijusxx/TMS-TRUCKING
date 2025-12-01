import { schemaReference, fieldExists, getModelFields, getEnumValues } from '../schema-reference';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a field exists on a model
 */
export function validateField(modelName: string, fieldName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schemaReference.models[modelName]) {
    errors.push(`Model '${modelName}' does not exist in schema`);
    return { isValid: false, errors, warnings };
  }

  if (!fieldExists(modelName, fieldName)) {
    const fields = getModelFields(modelName);
    const similarFields = fields
      .filter((f) => {
        const lowerField = fieldName.toLowerCase();
        const lowerF = f.name.toLowerCase();
        return lowerF.includes(lowerField) || lowerField.includes(lowerF);
      })
      .map((f) => f.name)
      .slice(0, 3);

    errors.push(
      `Field '${fieldName}' does not exist on model '${modelName}'${
        similarFields.length > 0 ? `. Did you mean: ${similarFields.join(', ')}?` : ''
      }`
    );
    return { isValid: false, errors, warnings };
  }

  return { isValid: true, errors, warnings };
}

/**
 * Validates that a relation exists on a model
 */
export function validateRelation(modelName: string, relationName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const model = schemaReference.models[modelName];
  if (!model) {
    errors.push(`Model '${modelName}' does not exist in schema`);
    return { isValid: false, errors, warnings };
  }

  const hasRelation = model.relations.includes(relationName);
  const hasField = getModelFields(modelName).some((f) => f.name === relationName && f.isRelation);

  if (!hasRelation && !hasField) {
    errors.push(`Relation '${relationName}' does not exist on model '${modelName}'`);
    return { isValid: false, errors, warnings };
  }

  return { isValid: true, errors, warnings };
}

/**
 * Validates that an enum value is valid for a field
 */
export function validateEnumValue(
  modelName: string,
  fieldName: string,
  value: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fieldExists(modelName, fieldName)) {
    errors.push(`Field '${fieldName}' does not exist on model '${modelName}'`);
    return { isValid: false, errors, warnings };
  }

  const fields = getModelFields(modelName);
  const field = fields.find((f) => f.name === fieldName);

  if (!field) {
    errors.push(`Field '${fieldName}' not found`);
    return { isValid: false, errors, warnings };
  }

  if (field.type.startsWith('enum:')) {
    const enumName = field.type.replace('enum:', '');
    const validValues = getEnumValues(enumName);

    if (validValues.length > 0 && !validValues.includes(value)) {
      errors.push(
        `Invalid enum value '${value}' for field '${fieldName}' (${enumName}). Valid values: ${validValues.join(', ')}`
      );
      return { isValid: false, errors, warnings };
    }
  }

  return { isValid: true, errors, warnings };
}

/**
 * Validates a Prisma query object structure
 */
function validatePrismaQuery(modelName: string, query: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schemaReference.models[modelName]) {
    errors.push(`Model '${modelName}' does not exist in schema`);
    return { isValid: false, errors, warnings };
  }

  // Validate where clause fields
  if (query.where) {
    for (const [fieldName, value] of Object.entries(query.where)) {
      if (fieldName === 'AND' || fieldName === 'OR' || fieldName === 'NOT') {
        continue; // Skip logical operators
      }
      const result = validateField(modelName, fieldName);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  // Validate include relations
  if (query.include) {
    for (const relationName of Object.keys(query.include)) {
      const result = validateRelation(modelName, relationName);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  // Validate select fields
  if (query.select) {
    for (const fieldName of Object.keys(query.select)) {
      const result = validateField(modelName, fieldName);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  // Validate data fields in create/update
  if (query.data) {
    for (const [fieldName, value] of Object.entries(query.data)) {
      if (fieldName.startsWith('_')) continue; // Skip Prisma internal fields
      const result = validateField(modelName, fieldName);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard to check if a model exists
 */
function isModel(modelName: string): boolean {
  return modelName in schemaReference.models;
}

/**
 * Get all field names for a model
 */
function getModelFieldNames(modelName: string): string[] {
  return getModelFields(modelName).map((f) => f.name);
}

/**
 * Get all relation names for a model
 */
function getModelRelationNames(modelName: string): string[] {
  const model = schemaReference.models[modelName];
  return model ? model.relations : [];
}

