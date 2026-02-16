import { schemaReference } from '../schema-reference';
import { getModelNameFromEntityType } from '../validations/import-field-validator';
import { getEntityConfig } from './entity-config';

export interface SystemField {
  key: string;
  label: string;
  required?: boolean;
  suggestedCsvHeaders?: string[];
}

/**
 * Deduplicates system fields by keeping the first occurrence of each unique key.
 * This prevents duplicate options in dropdowns when multiple field variations exist.
 */
export function deduplicateSystemFields(
  fields: SystemField[]
): SystemField[] {
  const seen = new Map<string, SystemField>();

  for (const field of fields) {
    const normalizedKey = field.key.toLowerCase().trim();

    // Keep the first occurrence, prioritizing required fields
    if (!seen.has(normalizedKey)) {
      seen.set(normalizedKey, field);
    } else {
      // If current field is required and existing is not, replace it
      const existing = seen.get(normalizedKey)!;
      if (field.required && !existing.required) {
        seen.set(normalizedKey, field);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Filters system fields to exclude already-mapped ones (optional, for better UX)
 */
export function filterUnmappedFields(
  fields: SystemField[],
  mappedFieldKeys: Set<string>
): SystemField[] {
  return fields.filter(field => !mappedFieldKeys.has(field.key));
}

/**
 * Groups system fields by category for better organization in UI
 */
export function groupFieldsByCategory(
  fields: SystemField[]
): Record<string, SystemField[]> {
  const groups: Record<string, SystemField[]> = {
    required: [],
    optional: [],
  };

  for (const field of fields) {
    if (field.required) {
      groups.required.push(field);
    } else {
      groups.optional.push(field);
    }
  }

  return groups;
}

/**
 * Gets the list of available system fields for a given entity type for import mapping.
 */
export function getSystemFieldsForEntity(entityType: string): SystemField[] {
  // Try to get from curated config first
  const config = getEntityConfig(entityType);
  if (config) {
    return config.fields.map(f => ({
      key: f.key,
      label: f.label,
      required: f.required,
      suggestedCsvHeaders: f.suggestedCsvHeaders
    }));
  }

  // Fallback to schema-based fields
  const modelName = getModelNameFromEntityType(entityType);
  const model = schemaReference.models[modelName];

  if (!model) {
    console.warn(`Model '${modelName}' not found for entity type '${entityType}'`);
    return [];
  }

  return model.fields
    .filter(field =>
      // Exclude relations, id, and common metadata fields
      !field.isRelation &&
      !['id', 'createdAt', 'updatedAt', 'deletedAt', 'mcNumberId', 'companyId', 'userId'].includes(field.name)
    )
    .map(field => ({
      key: field.name,
      label: field.name
        .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
        .replace(/^./, str => str.toUpperCase()) // Uppercase first letter
        .replace(' Id', ' ID') // Fix ID suffix
        .trim(),
      required: !field.isOptional && !field.defaultValue
    }));
}









