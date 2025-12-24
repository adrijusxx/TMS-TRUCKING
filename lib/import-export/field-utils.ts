/**
 * Utility functions for import/export field handling
 */

export interface SystemField {
  key: string;
  label: string;
  required?: boolean;
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







