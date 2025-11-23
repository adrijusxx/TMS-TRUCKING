import { schemaReference, getModelFields } from '../schema-reference';

export interface FormFieldValidationResult {
  isValid: boolean;
  unmappedFields: string[];
  invalidFields: string[];
  suggestions: Record<string, string[]>;
}

/**
 * Validates that form fields map correctly to database columns
 * This helps ensure forms submit data that matches the database schema
 */
export function validateFormFields(
  modelName: string,
  formFields: string[]
): FormFieldValidationResult {
  const unmappedFields: string[] = [];
  const invalidFields: string[] = [];
  const suggestions: Record<string, string[]> = {};

  const model = schemaReference.models[modelName];
  if (!model) {
    return {
      isValid: false,
      unmappedFields: formFields,
      invalidFields: [],
      suggestions: {},
    };
  }

  const dbFields = getModelFields(modelName);
  const dbFieldNames = new Set(dbFields.map((f) => f.name));

  for (const formField of formFields) {
    if (!dbFieldNames.has(formField)) {
      unmappedFields.push(formField);

      // Find similar field names
      const similar = dbFields
        .filter((f) => {
          const lowerForm = formField.toLowerCase();
          const lowerDb = f.name.toLowerCase();
          return (
            lowerDb.includes(lowerForm) ||
            lowerForm.includes(lowerDb) ||
            levenshteinDistance(lowerForm, lowerDb) <= 2
          );
        })
        .map((f) => f.name)
        .slice(0, 3);

      if (similar.length > 0) {
        suggestions[formField] = similar;
      }
    }
  }

  return {
    isValid: unmappedFields.length === 0 && invalidFields.length === 0,
    unmappedFields,
    invalidFields,
    suggestions,
  };
}

/**
 * Simple Levenshtein distance for similarity matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validates a form submission object against the database schema
 */
export function validateFormSubmission(
  modelName: string,
  formData: Record<string, any>
): FormFieldValidationResult {
  return validateFormFields(modelName, Object.keys(formData));
}

