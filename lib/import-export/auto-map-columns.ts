/**
 * Shared auto-mapping logic for import UIs.
 * Maps CSV/Excel column headers to system field keys using normalization and semantic matching.
 */

import type { SystemField } from './field-utils';

/**
 * Normalize string for simple matching: lowercase, remove non-alphanumeric.
 */
function normalizeSimple(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Advanced normalization: handle "number" vs "id" vs "#" common in trucking.
 */
function normalizeAdvanced(str: string): string {
  let s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  s = s.replace(/number/g, 'id').replace(/no/g, 'id').replace(/#/g, 'id');
  return s;
}

/**
 * Auto-map Excel/CSV column headers to system field keys.
 * Uses exact match, advanced semantic match (load_id == load_number), substring match, and suggestedCsvHeaders.
 *
 * @param headers - Column headers from the file (as they appear in parsed row keys)
 * @param systemFields - System fields with key, label, suggestedCsvHeaders
 * @returns Record mapping header -> systemField.key
 */
export function autoMapColumns(
  headers: string[],
  systemFields: Array<{ key: string; label?: string; suggestedCsvHeaders?: string[] }>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const header of headers) {
    const normHeader = normalizeSimple(header);
    const normHeaderAdv = normalizeAdvanced(header);

    const match = systemFields.find((f) => {
      const normKey = normalizeSimple(f.key);
      const normKeyAdv = normalizeAdvanced(f.key);

      // 1. Exact match (normalized)
      if (normHeader === normKey) return true;

      // 2. Advanced semantic match (load_id == load_number)
      if (normHeaderAdv === normKeyAdv) return true;

      // 3. Substring match (careful with short strings)
      if (normHeader.length > 3 && normKey.length > 3) {
        return normHeader.includes(normKey) || normKey.includes(normHeader);
      }

      // 4. Check suggestedCsvHeaders
      const suggestions = f.suggestedCsvHeaders || [];
      return suggestions.some((s) => {
        const ns = normalizeSimple(s);
        return ns === normHeader || normHeader.includes(ns) || ns.includes(normHeader);
      });
    });

    if (match) {
      result[header] = match.key;
    }
  }

  return result;
}
